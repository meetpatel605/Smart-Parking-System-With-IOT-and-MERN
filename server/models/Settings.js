const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    // Using a fixed key so there is always exactly one settings document
    key: { type: String, default: "global", unique: true },

    parkingOpenTime: { type: String, default: "06:00" },
    parkingCloseTime: { type: String, default: "22:00" },
    maxBookingDurationHours: { type: Number, default: 4 },
    minBookingDurationMinutes: { type: Number, default: 30 },
    maxAdvanceBookingDays: { type: Number, default: 7 },
    allowOverlapWaitlist: { type: Boolean, default: true },
    holidays: [{ date: String, label: String }],
    contactEmail: { type: String, default: "support@smartparking.com" },
    smtpConfigured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
