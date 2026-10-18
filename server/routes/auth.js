const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { generateQrDataUrl, sendMailWithQr, sendPasswordResetOtp, sendEmailVerificationOtp } = require("../utils/mailer");

const router = express.Router();
const MAX_VEHICLES_PER_USER = 10;

const normalizeVehicleNumber = (value) => {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase();
};

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// @route POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, mobile, address, aadhaarNumber, password, userType, vehicleNumber, vehicleType, rfidCardId } = req.body;
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedVehicleNumber = normalizeVehicleNumber(vehicleNumber);
    const normalizedAadhaar = typeof aadhaarNumber === "string" ? aadhaarNumber.replace(/\D/g, "") : "";

    if (!fullName || !normalizedEmail || !mobile || !address || !normalizedAadhaar || !password) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }
    if (normalizedAadhaar.length !== 12) {
      return res.status(400).json({ message: "Aadhaar number must contain exactly 12 digits" });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    // prepare initial vehicles array with a QR token for the vehicle (if provided)
    const vehicles = [];
    let qrDataUrl = null;
    if (normalizedVehicleNumber) {
      const qrToken = crypto.randomBytes(8).toString("hex");
      const payload = JSON.stringify({ t: qrToken, u: "new", v: normalizedVehicleNumber });
      qrDataUrl = await generateQrDataUrl(payload);
      vehicles.push({ number: normalizedVehicleNumber, type: vehicleType || "4-wheeler", qrToken, qrIssuedAt: new Date() });
    }

    const user = await User.create({
      fullName,
      email: normalizedEmail,
      mobile,
      address,
      aadhaarNumber: normalizedAadhaar,
      password,
      userType: userType === "faculty" ? "faculty" : "student",
      vehicleNumber: normalizedVehicleNumber || "",
      vehicleType: vehicleType || "4-wheeler",
      emailVerified: false,
      emailVerificationOtp: Math.floor(100000 + Math.random() * 900000).toString(),
      emailVerificationOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
      ...(rfidCardId?.trim() ? { rfidCardId: rfidCardId.trim() } : {}),
      vehicles,
    });

    // try to email QR (if SMTP configured). If mail not sent, return qrDataUrl so client can display/download in demo mode.
    let mailed = false;
    try {
      if (qrDataUrl) {
        mailed = await sendMailWithQr(user.email, user.fullName, qrDataUrl);
      }
    } catch (e) {
      // ignore mail errors for now
    }

    const verificationOtp = user.emailVerificationOtp;
    let mailedVerification = false;
    try {
      mailedVerification = await sendEmailVerificationOtp(user.email, verificationOtp);
    } catch (err) {
      mailedVerification = false;
    }
    const resp = {
      requiresEmailVerification: true,
      message: mailedVerification ? "Verification OTP sent to your email" : "Demo mode: SMTP is not configured",
      user: user.toSafeObject(),
    };
    if (!mailedVerification) resp.demoOtp = verificationOtp;
    if (!mailed && qrDataUrl) resp.qrDataUrl = qrDataUrl;
    res.status(201).json(resp);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });
    if (user.isBlocked) return res.status(403).json({ message: "Your account has been blocked by admin" });
    if (user.emailVerified === false) return res.status(403).json({ message: "Please verify your email before logging in" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = signToken(user._id);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/auth/verify-email
router.post("/verify-email", async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const { otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.emailVerified || user.emailVerificationOtp !== otp || !user.emailVerificationOtpExpires || user.emailVerificationOtpExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired verification OTP" });
    }

    user.emailVerified = true;
    user.emailVerificationOtp = null;
    user.emailVerificationOtpExpires = null;
    await user.save();
    res.json({ token: signToken(user._id), user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

// @route PUT /api/auth/profile
router.put("/profile", protect, async (req, res) => {
  try {
    const { fullName, mobile, address, aadhaarNumber, vehicleNumber, vehicleType, rfidCardId, profilePhoto, vehicles } = req.body;
    const user = req.user;
    const normalizedVehicleNumber = normalizeVehicleNumber(vehicleNumber);
    if (fullName) user.fullName = fullName;
    if (mobile) user.mobile = mobile;
    if (address !== undefined) user.address = address.trim();
    if (aadhaarNumber !== undefined) {
      const normalizedAadhaar = typeof aadhaarNumber === "string" ? aadhaarNumber.replace(/\D/g, "") : "";
      if (normalizedAadhaar.length !== 12) {
        return res.status(400).json({ message: "Aadhaar number must contain exactly 12 digits" });
      }
      user.aadhaarNumber = normalizedAadhaar;
    }
    if (vehicleNumber !== undefined) user.vehicleNumber = normalizedVehicleNumber;
    if (vehicleType) user.vehicleType = vehicleType;
    if (rfidCardId !== undefined) {
      const normalizedRfid = typeof rfidCardId === "string" ? rfidCardId.trim() : "";
      user.rfidCardId = normalizedRfid || undefined;
    }
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    // update vehicles list if provided (expect array of { number, type, label })
    if (Array.isArray(vehicles)) {
      if (vehicles.length > MAX_VEHICLES_PER_USER) {
        return res.status(400).json({ message: `You can add a maximum of ${MAX_VEHICLES_PER_USER} vehicles.` });
      }

      // merge: preserve existing qrToken when vehicle matches by number, otherwise generate a new token
      const existing = user.vehicles || [];
      const updated = [];
      const seenVehicleNumbers = new Set();
      for (const v of vehicles) {
        const normalizedNumber = normalizeVehicleNumber(v?.number);
        if (!normalizedNumber) continue;
        if (seenVehicleNumbers.has(normalizedNumber)) {
          return res.status(400).json({ message: `Vehicle number ${normalizedNumber} is already added. Please enter a different number.` });
        }
        seenVehicleNumbers.add(normalizedNumber);
        const found = existing.find((e) => normalizeVehicleNumber(e.number) === normalizedNumber);
        if (found) {
          updated.push({ ...found.toObject ? found.toObject() : found, number: normalizedNumber, type: v.type || found.type, label: v.label || found.label });
        } else {
          const qrToken = crypto.randomBytes(8).toString("hex");
          updated.push({ number: normalizedNumber, type: v.type || "4-wheeler", label: v.label || "", qrToken, qrIssuedAt: new Date() });
        }
      }
      if (updated.length > MAX_VEHICLES_PER_USER) {
        return res.status(400).json({ message: `You can add a maximum of ${MAX_VEHICLES_PER_USER} vehicles.` });
      }
      user.vehicles = updated;
      // keep backward compatibility fields in sync with first vehicle
      if (user.vehicles.length > 0) {
        user.vehicleNumber = user.vehicles[0].number;
        user.vehicleType = user.vehicles[0].type;
      }
    }
    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PUT /api/auth/change-password
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/auth/forgot-password  (simplified OTP demo — OTP returned in response since no email service configured)
router.post("/forgot-password", async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account with that email" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const mailed = await sendPasswordResetOtp(email, otp);
    if (mailed) {
      return res.json({ message: "OTP sent to your email" });
    }

    // Keep local development usable when SMTP is not configured.
    res.json({ message: "Demo mode: SMTP is not configured", otp });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const { otp, newPassword } = req.body;
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    const user = await User.findOne({ email });
    if (!user || user.resetOtp !== otp || !user.resetOtpExpires || user.resetOtpExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    user.password = newPassword;
    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();
    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
