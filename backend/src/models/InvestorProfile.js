const mongoose = require("mongoose");

const investorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    firmName: { type: String, trim: true },
    investmentFocus: [{ type: String, trim: true }],
    bio: { type: String, maxlength: 2000 },
    checkSizeMin: { type: Number, default: 0 },
    checkSizeMax: { type: Number, default: 0 },
    preferredStages: [
      { type: String, enum: ["pre-seed", "seed", "series-a", "series-b", "bootstrapped", "other"] },
    ],
    profileCompletionPercentage: { type: Number, default: 0 },
    isProfileComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InvestorProfile", investorProfileSchema);
