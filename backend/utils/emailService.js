import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { generateVerificationEmail, generatePasswordResetEmail } from "./emailTemplates";

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


// export const sendVerificationEmail = async (email, verificationLink) => {
//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: "Email Verification - IREGO POS",
//     html: `
//       <h1>Verify Your Email</h1>
//       <p>Please click the link below to verify your email address:</p>
//       <a href="${verificationLink}">${verificationLink}</a>
//       <p>This link will expire in 24 hours.</p>
//     `,
//   };

//   await transporter.sendMail(mailOptions);
// };
