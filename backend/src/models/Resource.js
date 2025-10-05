const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
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
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ["article", "video", "blog"],
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: function() {
        return this.type === "article" || this.type === "blog";
      },
    },
    videoUrl: {
      type: String,
      required: function() {
        return this.type === "video";
      },
    },
    thumbnailUrl: {
      type: String,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    category: {
      type: String,
      required: true,
      enum: [
        "career-planning",
        "interview-tips",
        "resume-writing",
        "job-search",
        "skill-development",
        "networking",
        "workplace-ethics",
        "leadership",
        "other"
      ],
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Index for search functionality
resourceSchema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Resource", resourceSchema);
