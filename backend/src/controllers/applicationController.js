const Application = require("../models/Application");
const Job = require("../models/Job");
const JobSeekerProfile = require("../models/JobSeekerProfile");
const User = require("../models/User");
const notificationService = require("../services/notificationService");

exports.apply = async (req,res,next)=>{
  try{
    const { jobId } = req.params;
    const job = await Job.findById(jobId).populate('employer');
    if(!job || job.status !== 'active') return res.status(404).json({ message: "Job not found" });
    const profile = await JobSeekerProfile.findOne({ user: req.user.id });
    if(!profile) return res.status(400).json({ message: "Complete profile before applying" });
    const exists = await Application.findOne({ job: jobId, applicant: req.user.id });
    if(exists) return res.status(400).json({ message: "Already applied" });

    const app = await Application.create({
      job: jobId,
      applicant: req.user.id,
      jobSeekerProfile: profile._id,
      coverLetter: req.body.coverLetter,
      resume: req.body.resume || profile.resume,
    });
    await Job.findByIdAndUpdate(jobId,{ $inc:{ applicationsCount:1 }});
    
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

    // Create notification for employer (new application received)
    if (job.employer && job.employer._id) {
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

    res.status(201).json({ message:"Applied", application: app });
  }catch(e){ next(e); }
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
      .populate('applicant')
      .populate('jobSeekerProfile');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user is the employer of the job
    const job = await Job.findById(application.job._id);
    if (job.employer.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized' });
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

    const notificationType = `application_${status}`;
    const title = status === 'shortlisted' ? 'Application Shortlisted' :
                  status === 'interview' ? 'Interview Scheduled' :
                  status === 'rejected' ? 'Application Update' :
                  status === 'accepted' ? 'Application Accepted' :
                  'Application Status Updated';

    await notificationService.createNotification({
      userId: application.applicant._id.toString(),
      type: notificationType,
      title,
      message: statusMessages[status] || `Your application status has been updated to ${status}`,
      relatedJob: application.job._id.toString(),
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


