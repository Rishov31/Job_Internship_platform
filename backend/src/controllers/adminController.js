const User = require("../models/User");
const Job = require("../models/Job");
const Internship = require("../models/Internship");
const Application = require("../models/Application");
const Resource = require("../models/Resource");

// Get dashboard statistics
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalJobs,
      totalInternships,
      totalApplications,
      totalResources,
      recentUsers,
      recentJobs,
      recentApplications
    ] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Internship.countDocuments(),
      Application.countDocuments(),
      Resource.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select("fullName email role createdAt"),
      Job.find().sort({ createdAt: -1 }).limit(5).select("title company createdAt status"),
      Application.find().sort({ createdAt: -1 }).limit(5).populate("user", "fullName").populate("job", "title")
    ]);

    // Get user counts by role
    const userStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get job counts by status
    const jobStats = await Job.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get applications by status
    const applicationStats = await Application.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      stats: {
        totalUsers,
        totalJobs,
        totalInternships,
        totalApplications,
        totalResources,
      },
      userStats,
      jobStats,
      applicationStats,
      recent: {
        users: recentUsers,
        jobs: recentJobs,
        applications: recentApplications,
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get all users with pagination
exports.getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      search,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const users = await User.find(query)
      .select("-passwordHash")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Update user (including admin status)
exports.updateUser = async (req, res, next) => {
  try {
    const { isAdmin, role, isVerified } = req.body;
    
    const updateData = {};
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
    if (role !== undefined) updateData.role = role;
    if (isVerified !== undefined) updateData.isVerified = isVerified;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
};

// Delete user
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// Get all jobs with admin details
exports.getAllJobs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const jobs = await Job.find(query)
      .populate("employer", "fullName email")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Job.countDocuments(query);

    res.json({
      jobs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalJobs: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Update job status
exports.updateJobStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate("employer", "fullName email");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json(job);
  } catch (err) {
    next(err);
  }
};

// Delete job
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    next(err);
  }
};
