import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { generateVerificationEmail, generatePasswordResetEmail } from "./emailTemplates.js";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});



export const sendVerificationEmail = async (email, name, verificationLink) => {
  const mailOptions = {
    from: `${process.env.EMAIL_ALIAS} <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email - IREGO POS",
    html: generateVerificationEmail(name, verificationLink),
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email, name, verificationLink) => {
  const mailOptions = {
    from: `${process.env.EMAIL_ALIAS} <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request - IREGO POS",
    html: generatePasswordResetEmail(name, verificationLink),
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};
