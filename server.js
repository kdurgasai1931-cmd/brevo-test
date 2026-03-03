require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

/* =========================
   OTP TEMP STORAGE
========================= */
const otpStore = {};

/* =========================
   CREATE TRANSPORTER
========================= */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT), // IMPORTANT
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/* =========================
   GENERATE OTP
========================= */
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/* =========================
   SEND OTP ROUTE
========================= */
app.post("/send-otp", async (req, res) => {
  console.log("SEND OTP ROUTE HIT");

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const otp = generateOtp();

    otpStore[email] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000,
    };

    const info = await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    });

    console.log("EMAIL SENT:", info.response);

    res.json({ message: "OTP sent successfully" });

  } catch (error) {
    console.error("EMAIL ERROR:", error);
    res.status(500).json({ message: "Email failed" });
  }
});

/* =========================
   VERIFY OTP ROUTE
========================= */
app.post("/verify-otp", (req, res) => {
  console.log("VERIFY OTP ROUTE HIT");

  const { email, otp } = req.body;

  if (!otpStore[email]) {
    return res.status(400).json({ message: "No OTP found" });
  }

  const record = otpStore[email];

  if (Date.now() > record.expires) {
    delete otpStore[email];
    return res.status(400).json({ message: "OTP expired" });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  delete otpStore[email];

  res.json({ message: "OTP verified successfully" });
});

/* =========================
   SERVER START
========================= */
/* =========================
   SERVER START (RENDER READY)
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});