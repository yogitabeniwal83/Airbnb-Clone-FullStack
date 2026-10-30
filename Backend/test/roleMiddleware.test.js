const assert = require('node:assert/strict');
const { test } = require('node:test');

const authMiddleware = require('../src/middlewares/authMiddleware');
const { requireRole } = require('../src/middlewares/roleMiddleware');

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

test('auth middleware converts legacy session users to roles', () => {
  const request = {
    session: {
      isLoggedIn: true,
      user: { _id: 'user-1', userType: 'host' },
    },
  };
  let nextCalled = false;

  authMiddleware(request, createResponse(), () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.deepEqual(request.session.user.roles, ['guest', 'host']);
  assert.equal(request.session.user.userType, 'host');
});

test('role middleware rejects unauthenticated requests', () => {
  const response = createResponse();
  let nextCalled = false;

  requireRole('guest')({ session: {} }, response, () => { nextCalled = true; });

  assert.equal(response.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('host role middleware rejects guests and accepts hosts', () => {
  const middleware = requireRole('host');
  const guestResponse = createResponse();
  let guestNext = false;

  middleware({
    session: {
      isLoggedIn: true,
      user: { _id: 'guest-1', roles: ['guest'] },
    },
  }, guestResponse, () => {
    guestNext = true;
  });

  assert.equal(guestNext, false);
  assert.equal(guestResponse.statusCode, 403);

  let hostNext = false;
  middleware({
    session: {
      isLoggedIn: true,
      user: { _id: 'host-1', roles: ['guest', 'host'] },
    },
  }, createResponse(), () => {
    hostNext = true;
  });

  assert.equal(hostNext, true);
});

test('guest role middleware denies accounts operating in host mode', () => {
  const response = createResponse();
  let nextCalled = false;

  requireRole('guest')({
    session: {
      isLoggedIn: true,
      user: { _id: 'host-1', roles: ['guest', 'host'] },
    },
  }, response, () => { nextCalled = true; });

  assert.equal(response.statusCode, 403);
  assert.equal(nextCalled, false);
});
