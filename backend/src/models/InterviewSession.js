const mongoose = require("mongoose");

/** Coding + video interview tied to a job application */
const interviewSessionSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      unique: true,
      index: true,
    },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    employer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed"],
      default: "scheduled",
      index: true,
    },
    /** Stream video uses call-{sessionId} — session _id string */
    notes: { type: String, maxlength: 2000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InterviewSession", interviewSessionSchema);
