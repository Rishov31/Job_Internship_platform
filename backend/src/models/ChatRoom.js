const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema(
  {
    mentoringSession: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "MentoringSession", 
      required: true, 
      unique: true,
      index: true 
    },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jobseeker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    lastMessageAt: { type: Date },
    unreadCountJobseeker: { type: Number, default: 0 },
    unreadCountMentor: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Compound index for efficient querying
chatRoomSchema.index({ jobseeker: 1, isActive: 1 });
chatRoomSchema.index({ mentor: 1, isActive: 1 });

module.exports = mongoose.model("ChatRoom", chatRoomSchema);

