const mongoose = require("mongoose");

const leaderboardEntrySchema = new mongoose.Schema(
  {
    rank: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, default: "" },
    githubUsername: { type: String, default: null },
    avatarUrl: { type: String, default: null },
    /** Commits + merged PRs in tracked startup repos (window) */
    totalCommits: { type: Number, default: 0 },
    /** Platform contribution score (JobSeekerProfile) */
    platformPoints: { type: Number, default: 0 },
    /** Collaboration tier: Bronze / Silver / Gold / Platinum */
    league: { type: String, default: "Bronze" },
    /** GitHub activity tier from last 30d volume */
    githubLeague: { type: String, default: "Bronze" },
    distinctStartupCount: { type: Number, default: 0 },
    startups: [
      {
        startupId: { type: String },
        name: { type: String },
        commits: { type: Number, default: 0 },
        fromPlatformOnly: { type: Boolean, default: false },
      },
    ],
    companyNames: [{ type: String }],
  },
  { _id: false }
);

const leaderboardSnapshotSchema = new mongoose.Schema(
  {
    windowDays: { type: Number, required: true, default: 30 },
    generatedAt: { type: Date, required: true, index: true },
    /** Cache TTL hint — same as generatedAt for queries */
    entries: [leaderboardEntrySchema],
    meta: {
      totalStudentsScanned: { type: Number, default: 0 },
      withGithub: { type: Number, default: 0 },
      message: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

leaderboardSnapshotSchema.index({ createdAt: -1 });

module.exports = mongoose.model("LeaderboardSnapshot", leaderboardSnapshotSchema);
