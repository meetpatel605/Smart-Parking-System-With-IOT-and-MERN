const express = require("express");
const crypto = require("crypto");
const Booking = require("../models/Booking");
const ParkingSlot = require("../models/ParkingSlot");
const Notification = require("../models/Notification");
const { protect } = require("../middleware/auth");

const router = express.Router();

const genBookingCode = () => "SP-" + crypto.randomBytes(4).toString("hex").toUpperCase();

// @route POST /api/bookings  (create a time-based booking)
router.post("/", protect, async (req, res) => {
  try {
    const { slotId, date, startTime, endTime, vehicleNumber } = req.body;
    if (!slotId || !date || !startTime || !endTime || !vehicleNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (startTime >= endTime) {
      return res.status(400).json({ message: "End time must be after start time" });
    }

    const slot = await ParkingSlot.findById(slotId);
    if (!slot || !slot.isActive || slot.status === "maintenance") {
      return res.status(400).json({ message: "Slot is not available" });
    }

    // Check overlap
    const conflict = await Booking.findOne({
      slot: slotId,
      date,
      status: { $in: ["confirmed", "pending"] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });
    if (conflict) return res.status(400).json({ message: "Slot already booked for this time range" });

    const booking = await Booking.create({
      user: req.user._id,
      slot: slotId,
      date,
      startTime,
      endTime,
      vehicleNumber,
      status: "confirmed",
      bookingCode: genBookingCode(),
    });

    await Notification.create({
      user: req.user._id,
      title: "Booking Confirmed",
      message: `Slot ${slot.slotNumber} booked on ${date} from ${startTime} to ${endTime}.`,
      type: "booking_confirmed",
    });

    const populated = await booking.populate("slot");
    res.status(201).json({ booking: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/bookings/mine
router.get("/mine", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("slot")
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PUT /api/bookings/:id/cancel
router.put("/:id/cancel", protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.user.toString() !== req.user._id.toString() && req.user.userType !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }
    booking.status = "cancelled";
    await booking.save();

    await Notification.create({
      user: booking.user,
      title: "Booking Cancelled",
      message: `Your booking ${booking.bookingCode} has been cancelled.`,
      type: "booking_cancelled",
    });

    res.json({ booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
