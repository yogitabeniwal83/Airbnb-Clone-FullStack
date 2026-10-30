const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");

const Booking = require("../src/models/booking");
const Home = require("../src/models/home");
const bookingController = require("../src/controllers/bookingController");
const authMiddleware = require("../src/middlewares/authMiddleware");

const originalBookingCreate = Booking.create;
const originalBookingFind = Booking.find;
const originalBookingFindById = Booking.findById;
const originalHomeFindById = Home.findById;

afterEach(() => {
  Booking.create = originalBookingCreate;
  Booking.find = originalBookingFind;
  Booking.findById = originalBookingFindById;
  Home.findById = originalHomeFindById;
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

test("authentication middleware rejects requests without a logged-in session", () => {
  const response = createResponse();
  let nextCalled = false;

  authMiddleware({ session: {} }, response, () => {
    nextCalled = true;
  });

  assert.equal(response.statusCode, 401);
  assert.equal(nextCalled, false);
});

test("createBooking derives ownership and pricing on the server", async () => {
  const homeId = "64b000000000000000000001";
  let createdData;

  Home.findById = async () => ({ _id: homeId, price: 1250 });
  Booking.create = async (data) => {
    createdData = data;
    return {
      _id: "64b000000000000000000010",
      ...data,
      populate: async function populate() { return this; },
    };
  };

  const response = createResponse();
  await bookingController.createBooking({
    session: { user: { _id: "64b000000000000000000002" } },
    body: {
      userId: "64b000000000000000000099",
      homeId,
      checkIn: "2026-10-10",
      checkOut: "2026-10-12",
      guests: 2,
      totalPrice: 1,
    },
  }, response);

  assert.equal(response.statusCode, 201);
  assert.equal(createdData.userId, "64b000000000000000000002");
  assert.equal(createdData.totalNights, 2);
  assert.equal(createdData.pricePerNight, 1250);
  assert.equal(createdData.totalPrice, 2500);
});

test("createBooking rejects invalid date order and invalid guest counts", async () => {
  const baseRequest = {
    session: { user: { _id: "64b000000000000000000002" } },
    body: {
      homeId: "64b000000000000000000001",
      checkIn: "2026-10-12",
      checkOut: "2026-10-10",
      guests: 0,
    },
  };

  const dateResponse = createResponse();
  await bookingController.createBooking(baseRequest, dateResponse);
  assert.equal(dateResponse.statusCode, 400);
  assert.match(dateResponse.body.message, /after check-in/i);

  const guestResponse = createResponse();
  await bookingController.createBooking({
    ...baseRequest,
    body: {
      ...baseRequest.body,
      checkOut: "2026-10-14",
    },
  }, guestResponse);
  assert.equal(guestResponse.statusCode, 400);
  assert.match(guestResponse.body.message, /guests/i);
});

test("getBookings always filters by the session user and sorts newest first", async () => {
  let receivedFilter;
  let receivedSort;
  const expectedBookings = [{ _id: "booking-one" }];

  Booking.find = (filter) => {
    receivedFilter = filter;
    return {
      populate() { return this; },
      sort(sort) {
        receivedSort = sort;
        return Promise.resolve(expectedBookings);
      },
    };
  };

  const response = createResponse();
  await bookingController.getBookings({
    session: { user: { _id: "64b000000000000000000002" } },
  }, response);

  assert.deepEqual(receivedFilter, { userId: "64b000000000000000000002" });
  assert.deepEqual(receivedSort, { createdAt: -1 });
  assert.deepEqual(response.body.bookings, expectedBookings);
});

test("cancelBooking forbids non-owners and updates an owner's booking", async () => {
  const bookingId = "64b000000000000000000010";
  let saveCalled = false;
  const booking = {
    userId: { toString: () => "64b000000000000000000002" },
    status: "confirmed",
    save: async () => { saveCalled = true; },
    populate: async function populate() { return this; },
  };
  Booking.findById = async () => booking;

  const forbiddenResponse = createResponse();
  await bookingController.cancelBooking({
    params: { bookingId },
    session: { user: { _id: "64b000000000000000000003" } },
  }, forbiddenResponse);
  assert.equal(forbiddenResponse.statusCode, 403);
  assert.equal(saveCalled, false);

  const ownerResponse = createResponse();
  await bookingController.cancelBooking({
    params: { bookingId },
    session: { user: { _id: "64b000000000000000000002" } },
  }, ownerResponse);
  assert.equal(ownerResponse.statusCode, 200);
  assert.equal(ownerResponse.body.booking.status, "cancelled");
  assert.equal(saveCalled, true);
});
