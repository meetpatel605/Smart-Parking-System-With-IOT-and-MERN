const QRCode = require("qrcode");
const nodemailer = require("nodemailer");

const generateQrDataUrl = async (payload) => {
  // payload should be a short string or JSON
  return await QRCode.toDataURL(payload);
};

const sendMailWithQr = async (toEmail, fullName, qrDataUrl) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || `no-reply@smartparking.com`;

  if (!host || !port || !user || !pass) {
    // SMTP not configured — caller can use returned QR data instead
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465, // true for 465, false for other ports
    auth: { user, pass },
  });

  const html = `
    <p>Hi ${fullName},</p>
    <p>Your Smart Parking QR access code is attached below. Show this QR at the gate reader to enter.</p>
    <img src="${qrDataUrl}" alt="QR Code" />
    <p>If you didn't request this, please contact support.</p>
  `;

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: "Your Smart Parking QR Access",
    html,
  });

  return true;
};

const sendPasswordResetOtp = async (toEmail, otp) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@smartparking.com";

  if (!host || !port || !user || !pass) return false;

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: "Smart Parking password reset OTP",
    text: `Your Smart Parking password reset OTP is ${otp}. It expires in 10 minutes.`,
  });

  return true;
};

const sendEmailVerificationOtp = async (toEmail, otp) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@smartparking.com";

  if (!host || !port || !user || !pass) return false;

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: "Verify your Smart Parking email",
    text: `Your Smart Parking email verification OTP is ${otp}. It expires in 10 minutes.`,
  });

  return true;
};

module.exports = { generateQrDataUrl, sendMailWithQr, sendPasswordResetOtp, sendEmailVerificationOtp };
