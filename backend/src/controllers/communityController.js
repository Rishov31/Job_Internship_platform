const CommunityMessage = require("../models/CommunityMessage");
const { emitCommunity } = require("../realtime/communityRealtime");

function serializeReactions(reactions) {
  const like = [];
  const love = [];
  for (const r of reactions || []) {
    const id = r.user?.toString?.() || String(r.user);
    if (r.type === "like") like.push(id);
    else if (r.type === "love") love.push(id);
  }
  return { like, love };
}

async function populateMessage(doc) {
  return CommunityMessage.findById(doc._id)
    .populate("sender", "fullName avatarUrl role")
    .lean();
}

exports.listMessages = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 40, 100);
    const before = req.query.before ? new Date(req.query.before) : null;

    const q = {};
    if (before && !Number.isNaN(before.getTime())) {
      q.createdAt = { $lt: before };
    }

    const rows = await CommunityMessage.find(q)
      .populate("sender", "fullName avatarUrl role")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const messages = rows.reverse().map((m) => ({
      ...m,
      reactionSummary: serializeReactions(m.reactions),
    }));

    res.json({ messages });
  } catch (e) {
    next(e);
  }
};

exports.postMessage = async (req, res, next) => {
  try {
    const { content, isIdea } = req.body;
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }
    const idea =
      Boolean(isIdea) && req.user.role === "jobseeker";

    const doc = await CommunityMessage.create({
      sender: req.user.id,
      content: content.trim(),
      isIdea: idea,
      reactions: [],
    });

    const populated = await populateMessage(doc);
    const out = {
      ...populated,
      reactionSummary: { like: [], love: [] },
    };
    emitCommunity("community-message", { message: out });
    res.status(201).json({ message: out });
  } catch (e) {
    next(e);
  }
};

exports.setReaction = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { type } = req.body;
    if (!["like", "love"].includes(type)) {
      return res.status(400).json({ message: "Invalid reaction type" });
    }

    const msg = await CommunityMessage.findById(messageId);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    const uid = req.user.id;
    const reactions = msg.reactions || [];
    const idx = reactions.findIndex((r) => r.user.toString() === uid);

    if (idx >= 0 && reactions[idx].type === type) {
      reactions.splice(idx, 1);
    } else if (idx >= 0) {
      reactions[idx].type = type;
    } else {
      reactions.push({ user: uid, type });
    }

    msg.reactions = reactions;
    await msg.save();

    const populated = await populateMessage(msg);
    const out = {
      ...populated,
      reactionSummary: serializeReactions(populated.reactions),
    };
    emitCommunity("community-reaction", { message: out });
    res.json({ message: out });
  } catch (e) {
    next(e);
  }
};
