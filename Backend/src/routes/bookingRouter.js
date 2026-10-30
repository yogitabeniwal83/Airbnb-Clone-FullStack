const express = require("express");

const bookingController = require("../controllers/bookingController");
const authMiddleware = require("../middlewares/authMiddleware");
const { requireRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

router.use("/api/bookings", authMiddleware, requireRole('guest'));
router.post("/api/bookings", bookingController.createBooking);
router.get("/api/bookings", bookingController.getBookings);
router.patch("/api/bookings/:bookingId/cancel", bookingController.cancelBooking);

module.exports = router;
