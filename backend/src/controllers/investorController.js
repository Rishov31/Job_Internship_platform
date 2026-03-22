const mongoose = require("mongoose");
const Startup = require("../models/Startup");
const Investment = require("../models/Investment");
const InvestorProfile = require("../models/InvestorProfile");
const User = require("../models/User");

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

function portfolioItemFromInvestment(inv, startup) {
  const valuation = Number(startup?.valuation);
  const shares = Number(inv.sharePercent) || 0;
  const invested = Number(inv.amount) || 0;
  const currentValue =
    Number.isFinite(valuation) && valuation > 0
      ? (shares / 100) * valuation
      : invested;
  const roiPercent =
    invested > 0 ? ((currentValue - invested) / invested) * 100 : 0;
  return {
    id: inv._id,
    startupId: startup?._id,
    startupName: startup?.name,
    industry: startup?.industry,
    invested,
    currentValue,
    roiPercent: Math.round(roiPercent * 100) / 100,
    sharesPercent: shares,
  };
}

// Overview for investor dashboard: discovery + portfolio stats
exports.getOverview = async (req, res, next) => {
  try {
    const investorId = req.user.id;

    const [investorUser, investments] = await Promise.all([
      User.findById(investorId).select("walletBalance"),
      Investment.find({ investor: investorId })
        .populate("startup", "name industry capitalRaised valuation")
        .sort({ createdAt: -1 }),
    ]);

    const totalInvestment = investments.reduce(
      (sum, inv) => sum + (Number(inv.amount) || 0),
      0
    );

    const portfolio = investments.map((inv) =>
      portfolioItemFromInvestment(inv, inv.startup || {})
    );

    const totalCurrentValue = portfolio.reduce(
      (sum, p) => sum + (p.currentValue || 0),
      0
    );

    let portfolioRoiPercent = 0;
    if (totalInvestment > 0) {
      portfolioRoiPercent =
        ((totalCurrentValue - totalInvestment) / totalInvestment) * 100;
    }

    const discoveryStartups = await Startup.find({})
      .sort({ capitalRaised: -1 })
      .limit(5)
      .select("name industry stage capitalRaised contributorsCount valuation targetFunding");

    res.json({
      walletBalance: investorUser?.walletBalance ?? 0,
      discovery: {
        startups: discoveryStartups,
      },
      portfolio: {
        totalInvestment,
        totalCurrentValue,
        portfolioRoiPercent: Math.round(portfolioRoiPercent * 100) / 100,
        items: portfolio,
      },
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Atomic investment: wallet debit, Investment doc, startup capital + investors + growthHistory.
 * Uses a MongoDB multi-document transaction (requires replica set).
 */
exports.confirmInvestment = async (req, res, next) => {
  const { startupId, amount, idempotencyKey } = req.body || {};
  const numericAmount = Number(amount);

  try {
    if (!startupId || !mongoose.isValidObjectId(startupId)) {
      return res.status(400).json({ message: "Valid startupId is required" });
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }

    const key =
      typeof idempotencyKey === "string" && idempotencyKey.trim()
        ? idempotencyKey.trim().slice(0, 128)
        : null;

    if (key) {
      const existing = await Investment.findOne({ idempotencyKey: key }).populate(
        "startup"
      );
      if (existing && existing.investor.equals(req.user.id)) {
        const u = await User.findById(req.user.id).select("walletBalance");
        return res.json({
          duplicate: true,
          investment: existing,
          walletBalance: u?.walletBalance ?? 0,
          startup: existing.startup,
        });
      }
    }

    let session;
    let responsePayload;

    try {
      session = await mongoose.startSession();
      session.startTransaction();

      const startup = await Startup.findById(startupId).session(session);
      if (!startup) {
        const err = new Error("Startup not found");
        err.status = 404;
        throw err;
      }

      let valuation = Number(startup.valuation);
      if (!Number.isFinite(valuation) || valuation <= 0) {
        valuation = 150_000;
        startup.valuation = valuation;
      }

      const shares = (numericAmount / valuation) * 100;
      const shareRounded = Math.round(shares * 10000) / 10000;

      const investorDoc = await User.findOneAndUpdate(
        { _id: req.user.id, walletBalance: { $gte: numericAmount } },
        { $inc: { walletBalance: -numericAmount } },
        { new: true, session }
      );
      if (!investorDoc) {
        const err = new Error("Insufficient wallet balance");
        err.status = 400;
        throw err;
      }

      const [investment] = await Investment.create(
        [
          {
            investor: req.user.id,
            startup: startupId,
            amount: numericAmount,
            sharePercent: shareRounded,
            status: "confirmed",
            ...(key ? { idempotencyKey: key } : {}),
          },
        ],
        { session }
      );

      const newCapital = (startup.capitalRaised || 0) + numericAmount;
      startup.capitalRaised = newCapital;
      startup.capitalHistory.push({ amount: numericAmount });
      startup.growthHistory.push({ date: new Date(), capital: newCapital });
      const invId = req.user.id;
      if (!startup.investors.some((id) => id.equals(invId))) {
        startup.investors.push(invId);
      }
      startup.totalInvestors = startup.investors.length;
      await startup.save({ session });

      await session.commitTransaction();

      responsePayload = {
        investment,
        walletBalance: investorDoc.walletBalance,
        startup,
      };
    } catch (inner) {
      if (session) {
        try {
          await session.abortTransaction();
        } catch (_) {
          // ignore if no transaction to abort
        }
      }
      const dupCode = inner.code === 11000 || inner.code === "11000";
      if (dupCode && key) {
        const dup = await Investment.findOne({ idempotencyKey: key }).populate("startup");
        if (dup && dup.investor.equals(req.user.id)) {
          const u = await User.findById(req.user.id).select("walletBalance");
          return res.json({
            duplicate: true,
            investment: dup,
            walletBalance: u?.walletBalance ?? 0,
            startup: dup.startup,
          });
        }
      }
      if (inner.status) {
        return res.status(inner.status).json({ message: inner.message });
      }
      return next(inner);
    } finally {
      if (session) session.endSession();
    }

    return res.status(201).json(responsePayload);
  } catch (e) {
    next(e);
  }
};

// Detailed portfolio list for investor
exports.getPortfolio = async (req, res, next) => {
  try {
    const investorId = req.user.id;
    const investments = await Investment.find({ investor: investorId })
      .populate("startup", "name industry capitalRaised valuation")
      .sort({ createdAt: -1 });
    res.json({ investments });
  } catch (e) {
    next(e);
  }
};
