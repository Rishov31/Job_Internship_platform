const mongoose = require("mongoose");

const savedJobSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true, 
      index: true 
    },
    job: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Job", 
      required: false,
      index: true 
    },
    scrapedJob: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "ScrapedJob", 
      required: false,
      index: true 
    },
    savedAt: { 
      type: Date, 
      default: Date.now, 
      index: true 
    },
  },
  { timestamps: true }
);

// Ensure user can't save the same job twice
savedJobSchema.index({ user: 1, job: 1 }, { unique: true, sparse: true });
savedJobSchema.index({ user: 1, scrapedJob: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("SavedJob", savedJobSchema);
