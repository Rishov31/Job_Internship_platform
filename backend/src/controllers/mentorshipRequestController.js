const MentorshipRequest = require("../models/MentorshipRequest");
const MentoringSession = require("../models/MentoringSession");
const ChatRoom = require("../models/ChatRoom");
const Startup = require("../models/Startup");
const User = require("../models/User");

/** Student: create request */
exports.createRequest = async (req, res, next) => {
  try {
    const { providerType, startupId, investorUserId, message } = req.body || {};

    if (!["startup", "investor"].includes(providerType)) {
      return res.status(400).json({ message: "providerType must be startup or investor" });
    }

    if (providerType === "startup") {
      if (!startupId) {
        return res.status(400).json({ message: "startupId is required" });
      }
      const startup = await Startup.findById(startupId);
      if (!startup) return res.status(404).json({ message: "Startup not found" });
      if (String(startup.owner) === String(req.user.id)) {
        return res.status(400).json({ message: "You cannot request mentorship from your own startup" });
      }

      const dup = await MentorshipRequest.findOne({
        student: req.user.id,
        startup: startupId,
        status: { $in: ["pending", "slot_proposed"] },
      });
      if (dup) {
        return res.status(400).json({ message: "You already have an open request for this startup" });
      }

      const doc = await MentorshipRequest.create({
        student: req.user.id,
        providerType: "startup",
        startup: startupId,
        message: String(message || "").slice(0, 1500),
      });
      const populated = await MentorshipRequest.findById(doc._id)
        .populate("startup", "name industry owner")
        .lean();
      return res.status(201).json({ request: populated });
    }

    if (!investorUserId) {
      return res.status(400).json({ message: "investorUserId is required" });
    }
    const inv = await User.findById(investorUserId).select("role fullName");
    if (!inv || inv.role !== "investor") {
      return res.status(404).json({ message: "Investor not found" });
    }
    if (String(investorUserId) === String(req.user.id)) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const dup = await MentorshipRequest.findOne({
      student: req.user.id,
      investorUser: investorUserId,
      status: { $in: ["pending", "slot_proposed"] },
    });
    if (dup) {
      return res.status(400).json({ message: "You already have an open request for this investor" });
    }

    const doc = await MentorshipRequest.create({
      student: req.user.id,
      providerType: "investor",
      investorUser: investorUserId,
      message: String(message || "").slice(0, 1500),
    });
    const populated = await MentorshipRequest.findById(doc._id)
      .populate("investorUser", "fullName email")
      .lean();
    return res.status(201).json({ request: populated });
  } catch (e) {
    next(e);
  }
};

/** Student: my requests */
exports.listMine = async (req, res, next) => {
  try {
    const list = await MentorshipRequest.find({ student: req.user.id })
      .populate("startup", "name industry")
      .populate("investorUser", "fullName email")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ requests: list });
  } catch (e) {
    next(e);
  }
};

/** Investors available for mentorship browse */
exports.listInvestors = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 40, 100);
    const investors = await User.find({ role: "investor" })
      .select("fullName email")
      .sort({ fullName: 1 })
      .limit(limit)
      .lean();
    res.json({ investors });
  } catch (e) {
    next(e);
  }
};

/** Provider: requests addressed to me */
exports.listForProvider = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("role");
    if (!user) return res.status(404).json({ message: "User not found" });

    let filter = null;
    if (user.role === "employer") {
      const startup = await Startup.findOne({ owner: req.user.id });
      if (!startup) return res.json({ requests: [] });
      filter = { startup: startup._id };
    } else if (user.role === "investor") {
      filter = { investorUser: req.user.id, providerType: "investor" };
    } else {
      return res.status(403).json({ message: "Only startup founders or investors" });
    }

    const list = await MentorshipRequest.find(filter)
      .populate("student", "fullName email githubUsername")
      .populate("startup", "name industry")
      .populate("investorUser", "fullName email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ requests: list });
  } catch (e) {
    next(e);
  }
};

exports.rejectRequest = async (req, res, next) => {
  try {
    const doc = await MentorshipRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Request not found" });

    const providerId = await resolveProviderUserId(doc);
    if (!providerId || String(providerId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (!["pending", "slot_proposed"].includes(doc.status)) {
      return res.status(400).json({ message: "Request cannot be rejected now" });
    }

    doc.status = "rejected";
    doc.rejectionNote = String(req.body?.note || "").slice(0, 500);
    await doc.save();
    res.json({ request: doc });
  } catch (e) {
    next(e);
  }
};

async function resolveProviderUserId(doc) {
  if (doc.providerType === "startup") {
    const sid = doc.startup?._id || doc.startup;
    const s = await Startup.findById(sid).select("owner");
    return s?.owner;
  }
  const inv = doc.investorUser?._id || doc.investorUser;
  return inv;
}

exports.proposeSlot = async (req, res, next) => {
  try {
    const { startTime, minutes, pricePerMinute } = req.body || {};
    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: "Invalid startTime" });
    }
    const mins = Math.min(Math.max(parseInt(minutes, 10) || 30, 10), 240);
    const ppm = Math.max(Number(pricePerMinute) || 0, 0);
    const total = Math.round(ppm * mins * 100) / 100;

    const doc = await MentorshipRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Request not found" });

    const providerId = await resolveProviderUserId(doc);
    if (!providerId || String(providerId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (doc.status !== "pending") {
      return res.status(400).json({ message: "Request is not pending" });
    }

    doc.proposedStartTime = start;
    doc.proposedMinutes = mins;
    doc.pricePerMinute = ppm;
    doc.totalAmount = total;
    doc.status = "slot_proposed";
    await doc.save();

    const populated = await MentorshipRequest.findById(doc._id)
      .populate("student", "fullName email")
      .populate("startup", "name")
      .populate("investorUser", "fullName")
      .lean();

    res.json({ request: populated });
  } catch (e) {
    next(e);
  }
};

/** Student pays (demo) → MentoringSession + ChatRoom */
exports.payRequest = async (req, res, next) => {
  try {
    const doc = await MentorshipRequest.findById(req.params.id)
      .populate("startup", "name owner")
      .populate("investorUser", "fullName");

    if (!doc) return res.status(404).json({ message: "Request not found" });
    if (String(doc.student) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not your request" });
    }
    if (doc.status !== "slot_proposed") {
      return res.status(400).json({ message: "No slot to pay for yet" });
    }
    if (!doc.proposedStartTime || !doc.totalAmount) {
      return res.status(400).json({ message: "Incomplete proposal" });
    }

    const providerUserId = await resolveProviderUserId(doc);
    if (!providerUserId) {
      return res.status(400).json({ message: "Could not resolve provider" });
    }

    const sessionKind =
      doc.providerType === "startup" ? "startup_founder" : "investor";

    const startupRef =
      doc.startup && doc.startup._id ? doc.startup._id : doc.startup;

    const session = await MentoringSession.create({
      mentorUser: providerUserId,
      jobseeker: doc.student,
      startTime: doc.proposedStartTime,
      minutes: doc.proposedMinutes,
      pricePerMinuteAtBooking: doc.pricePerMinute,
      totalAmount: doc.totalAmount,
      status: "paid",
      sessionKind,
      providerStartup: sessionKind === "startup_founder" ? startupRef : undefined,
      mentorshipRequest: doc._id,
      paymentId: req.body?.paymentId || `demo_${Date.now()}`,
      paymentMethod: req.body?.paymentMethod || "demo",
      notes: doc.message?.slice(0, 500),
      motivation: doc.message?.slice(0, 1000),
    });

    await ChatRoom.create({
      mentoringSession: session._id,
      mentor: providerUserId,
      jobseeker: doc.student,
    });

    doc.status = "paid";
    doc.mentoringSession = session._id;
    await doc.save();

    const populatedSession = await MentoringSession.findById(session._id)
      .populate("mentorUser", "fullName email")
      .populate("jobseeker", "fullName email")
      .populate("providerStartup", "name")
      .lean();

    res.json({
      message: "Booked. Open Chat and Video Call from your dashboard.",
      session: populatedSession,
      request: doc,
    });
  } catch (e) {
    next(e);
  }
};
