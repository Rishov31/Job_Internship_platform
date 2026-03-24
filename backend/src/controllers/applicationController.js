const Application = require("../models/Application");
const Job = require("../models/Job");
const ScrapedJob = require("../models/ScrapedJob");
const JobSeekerProfile = require("../models/JobSeekerProfile");
const User = require("../models/User");
const notificationService = require("../services/notificationService");

exports.apply = async (req,res,next)=>{
  try{
    const { jobId } = req.params;
    const { isScraped, coverLetter, resume } = req.body;
    
    // Check if it's a scraped job or regular job
    let job = null;
    let isScrapedJob = isScraped === true || isScraped === 'true';
    
    if (isScrapedJob) {
      job = await ScrapedJob.findById(jobId);
      if(!job || job.status !== 'active') {
        return res.status(404).json({ message: "Job not found or no longer available" });
      }
    } else {
      job = await Job.findById(jobId).populate('employer');
      if(!job || job.status !== 'active') {
        return res.status(404).json({ message: "Job not found or no longer available" });
      }
    }
    
    const profile = await JobSeekerProfile.findOne({ user: req.user.id });
    if(!profile) {
      return res.status(400).json({ message: "Complete your profile before applying" });
    }
    
    // Check if already applied
    const exists = isScrapedJob 
      ? await Application.findOne({ scrapedJob: jobId, applicant: req.user.id })
      : await Application.findOne({ job: jobId, applicant: req.user.id });
    
    if(exists) {
      return res.status(400).json({ message: "You have already applied to this job" });
    }

    // Create application
    const appData = {
      applicant: req.user.id,
      jobSeekerProfile: profile._id,
      isScraped: isScrapedJob,
      coverLetter: coverLetter || '',
      resume: resume || profile.resume || {},
    };
    
    if (isScrapedJob) {
      appData.scrapedJob = jobId;
    } else {
      appData.job = jobId;
    }
    
    const app = await Application.create(appData);
    
    // Update job application count (only for regular jobs, scraped jobs don't have employer)
    if (!isScrapedJob) {
      await Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } });
    }
    
    // Create notification for job seeker (application submitted)
    const applicant = await User.findById(req.user.id);
    await notificationService.createNotification({
      userId: req.user.id,
      type: 'application_submitted',
      title: 'Application Submitted Successfully',
      message: `Your application for ${job.title} at ${job.company} has been submitted successfully.`,
      relatedJob: jobId,
      relatedApplication: app._id,
      priority: 'medium',
    });

    // Create notification for employer (new application received) - only for regular jobs
    if (!isScrapedJob && job.employer && job.employer._id) {
      await notificationService.createNotification({
        userId: job.employer._id.toString(),
        type: 'new_application',
        title: 'New Application Received',
        message: `${applicant.fullName} has applied for ${job.title}`,
        relatedJob: jobId,
        relatedApplication: app._id,
        relatedUser: req.user.id,
        priority: 'high',
      });
    }

    res.status(201).json({ 
      message: "Application submitted successfully", 
      application: app 
    });
  }catch(e){ 
    next(e); 
  }
};

// Check if user has applied to a job
exports.checkApplication = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { isScraped } = req.query;
    
    const query = isScraped === 'true' 
      ? { scrapedJob: jobId, applicant: req.user.id }
      : { job: jobId, applicant: req.user.id };
    
    const application = await Application.findOne(query);
    
    res.json({ applied: !!application });
  } catch (error) {
    next(error);
  }
};

// Update application status (for employers/admins)
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { status, interviewDate, interviewTime, interviewLocation, interviewNotes } = req.body;

    const validStatuses = ['pending', 'reviewing', 'shortlisted', 'interview', 'rejected', 'accepted', 'withdrawn'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await Application.findById(applicationId)
      .populate('job')
      .populate('scrapedJob')
      .populate('applicant')
      .populate('jobSeekerProfile');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user is the employer of the job (only for regular jobs)
    if (!application.isScraped && application.job) {
      const job = await Job.findById(application.job._id);
      if (job && job.employer.toString() !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else if (application.isScraped) {
      // Scraped jobs don't have employers, only admins can update
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Unauthorized - scraped job applications can only be updated by admins' });
      }
    }

    const oldStatus = application.status;
    application.status = status;
    application.lastUpdated = new Date();
    
    // Store interview details in metadata if provided
    if (status === 'interview' && (interviewDate || interviewTime || interviewLocation || interviewNotes)) {
      application.metadata = application.metadata || {};
      application.metadata.interview = {
        date: interviewDate,
        time: interviewTime,
        location: interviewLocation,
        notes: interviewNotes,
      };
    }

    await application.save();

    // Create appropriate notification based on status change
    const statusMessages = {
      reviewing: 'Your application is being reviewed',
      shortlisted: 'Congratulations! You have been shortlisted',
      interview: 'You have been selected for an interview',
      rejected: 'Thank you for your interest. Unfortunately, your application was not selected',
      accepted: 'Congratulations! Your application has been accepted',
    };

    /** Must match Notification.type enum (not `application_${status}` — e.g. interview → interview_scheduled) */
    const notificationTypeByStatus = {
      pending: 'application_viewed',
      reviewing: 'application_reviewing',
      shortlisted: 'application_shortlisted',
      interview: 'interview_scheduled',
      rejected: 'application_rejected',
      accepted: 'application_accepted',
      withdrawn: 'application_viewed',
    };
    const notificationType = notificationTypeByStatus[status] || 'application_viewed';

    const title = status === 'shortlisted' ? 'Application Shortlisted' :
                  status === 'interview' ? 'Interview Scheduled' :
                  status === 'rejected' ? 'Application Update' :
                  status === 'accepted' ? 'Application Accepted' :
                  'Application Status Updated';

    const jobId = application.isScraped 
      ? (application.scrapedJob?._id || application.scrapedJob)?.toString()
      : (application.job?._id || application.job)?.toString();

    let notifyMessage = statusMessages[status] || `Your application status has been updated to ${status}`;
    if (status === "interview" && application.metadata?.interview) {
      const iv = application.metadata.interview;
      const parts = [iv.date, iv.time, iv.location].filter(Boolean);
      if (parts.length) notifyMessage += ` — ${parts.join(" · ")}`;
    }
    
    await notificationService.createNotification({
      userId: application.applicant._id.toString(),
      type: notificationType,
      title,
      message: notifyMessage,
      relatedJob: jobId,
      relatedApplication: application._id.toString(),
      metadata: application.metadata || {},
      priority: status === 'accepted' || status === 'shortlisted' ? 'high' : 'medium',
    });

    res.json({
      message: 'Application status updated successfully',
      application,
    });
  } catch (error) {
    next(error);
  }
};

// Get applications for a job (for employers)
exports.getJobApplications = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the employer
    if (job.employer.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const applications = await Application.find({ job: jobId })
      .populate('applicant', 'fullName email')
      .populate('jobSeekerProfile')
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (error) {
    next(error);
  }
};


