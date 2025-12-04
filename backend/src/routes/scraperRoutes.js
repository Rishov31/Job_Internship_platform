const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const requireRole = require("../middlewares/roleMiddleware");
const scraperController = require("../controllers/scraperController");

// All routes require admin authentication
router.use(auth);
router.use(requireRole("admin"));

// Scraper management routes
router.get("/stats", scraperController.getScrapingStats);
router.post("/trigger", scraperController.triggerScraping);
router.post("/stop", scraperController.stopScraping); // Stop ongoing scraping
router.post("/scheduler/start", scraperController.startScheduler);
router.post("/scheduler/stop", scraperController.stopScheduler);
router.get("/scheduler/status", scraperController.getSchedulerStatus);
router.post("/cleanup", scraperController.cleanupExpiredData);

module.exports = router;
