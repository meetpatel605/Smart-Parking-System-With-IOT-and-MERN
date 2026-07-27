const express = require("express");
const User = require("../models/User");
const Booking = require("../models/Booking");
const ParkingSlot = require("../models/ParkingSlot");
const Notification = require("../models/Notification");
const Settings = require("../models/Settings");
const ActivityLog = require("../models/ActivityLog");
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
    const reservedSlots = await ParkingSlot.countDocuments({ status: "reserved" });
    const today = new Date().toISOString().slice(0, 10);
    const todaysBookings = await Booking.countDocuments({ date: today });
    const totalBookings = await Booking.countDocuments();
    // "Active vehicles" = confirmed bookings for today (a reasonable proxy without live gate hardware)
    const activeVehicles = await Booking.countDocuments({ date: today, status: "confirmed" });

    const recentActivities = await ActivityLog.find().sort({ createdAt: -1 }).limit(8);

    res.json({
      totalUsers,
      totalSlots,
      occupiedSlots,
      availableSlots,
      reservedSlots,
      todaysBookings,
      totalBookings,
      activeVehicles,
      // Entry/Exit stats are simulated proportional to today's bookings since there's no live gate hardware wired in yet
      entryExitStats: {
        entriesToday: activeVehicles,
        exitsToday: Math.max(0, activeVehicles - Math.round(activeVehicles * 0.3)),
      },
      recentActivities,
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

// @route PUT /api/admin/users/:id (edit / block-unblock)
router.put("/users/:id", async (req, res) => {
  try {
    const allowed = ["fullName", "mobile", "vehicleNumber", "vehicleType", "isBlocked", "userType"];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-password");

    if (req.body.isBlocked !== undefined) {
      ActivityLog.create({
        user: req.user._id,
        userLabel: `${req.user.fullName} (admin)`,
        action: req.body.isBlocked ? "block_user" : "unblock_user",
        details: `${user?.fullName || req.params.id}`,
      }).catch(() => {});
    }

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

// ----- RFID Management -----

// @route GET /api/admin/rfid  (all users, for the RFID management table)
router.get("/rfid", async (req, res) => {
  try {
    const users = await User.find({ userType: { $ne: "admin" } })
      .select("fullName email vehicleNumber rfidCardId rfidStatus")
      .sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/admin/rfid/:userId/assign  (register/assign or replace a card)
router.post("/rfid/:userId/assign", async (req, res) => {
  try {
    const { rfidCardId } = req.body;
    if (!rfidCardId) return res.status(400).json({ message: "RFID Card ID is required" });

    const existing = await User.findOne({ rfidCardId, _id: { $ne: req.params.userId } });
    if (existing) return res.status(400).json({ message: "This RFID card is already assigned to another user" });

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { rfidCardId, rfidStatus: "active" },
      { new: true }
    ).select("-password");

    ActivityLog.create({
      user: req.user._id,
      userLabel: `${req.user.fullName} (admin)`,
      action: "assign_rfid",
      details: `Card ${rfidCardId} → ${user?.fullName}`,
    }).catch(() => {});

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PUT /api/admin/rfid/:userId/deactivate
router.put("/rfid/:userId/deactivate", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { rfidStatus: "inactive" },
      { new: true }
    ).select("-password");

    ActivityLog.create({
      user: req.user._id,
      userLabel: `${req.user.fullName} (admin)`,
      action: "deactivate_rfid",
      details: `${user?.fullName}`,
    }).catch(() => {});

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route DELETE /api/admin/rfid/:userId  (unassign card entirely / "lost card")
router.delete("/rfid/:userId", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, {
      $unset: { rfidCardId: "" },
      rfidStatus: "unassigned",
    });
    res.json({ message: "RFID card unassigned" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ----- Settings -----

// @route GET /api/admin/settings
router.get("/settings", async (req, res) => {
  try {
    let settings = await Settings.findOne({ key: "global" });
    if (!settings) settings = await Settings.create({ key: "global" });
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PUT /api/admin/settings
router.put("/settings", async (req, res) => {
  try {
    const allowed = [
      "parkingOpenTime", "parkingCloseTime", "maxBookingDurationHours",
      "minBookingDurationMinutes", "maxAdvanceBookingDays", "allowOverlapWaitlist",
      "holidays", "contactEmail", "smtpConfigured",
    ];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });
    const settings = await Settings.findOneAndUpdate({ key: "global" }, updates, {
      new: true,
      upsert: true,
    });

    ActivityLog.create({
      user: req.user._id,
      userLabel: `${req.user.fullName} (admin)`,
      action: "update_settings",
      details: Object.keys(updates).join(", "),
    }).catch(() => {});

    res.json({ settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ----- Notifications (broadcast) -----

// @route POST /api/admin/notifications/broadcast
router.post("/notifications/broadcast", async (req, res) => {
  try {
    const { title, message, target } = req.body; // target: "all" | "student" | "faculty"
    if (!title || !message) return res.status(400).json({ message: "Title and message are required" });

    const filter = { userType: { $ne: "admin" } };
    if (target === "student" || target === "faculty") filter.userType = target;

    const users = await User.find(filter).select("_id");
    const docs = users.map((u) => ({ user: u._id, title, message, type: "general" }));
    if (docs.length) await Notification.insertMany(docs);

    ActivityLog.create({
      user: req.user._id,
      userLabel: `${req.user.fullName} (admin)`,
      action: "broadcast_notification",
      details: `"${title}" → ${docs.length} user(s) (${target || "all"})`,
    }).catch(() => {});

    res.json({ message: `Notification sent to ${docs.length} user(s)` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/admin/notifications/history
router.get("/notifications/history", async (req, res) => {
  try {
    const logs = await ActivityLog.find({ action: "broadcast_notification" }).sort({ createdAt: -1 }).limit(50);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ----- Activity Logs / Security -----

// @route GET /api/admin/activity-logs
router.get("/activity-logs", async (req, res) => {
  try {
    const { action, limit } = req.query;
    const filter = {};
    if (action) filter.action = action;
    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit) || 100);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/admin/login-history
router.get("/login-history", async (req, res) => {
  try {
    const logs = await ActivityLog.find({ action: "login" }).sort({ createdAt: -1 }).limit(50);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
