const mongoose = require("mongoose");

const mentoringSessionSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "Mentor", required: true, index: true },
    mentorUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobseeker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
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
    notes: { type: String, maxlength: 500 },
    motivation: { type: String, maxlength: 1000 }, // Jobseeker's motivation for seeking mentorship
  },
  { timestamps: true }
);

module.exports = mongoose.model("MentoringSession", mentoringSessionSchema);

