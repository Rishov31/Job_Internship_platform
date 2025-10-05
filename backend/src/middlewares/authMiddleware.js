const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

module.exports = async function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token || (req.headers.authorization || "").replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Not authenticated" });
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = { id: user._id.toString(), role: user.role, isAdmin: user.isAdmin };
    next();
  } catch (err) {
    next(err);
  }
};


