const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "Mentor", required: true, index: true },
    mentorUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobseeker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    startTime: { type: Date, required: true },
    minutes: { type: Number, required: true, min: 10, max: 240 },
    pricePerMinuteAtBooking: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled", index: true },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);


