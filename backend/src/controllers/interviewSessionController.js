const InterviewSession = require("../models/InterviewSession");
const Application = require("../models/Application");
const Job = require("../models/Job");
const notificationService = require("../services/notificationService");

/** Create coding interview session (employer) */
exports.createSession = async (req, res, next) => {
  try {
    const { applicationId } = req.body;
    if (!applicationId) {
      return res.status(400).json({ message: "applicationId is required" });
    }

    const application = await Application.findById(applicationId)
      .populate("job")
      .populate("applicant", "fullName email");

    if (!application || application.isScraped) {
      return res.status(404).json({ message: "Application not found" });
    }

    const job = await Job.findById(application.job._id || application.job);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.employer.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const existing = await InterviewSession.findOne({ application: applicationId });
    if (existing) {
      const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const joinUrl = `${baseUrl}/interview/coding/${existing._id}`;
      await Application.findByIdAndUpdate(application._id, {
        $set: {
          "metadata.interviewSessionId": existing._id.toString(),
          "metadata.codingInterviewJoinUrl": joinUrl,
        },
      });
      return res.status(200).json({
        message: "Session already exists",
        session: existing,
      });
    }

    const session = await InterviewSession.create({
      application: application._id,
      job: job._id,
      employer: job.employer,
      student: application.applicant._id,
      status: "scheduled",
    });

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const joinUrl = `${baseUrl}/interview/coding/${session._id}`;

    await Application.findByIdAndUpdate(application._id, {
      $set: {
        "metadata.interviewSessionId": session._id.toString(),
        "metadata.codingInterviewJoinUrl": joinUrl,
      },
    });

    await notificationService.createNotification({
      userId: application.applicant._id.toString(),
      type: "interview_scheduled",
      title: "Coding interview session",
      message: `Your interviewer started a coding interview for "${job.title}". Join: ${joinUrl}`,
      relatedJob: job._id.toString(),
      relatedApplication: application._id.toString(),
      metadata: { interviewSessionId: session._id.toString(), joinUrl },
      priority: "high",
    });

    res.status(201).json({ session });
  } catch (e) {
    next(e);
  }
};

/** Get session — participant must be employer or student */
exports.getSession = async (req, res, next) => {
  try {
    const session = await InterviewSession.findById(req.params.id)
      .populate("application")
      .populate("job")
      .populate("employer", "fullName email")
      .populate("student", "fullName email");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const uid = req.user.id.toString();
    if (
      session.employer._id.toString() !== uid &&
      session.student._id.toString() !== uid &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json({ session });
  } catch (e) {
    next(e);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["scheduled", "in_progress", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const session = await InterviewSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const uid = req.user.id.toString();
    if (
      session.employer.toString() !== uid &&
      session.student.toString() !== uid &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    session.status = status;
    await session.save();
    res.json({ session });
  } catch (e) {
    next(e);
  }
};
