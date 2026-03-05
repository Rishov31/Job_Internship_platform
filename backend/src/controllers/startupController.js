const Startup = require("../models/Startup");

// Get or create startup profile for current founder (employer)
exports.getMyStartup = async (req, res, next) => {
  try {
    let startup = await Startup.findOne({ owner: req.user.id });
    if (!startup) {
      // Return an empty shell so UI can prompt to fill details
      return res.json({ hasProfile: false, startup: null });
    }
    res.json({ hasProfile: true, startup });
  } catch (e) {
    next(e);
  }
};

exports.upsertMyStartup = async (req, res, next) => {
  try {
    const data = req.body || {};
    const startup = await Startup.findOneAndUpdate(
      { owner: req.user.id },
      { ...data, owner: req.user.id },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ startup });
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

    startup.capitalRaised = (startup.capitalRaised || 0) + numericAmount;
    startup.capitalHistory.push({ amount: numericAmount });
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


