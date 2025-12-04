const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        // Job Seeker notifications
        "job_alert",
        "application_submitted",
        "application_viewed",
        "application_shortlisted",
        "application_rejected",
        "interview_scheduled",
        "interview_reminder",
        "interview_result",
        "profile_incomplete",
        "profile_viewed",
        "skill_test_result",
        "skill_recommendation",
        "password_changed",
        "login_alert",
        "feature_update",
        "career_tip",
        "newsletter_update",
        // Employer notifications
        "new_application",
        "candidate_accepted_interview",
        "candidate_declined_interview",
        "candidate_completed_test",
        "job_published",
        "job_expiring_soon",
        "hiring_analytics",
        "matching_candidates",
        "subscription_reminder",
        "profile_verification",
        "platform_announcement",
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    // Related entity references (optional)
    relatedJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    relatedApplication: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Additional metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Email notification sent status
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
    },
    // Priority level
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);

