const express = require("express");
const ParkingSlot = require("../models/ParkingSlot");
const Booking = require("../models/Booking");
const { protect, adminOnly } = require("../middleware/auth");
const { isValidDate, isValidTime } = require("../utils/validation");

const router = express.Router();

// @route GET /api/slots  (live parking layout)
router.get("/", protect, async (req, res) => {
  try {
    const slots = await ParkingSlot.find({ isActive: true }).sort({ slotNumber: 1 });
    res.json({ slots });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/slots/available?date=YYYY-MM-DD&startTime=HH:MM&endTime=HH:MM
router.get("/available", protect, async (req, res) => {
  try {
    const { date, startTime, endTime } = req.query;
    if (!isValidDate(date) || !isValidTime(startTime) || !isValidTime(endTime) || startTime >= endTime) {
      return res.status(400).json({ message: "date, startTime and endTime are required" });
    }
    if (date < new Date().toISOString().slice(0, 10)) {
      return res.status(400).json({ message: "Date cannot be in the past" });
    }

    const allSlots = await ParkingSlot.find({ isActive: true, status: { $ne: "maintenance" } });

    const overlapping = await Booking.find({
      date,
      status: { $in: ["confirmed", "pending"] },
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
    }).select("slot");

    const bookedSlotIds = new Set(overlapping.map((b) => b.slot.toString()));
    const availableSlots = allSlots.filter((s) => !bookedSlotIds.has(s._id.toString()));

    res.json({ slots: availableSlots });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ----- Admin slot management -----

// @route POST /api/slots  (admin: add slot)
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { slotNumber, zone, nearestGate, category, chargingAvailable, covered } = req.body;
    if (typeof slotNumber !== "string" || !slotNumber.trim() || (zone !== undefined && (typeof zone !== "string" || !zone.trim())) || (nearestGate !== undefined && (typeof nearestGate !== "string" || !nearestGate.trim())) || !["general", "faculty", "disabled", "ev"].includes(category || "general")) {
      return res.status(400).json({ message: "Please enter valid slot details" });
    }
    const slot = await ParkingSlot.create({ slotNumber: slotNumber.trim(), zone: zone?.trim() || "A", nearestGate: nearestGate?.trim() || "Main Gate", category: category || "general", chargingAvailable: Boolean(chargingAvailable), covered: Boolean(covered) });
    res.status(201).json({ slot });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PUT /api/slots/:id (admin: edit / disable / maintenance)
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const slot = await ParkingSlot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!slot) return res.status(404).json({ message: "Slot not found" });
    res.json({ slot });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route DELETE /api/slots/:id (admin: delete slot)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await ParkingSlot.findByIdAndDelete(req.params.id);
    res.json({ message: "Slot deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
