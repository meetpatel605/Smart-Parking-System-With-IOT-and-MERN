const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userLabel: { type: String, default: "" }, // denormalized name/email for quick display
    action: { type: String, required: true }, // e.g. "login", "block_user", "add_slot"
    details: { type: String, default: "" },
    ip: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);
