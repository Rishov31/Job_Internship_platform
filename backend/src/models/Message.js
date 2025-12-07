const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true, maxlength: 5000 },
    messageType: { 
      type: String, 
      enum: ["text", "file", "image"], 
      default: "text" 
    },
    fileUrl: { type: String }, // For file/image messages
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
  },
  { timestamps: true }
);

// Compound index for efficient querying
messageSchema.index({ chatRoom: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);

