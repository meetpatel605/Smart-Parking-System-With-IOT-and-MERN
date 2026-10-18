const mongoose = require("mongoose");

const parkingSlotSchema = new mongoose.Schema(
  {
    slotNumber: { type: String, required: true, unique: true },
    zone: { type: String, default: "A" },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "maintenance"],
      default: "available",
    },
    nearestGate: { type: String, default: "Main Gate" },
    chargingAvailable: { type: Boolean, default: false },
    covered: { type: Boolean, default: false },
    category: {
      type: String,
      enum: ["general", "faculty", "disabled", "ev"],
      default: "general",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ParkingSlot", parkingSlotSchema);
