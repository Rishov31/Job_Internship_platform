const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobSeekerProfile: { type: mongoose.Schema.Types.ObjectId, ref: "JobSeekerProfile", required: true },
    status: {
      type: String,
      enum: ["pending", "reviewing", "shortlisted", "interview", "rejected", "accepted", "withdrawn"],
      default: "pending",
      index: true,
    },
    coverLetter: { type: String, maxlength: 2000 },
    resume: {
      fileName: String,
      fileUrl: String,
    },
    appliedAt: { type: Date, default: Date.now, index: true },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);


