const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

const Home = require('../src/models/home');
const User = require('../src/models/user');
const storeController = require('../src/controllers/storeController');

const originalHomeFindById = Home.findById;
const originalUserFindById = User.findById;
const originalUserFindByIdAndUpdate = User.findByIdAndUpdate;

afterEach(() => {
  Home.findById = originalHomeFindById;
  User.findById = originalUserFindById;
  User.findByIdAndUpdate = originalUserFindByIdAndUpdate;
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

test('getFavouriteList loads only the session user favourites', async () => {
  const favourites = [{ _id: '64b000000000000000000001', houseName: 'Test Home' }];
  let receivedUserId;
  let populateOptions;

  User.findById = (userId) => {
    receivedUserId = userId;
    return {
      populate: async (options) => {
        populateOptions = options;
        return { favourites };
      },
    };
  };

  const response = createResponse();
  await storeController.getFavouriteList({
    session: { user: { _id: '64b000000000000000000002' } },
  }, response);

  assert.equal(receivedUserId, '64b000000000000000000002');
  assert.equal(populateOptions.path, 'favourites');
  assert.deepEqual(response.body.favourites, favourites);
});

test('postAddToFavourite validates home IDs and verifies that the home exists', async () => {
  const invalidResponse = createResponse();
  await storeController.postAddToFavourite({
    params: { homeId: 'not-an-object-id' },
    session: { user: { _id: '64b000000000000000000002' } },
  }, invalidResponse);
  assert.equal(invalidResponse.statusCode, 400);

  Home.findById = async () => null;
  const missingResponse = createResponse();
  await storeController.postAddToFavourite({
    params: { homeId: '64b000000000000000000001' },
    session: { user: { _id: '64b000000000000000000002' } },
  }, missingResponse);
  assert.equal(missingResponse.statusCode, 404);
});

test('postAddToFavourite uses the session user and addToSet to prevent duplicates', async () => {
  const homeId = '64b000000000000000000001';
  const userId = '64b000000000000000000002';
  let receivedUserId;
  let receivedUpdate;

  Home.findById = async () => ({ _id: homeId, houseName: 'Test Home' });
  User.findByIdAndUpdate = async (id, update) => {
    receivedUserId = id;
    receivedUpdate = update;
    return { _id: userId, favourites: [homeId] };
  };

  const response = createResponse();
  await storeController.postAddToFavourite({
    params: { homeId },
    session: { user: { _id: userId } },
    body: { userId: '64b000000000000000000099' },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(receivedUserId, userId);
  assert.deepEqual(receivedUpdate, { $addToSet: { favourites: homeId } });
  assert.equal(response.body.isFavourite, true);
});

test('postRemoveFromFavourite pulls only from the session user favourites', async () => {
  const homeId = '64b000000000000000000001';
  const userId = '64b000000000000000000002';
  let receivedUserId;
  let receivedUpdate;

  User.findByIdAndUpdate = async (id, update) => {
    receivedUserId = id;
    receivedUpdate = update;
    return { _id: userId, favourites: [] };
  };

  const response = createResponse();
  await storeController.postRemoveFromFavourite({
    params: { homeId },
    session: { user: { _id: userId } },
  }, response);

  assert.equal(receivedUserId, userId);
  assert.deepEqual(receivedUpdate, { $pull: { favourites: homeId } });
  assert.equal(response.body.isFavourite, false);
});
