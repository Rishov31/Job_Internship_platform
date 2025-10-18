const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
const internshipController = require("../controllers/internshipController");

// Public routes
router.get("/", internshipController.getAllInternships);
router.get("/:id", internshipController.getInternshipById);

// Protected routes - Employer only
router.use(auth);
router.use(requireRole("employer"));

// Employer internship management
router.post("/", internshipController.createInternship);
router.get("/employer/my-internships", internshipController.getEmployerInternships);
router.put("/:id", internshipController.updateInternship);
router.delete("/:id", internshipController.deleteInternship);
router.patch("/:id/status", internshipController.updateInternshipStatus);
router.get("/employer/stats", internshipController.getInternshipStats);

module.exports = router;
