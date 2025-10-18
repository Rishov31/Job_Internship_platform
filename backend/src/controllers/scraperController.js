const scraperService = require('../services/scraperService');
const schedulerService = require('../services/schedulerService');

// Get scraping statistics
exports.getScrapingStats = async (req, res, next) => {
  try {
    const stats = await scraperService.getScrapingStats();
    const schedulerStatus = schedulerService.getStatus();
    
    res.json({
      stats,
      scheduler: schedulerStatus
    });
  } catch (error) {
    next(error);
  }
};

// Trigger manual scraping
exports.triggerScraping = async (req, res, next) => {
  try {
    const results = await schedulerService.runScrapingNow();
    
    res.json({
      message: 'Scraping completed successfully',
      results
    });
  } catch (error) {
    next(error);
  }
};

// Start scheduler
exports.startScheduler = async (req, res, next) => {
  try {
    schedulerService.start();
    
    res.json({
      message: 'Scheduler started successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Stop scheduler
exports.stopScheduler = async (req, res, next) => {
  try {
    schedulerService.stop();
    
    res.json({
      message: 'Scheduler stopped successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get scheduler status
exports.getSchedulerStatus = async (req, res, next) => {
  try {
    const status = schedulerService.getStatus();
    
    res.json(status);
  } catch (error) {
    next(error);
  }
};

// Cleanup expired data
exports.cleanupExpiredData = async (req, res, next) => {
  try {
    const results = await schedulerService.cleanupExpiredData();
    
    res.json({
      message: 'Cleanup completed successfully',
      results
    });
  } catch (error) {
    next(error);
  }
};
