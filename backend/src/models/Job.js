const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    company: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    jobType: {
      type: String,
      enum: ["private", "government", "overseas"],
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    experience: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 5 },
    },
    salary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: "INR" },
      period: { type: String, enum: ["monthly", "yearly", "hourly"], default: "monthly" },
      // Detailed salary structure
      probationDuration: { type: String, default: "3 months" },
      probationSalaryMin: { type: Number },
      probationSalaryMax: { type: Number },
      annualCTCMin: { type: Number },
      annualCTCMax: { type: Number },
    },
    skills: [{
      type: String,
      trim: true,
    }],
    requirements: [{
      type: String,
      trim: true,
    }],
    benefits: [{
      type: String,
      trim: true,
    }],
    // Additional detailed fields
    keyResponsibilities: [{
      type: String,
      trim: true,
    }],
    workEnvironmentRequirements: [{
      type: String,
      trim: true,
    }],
    educationQualifications: [{
      type: String,
      trim: true,
    }],
    otherRequirements: [{
      type: String,
      trim: true,
    }],
    whyCompany: [{
      type: String,
      trim: true,
    }],
    applicationDeadline: {
      type: Date,
    },
    startDate: {
      type: String,
      default: "Immediately",
    },
    numberOfOpenings: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["active", "paused", "closed"],
      default: "active",
      index: true,
    },
    isRemote: {
      type: Boolean,
      default: false,
    },
    isFresher: {
      type: Boolean,
      default: false,
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    companyDetails: {
      website: String,
      logo: String,
      description: String,
      size: String,
      industry: String,
      // Company activity stats
      hiringSince: { type: String, default: "January 2020" },
      opportunitiesPosted: { type: Number, default: 0 },
      candidatesHired: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Index for better search performance
jobSchema.index({ title: "text", description: "text", company: "text", skills: "text" });
jobSchema.index({ jobType: 1, category: 1, location: 1 });
jobSchema.index({ status: 1, employer: 1 });

module.exports = mongoose.model("Job", jobSchema);
