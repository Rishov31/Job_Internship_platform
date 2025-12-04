const cron = require('node-cron');
const scraperService = require('./scraperService');
const logger = require('../utils/logger');

class SchedulerService {
  constructor() {
    this.isInitialized = false;
    this.scheduledJobs = [];
  }

  init() {
    if (this.isInitialized) {
      logger.warn('Scheduler already initialized');
      return;
    }

    logger.info('Initializing scheduler service...');

    // Schedule daily scraping at 2 AM
    const dailyScrapingJob = cron.schedule('0 2 * * *', async () => {
      try {
        const mongoose = require('mongoose');
        
        // Check if MongoDB is connected before scraping
        if (mongoose.connection.readyState !== 1) {
          logger.warn('MongoDB is not connected. Skipping scheduled scraping.');
          return;
        }

        logger.info('Starting scheduled daily scraping...');
        const results = await scraperService.scrapeAll();
        logger.info('Scheduled scraping completed:', results);
      } catch (error) {
        logger.error('Error in scheduled scraping:', error);
      }
    }, {
      scheduled: false, // Don't start immediately
      timezone: "Asia/Kolkata"
    });

    // Schedule weekly cleanup at 3 AM on Sundays
    const weeklyCleanupJob = cron.schedule('0 3 * * 0', async () => {
      try {
        logger.info('Starting scheduled weekly cleanup...');
        await this.cleanupExpiredData();
        logger.info('Scheduled cleanup completed');
      } catch (error) {
        logger.error('Error in scheduled cleanup:', error);
      }
    }, {
      scheduled: false,
      timezone: "Asia/Kolkata"
    });

    this.scheduledJobs.push(dailyScrapingJob, weeklyCleanupJob);
    this.isInitialized = true;

    logger.info('Scheduler service initialized successfully');
  }

  start() {
    if (!this.isInitialized) {
      this.init();
    }

    this.scheduledJobs.forEach(job => {
      job.start();
    });

    logger.info('Scheduled jobs started');
  }

  stop() {
    this.scheduledJobs.forEach(job => {
      job.stop();
    });

    logger.info('Scheduled jobs stopped');
  }

  async runScrapingNow() {
    try {
      const mongoose = require('mongoose');
      
      // Check if MongoDB is connected
      if (mongoose.connection.readyState !== 1) {
        logger.error('MongoDB is not connected. Cannot run scraping.');
        throw new Error('Database not connected. Please ensure MongoDB is running and connection string is correct.');
      }

      logger.info('Manual scraping triggered...');
      const results = await scraperService.scrapeAll();
      logger.info('Manual scraping completed:', results);
      return results;
    } catch (error) {
      logger.error('Error in manual scraping:', error);
      throw error;
    }
  }

  async cleanupExpiredData() {
    try {
      const mongoose = require('mongoose');
      
      // Check if MongoDB is connected
      if (mongoose.connection.readyState !== 1) {
        logger.warn('MongoDB is not connected. Skipping cleanup.');
        return {
          deletedJobs: 0,
          deletedInternships: 0,
          message: 'Database not connected'
        };
      }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Remove expired scraped data older than 30 days
      const ScrapedJob = require('../models/ScrapedJob');
      const ScrapedInternship = require('../models/ScrapedInternship');

      const deletedJobs = await ScrapedJob.deleteMany({
        status: 'expired',
        lastScraped: { $lt: thirtyDaysAgo }
      });

      const deletedInternships = await ScrapedInternship.deleteMany({
        status: 'expired',
        lastScraped: { $lt: thirtyDaysAgo }
      });

      logger.info(`Cleanup completed: Deleted ${deletedJobs.deletedCount} expired jobs and ${deletedInternships.deletedCount} expired internships`);
      
      return {
        deletedJobs: deletedJobs.deletedCount,
        deletedInternships: deletedInternships.deletedCount
      };
    } catch (error) {
      logger.error('Error in cleanup:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      jobsRunning: this.scheduledJobs.map(job => job.running),
      totalJobs: this.scheduledJobs.length
    };
  }
}

module.exports = new SchedulerService();
