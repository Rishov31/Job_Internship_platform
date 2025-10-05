const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES_IN = "7d";

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password, role } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, email, passwordHash, role });
    const token = createToken({ id: user._id, role: user.role, isAdmin: user.isAdmin });
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    return res.status(201).json({
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role, isAdmin: user.isAdmin },
      token,
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+passwordHash fullName email role isAdmin");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    user.lastLoginAt = new Date();
    await user.save();

    const token = createToken({ id: user._id, role: user.role, isAdmin: user.isAdmin });
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    return res.json({
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role, isAdmin: user.isAdmin },
      token,
    });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const auth = req.cookies?.token || (req.headers.authorization || "").replace("Bearer ", "");
    if (!auth) return res.status(401).json({ message: "Not authenticated" });
    let decoded;
    try {
      decoded = jwt.verify(auth, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ id: user._id, fullName: user.fullName, email: user.email, role: user.role, isAdmin: user.isAdmin });
  } catch (err) {
    next(err);
  }
};


