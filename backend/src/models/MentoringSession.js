const mongoose = require("mongoose");

const mentoringSessionSchema = new mongoose.Schema(
  {
    /** Platform mentor profile; omitted for startup founder / investor sessions */
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "Mentor", index: true },
    mentorUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobseeker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionKind: {
      type: String,
      enum: ["platform_mentor", "startup_founder", "investor"],
      default: "platform_mentor",
      index: true,
    },
    providerStartup: { type: mongoose.Schema.Types.ObjectId, ref: "Startup" },
    mentorshipRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MentorshipRequest",
    },
    startTime: { type: Date, required: true },
    minutes: { type: Number, required: true, min: 10, max: 240 },
    pricePerMinuteAtBooking: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { 
      type: String, 
      enum: ["pending_payment", "paid", "scheduled", "completed", "cancelled"], 
      default: "pending_payment", 
      index: true 
    },
    paymentId: { type: String }, // Payment gateway transaction ID
    paymentMethod: { type: String }, // e.g., "razorpay", "stripe"
    stripeCheckoutSessionId: { type: String, index: true },
    stripePaymentIntentId: { type: String, index: true },
    paidAt: { type: Date },
    invoiceNumber: { type: String },
    notes: { type: String, maxlength: 500 },
    motivation: { type: String, maxlength: 1000 }, // Jobseeker's motivation for seeking mentorship
  },
  { timestamps: true }
);

module.exports = mongoose.model("MentoringSession", mentoringSessionSchema);

