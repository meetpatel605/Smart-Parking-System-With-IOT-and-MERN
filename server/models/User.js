const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const normalizeVehicleNumber = (value) => {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase();
};

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 },
    userType: { type: String, enum: ["student", "faculty", "admin"], default: "student" },
    vehicleNumber: { type: String, default: "", set: normalizeVehicleNumber },
    vehicleType: { type: String, enum: ["2-wheeler", "4-wheeler", "other"], default: "4-wheeler" },
    rfidCardId: { type: String, default: null, unique: true, sparse: true },
    // support multiple vehicles per user
    vehicles: [
      {
        number: { type: String, required: true, set: normalizeVehicleNumber },
        type: { type: String, enum: ["2-wheeler", "4-wheeler", "other"], default: "4-wheeler" },
        label: { type: String, default: "" },
        qrToken: { type: String, default: null },
        qrIssuedAt: { type: Date, default: null },
      },
    ],
    profilePhoto: { type: String, default: "" },
    isBlocked: { type: Boolean, default: false },
    resetOtp: { type: String, default: null },
    resetOtpExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetOtp;
  delete obj.resetOtpExpires;
  // Remove internal QR tokens from vehicles before exposing
  if (obj.vehicles && Array.isArray(obj.vehicles)) {
    obj.vehicles = obj.vehicles.map((v) => {
      const { qrToken, ...rest } = v || {};
      return rest;
    });
  }
  return obj;
};

module.exports = mongoose.model("User", userSchema);
