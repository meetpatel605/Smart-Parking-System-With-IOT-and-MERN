const express = require("express");
const crypto = require("crypto");
const Device = require("../models/Device");
const AccessEvent = require("../models/AccessEvent");
const { protect, adminOnly } = require("../middleware/auth");
const { publishGateCommand } = require("../services/mqtt");

const router = express.Router();
router.use(protect, adminOnly);

router.get("/devices", async (req, res) => {
  try {
    const devices = await Device.find().sort({ lastSeenAt: -1, deviceId: 1 }).lean();
    const cutoff = Date.now() - Number(process.env.DEVICE_OFFLINE_AFTER_MS || 120000);
    res.json({
      devices: devices.map((device) => ({
        ...device,
        status: device.lastSeenAt && new Date(device.lastSeenAt).getTime() >= cutoff ? "online" : "offline",
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/access-events", async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const events = await AccessEvent.find().populate("user", "fullName email").populate("booking", "bookingCode").sort({ occurredAt: -1 }).limit(limit).lean();
    res.json({ events });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/gate/:gate/command", async (req, res) => {
  const command = req.body?.command;
  if (!["open", "deny", "close"].includes(command)) return res.status(400).json({ message: "Invalid gate command" });
  const commandId = crypto.randomUUID();
  try {
    publishGateCommand(req.params.gate, { commandId, command, source: "admin", timestamp: new Date().toISOString() });
    res.status(202).json({ commandId, message: "Command published" });
  } catch (error) {
    res.status(503).json({ message: error.message });
  }
});

module.exports = router;
