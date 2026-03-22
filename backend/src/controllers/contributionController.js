const Contribution = require("../models/Contribution");
const Startup = require("../models/Startup");
const User = require("../models/User");
const JobSeekerProfile = require("../models/JobSeekerProfile");
const { normalizeGithubUsernameInput } = require("../utils/githubUsername");

// Helper to bump student's contribution metrics when a contribution is approved
async function awardContributionPoints(studentId, points, badges = []) {
  const profile = await JobSeekerProfile.findOne({ user: studentId });
  if (!profile) return;

  profile.contributionScore = (profile.contributionScore || 0) + (points || 0);

  // Very simple level logic based on contributionScore
  const score = profile.contributionScore;
  if (score >= 2000) profile.collaborationLevel = "Platinum";
  else if (score >= 1000) profile.collaborationLevel = "Gold";
  else if (score >= 500) profile.collaborationLevel = "Silver";
  else profile.collaborationLevel = "Bronze";

  const existingBadges = new Set(profile.badges || []);
  badges.forEach((b) => existingBadges.add(b));
  profile.badges = Array.from(existingBadges);

  await profile.save();
}

// Student submits a new contribution for a startup repo
exports.createContribution = async (req, res, next) => {
  try {
    const { startupId, repoUrl, issueUrl, prUrl, description } = req.body;
    if (!startupId || !repoUrl) {
      return res.status(400).json({ message: "startupId and repoUrl are required" });
    }

    const startup = await Startup.findById(startupId);
    if (!startup) return res.status(404).json({ message: "Startup not found" });

    const contribution = await Contribution.create({
      student: req.user.id,
      startup: startupId,
      repoUrl,
      issueUrl,
      prUrl,
      description,
    });

    res.status(201).json({ contribution });
  } catch (e) {
    next(e);
  }
};

// Student: list own contributions + summary for dashboard
exports.listMyContributions = async (req, res, next) => {
  try {
    const contributions = await Contribution.find({ student: req.user.id })
      .populate("startup", "name industry")
      .sort({ createdAt: -1 });

    const totalPoints = contributions.reduce(
      (sum, c) => sum + (c.pointsAwarded || 0),
      0
    );
    const approvedCount = contributions.filter((c) => c.status === "approved").length;
    const collaborationCount = new Set(
      contributions
        .filter((c) => c.status === "approved")
        .map((c) => c.startup && String(c.startup._id))
    ).size;

    res.json({
      contributions,
      summary: {
        totalPoints,
        approvedCount,
        collaborationCount,
      },
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Founder awards points from GitHub contributor login (creates approved contribution).
 */
exports.founderAwardByGithub = async (req, res, next) => {
  try {
    const {
      githubUsername,
      points = 150,
      description = "Open-source contribution reward",
    } = req.body || {};

    const want = normalizeGithubUsernameInput(githubUsername || "");
    if (!want) {
      return res.status(400).json({ message: "githubUsername is required" });
    }

    const startup = await Startup.findOne({ owner: req.user.id });
    if (!startup) {
      return res.status(404).json({ message: "No startup profile found" });
    }

    const users = await User.find({ role: "jobseeker" })
      .select("githubUsername fullName email")
      .limit(5000)
      .lean();

    const student = users.find(
      (u) => normalizeGithubUsernameInput(u.githubUsername || "") === want
    );
    if (!student) {
      return res.status(404).json({
        message:
          "No student on HireMe matches this GitHub username. They must add GitHub on their profile.",
      });
    }

    let repoUrl = (startup.githubUrl || "").trim();
    if (!repoUrl && startup.githubRepos?.length) {
      repoUrl = (startup.githubRepos[0].url || "").trim();
    }
    if (!repoUrl) {
      return res.status(400).json({
        message: "Link a GitHub repository on your startup profile first.",
      });
    }

    const badgesAwarded = ["Innovation Badge"];
    const contribution = await Contribution.create({
      student: student._id,
      startup: startup._id,
      repoUrl,
      description: String(description).slice(0, 500),
      status: "approved",
      pointsAwarded: Math.min(Math.max(Number(points) || 0, 0), 10000),
      badgesAwarded,
    });

    await awardContributionPoints(
      student._id,
      contribution.pointsAwarded,
      badgesAwarded
    );

    res.status(201).json({
      contribution,
      student: {
        fullName: student.fullName,
        email: student.email,
        githubUsername: student.githubUsername,
      },
    });
  } catch (e) {
    next(e);
  }
};

// Startup founder: contributions to their startup
exports.listStartupContributions = async (req, res, next) => {
  try {
    const startup = await Startup.findOne({ owner: req.user.id });
    if (!startup)
      return res
        .status(404)
        .json({ message: "No startup profile found for this user" });

    const contributions = await Contribution.find({ startup: startup._id })
      .populate("student", "fullName email")
      .sort({ createdAt: -1 });

    res.json({ contributions });
  } catch (e) {
    next(e);
  }
};

// Founder or admin approves / rejects a contribution
exports.updateContributionStatus = async (req, res, next) => {
  try {
    const { status, points = 100 } = req.body;
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const contribution = await Contribution.findById(req.params.id);
    if (!contribution) {
      return res.status(404).json({ message: "Contribution not found" });
    }

    contribution.status = status;

    if (status === "approved") {
      contribution.pointsAwarded = points;
      contribution.badgesAwarded = contribution.badgesAwarded || [];
      if (!contribution.badgesAwarded.includes("Innovation Badge")) {
        contribution.badgesAwarded.push("Innovation Badge");
      }
      await awardContributionPoints(
        contribution.student,
        points,
        contribution.badgesAwarded
      );
    }

    await contribution.save();
    res.json({ contribution });
  } catch (e) {
    next(e);
  }
};

