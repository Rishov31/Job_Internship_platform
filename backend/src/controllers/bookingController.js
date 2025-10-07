const Booking = require("../models/Booking");
const Mentor = require("../models/Mentor");

exports.createBooking = async (req, res, next) => {
  try {
    const { mentorId } = req.params;
    const { startTime, minutes, notes } = req.body;
    const mentor = await Mentor.findById(mentorId);
    if (!mentor || !mentor.isActive) return res.status(404).json({ message: "Mentor not found" });
    const start = new Date(startTime);
    if (isNaN(start.getTime())) return res.status(400).json({ message: "Invalid startTime" });
    const booking = await Booking.create({
      mentor: mentor._id,
      mentorUser: mentor.user,
      jobseeker: req.user.id,
      startTime: start,
      minutes,
      pricePerMinuteAtBooking: mentor.pricePerMinute,
      notes,
    });
    res.status(201).json({ message: "Booking created", booking });
  } catch (e) { next(e); }
};

exports.listMyBookingsAsJobSeeker = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ jobseeker: req.user.id })
      .populate({ path: "mentor", populate: { path: "user", select: "fullName avatarUrl" } })
      .sort({ startTime: -1 });
    res.json({ bookings });
  } catch (e) { next(e); }
};

exports.listMyBookingsAsMentor = async (req, res, next) => {
  try {
    const mentor = await Mentor.findOne({ user: req.user.id });
    if (!mentor) return res.json({ bookings: [] });
    const bookings = await Booking.find({ mentor: mentor._id })
      .populate("jobseeker", "fullName avatarUrl")
      .sort({ startTime: -1 });
    res.json({ bookings });
  } catch (e) { next(e); }
};


