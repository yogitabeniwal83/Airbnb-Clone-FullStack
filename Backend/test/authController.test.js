const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const bcrypt = require('bcryptjs');

const User = require('../src/models/user');
const authController = require('../src/controllers/authController');
const { getActiveRole, getUserRoles, toSessionUser } = require('../src/utils/userRoles');

const originals = {
  create: User.create,
  exists: User.exists,
  findOne: User.findOne,
  findById: User.findById,
  findByIdAndUpdate: User.findByIdAndUpdate,
  updateOne: User.updateOne,
};

afterEach(() => {
  Object.assign(User, originals);
});

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const createSession = () => ({
  save(callback) { callback(); },
  destroy(callback) { callback(); },
});

const asUserDocument = (data) => ({
  ...data,
  toObject() {
    return { ...data };
  },
});

const runMiddleware = async (middleware, request) => {
  const response = createResponse();

  for (const validator of middleware.slice(0, -1)) {
    await validator.run(request);
  }

  await middleware.at(-1)(request, response);
  return response;
};

const runSignup = (body) => runMiddleware(
  authController.postSignup,
  { body: { ...body } },
);

const runLogin = (body, session = createSession()) => runMiddleware(
  authController.postLogin,
  { body: { ...body }, session },
);

const validSignup = (overrides = {}) => ({
  firstName: 'Auth',
  lastName: 'Test',
  email: 'auth@example.com',
  password: 'ValidPass1!',
  confirmPassword: 'ValidPass1!',
  terms: 'on',
  ...overrides,
});

test('normal signup hashes the exact password once and creates only the guest role', async () => {
  const password = ' ValidPass1! ';
  let storedUser;

  User.exists = async () => null;
  User.create = async (user) => {
    storedUser = user;
    return user;
  };

  const response = await runSignup(validSignup({
    password,
    confirmPassword: password,
  }));

  assert.equal(response.statusCode, 201);
  assert.deepEqual(storedUser.roles, ['guest']);
  assert.equal('userType' in storedUser, false);
  assert.match(storedUser.password, /^\$2[aby]\$12\$/);
  assert.equal(await bcrypt.compare(password, storedUser.password), true);
});

test('signup rejects an existing normalized email with 409 without creating a duplicate', async () => {
  let createCalled = false;
  User.exists = async () => ({ _id: '64b000000000000000000002' });
  User.create = async () => { createCalled = true; };

  const response = await runSignup(validSignup());

  assert.equal(response.statusCode, 409);
  assert.equal(response.body.message, 'An account with this email already exists. Please sign in.');
  assert.equal(createCalled, false);
});

test('login lazily migrates a legacy guest and returns the active guest role', async () => {
  const password = 'ValidPass1!';
  let migrationUpdate;
  const legacyUser = asUserDocument({
    _id: '64b000000000000000000002',
    firstName: 'Legacy',
    lastName: 'Guest',
    email: 'legacy@example.com',
    password: await bcrypt.hash(password, 4),
    roles: [],
    userType: 'guest',
  });

  User.findOne = async () => legacyUser;
  User.updateOne = async (filter, update) => { migrationUpdate = { filter, update }; };

  const session = createSession();
  const response = await runLogin({ email: legacyUser.email, password }, session);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.user.roles, ['guest']);
  assert.equal(response.body.user.userType, 'guest');
  assert.deepEqual(migrationUpdate.update, {
    $addToSet: { roles: { $each: ['guest'] } },
  });
});

test('legacy host accounts retain guest and host access', () => {
  assert.deepEqual(getUserRoles({ userType: 'host' }), ['guest', 'host']);
  assert.equal(getActiveRole({ userType: 'host' }), 'host');
  assert.deepEqual(toSessionUser({
    _id: '64b000000000000000000002',
    email: 'host@example.com',
    userType: 'host',
  }).roles, ['guest', 'host']);
  assert.equal(toSessionUser({
    _id: '64b000000000000000000002',
    userType: 'host',
  }).userType, 'host');

  const hydratedLegacyHost = User.hydrate({
    _id: '64b000000000000000000003',
    firstName: 'Legacy',
    email: 'legacy-host@example.com',
    password: 'stored-hash',
    userType: 'host',
  });
  assert.deepEqual(hydratedLegacyHost.roles, ['guest', 'host']);
});

test('become-host adds roles with addToSet, updates the session, and is idempotent', async () => {
  const userId = '64b000000000000000000002';
  const guest = asUserDocument({
    _id: userId,
    firstName: 'Role',
    lastName: 'Test',
    email: 'role@example.com',
    roles: ['guest'],
  });
  const host = asUserDocument({ ...guest.toObject(), roles: ['guest', 'host'] });
  const updates = [];

  User.findById = async () => guest;
  User.findByIdAndUpdate = async (id, update) => {
    updates.push({ id, update });
    return host;
  };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const request = {
      session: {
        ...createSession(),
        isLoggedIn: true,
        user: toSessionUser(guest),
      },
    };
    const response = createResponse();

    await authController.postBecomeHost(request, response);

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body.user.roles, ['guest', 'host']);
    assert.equal(response.body.user.userType, 'host');
    assert.deepEqual(request.session.user.roles, ['guest', 'host']);
  }

  assert.equal(updates.length, 2);
  assert.deepEqual(updates[0].update, {
    $addToSet: { roles: { $each: ['guest', 'host'] } },
  });
});

test('wrong password returns 401 and does not change the stored hash', async () => {
  const password = 'ValidPass1!';
  const storedHash = await bcrypt.hash(password, 4);
  const user = asUserDocument({
    _id: '64b000000000000000000002',
    firstName: 'Auth',
    lastName: 'Test',
    email: 'auth@example.com',
    password: storedHash,
    roles: ['guest'],
  });

  User.findOne = async () => user;
  User.updateOne = async () => {};

  const response = await runLogin({
    email: user.email,
    password: 'WrongPass1!',
  });

  assert.equal(response.statusCode, 401);
  assert.equal(user.password, storedHash);
});

test('signup and login apply the same email normalization', async () => {
  const submittedEmail = ' Auth.Login.Test@GMAIL.com ';
  const password = 'ValidPass1!';
  let storedUser;
  let queriedEmail;

  User.exists = async () => null;
  User.create = async (user) => {
    storedUser = asUserDocument({
      _id: '64b000000000000000000002',
      ...user,
    });
    return storedUser;
  };

  const signupResponse = await runSignup(validSignup({
    email: submittedEmail,
    password,
    confirmPassword: password,
  }));

  User.findOne = ({ email }) => {
    queriedEmail = email;
    return Promise.resolve(email === storedUser.email ? storedUser : null);
  };
  User.updateOne = async () => {};

  const loginResponse = await runLogin({ email: submittedEmail, password });

  assert.equal(signupResponse.statusCode, 201);
  assert.equal(storedUser.email, 'authlogintest@gmail.com');
  assert.equal(queriedEmail, storedUser.email);
  assert.equal(loginResponse.statusCode, 200);
});
