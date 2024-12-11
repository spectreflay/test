import express from "express";
import bcrypt from "bcryptjs";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/userModel.js";

const router = express.Router();

// Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: "uploads/",
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(
//       null,
//       file.fieldname +
//         "-" +
//         uniqueSuffix +
//         "." +
//         file.originalname.split(".").pop()
//     );
//   },
// });

// const upload = multer({ storage });

// Update profile
router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update avatar
// router.put("/avatar", protect, upload.single("avatar"), async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id);
//     if (user && req.file) {
//       user.avatar = `/uploads/${req.file.filename}`;
//       const updatedUser = await user.save();
//       res.json({
//         _id: updatedUser._id,
//         name: updatedUser.name,
//         email: updatedUser.email,
//         avatar: updatedUser.avatar,
//       });
//     } else {
//       res.status(404).json({ message: "User not found or no file uploaded" });
//     }
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// });

//Update theme
router.put("/theme", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.themePreference = req.body.themePreference;
      await user.save();
      res.json({ message: "Theme updated successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add this new route
router.get("/theme", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({ themePreference: user.themePreference });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update password
router.put("/password", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user && (await user.matchPassword(req.body.currentPassword))) {
      user.password = req.body.newPassword;
      await user.save();
      res.json({ message: "Password updated successfully" });
    } else {
      res.status(401).json({ message: "Invalid current password" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete account
router.delete("/account", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      await user.deleteOne();
      res.json({ message: "Account deleted successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;

