const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["like", "love"], required: true },
  },
  { _id: false }
);

const communityMessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true, maxlength: 8000, trim: true },
    /** Student-tagged “startup idea” posts (optional; anyone can still reply in-thread visually via same feed) */
    isIdea: { type: Boolean, default: false, index: true },
    reactions: { type: [reactionSchema], default: [] },
  },
  { timestamps: true }
);

communityMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model("CommunityMessage", communityMessageSchema);
