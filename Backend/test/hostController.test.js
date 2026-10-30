const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

const Home = require('../src/models/home');
const hostController = require('../src/controllers/hostController');

const originals = {
  create: Home.create,
  deleteOne: Home.deleteOne,
  find: Home.find,
  findById: Home.findById,
};

afterEach(() => {
  Object.assign(Home, originals);
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

const hostId = '64b000000000000000000002';
const otherHostId = '64b000000000000000000003';
const homeId = '64b000000000000000000010';

test('getHostHomes filters homes using the authenticated host ID', async () => {
  let receivedFilter;
  const expectedHomes = [{ _id: homeId, hostId }];

  Home.find = async (filter) => {
    receivedFilter = filter;
    return expectedHomes;
  };

  const response = createResponse();
  await hostController.getHostHomes({ session: { user: { _id: hostId } } }, response);

  assert.deepEqual(receivedFilter, { hostId });
  assert.deepEqual(response.body.homes, expectedHomes);
});

test('postAddHome derives ownership from the session and ignores a submitted host ID', async () => {
  let createdData;
  Home.create = async (data) => {
    createdData = data;
    return { _id: homeId, ...data };
  };

  const response = createResponse();
  await hostController.postAddHome({
    session: { user: { _id: hostId } },
    file: { filename: 'test-house.png' },
    body: {
      hostId: otherHostId,
      houseName: 'Owned Home',
      price: 2000,
      location: 'Jaipur',
      rating: 4.8,
      description: 'Test home',
    },
  }, response);

  assert.equal(response.statusCode, 201);
  assert.equal(createdData.hostId, hostId);
  assert.equal(createdData.photo, '/uploads/test-house.png');
});

test('postEditHome allows only the owning host', async () => {
  let saveCalled = false;
  const ownedHome = {
    _id: homeId,
    hostId: { toString: () => hostId },
    photo: '/uploads/existing.png',
    save: async () => { saveCalled = true; },
  };
  Home.findById = async () => ownedHome;

  const forbiddenResponse = createResponse();
  await hostController.postEditHome({
    session: { user: { _id: otherHostId } },
    body: { id: homeId },
  }, forbiddenResponse);

  assert.equal(forbiddenResponse.statusCode, 403);
  assert.equal(saveCalled, false);

  const ownerResponse = createResponse();
  await hostController.postEditHome({
    session: { user: { _id: hostId } },
    body: {
      id: homeId,
      houseName: 'Updated Home',
      price: 2500,
      location: 'Delhi',
      rating: 4.9,
      description: 'Updated',
    },
  }, ownerResponse);

  assert.equal(ownerResponse.statusCode, 200);
  assert.equal(saveCalled, true);
  assert.equal(ownedHome.houseName, 'Updated Home');
});

test('postDeleteHome allows only the owning host', async () => {
  let receivedDeleteFilter;
  const ownedHome = {
    _id: homeId,
    hostId: { toString: () => hostId },
    photo: '',
  };
  Home.findById = async () => ownedHome;
  Home.deleteOne = async (filter) => { receivedDeleteFilter = filter; };

  const forbiddenResponse = createResponse();
  await hostController.postDeleteHome({
    params: { homeId },
    session: { user: { _id: otherHostId } },
  }, forbiddenResponse);

  assert.equal(forbiddenResponse.statusCode, 403);
  assert.equal(receivedDeleteFilter, undefined);

  const ownerResponse = createResponse();
  await hostController.postDeleteHome({
    params: { homeId },
    session: { user: { _id: hostId } },
  }, ownerResponse);

  assert.equal(ownerResponse.statusCode, 200);
  assert.deepEqual(receivedDeleteFilter, { _id: homeId, hostId });
});
