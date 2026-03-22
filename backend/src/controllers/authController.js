const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const JobSeekerProfile = require("../models/JobSeekerProfile");
const Startup = require("../models/Startup");
const InvestorProfile = require("../models/InvestorProfile");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES_IN = "7d";

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function seedRoleProfiles(user, body) {
  const { fullName, companyName } = body;
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/);
  const firstName = parts[0] || "User";
  const lastName = parts.slice(1).join(" ") || "";

  if (user.role === "jobseeker") {
    await JobSeekerProfile.findOneAndUpdate(
      { user: user._id },
      {
        $setOnInsert: {
          user: user._id,
          personalInfo: { firstName, lastName },
        },
      },
      { upsert: true }
    );
  } else if (user.role === "employer") {
    const startupName =
      (companyName && String(companyName).trim()) || fullName || "My Startup";
    await Startup.findOneAndUpdate(
      { owner: user._id },
      {
        $setOnInsert: {
          owner: user._id,
          name: startupName,
        },
      },
      { upsert: true }
    );
  } else if (user.role === "investor") {
    await InvestorProfile.findOneAndUpdate(
      { user: user._id },
      {
        $setOnInsert: {
          user: user._id,
          firmName: fullName,
        },
      },
      { upsert: true }
    );
  }
}

exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password, role, companyName } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, email, passwordHash, role });

    try {
      await seedRoleProfiles(user, { fullName, companyName });
    } catch (seedErr) {
      console.error("Profile seed error (user still created):", seedErr.message);
    }

    const token = createToken({ id: user._id, role: user.role, isAdmin: user.isAdmin });
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    return res.status(201).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        githubUsername: user.githubUsername || "",
      },
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

    try {
      await seedRoleProfiles(user, { fullName: user.fullName });
    } catch (seedErr) {
      console.error("Profile ensure on login:", seedErr.message);
    }

    const token = createToken({ id: user._id, role: user.role, isAdmin: user.isAdmin });
    res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
    return res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        githubUsername: user.githubUsername || "",
      },
      token,
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax", path: "/" });
  return res.json({ ok: true });
};

exports.me = async (req, res, next) => {
  try {
    const bearer = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
    const auth = bearer || req.cookies?.token;
    if (!auth) return res.status(401).json({ message: "Not authenticated" });
    let decoded;
    try {
      decoded = jwt.verify(auth, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: "Invalid token" });
    }
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      githubUsername: user.githubUsername || "",
    });
  } catch (err) {
    next(err);
  }
};


