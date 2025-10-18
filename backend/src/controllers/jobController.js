const Job = require("../models/Job");
const ScrapedJob = require("../models/ScrapedJob");
const User = require("../models/User");

// Create a new job posting
exports.createJob = async (req, res, next) => {
  try {
    const jobData = {
      ...req.body,
      employer: req.user.id,
    };

    // Validate required fields
    const requiredFields = ['title', 'description', 'company', 'location', 'jobType', 'category'];
    for (const field of requiredFields) {
      if (!jobData[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    const job = await Job.create(jobData);
    
    // Populate employer details
    await job.populate('employer', 'fullName email companyDetails');
    
    res.status(201).json({
      message: "Job posted successfully",
      job,
    });
  } catch (error) {
    next(error);
  }
};

// Get all jobs with filtering and pagination (including scraped jobs)
exports.getAllJobs = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      jobType,
      category,
      location,
      search,
      status = 'active',
      includeScraped = 'true'
    } = req.query;

    const filter = { status };
    const scrapedFilter = { status: 'active' }; // Only active scraped jobs

    // Apply filters
    if (jobType) {
      filter.jobType = jobType;
      scrapedFilter.jobType = jobType;
    }
    if (category) {
      filter.category = new RegExp(category, 'i');
      scrapedFilter.category = new RegExp(category, 'i');
    }
    if (location) {
      filter.location = new RegExp(location, 'i');
      scrapedFilter.location = new RegExp(location, 'i');
    }
    if (search) {
      filter.$text = { $search: search };
      scrapedFilter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get both regular and scraped jobs
    const [regularJobs, scrapedJobs] = await Promise.all([
      Job.find(filter)
        .populate('employer', 'fullName email companyDetails')
        .sort({ createdAt: -1 })
        .lean(),
      includeScraped === 'true' ? 
        ScrapedJob.find(scrapedFilter)
          .sort({ lastScraped: -1 })
          .lean() : []
    ]);

    // Combine and format jobs
    const allJobs = [
      ...regularJobs.map(job => ({ ...job, isScraped: false, source: 'internal' })),
      ...scrapedJobs.map(job => ({ ...job, isScraped: true, employer: null }))
    ];

    // Sort combined results by date (most recent first)
    allJobs.sort((a, b) => {
      const dateA = a.createdAt || a.lastScraped;
      const dateB = b.createdAt || b.lastScraped;
      return new Date(dateB) - new Date(dateA);
    });

    // Apply pagination to combined results
    const paginatedJobs = allJobs.slice(skip, skip + parseInt(limit));
    const total = allJobs.length;

    res.json({
      jobs: paginatedJobs,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: paginatedJobs.length,
        totalJobs: total,
        regularJobs: regularJobs.length,
        scrapedJobs: scrapedJobs.length
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get job by ID (handles both regular and scraped jobs)
exports.getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Try to find in regular jobs first
    let job = await Job.findById(id)
      .populate('employer', 'fullName email companyDetails');
    
    if (job) {
      return res.json({ ...job.toObject(), isScraped: false, source: 'internal' });
    }
    
    // If not found, try scraped jobs
    job = await ScrapedJob.findById(id);
    
    if (job) {
      return res.json({ ...job.toObject(), isScraped: true, employer: null });
    }
    
    return res.status(404).json({ message: "Job not found" });
  } catch (error) {
    next(error);
  }
};

// Get jobs posted by current employer
exports.getEmployerJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { employer: req.user.id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const jobs = await Job.find(filter)
      .populate('employer', 'fullName email companyDetails')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(filter);

    res.json({
      jobs,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: jobs.length,
        totalJobs: total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update job
exports.updateJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, employer: req.user.id });
    
    if (!job) {
      return res.status(404).json({ message: "Job not found or unauthorized" });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('employer', 'fullName email companyDetails');

    res.json({
      message: "Job updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    next(error);
  }
};

// Delete job
exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, employer: req.user.id });
    
    if (!job) {
      return res.status(404).json({ message: "Job not found or unauthorized" });
    }

    await Job.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Update job status
exports.updateJobStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'paused', 'closed'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const job = await Job.findOne({ _id: req.params.id, employer: req.user.id });
    
    if (!job) {
      return res.status(404).json({ message: "Job not found or unauthorized" });
    }

    job.status = status;
    await job.save();

    res.json({
      message: "Job status updated successfully",
      job,
    });
  } catch (error) {
    next(error);
  }
};

// Get job statistics for employer
exports.getJobStats = async (req, res, next) => {
  try {
    const stats = await Job.aggregate([
      { $match: { employer: req.user.id } },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          activeJobs: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          pausedJobs: { $sum: { $cond: [{ $eq: ["$status", "paused"] }, 1, 0] } },
          closedJobs: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
          totalApplications: { $sum: "$applicationsCount" },
        },
      },
    ]);

    const result = stats[0] || {
      totalJobs: 0,
      activeJobs: 0,
      pausedJobs: 0,
      closedJobs: 0,
      totalApplications: 0,
    };

    res.json(result);
  } catch (error) {
    next(error);
  }
};
