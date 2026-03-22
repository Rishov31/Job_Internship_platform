const Startup = require("../models/Startup");
const User = require("../models/User");

const STARTUP_UPSERT_FIELDS = [
  "name",
  "logoUrl",
  "industry",
  "description",
  "stage",
  "websiteUrl",
  "githubUrl",
  "activeProjects",
  "openPositions",
  "contributorsCount",
  "valuation",
  "targetFunding",
];

function calcStartupCompletion(s) {
  if (!s) {
    return { completionPercentage: 0, isProfileComplete: false };
  }
  let p = 0;
  if ((s.name || "").trim().length >= 2) p += 15;
  if ((s.industry || "").trim().length >= 2) p += 15;
  if ((s.description || "").trim().length >= 40) p += 25;
  if (s.stage) p += 10;
  if ((s.websiteUrl || "").trim().length >= 4) p += 15;
  if ((s.logoUrl || "").trim().length >= 4) p += 10;
  if (
    (s.githubUrl || "").trim().length >= 4 ||
    (Array.isArray(s.githubRepos) && s.githubRepos.length > 0)
  ) {
    p += 10;
  }
  if (p > 100) p = 100;
  return {
    completionPercentage: p,
    isProfileComplete: p >= 70,
  };
}

exports.calcStartupCompletion = calcStartupCompletion;

exports.getMyGithubSummary = async (req, res, next) => {
  try {
    const { getStartupRepoContributors } = require("../services/githubContributionService");
    const data = await getStartupRepoContributors(req.user.id);
    res.json(data);
  } catch (e) {
    next(e);
  }
};

// Get or create startup profile for current founder (employer)
exports.getMyStartup = async (req, res, next) => {
  try {
    let startup = await Startup.findOne({ owner: req.user.id });
    if (!startup) {
      return res.json({
        hasProfile: false,
        startup: null,
        completion: { completionPercentage: 0, isProfileComplete: false },
      });
    }
    res.json({
      hasProfile: true,
      startup,
      completion: calcStartupCompletion(startup),
    });
  } catch (e) {
    next(e);
  }
};

exports.getStartupCompletion = async (req, res, next) => {
  try {
    const startup = await Startup.findOne({ owner: req.user.id });
    res.json(calcStartupCompletion(startup));
  } catch (e) {
    next(e);
  }
};

exports.upsertMyStartup = async (req, res, next) => {
  try {
    const body = req.body || {};
    const data = { owner: req.user.id };
    STARTUP_UPSERT_FIELDS.forEach((k) => {
      if (body[k] !== undefined) data[k] = body[k];
    });

    const existing = await Startup.findOne({ owner: req.user.id });
    if (!existing && !data.name) {
      const u = await User.findById(req.user.id);
      data.name = (u && u.fullName) || "My Startup";
    }

    const startup = await Startup.findOneAndUpdate(
      { owner: req.user.id },
      data,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    const completion = calcStartupCompletion(startup);
    res.json({ startup, completion });
  } catch (e) {
    next(e);
  }
};

// Public / authenticated overview for a given startup
exports.getStartupOverview = async (req, res, next) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) return res.status(404).json({ message: "Startup not found" });
    res.json({ startup });
  } catch (e) {
    next(e);
  }
};

/** Growth series for charts: [{ date, capital }] */
exports.getStartupGrowth = async (req, res, next) => {
  try {
    const startup = await Startup.findById(req.params.id).select("growthHistory");
    if (!startup) return res.status(404).json({ message: "Startup not found" });
    const points = (startup.growthHistory || []).map((g) => ({
      date: g.date,
      capital: g.capital,
    }));
    res.json(points);
  } catch (e) {
    next(e);
  }
};

// For Student / Investor: browse startups with simple filters
exports.exploreStartups = async (req, res, next) => {
  try {
    const { industry, stage, limit = 10 } = req.query;
    const filter = {};
    if (industry) filter.industry = industry;
    if (stage) filter.stage = stage;

    const startups = await Startup.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.json({ startups });
  } catch (e) {
    next(e);
  }
};

// Founder: raise funding (add to capitalRaised and history)
exports.raiseFunding = async (req, res, next) => {
  try {
    const { amount } = req.body || {};
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }

    // Create startup shell on first funding action if needed
    let startup = await Startup.findOne({ owner: req.user.id });
    if (!startup) {
      startup = await Startup.create({
        owner: req.user.id,
        name: "Your Startup Name",
      });
    }

    const newCapital = (startup.capitalRaised || 0) + numericAmount;
    startup.capitalRaised = newCapital;
    startup.capitalHistory.push({ amount: numericAmount });
    startup.growthHistory.push({ date: new Date(), capital: newCapital });
    await startup.save();

    res.json({ startup });
  } catch (e) {
    next(e);
  }
};

// Founder: link a GitHub repository with optional reward details
exports.addRepository = async (req, res, next) => {
  try {
    const { name, url, rewardDetails } = req.body || {};
    if (!url) {
      return res.status(400).json({ message: "Repository url is required" });
    }

    // Create startup shell on first repo link if needed
    let startup = await Startup.findOne({ owner: req.user.id });
    if (!startup) {
      startup = await Startup.create({
        owner: req.user.id,
        name: "Your Startup Name",
      });
    }

    const repoName = name || (typeof url === "string" ? url.split("/").filter(Boolean).pop() : "Repository");

    startup.githubRepos = startup.githubRepos || [];
    startup.githubRepos.push({
      name: repoName,
      url,
      rewardDetails: rewardDetails || "",
    });
    await startup.save();

    res.status(201).json({ startup });
  } catch (e) {
    next(e);
  }
};


