const Job = require("../models/Job");
const ScrapedJob = require("../models/ScrapedJob");
const SavedJob = require("../models/SavedJob");
const User = require("../models/User");
const JobSeekerProfile = require("../models/JobSeekerProfile");
const notificationService = require("../services/notificationService");
const logger = require("../utils/logger");

/**
 * Send job alerts to job seekers who match the job criteria
 * This function runs asynchronously and doesn't block the response
 */
async function sendJobAlertsToJobSeekers(job) {
  try {
    // Find all job seekers with job alerts enabled
    const jobSeekerProfiles = await JobSeekerProfile.find({
      'preferences.jobAlerts': { $ne: false }, // true or undefined (default is true)
    }).populate('user', '_id fullName email');

    if (!jobSeekerProfiles || jobSeekerProfiles.length === 0) {
      logger.info('No job seekers with job alerts enabled found');
      return;
    }

    // Prepare notifications for job seekers
    const notifications = [];
    const jobCategory = job.category?.toLowerCase();
    const jobLocation = job.location?.toLowerCase();
    const jobSkills = (job.skills || []).map(s => s.toLowerCase());

    for (const profile of jobSeekerProfiles) {
      if (!profile.user || !profile.user._id) continue;

      // Check if job matches job seeker preferences (if they have any)
      let shouldNotify = true;

      // If job seeker has preferences, check if job matches
      if (profile.preferences) {
        // Check category match
        if (profile.preferences.jobCategories && profile.preferences.jobCategories.length > 0) {
          const preferredCategories = profile.preferences.jobCategories.map(c => c.toLowerCase());
          if (jobCategory && !preferredCategories.some(cat => jobCategory.includes(cat) || cat.includes(jobCategory))) {
            shouldNotify = false;
          }
        }

        // Check location match
        if (shouldNotify && profile.preferences.locations && profile.preferences.locations.length > 0) {
          const preferredLocations = profile.preferences.locations.map(l => l.toLowerCase());
          if (jobLocation && !preferredLocations.some(loc => jobLocation.includes(loc) || loc.includes(jobLocation))) {
            shouldNotify = false;
          }
        }

        // Check skills match (if job seeker has skills and job requires skills)
        if (shouldNotify && jobSkills.length > 0 && profile.skills) {
          const seekerSkills = [
            ...(profile.skills.technical || []),
            ...(profile.skills.soft || [])
          ].map(s => s.toLowerCase());
          
          // If job seeker has skills, check for at least one match
          if (seekerSkills.length > 0) {
            const hasMatchingSkill = jobSkills.some(jobSkill => 
              seekerSkills.some(seekerSkill => 
                seekerSkill.includes(jobSkill) || jobSkill.includes(seekerSkill)
              )
            );
            // If no matching skills, still notify (don't be too restrictive)
            // Uncomment below to make it more restrictive:
            // shouldNotify = hasMatchingSkill;
          }
        }
      }

      // If job seeker has job alerts disabled, skip
      if (profile.preferences?.jobAlerts === false) {
        shouldNotify = false;
      }

      if (shouldNotify) {
        notifications.push({
          user: profile.user._id, // Already an ObjectId from mongoose
          type: 'job_alert',
          title: `New Job Alert: ${job.title}`,
          message: `A new ${job.category} position "${job.title}" at ${job.company} in ${job.location} has been posted.`,
          relatedJob: job._id, // Already an ObjectId from mongoose
          priority: 'medium',
        });
      }
    }

    if (notifications.length > 0) {
      // Use bulk notification creation for efficiency
      await notificationService.createBulkNotifications(notifications);
      logger.info(`Sent ${notifications.length} job alerts for job: ${job.title}`);
    } else {
      logger.info(`No matching job seekers found for job: ${job.title}`);
    }
  } catch (error) {
    logger.error('Error in sendJobAlertsToJobSeekers:', error);
    throw error;
  }
}

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
    
    // Create notification for employer (job published successfully)
    await notificationService.createNotification({
      userId: req.user.id,
      type: 'job_published',
      title: 'Job Published Successfully',
      message: `Your job posting "${job.title}" has been published and is now live.`,
      relatedJob: job._id.toString(),
      priority: 'low',
    });

    // Send job alerts to job seekers asynchronously (don't block the response)
    sendJobAlertsToJobSeekers(job).catch(error => {
      logger.error('Error sending job alerts to job seekers:', error.message);
    });
    
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
      limit = 20,
      jobType,
      category,
      location,
      search,
      status = 'active',
      includeScraped = 'true',
      salaryMin,
      salaryMax,
      isRemote,
      experience,
      skills,
      sortBy = 'date', // date, salary, rating
      sortOrder = 'desc'
    } = req.query;

    const filter = { status };
    const scrapedFilter = { status: 'active' }; // Only active scraped jobs

    // Apply basic filters
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
    if (isRemote !== undefined) {
      filter.isRemote = isRemote === 'true';
      scrapedFilter.isRemote = isRemote === 'true';
    }
    if (experience) {
      const expNum = parseInt(experience);
      if (!isNaN(expNum)) {
        filter['experience.min'] = { $lte: expNum };
        filter['experience.max'] = { $gte: expNum };
        scrapedFilter['experience.min'] = { $lte: expNum };
        scrapedFilter['experience.max'] = { $gte: expNum };
      }
    }
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      filter.skills = { $in: skillsArray.map(s => new RegExp(s, 'i')) };
      scrapedFilter.skills = { $in: skillsArray.map(s => new RegExp(s, 'i')) };
    }

    // Salary filtering
    if (salaryMin || salaryMax) {
      const salaryFilter = {};
      if (salaryMin && !isNaN(parseInt(salaryMin))) {
        salaryFilter['salary.min'] = { $gte: parseInt(salaryMin) };
      }
      if (salaryMax && !isNaN(parseInt(salaryMax))) {
        salaryFilter['salary.max'] = { $lte: parseInt(salaryMax) };
      }
      if (Object.keys(salaryFilter).length > 0) {
        Object.assign(filter, salaryFilter);
        Object.assign(scrapedFilter, salaryFilter);
      }
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
      ...regularJobs.map(job => ({ 
        ...job, 
        isScraped: false, 
        source: 'internal',
        rating: 4.5, // Mock rating for now
        applicationsCount: job.applicationsCount || Math.floor(Math.random() * 50) + 1
      })),
      ...scrapedJobs.map(job => ({ 
        ...job, 
        isScraped: true, 
        employer: null,
        rating: 4.0 + Math.random() * 0.5, // Mock rating
        applicationsCount: Math.floor(Math.random() * 100) + 1
      }))
    ];

    // Apply sorting
    allJobs.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'salary':
          const salaryA = a.salary?.min || 0;
          const salaryB = b.salary?.min || 0;
          comparison = salaryA - salaryB;
          break;
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
        case 'date':
        default:
          const dateA = new Date(a.createdAt || a.lastScraped);
          const dateB = new Date(b.createdAt || b.lastScraped);
          comparison = dateA - dateB;
          break;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
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
      // Add mock data for missing fields to match Internshala format
      const enhancedJob = {
        ...job.toObject(),
        isScraped: false,
        source: 'internal',
        applicationsCount: job.applicationsCount || Math.floor(Math.random() * 100) + 1,
        // Ensure all required fields have default values
        skills: job.skills || ['Communication', 'Teamwork', 'Problem Solving'],
        keyResponsibilities: job.keyResponsibilities || [
          'Execute assigned tasks efficiently',
          'Collaborate with team members',
          'Meet project deadlines',
          'Maintain quality standards'
        ],
        workEnvironmentRequirements: job.workEnvironmentRequirements || [
          'Professional work environment',
          'Basic computer skills',
          'Good communication skills'
        ],
        educationQualifications: job.educationQualifications || [
          'Bachelor\'s degree in relevant field',
          'Any equivalent qualification'
        ],
        otherRequirements: job.otherRequirements || [
          'Strong work ethic',
          'Ability to learn quickly',
          'Good interpersonal skills'
        ],
        whyCompany: job.whyCompany || [
          'Competitive salary package',
          'Professional growth opportunities',
          'Positive work environment',
          'Learning and development programs'
        ],
        requirements: job.requirements || [
          'Relevant educational background',
          'Good communication skills',
          'Basic computer knowledge',
          'Team player attitude'
        ],
        benefits: job.benefits || [
          'Health insurance',
          'Paid time off',
          'Professional development',
          'Flexible working hours'
        ],
        startDate: job.startDate || 'Immediately',
        numberOfOpenings: job.numberOfOpenings || 1,
        isFresher: job.isFresher || false,
        isUrgent: job.isUrgent || false,
        companyDetails: {
          ...job.companyDetails,
          description: job.companyDetails?.description || `${job.company} is a growing company looking for talented individuals to join our team. We offer a dynamic work environment with opportunities for professional growth and development.`,
          hiringSince: job.companyDetails?.hiringSince || 'January 2020',
          opportunitiesPosted: job.companyDetails?.opportunitiesPosted || Math.floor(Math.random() * 50) + 10,
          candidatesHired: job.companyDetails?.candidatesHired || Math.floor(Math.random() * 20) + 5
        }
      };
      
      return res.json(enhancedJob);
    }
    
    // If not found, try scraped jobs
    job = await ScrapedJob.findById(id);
    
    if (job) {
      // Add mock data for missing fields to match Internshala format
      const enhancedJob = {
        ...job.toObject(),
        isScraped: true,
        employer: null,
        applicationsCount: Math.floor(Math.random() * 100) + 1,
        // Ensure all required fields have default values
        skills: job.skills || ['Communication', 'Teamwork', 'Problem Solving'],
        keyResponsibilities: job.keyResponsibilities || [
          'Execute assigned tasks efficiently',
          'Collaborate with team members',
          'Meet project deadlines',
          'Maintain quality standards'
        ],
        workEnvironmentRequirements: job.workEnvironmentRequirements || [
          'Professional work environment',
          'Basic computer skills',
          'Good communication skills'
        ],
        educationQualifications: job.educationQualifications || [
          'Bachelor\'s degree in relevant field',
          'Any equivalent qualification'
        ],
        otherRequirements: job.otherRequirements || [
          'Strong work ethic',
          'Ability to learn quickly',
          'Good interpersonal skills'
        ],
        whyCompany: job.whyCompany || [
          'Competitive salary package',
          'Professional growth opportunities',
          'Positive work environment',
          'Learning and development programs'
        ],
        requirements: job.requirements || [
          'Relevant educational background',
          'Good communication skills',
          'Basic computer knowledge',
          'Team player attitude'
        ],
        benefits: job.benefits || [
          'Health insurance',
          'Paid time off',
          'Professional development',
          'Flexible working hours'
        ],
        startDate: job.startDate || 'Immediately',
        numberOfOpenings: job.numberOfOpenings || 1,
        isFresher: job.isFresher || false,
        isUrgent: job.isUrgent || false,
        companyDetails: {
          ...job.companyDetails,
          description: job.companyDetails?.description || `${job.company} is a growing company looking for talented individuals to join our team. We offer a dynamic work environment with opportunities for professional growth and development.`,
          hiringSince: job.companyDetails?.hiringSince || 'January 2020',
          opportunitiesPosted: job.companyDetails?.opportunitiesPosted || Math.floor(Math.random() * 50) + 10,
          candidatesHired: job.companyDetails?.candidatesHired || Math.floor(Math.random() * 20) + 5
        }
      };
      
      return res.json(enhancedJob);
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

// Save/Bookmark a job
exports.saveJob = async (req, res, next) => {
  try {
    const { jobId, isScraped } = req.body;
    const userId = req.user.id;

    if (!jobId) {
      return res.status(400).json({ message: "Job ID is required" });
    }

    // Check if job is already saved
    const existingSave = await SavedJob.findOne({
      user: userId,
      [isScraped ? 'scrapedJob' : 'job']: jobId
    });

    if (existingSave) {
      return res.status(400).json({ message: "Job already saved" });
    }

    // Verify job exists
    if (isScraped) {
      const scrapedJob = await ScrapedJob.findById(jobId);
      if (!scrapedJob) {
        return res.status(404).json({ message: "Scraped job not found" });
      }
    } else {
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
    }

    // Save the job
    const savedJob = await SavedJob.create({
      user: userId,
      [isScraped ? 'scrapedJob' : 'job']: jobId
    });

    res.status(201).json({
      message: "Job saved successfully",
      savedJob
    });
  } catch (error) {
    next(error);
  }
};

// Remove saved job
exports.unsaveJob = async (req, res, next) => {
  try {
    const { jobId, isScraped } = req.body;
    const userId = req.user.id;

    const savedJob = await SavedJob.findOneAndDelete({
      user: userId,
      [isScraped ? 'scrapedJob' : 'job']: jobId
    });

    if (!savedJob) {
      return res.status(404).json({ message: "Saved job not found" });
    }

    res.json({ message: "Job removed from saved list" });
  } catch (error) {
    next(error);
  }
};

// Get user's saved jobs
exports.getSavedJobs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const savedJobs = await SavedJob.find({ user: userId })
      .populate('job')
      .populate('scrapedJob')
      .sort({ savedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Format the response
    const formattedJobs = savedJobs.map(savedJob => {
      const job = savedJob.job || savedJob.scrapedJob;
      return {
        ...job.toObject(),
        isScraped: !!savedJob.scrapedJob,
        source: savedJob.scrapedJob ? 'external' : 'internal',
        savedAt: savedJob.savedAt,
        rating: 4.0 + Math.random() * 0.5 // Mock rating
      };
    });

    const total = await SavedJob.countDocuments({ user: userId });

    res.json({
      jobs: formattedJobs,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: formattedJobs.length,
        totalJobs: total
      }
    });
  } catch (error) {
    next(error);
  }
};

// Check if jobs are saved by user
exports.checkSavedJobs = async (req, res, next) => {
  try {
    const { jobIds, isScraped } = req.query;
    const userId = req.user.id;

    if (!jobIds) {
      return res.json({ savedJobs: [] });
    }

    const ids = jobIds.split(',');
    const savedJobs = await SavedJob.find({
      user: userId,
      [isScraped === 'true' ? 'scrapedJob' : 'job']: { $in: ids }
    });

    const savedJobIds = savedJobs.map(savedJob => 
      savedJob[isScraped === 'true' ? 'scrapedJob' : 'job'].toString()
    );

    res.json({ savedJobs: savedJobIds });
  } catch (error) {
    next(error);
  }
};
