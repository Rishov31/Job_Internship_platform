const mongoose = require("mongoose");
const User = require("../models/User");
const DirectConversation = require("../models/DirectConversation");
const DirectMessage = require("../models/DirectMessage");
const { emitDm } = require("../realtime/communityRealtime");

async function assertConversationAccess(conversationId, userId) {
  const conv = await DirectConversation.findById(conversationId);
  if (!conv) return { errStatus: 404, errMessage: "Conversation not found" };
  const ok =
    conv.startup.toString() === userId || conv.student.toString() === userId;
  if (!ok) return { errStatus: 403, errMessage: "Unauthorized" };
  return { conv };
}

exports.listConversations = async (req, res, next) => {
  try {
    const uid = req.user.id;
    const q =
      req.user.role === "employer"
        ? { startup: uid }
        : { student: uid };

    const list = await DirectConversation.find(q)
      .populate("startup", "fullName avatarUrl role")
      .populate("student", "fullName avatarUrl role")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .lean();

    res.json({ conversations: list });
  } catch (e) {
    next(e);
  }
};

/** Body: { peerId } — the other user; must be one jobseeker + one employer */
exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const { peerId } = req.body;
    if (!peerId || !mongoose.Types.ObjectId.isValid(peerId)) {
      return res.status(400).json({ message: "peerId is required" });
    }
    if (peerId === req.user.id) {
      return res.status(400).json({ message: "Invalid peer" });
    }

    const peer = await User.findById(peerId).select("role");
    if (!peer) return res.status(404).json({ message: "User not found" });

    const roles = new Set([req.user.role, peer.role]);
    if (!roles.has("jobseeker") || !roles.has("employer")) {
      return res
        .status(403)
        .json({ message: "Direct chat is only between a student and a startup" });
    }

    let startupId;
    let studentId;
    if (req.user.role === "employer") {
      startupId = req.user.id;
      studentId = peerId;
    } else {
      studentId = req.user.id;
      startupId = peerId;
    }

    let conv = await DirectConversation.findOne({ startup: startupId, student: studentId });
    if (!conv) {
      conv = await DirectConversation.create({
        startup: startupId,
        student: studentId,
      });
    }

    const populated = await DirectConversation.findById(conv._id)
      .populate("startup", "fullName avatarUrl role")
      .populate("student", "fullName avatarUrl role")
      .populate("lastMessage")
      .lean();

    res.json({ conversation: populated });
  } catch (e) {
    next(e);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const skip = parseInt(req.query.skip, 10) || 0;

    const access = await assertConversationAccess(conversationId, req.user.id);
    if (access.errStatus) {
      return res.status(access.errStatus).json({ message: access.errMessage });
    }
    const { conv } = access;

    const messages = await DirectMessage.find({ conversation: conv._id })
      .populate("sender", "fullName avatarUrl role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const unread = messages.filter(
      (m) =>
        !m.readAt &&
        m.sender &&
        m.sender._id.toString() !== req.user.id
    );
    if (unread.length) {
      await DirectMessage.updateMany(
        { _id: { $in: unread.map((u) => u._id) } },
        { readAt: new Date() }
      );
      if (req.user.role === "employer") {
        conv.unreadForStartup = 0;
      } else {
        conv.unreadForStudent = 0;
      }
      await conv.save();
    }

    res.json({
      messages: messages.reverse(),
      conversation: conv,
    });
  } catch (e) {
    next(e);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const access = await assertConversationAccess(conversationId, req.user.id);
    if (access.errStatus) {
      return res.status(access.errStatus).json({ message: access.errMessage });
    }
    const { conv } = access;

    const dm = await DirectMessage.create({
      conversation: conv._id,
      sender: req.user.id,
      content: content.trim(),
    });

    conv.lastMessage = dm._id;
    conv.lastMessageAt = new Date();
    if (req.user.role === "employer") {
      conv.unreadForStudent = (conv.unreadForStudent || 0) + 1;
    } else {
      conv.unreadForStartup = (conv.unreadForStartup || 0) + 1;
    }
    await conv.save();

    const populated = await DirectMessage.findById(dm._id)
      .populate("sender", "fullName avatarUrl role")
      .lean();

    emitDm(conversationId, "dm-message", {
      message: populated,
      conversationId: String(conv._id),
    });

    res.status(201).json({ message: populated });
  } catch (e) {
    next(e);
  }
};
