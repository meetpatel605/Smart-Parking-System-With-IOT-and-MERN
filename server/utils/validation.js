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

module.exports = {
  isNonEmptyString,
  isValidEmail,
  isValidTime,
  isValidDate,
  isValidVehicleNumber,
};
