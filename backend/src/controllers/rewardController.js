const RewardClaim = require("../models/RewardClaim");
const Startup = require("../models/Startup");

/** Student claims a startup-listed reward (notifies founder dashboard). */
exports.claimReward = async (req, res, next) => {
  try {
    const { startupId, offerTitle, studentNote } = req.body || {};
    if (!startupId) {
      return res.status(400).json({ message: "startupId is required" });
    }

    const startup = await Startup.findById(startupId);
    if (!startup) {
      return res.status(404).json({ message: "Startup not found" });
    }

    const pending = await RewardClaim.findOne({
      student: req.user.id,
      startup: startupId,
      status: "pending",
    });
    if (pending) {
      return res.status(400).json({
        message: "You already have a pending claim for this startup.",
        claim: pending,
      });
    }

    const claim = await RewardClaim.create({
      student: req.user.id,
      startup: startupId,
      offerTitle: (offerTitle || "Swag Box").slice(0, 120),
      studentNote: (studentNote || "").slice(0, 500),
    });

    const populated = await RewardClaim.findById(claim._id)
      .populate("startup", "name industry")
      .lean();

    res.status(201).json({ claim: populated });
  } catch (e) {
    next(e);
  }
};

/** Student: my reward claims */
exports.listMyClaims = async (req, res, next) => {
  try {
    const claims = await RewardClaim.find({ student: req.user.id })
      .populate("startup", "name industry githubUrl")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ claims });
  } catch (e) {
    next(e);
  }
};

/** Founder: pending / all claims for own startup */
exports.listStartupClaims = async (req, res, next) => {
  try {
    const startup = await Startup.findOne({ owner: req.user.id });
    if (!startup) {
      return res.status(404).json({ message: "No startup profile found" });
    }

    const claims = await RewardClaim.find({ startup: startup._id })
      .populate("student", "fullName email githubUsername")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ startup: { _id: startup._id, name: startup.name }, claims });
  } catch (e) {
    next(e);
  }
};

/** Founder updates claim status */
exports.updateClaimStatus = async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!["pending", "acknowledged", "fulfilled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const startup = await Startup.findOne({ owner: req.user.id });
    if (!startup) {
      return res.status(404).json({ message: "No startup profile found" });
    }

    const claim = await RewardClaim.findById(req.params.id);
    if (!claim || String(claim.startup) !== String(startup._id)) {
      return res.status(404).json({ message: "Claim not found" });
    }

    claim.status = status;
    await claim.save();

    const populated = await RewardClaim.findById(claim._id)
      .populate("student", "fullName email githubUsername")
      .populate("startup", "name")
      .lean();

    res.json({ claim: populated });
  } catch (e) {
    next(e);
  }
};
