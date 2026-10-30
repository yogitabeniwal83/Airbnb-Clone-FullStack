const mongoose = require("mongoose");

const Booking = require("../models/booking");
const Home = require("../models/home");

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const HOME_FIELDS = "houseName location photo rating price";

const parseDateOnly = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

exports.createBooking = async (req, res) => {
  try {
    const { homeId, checkIn, checkOut, guests } = req.body;
    const userId = req.session.user._id;

    if (!mongoose.isValidObjectId(homeId)) {
      return res.status(400).json({
        success: false,
        message: "A valid homeId is required.",
      });
    }

    const parsedCheckIn = parseDateOnly(checkIn);
    const parsedCheckOut = parseDateOnly(checkOut);

    if (!parsedCheckIn || !parsedCheckOut) {
      return res.status(400).json({
        success: false,
        message: "Check-in and check-out must be valid dates in YYYY-MM-DD format.",
      });
    }

    if (parsedCheckOut <= parsedCheckIn) {
      return res.status(400).json({
        success: false,
        message: "Check-out must be after check-in.",
      });
    }

    const guestCount = Number(guests);
    if (!Number.isInteger(guestCount) || guestCount < 1) {
      return res.status(400).json({
        success: false,
        message: "Guests must be a whole number greater than zero.",
      });
    }

    const home = await Home.findById(homeId);
    if (!home) {
      return res.status(404).json({
        success: false,
        message: "Home not found.",
      });
    }

    const pricePerNight = Number(home.price);
    if (!Number.isFinite(pricePerNight) || pricePerNight < 0) {
      return res.status(422).json({
        success: false,
        message: "This home does not have a valid nightly price.",
      });
    }

    const totalNights = Math.round(
      (parsedCheckOut.getTime() - parsedCheckIn.getTime()) / MILLISECONDS_PER_DAY,
    );
    const totalPrice = pricePerNight * totalNights;

    const booking = await Booking.create({
      userId,
      homeId: home._id,
      checkIn: parsedCheckIn,
      checkOut: parsedCheckOut,
      guests: guestCount,
      totalNights,
      pricePerNight,
      totalPrice,
      status: "confirmed",
    });

    await booking.populate("homeId", HOME_FIELDS);

    return res.status(201).json({
      success: true,
      message: "Booking confirmed successfully.",
      booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to create the booking. Please try again.",
    });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.session.user._id })
      .populate("homeId", HOME_FIELDS)
      .sort({ createdAt: -1 });

    return res.json({ success: true, bookings });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to load bookings. Please try again.",
    });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({ success: false, message: "Invalid booking ID." });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    if (booking.userId.toString() !== req.session.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to cancel this booking.",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(409).json({
        success: false,
        message: "This booking has already been cancelled.",
      });
    }

    booking.status = "cancelled";
    await booking.save();
    await booking.populate("homeId", HOME_FIELDS);

    return res.json({
      success: true,
      message: "Booking cancelled successfully.",
      booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to cancel the booking. Please try again.",
    });
  }
};
