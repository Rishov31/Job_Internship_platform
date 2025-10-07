const mongoose = require("mongoose");

const availabilitySlotSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: String, enum: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"], required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const mentorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    title: { type: String, trim: true },
    experienceYears: { type: Number, default: 0, min: 0 },
    expertise: [{ type: String, trim: true }],
    bio: { type: String, maxlength: 1000 },
    pricePerMinute: { type: Number, required: true, min: 0 },
    timezone: { type: String, default: "UTC" },
    availability: [availabilitySlotSchema],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalSessions: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mentor", mentorSchema);


