const mongoose = require("mongoose");

/**
 * Student requests mentorship from a startup founder or investor.
 * Provider proposes slot + price → student pays → MentoringSession + ChatRoom created.
 */
const mentorshipRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    providerType: {
      type: String,
      enum: ["startup", "investor"],
      required: true,
      index: true,
    },
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      index: true,
    },
    /** When providerType is investor — the investor User id */
    investorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    message: { type: String, maxlength: 1500, default: "" },
    status: {
      type: String,
      enum: ["pending", "rejected", "slot_proposed", "paid", "cancelled"],
      default: "pending",
      index: true,
    },
    proposedStartTime: { type: Date },
    proposedMinutes: { type: Number, min: 10, max: 240 },
    pricePerMinute: { type: Number, min: 0 },
    totalAmount: { type: Number, min: 0 },
    rejectionNote: { type: String, maxlength: 500 },
    mentoringSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MentoringSession",
    },
  },
  { timestamps: true }
);

mentorshipRequestSchema.pre("validate", function (next) {
  if (this.providerType === "startup" && !this.startup) {
    return next(new Error("startup is required when providerType is startup"));
  }
  if (this.providerType === "investor" && !this.investorUser) {
    return next(new Error("investorUser is required when providerType is investor"));
  }
  next();
});

module.exports = mongoose.model("MentorshipRequest", mentorshipRequestSchema);
