const mongoose = require("mongoose");

const contributionSchema = new mongoose.Schema(
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
    repoUrl: { type: String, required: true },
    issueUrl: String,
    prUrl: String,
    description: String,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    pointsAwarded: { type: Number, default: 0 },
    badgesAwarded: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contribution", contributionSchema);

