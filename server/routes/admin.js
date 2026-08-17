const express = require("express");
const User = require("../models/User");
const Booking = require("../models/Booking");
const ParkingSlot = require("../models/ParkingSlot");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();
router.use(protect, adminOnly);

// @route GET /api/admin/stats  (dashboard cards)
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ userType: { $ne: "admin" } });
    const totalSlots = await ParkingSlot.countDocuments();
    const occupiedSlots = await ParkingSlot.countDocuments({ status: "occupied" });
    const availableSlots = await ParkingSlot.countDocuments({ status: "available" });
    const today = new Date().toISOString().slice(0, 10);
    const todaysBookings = await Booking.countDocuments({ date: today });
    const totalBookings = await Booking.countDocuments();

    res.json({
      totalUsers,
      totalSlots,
      occupiedSlots,
      availableSlots,
      todaysBookings,
      totalBookings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ----- Users -----

// @route GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { userType: { $ne: "admin" } };
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { vehicleNumber: { $regex: search, $options: "i" } },
      ];
    }
    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PUT /api/admin/users/:id (edit / block-unblock / assign RFID)
router.put("/users/:id", async (req, res) => {
  try {
    const allowed = ["fullName", "mobile", "vehicleNumber", "vehicleType", "rfidCardId", "isBlocked", "userType"];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-password");
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ----- Bookings -----

// @route GET /api/admin/bookings
router.get("/bookings", async (req, res) => {
  try {
    const { status, date } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (date) filter.date = date;
    const bookings = await Booking.find(filter)
      .populate("user", "fullName email userType")
      .populate("slot", "slotNumber zone")
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PUT /api/admin/bookings/:id/status
router.put("/bookings/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ----- Analytics -----

// @route GET /api/admin/analytics
router.get("/analytics", async (req, res) => {
  try {
    const bookings = await Booking.find().populate("slot", "slotNumber");

    // Bookings per day (last 14 entries by date string)
    const perDayMap = {};
    bookings.forEach((b) => {
      perDayMap[b.date] = (perDayMap[b.date] || 0) + 1;
    });
    const bookingTrends = Object.entries(perDayMap)
      .sort((a, b) => (a[0] > b[0] ? 1 : -1))
      .slice(-14)
      .map(([date, count]) => ({ date, count }));

    // Peak hours (by start hour)
    const hourMap = {};
    bookings.forEach((b) => {
      const hour = b.startTime?.split(":")[0];
      if (hour) hourMap[hour] = (hourMap[hour] || 0) + 1;
    });
    const peakHours = Object.entries(hourMap)
      .sort((a, b) => a[0] - b[0])
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }));

    // Most used slots
    const slotMap = {};
    bookings.forEach((b) => {
      const name = b.slot?.slotNumber || "Unknown";
      slotMap[name] = (slotMap[name] || 0) + 1;
    });
    const mostUsedSlots = Object.entries(slotMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([slot, count]) => ({ slot, count }));

    // Status breakdown
    const statusMap = {};
    bookings.forEach((b) => {
      statusMap[b.status] = (statusMap[b.status] || 0) + 1;
    });
    const statusBreakdown = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    res.json({ bookingTrends, peakHours, mostUsedSlots, statusBreakdown });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
