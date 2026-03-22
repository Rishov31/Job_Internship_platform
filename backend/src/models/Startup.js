const mongoose = require("mongoose");

const capitalEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true }, // amount added in INR
  },
  { _id: false }
);

const growthPointSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    capital: { type: Number, required: true }, // total capitalRaised after event (INR)
  },
  { _id: false }
);

const githubRepoSchema = new mongoose.Schema(
  {
    name: String,
    url: String,
    openIssues: { type: Number, default: 0 },
    rewardDetails: String,
  },
  { _id: false }
);

const startupSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    logoUrl: String,
    industry: String,
    description: String,
    stage: {
      type: String,
      enum: ["pre-seed", "seed", "series-a", "series-b", "bootstrapped", "other"],
      default: "pre-seed",
    },
    websiteUrl: String,
    githubUrl: String,

    // Capital & funding information (stored in INR but UI can format to Cr/L)
    capitalRaised: { type: Number, default: 0 },
    capitalHistory: [capitalEntrySchema],
    /** Post-money style valuation in INR (used for share %). Default matches demo: ₹20k ≈ 13.3% */
    valuation: { type: Number, default: 150_000, min: 1 },
    /** Funding round target in INR (e.g. 10 Cr = 100_000_000) */
    targetFunding: { type: Number, default: 100_000_000, min: 1 },
    /** Distinct investors (User ids) */
    investors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    /** Time series for capital-raised graph */
    growthHistory: [growthPointSchema],

    // Hiring & collaboration metrics surfaced on dashboards
    totalInvestors: { type: Number, default: 0 },
    contributorsCount: { type: Number, default: 0 },
    activeProjects: { type: Number, default: 0 },
    openPositions: { type: Number, default: 0 },

    githubRepos: [githubRepoSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Startup", startupSchema);

