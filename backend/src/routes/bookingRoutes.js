const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
const ctrl = require("../controllers/bookingController");

router.use(auth);

// Jobseeker creates booking with a mentor
router.post("/mentor/:mentorId", requireRole("jobseeker"), ctrl.createBooking);

// Lists
router.get("/me/jobseeker", requireRole("jobseeker"), ctrl.listMyBookingsAsJobSeeker);
router.get("/me/mentor", requireRole("mentor", "admin"), ctrl.listMyBookingsAsMentor);

module.exports = router;


