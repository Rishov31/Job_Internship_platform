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

