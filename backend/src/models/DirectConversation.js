const mongoose = require("mongoose");

const directConversationSchema = new mongoose.Schema(
  {
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "DirectMessage" },
    lastMessageAt: { type: Date },
    unreadForStudent: { type: Number, default: 0, min: 0 },
    unreadForStartup: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

directConversationSchema.index({ startup: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("DirectConversation", directConversationSchema);
