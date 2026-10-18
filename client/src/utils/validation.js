const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isValidEmail = (value) => EMAIL_PATTERN.test(value.trim());

export const validateLogin = ({ email, password }) => {
  if (!email.trim() || !password) return "Please enter your email and password.";
  if (!isValidEmail(email)) return "Please enter a valid email address.";
  return "";
};

export const validateRegister = (form) => {
  const requiredFields = [
    ["fullName", "full name"],
    ["email", "email"],
    ["mobile", "mobile number"],
    ["address", "address"],
    ["aadhaarNumber", "Aadhaar number"],
    ["password", "password"],
  ];
  const missing = requiredFields.find(([field]) => !String(form[field] || "").trim());
  if (missing) return `Please enter your ${missing[1]}.`;
  if (!isValidEmail(form.email)) return "Please enter a valid email address.";
  if (!/^\d{10}$/.test(form.mobile)) return "Mobile number must contain exactly 10 digits.";
  if (!/^\d{12}$/.test(form.aadhaarNumber)) return "Aadhaar number must contain exactly 12 digits.";
  if (form.password.length < 6) return "Password must be at least 6 characters.";
  if (form.password !== form.confirmPassword) return "Passwords do not match.";
  if (form.vehicleNumber.trim() && !/^[A-Z0-9 -]{2,20}$/i.test(form.vehicleNumber.trim())) {
    return "Please enter a valid vehicle number.";
  }
  return "";
};

export const validateBooking = ({ date, startTime, endTime, vehicleNumber }) => {
  if (!date || !startTime || !endTime || !vehicleNumber.trim()) return "Please fill in all booking fields.";
  if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) return "Please enter valid booking times.";
  if (startTime >= endTime) return "End time must be after start time.";
  if (date < new Date().toISOString().slice(0, 10)) return "Booking date cannot be in the past.";
  return "";
};

export const validateProfile = ({ fullName, mobile, address, aadhaarNumber, vehicles }) => {
  if (!fullName.trim() || !mobile.trim() || !address.trim() || !aadhaarNumber.trim()) {
    return "Please fill in all profile fields.";
  }
  if (!/^\d{10}$/.test(mobile)) return "Mobile number must contain exactly 10 digits.";
  if (!/^\d{12}$/.test(aadhaarNumber)) return "Aadhaar number must contain exactly 12 digits.";
  if (vehicles.some((vehicle) => !String(vehicle.number || "").trim())) return "Please enter a number for every vehicle or remove empty vehicles.";
  return "";
};

export const validatePasswordChange = ({ currentPassword, newPassword }) => {
  if (!currentPassword || !newPassword) return "Please enter both passwords.";
  if (newPassword.length < 6) return "New password must be at least 6 characters.";
  return "";
};

export const validateOtp = (otp) => {
  if (!/^\d{6}$/.test(String(otp || ""))) return "Please enter the 6-digit OTP.";
  return "";
};

export const validateForgotPassword = ({ email }) => {
  if (!email || !email.trim()) return "Please enter your email address.";
  if (!isValidEmail(email)) return "Please enter a valid email address.";
  return "";
};

export const validateSlot = ({ slotNumber, zone, nearestGate }) => {
  if (!slotNumber?.trim() || !zone?.trim() || !nearestGate?.trim()) {
    return "Please fill in the slot number, zone, and nearest gate.";
  }
  if (!/^[A-Z0-9-]{1,20}$/i.test(slotNumber.trim())) {
    return "Slot number may contain only letters, numbers, and hyphens.";
  }
  return "";
};

export const validateNotification = ({ title, message }) => {
  if (!title?.trim() || !message?.trim()) return "Please enter a title and message.";
  return "";
};
