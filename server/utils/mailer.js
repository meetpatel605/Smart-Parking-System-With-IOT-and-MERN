const QRCode = require("qrcode");
const nodemailer = require("nodemailer");

const isSmtpConfigured = () => Boolean(
  process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS
);

const createTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const generateQrDataUrl = async (payload) => {
  // payload should be a short string or JSON
  return await QRCode.toDataURL(payload);
};

const sendMailWithQr = async (toEmail, fullName, qrDataUrl) => {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@smartparking.com";
  if (!isSmtpConfigured()) {
    // SMTP not configured — caller can use returned QR data instead
    return false;
  }

  const transporter = createTransporter();

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
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@smartparking.com";

  if (!isSmtpConfigured()) return false;
  const transporter = createTransporter();

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: "Smart Parking password reset OTP",
    text: `Your Smart Parking password reset OTP is ${otp}. It expires in 10 minutes.`,
  });

  return true;
};

module.exports = { generateQrDataUrl, sendMailWithQr, sendPasswordResetOtp };
