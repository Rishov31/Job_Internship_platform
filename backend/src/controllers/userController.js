const User = require("../models/User");

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ id: user._id, fullName: user.fullName, email: user.email, role: user.role });
  } catch (e) {
    next(e);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const allowed = ["fullName", "avatarUrl", "phone", "bio"];
    const updates = {};
    for (const key of allowed) if (key in req.body) updates[key] = req.body[key];
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json({ id: user._id, fullName: user.fullName, email: user.email, role: user.role, avatarUrl: user.avatarUrl, phone: user.phone, bio: user.bio });
  } catch (e) {
    next(e);
  }
};

exports.listUsers = async (_req, res, next) => {
  try {
    const users = await User.find().select("fullName email role createdAt").sort({ createdAt: -1 });
    res.json(users);
  } catch (e) {
    next(e);
  }
};


