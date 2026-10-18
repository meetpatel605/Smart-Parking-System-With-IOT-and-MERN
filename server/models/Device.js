const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, default: "" },
    type: { type: String, enum: ["gate", "rfid_reader", "slot_sensor", "sensor", "unknown"], default: "unknown" },
    status: { type: String, enum: ["online", "offline"], default: "offline" },
    lastSeenAt: { type: Date, default: null },
    lastHeartbeatAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastError: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Device", deviceSchema);
