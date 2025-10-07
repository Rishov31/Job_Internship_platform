const Mentor = require("../models/Mentor");
const User = require("../models/User");

exports.getMyProfile = async (req, res, next) => {
  try {
    const profile = await Mentor.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  } catch (e) { next(e); }
};

exports.upsertMyProfile = async (req, res, next) => {
  try {
    const allowed = [
      "title",
      "experienceYears",
      "expertise",
      "bio",
      "pricePerMinute",
      "timezone",
      "availability",
      "isActive",
    ];
    const updates = { user: req.user.id };
    for (const k of allowed) if (k in req.body) updates[k] = req.body[k];
    const profile = await Mentor.findOneAndUpdate(
      { user: req.user.id },
      updates,
      { upsert: true, new: true, runValidators: true }
    );
    res.status(201).json(profile);
  } catch (e) { next(e); }
};

exports.listMentors = async (req, res, next) => {
  try {
    const { q, expertise, page = 1, limit = 10 } = req.query;
    const filter = { isActive: true };
    if (expertise) filter.expertise = { $in: expertise.split(",").map(s => s.trim()) };
    if (q) filter.$or = [
      { title: new RegExp(q, "i") },
      { bio: new RegExp(q, "i") },
    ];
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const mentors = await Mentor.find(filter)
      .populate("user", "fullName avatarUrl")
      .sort({ rating: -1, totalSessions: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Mentor.countDocuments(filter);
    res.json({ mentors, pagination: { current: parseInt(page), total: Math.ceil(total / parseInt(limit)), count: mentors.length, totalMentors: total } });
  } catch (e) { next(e); }
};

exports.getMentorById = async (req, res, next) => {
  try {
    const mentor = await Mentor.findById(req.params.id).populate("user", "fullName avatarUrl bio");
    if (!mentor) return res.status(404).json({ message: "Mentor not found" });
    res.json(mentor);
  } catch (e) { next(e); }
};


