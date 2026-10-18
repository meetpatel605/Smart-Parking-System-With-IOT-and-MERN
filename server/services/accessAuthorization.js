const User = require("../models/User");
const Booking = require("../models/Booking");

const normalize = (value) => (typeof value === "string" ? value.trim().toUpperCase() : "");
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getParkingDateTime = (date) => {
  const timeZone = process.env.PARKING_TIMEZONE || "UTC";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).reduce((result, part) => {
    if (part.type !== "literal") result[part.type] = part.value;
    return result;
  }, {});
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
};

const findCredentialOwner = async (eventType, identifier) => {
  if (eventType === "rfid") {
    return User.findOne({ rfidCardId: { $regex: `^${escapeRegex(identifier)}$`, $options: "i" } });
  }
  return User.findOne({ "vehicles.qrToken": identifier });
};

const authorizeAccess = async ({ eventType, identifier, occurredAt = new Date() }) => {
  const normalizedIdentifier = eventType === "qr"
    ? (typeof identifier === "string" ? identifier.trim() : "")
    : normalize(identifier);
  if (!normalizedIdentifier) return { granted: false, reason: "Missing credential" };

  const user = await findCredentialOwner(eventType, normalizedIdentifier);
  if (!user) return { granted: false, reason: "Credential is not registered" };
  if (user.isBlocked) return { granted: false, user, reason: "Account is blocked" };

  const vehicle = eventType === "qr"
    ? user.vehicles.find((item) => item.qrToken === normalizedIdentifier)
    : null;
  const vehicleNumber = normalize(vehicle?.number || user.vehicleNumber);
  const { date, time } = getParkingDateTime(occurredAt);
  const booking = await Booking.findOne({
    user: user._id,
    ...(vehicleNumber ? { vehicleNumber } : {}),
    date,
    status: "confirmed",
    startTime: { $lte: time },
    endTime: { $gt: time },
  }).sort({ startTime: 1 });

  if (!booking) return { granted: false, user, vehicleNumber, reason: "No active booking for this credential" };
  return { granted: true, user, vehicleNumber, booking, reason: "Booking validated" };
};

module.exports = { authorizeAccess, normalize, getParkingDateTime };
