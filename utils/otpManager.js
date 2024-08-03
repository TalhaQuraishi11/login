const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

// Create a transporter object using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

// In-memory store for OTPs
const otpStore = new Map(); // Key: email, Value: { otp: string, expiresAt: Date }

// Generate OTP function
const generateOTP = () => {
  return otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
  });
};

// Store OTP function
const storeOTP = (email, otp) => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  console.log(`Storing OTP: ${otp}, Expires At: ${expiresAt}`); // Debug log
  otpStore.set(email, { otp, expiresAt });
};

// Retrieve OTP function
const getStoredOTP = (email) => {
  const otpRecord = otpStore.get(email);
  console.log(`Retrieved OTP Record: ${JSON.stringify(otpRecord)}`); // Debug log
  if (otpRecord && otpRecord.expiresAt > new Date()) {
    return otpRecord.otp;
  }
  return null;
};

// Delete OTP function
const deleteStoredOTP = (email) => {
  otpStore.delete(email);
};

// Send OTP email function
const sendEmail = async (email, otp) => {
  console.log(`Generated OTP: ${otp}`); // For debugging

  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
    return otp; // Return OTP for validation purposes
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send OTP email");
  }
};

module.exports = { sendEmail, generateOTP, storeOTP, getStoredOTP, deleteStoredOTP };
