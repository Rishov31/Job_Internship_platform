const MentoringSession = require("../models/MentoringSession");
const ChatRoom = require("../models/ChatRoom");
const Mentor = require("../models/Mentor");

// Create a mentoring session with pending_payment status
exports.createSession = async (req, res, next) => {
  try {
    const { mentorId } = req.params;
    const { startTime, minutes, notes, motivation } = req.body;
    
    const mentor = await Mentor.findById(mentorId);
    if (!mentor || !mentor.isActive) {
      return res.status(404).json({ message: "Mentor not found" });
    }

    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: "Invalid startTime" });
    }

    const totalAmount = mentor.pricePerMinute * (minutes || 30);

    const session = await MentoringSession.create({
      mentor: mentor._id,
      mentorUser: mentor.user,
      jobseeker: req.user.id,
      startTime: start,
      minutes: minutes || 30,
      pricePerMinuteAtBooking: mentor.pricePerMinute,
      totalAmount,
      status: "pending_payment",
      sessionKind: "platform_mentor",
      notes,
      motivation,
    });

    res.status(201).json({ 
      message: "Mentoring session created. Please complete payment.",
      session 
    });
  } catch (e) {
    next(e);
  }
};

// Update session status after payment
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { paymentId, paymentMethod, status } = req.body;

    const session = await MentoringSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Only jobseeker who created the session can update payment
    if (session.jobseeker.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update payment details
    if (paymentId) session.paymentId = paymentId;
    if (paymentMethod) session.paymentMethod = paymentMethod;
    if (status === "paid") {
      session.status = "paid";
      
      // Create chat room after payment
      const existingChatRoom = await ChatRoom.findOne({ 
        mentoringSession: session._id 
      });
      
      if (!existingChatRoom) {
        await ChatRoom.create({
          mentoringSession: session._id,
          mentor: session.mentorUser,
          jobseeker: session.jobseeker,
        });
      }
    }

    await session.save();

    res.json({ 
      message: "Payment status updated",
      session 
    });
  } catch (e) {
    next(e);
  }
};

// Get all sessions for a jobseeker
exports.getMySessions = async (req, res, next) => {
  try {
    const sessions = await MentoringSession.find({ jobseeker: req.user.id })
      .populate({
        path: "mentor",
        populate: { path: "user", select: "fullName avatarUrl" },
      })
      .populate("mentorUser", "fullName avatarUrl email")
      .populate("providerStartup", "name industry")
      .sort({ createdAt: -1 });

    res.json({ sessions });
  } catch (e) {
    next(e);
  }
};

/** Provider-side sessions (platform mentor, startup founder, investor) via mentorUser */
exports.getMySessionsAsMentor = async (req, res, next) => {
  try {
    const sessions = await MentoringSession.find({ mentorUser: req.user.id })
      .populate("jobseeker", "fullName avatarUrl email phone")
      .populate("mentorUser", "fullName avatarUrl")
      .populate({
        path: "mentor",
        populate: { path: "user", select: "fullName avatarUrl" },
      })
      .populate("providerStartup", "name industry")
      .sort({ startTime: -1 });

    res.json({ sessions });
  } catch (e) {
    next(e);
  }
};

// Get a specific session
exports.getSessionById = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await MentoringSession.findById(sessionId)
      .populate({
        path: "mentor",
        populate: { path: "user", select: "fullName avatarUrl" },
      })
      .populate("jobseeker", "fullName avatarUrl")
      .populate("mentorUser", "fullName avatarUrl")
      .populate("providerStartup", "name industry");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check authorization
    if (session.jobseeker.toString() !== req.user.id && 
        session.mentorUser.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json({ session });
  } catch (e) {
    next(e);
  }
};

