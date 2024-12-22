import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../utils/emailService.js";
import VerificationToken from "../models/verificationTokenModel.js";
import {
  generateVerificationToken,
  createVerificationLink,
  createResetLink,
  generateResetToken,
  verifyResetToken,
} from "../utils/generateTokenLinkUtils.js";

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "30d",
  });
};

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      isEmailVerified: false,
    });

    // Generate verification token and send email
    const verificationToken = await generateVerificationToken(user._id);
    const verificationLink = createVerificationLink(verificationToken);
    await sendVerificationEmail(email, name, verificationLink);

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
        isEmailVerified: false,
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Verify email route
router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;
    const verificationToken = await VerificationToken.findOne({ token });

    if (!verificationToken) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token" });
    }

    const user = await User.findById(verificationToken.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isEmailVerified = true;
    await user.save();
    await verificationToken.deleteOne();

    res.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Resend verification email
router.post("/resend-verification", async (req, res) => {
  try {
    const { email, name } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Delete any existing verification tokens
    await VerificationToken.deleteMany({ user: user._id });

    // Generate new token and send email
    const verificationToken = await generateVerificationToken(user._id);
    const verificationLink = createVerificationLink(verificationToken);
    await sendVerificationEmail(email, user.name, verificationLink);

    res.json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Send verification email (for logged-in users)
router.post("/send-verification", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Delete any existing verification tokens
    await VerificationToken.deleteMany({ user: user._id });

    // Generate new token and send email
    const verificationToken = await generateVerificationToken(user._id);
    const verificationLink = createVerificationLink(verificationToken);
    await sendVerificationEmail(user.email, user.name, verificationLink);

    res.json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = await generateResetToken(user._id);
    const resetLink = createResetLink(resetToken);
    await sendPasswordResetEmail(user.email, user.name, resetLink);

    res.json({
      success: true,
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const resetToken = await verifyResetToken(token);
    const user = resetToken.user;

    // Update password
    user.password = newPassword;
    await user.save();

    // Delete the used token
    await resetToken.deleteOne();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
        themePreference: user.themePreference,
        isEmailVerified: user.isEmailVerified || false,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
