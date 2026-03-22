const Startup = require("../models/Startup");
const Investment = require("../models/Investment");
const InvestorProfile = require("../models/InvestorProfile");

function calcInvestorCompletion(p) {
  if (!p) return 0;
  let s = 0;
  if (p.firmName) s += 25;
  if ((p.investmentFocus || []).length) s += 25;
  if (p.bio) s += 25;
  if ((p.preferredStages || []).length) s += 25;
  return Math.min(s, 100);
}

exports.getInvestorProfile = async (req, res, next) => {
  try {
    let profile = await InvestorProfile.findOne({ user: req.user.id });
    if (!profile) {
      profile = await InvestorProfile.create({ user: req.user.id });
    }
    res.json(profile);
  } catch (e) {
    next(e);
  }
};

exports.upsertInvestorProfile = async (req, res, next) => {
  try {
    const { firmName, investmentFocus, bio, checkSizeMin, checkSizeMax, preferredStages } =
      req.body || {};
    const profile = await InvestorProfile.findOneAndUpdate(
      { user: req.user.id },
      {
        ...(firmName !== undefined && { firmName }),
        ...(investmentFocus !== undefined && { investmentFocus }),
        ...(bio !== undefined && { bio }),
        ...(checkSizeMin !== undefined && { checkSizeMin }),
        ...(checkSizeMax !== undefined && { checkSizeMax }),
        ...(preferredStages !== undefined && { preferredStages }),
        user: req.user.id,
      },
      { new: true, upsert: true, runValidators: true }
    );
    const pct = calcInvestorCompletion(profile);
    profile.profileCompletionPercentage = pct;
    profile.isProfileComplete = pct >= 70;
    await profile.save();
    res.json(profile);
  } catch (e) {
    next(e);
  }
};

// Overview for investor dashboard: discovery + portfolio stats
exports.getOverview = async (req, res, next) => {
  try {
    const investorId = req.user.id;

    // Portfolio
    const investments = await Investment.find({ investor: investorId })
      .populate("startup", "name industry capitalRaised")
      .sort({ createdAt: -1 });

    const totalInvestment = investments.reduce(
      (sum, inv) => sum + (inv.amount || 0),
      0
    );

    // For demo, treat current value as capitalRaised proportionally
    const portfolio = investments.map((inv) => {
      const startup = inv.startup || {};
      const currentValue =
        inv.sharePercent && startup.capitalRaised
          ? (startup.capitalRaised * inv.sharePercent) / 100
          : inv.amount;
      const growth =
        inv.amount > 0 ? Math.round(((currentValue - inv.amount) / inv.amount) * 100) : 0;
      return {
        id: inv._id,
        startupId: startup._id,
        startupName: startup.name,
        industry: startup.industry,
        invested: inv.amount,
        currentValue,
        growthPercent: growth,
      };
    });

    const totalCurrentValue = portfolio.reduce(
      (sum, p) => sum + (p.currentValue || 0),
      0
    );

    // Discovery list: top startups by capitalRaised
    const discoveryStartups = await Startup.find({})
      .sort({ capitalRaised: -1 })
      .limit(5)
      .select("name industry stage capitalRaised contributorsCount");

    res.json({
      discovery: {
        startups: discoveryStartups,
      },
      portfolio: {
        totalInvestment,
        totalCurrentValue,
        items: portfolio,
      },
    });
  } catch (e) {
    next(e);
  }
};

// Create a new investment and update startup capital
exports.createInvestment = async (req, res, next) => {
  try {
    const { startupId, amount, sharePercent } = req.body;
    if (!startupId || !amount) {
      return res.status(400).json({ message: "startupId and amount are required" });
    }

    const startup = await Startup.findById(startupId);
    if (!startup) {
      return res.status(404).json({ message: "Startup not found" });
    }

    const investment = await Investment.create({
      investor: req.user.id,
      startup: startupId,
      amount,
      sharePercent: sharePercent || 0,
      status: "confirmed",
    });

    // Update startup capital & investor count (very simplified)
    startup.capitalRaised = (startup.capitalRaised || 0) + amount;
    startup.capitalHistory.push({ amount });
    startup.totalInvestors = (startup.totalInvestors || 0) + 1;
    await startup.save();

    res.status(201).json({ investment });
  } catch (e) {
    next(e);
  }
};

// Detailed portfolio list for investor
exports.getPortfolio = async (req, res, next) => {
  try {
    const investorId = req.user.id;
    const investments = await Investment.find({ investor: investorId })
      .populate("startup", "name industry capitalRaised")
      .sort({ createdAt: -1 });
    res.json({ investments });
  } catch (e) {
    next(e);
  }
};

