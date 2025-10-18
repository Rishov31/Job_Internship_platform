const mongoose = require("mongoose");

const scrapedInternshipSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    company: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    stipend: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    requirements: [{
      type: String,
    }],
    skills: [{
      type: String,
    }],
    status: {
      type: String,
      enum: ["active", "expired"],
      default: "active",
      index: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    applicationDeadline: {
      type: Date,
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
    },
    lastScraped: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicates from same source
scrapedInternshipSchema.index({ source: 1, sourceId: 1 }, { unique: true });

// Index for better search performance
scrapedInternshipSchema.index({ title: "text", description: "text", company: "text", skills: "text" });
scrapedInternshipSchema.index({ status: 1, source: 1 });
scrapedInternshipSchema.index({ lastScraped: -1 });

module.exports = mongoose.model("ScrapedInternship", scrapedInternshipSchema);
