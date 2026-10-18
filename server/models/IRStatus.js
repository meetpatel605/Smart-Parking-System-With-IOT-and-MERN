const mongoose = require("mongoose");

const irStatusSchema = new mongoose.Schema(
  {
    // deviceId is a unique per-slot key (e.g. ESP32-01-A1) to remain
    // compatible with databases that already have a unique deviceId index.
    deviceId: { type: String, required: true, unique: true, trim: true },
    parentDeviceId: { type: String, required: true, trim: true, index: true },
    slotId: { type: String, required: true, trim: true, uppercase: true },
    detected: { type: Boolean, required: true },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

irStatusSchema.index({ parentDeviceId: 1, slotId: 1 }, { unique: true });

module.exports = mongoose.model("IRStatus", irStatusSchema);
