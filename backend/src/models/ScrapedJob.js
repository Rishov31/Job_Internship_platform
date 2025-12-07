const mongoose = require("mongoose");

const scrapedJobSchema = new mongoose.Schema(
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
    },
    // Full HTML description as scraped from the source site (for exact rendering)
    descriptionHtml: {
      type: String,
    },
    // Entire details section HTML (multiple sections stitched together for exact rendering)
    fullDetailsHtml: {
      type: String,
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
      default: "private",
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
      text: { type: String }, // Store salary as text from scraped data
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
      enum: ["active", "expired"],
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
    source: {
      type: String,
      enum: ["internshala", "unstop"],
      required: true,
      index: true,
    },
    sourceUrl: {
      type: String,
      required: true,
    },
    sourceId: {
      type: String,
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
    lastScraped: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicates from same source
scrapedJobSchema.index({ source: 1, sourceId: 1 }, { unique: true });

// Index for better search performance
scrapedJobSchema.index({ title: "text", description: "text", descriptionHtml: "text", fullDetailsHtml: "text", company: "text", skills: "text" });
scrapedJobSchema.index({ jobType: 1, category: 1, location: 1 });
scrapedJobSchema.index({ status: 1, source: 1 });
scrapedJobSchema.index({ lastScraped: -1 });

module.exports = mongoose.model("ScrapedJob", scrapedJobSchema);
