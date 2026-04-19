const mongoose = require("mongoose");

const directMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DirectConversation",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: { type: String, required: true, maxlength: 8000, trim: true },
    readAt: { type: Date },
  },
  { timestamps: true }
);

directMessageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model("DirectMessage", directMessageSchema);
