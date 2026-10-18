const mongoose = require("mongoose");

const accessEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    deviceId: { type: String, required: true, index: true },
    gate: { type: String, default: "entry" },
    eventType: { type: String, enum: ["rfid", "qr"], required: true },
    identifier: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
    vehicleNumber: { type: String, default: "" },
    status: { type: String, enum: ["granted", "denied"], required: true },
    reason: { type: String, default: "" },
    commandId: { type: String, default: "" },
    commandStatus: { type: String, enum: ["pending", "acknowledged", "failed", "not_required"], default: "pending" },
    occurredAt: { type: Date, required: true },
    rawPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AccessEvent", accessEventSchema);
