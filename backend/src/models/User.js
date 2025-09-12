const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["jobseeker", "employer", "mentor", "admin"],
      default: "jobseeker",
      index: true,
    },
    avatarUrl: {
      type: String,
    },
    phone: {
      type: String,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Remove redundant index to avoid duplicate index warning; unique on path is enough

module.exports = mongoose.model("User", userSchema);


