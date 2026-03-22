const mongoose = require("mongoose");

const rewardClaimSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      required: true,
      index: true,
    },
    offerTitle: { type: String, default: "Swag Box" },
    status: {
      type: String,
      enum: ["pending", "acknowledged", "fulfilled"],
      default: "pending",
      index: true,
    },
    studentNote: { type: String, default: "" },
  },
  { timestamps: true }
);

rewardClaimSchema.index({ student: 1, startup: 1, status: 1 });

module.exports = mongoose.model("RewardClaim", rewardClaimSchema);
