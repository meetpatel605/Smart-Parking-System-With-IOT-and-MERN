const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const VEHICLE_PATTERN = /^[A-Z0-9 -]{2,20}$/;

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const isValidEmail = (value) => typeof value === "string" && EMAIL_PATTERN.test(value.trim());
const isValidTime = (value) => typeof value === "string" && TIME_PATTERN.test(value);
const isValidDate = (value) => {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};
const isValidVehicleNumber = (value) => typeof value === "string" && VEHICLE_PATTERN.test(value.trim().toUpperCase());
const getParkingDateTimeParts = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.PARKING_TIMEZONE || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return { date: `${values.year}-${values.month}-${values.day}`, time: `${values.hour}:${values.minute}` };
};

module.exports = {
  isNonEmptyString,
  isValidEmail,
  isValidTime,
  isValidDate,
  isValidVehicleNumber,
  getParkingDateTimeParts,
};
