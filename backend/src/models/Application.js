const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", index: true },
    scrapedJob: { type: mongoose.Schema.Types.ObjectId, ref: "ScrapedJob", index: true },
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobSeekerProfile: { type: mongoose.Schema.Types.ObjectId, ref: "JobSeekerProfile", required: true },
    isScraped: { type: Boolean, default: false, index: true },
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
    /** Interview notes, coding session id, etc. */
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate applications
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true, sparse: true });
applicationSchema.index({ scrapedJob: 1, applicant: 1 }, { unique: true, sparse: true });

// Validation: Either job or scrapedJob must be provided
applicationSchema.pre('validate', function(next) {
  if (!this.job && !this.scrapedJob) {
    next(new Error('Either job or scrapedJob must be provided'));
  } else if (this.job && this.scrapedJob) {
    next(new Error('Cannot have both job and scrapedJob'));
  } else {
    next();
  }
});

module.exports = mongoose.model("Application", applicationSchema);


