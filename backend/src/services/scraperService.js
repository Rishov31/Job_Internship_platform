const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const ScrapedJob = require('../models/ScrapedJob');
const ScrapedInternship = require('../models/ScrapedInternship');
const logger = require('../utils/logger');

class ScraperService {
  constructor() {
    this.browser = null;
    this.isScraping = false;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Internshala Jobs Scraper
  async scrapeInternshalaJobs() {
    try {
      logger.info('Starting Internshala jobs scraping...');
      
      await this.initBrowser();
      const page = await this.browser.newPage();
      
      // Set user agent to avoid blocking
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      const jobs = [];
      const maxPages = 5; // Limit to avoid overwhelming the server
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const url = `https://internshala.com/jobs/page-${pageNum}`;
        
        try {
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
          
          // Wait for job listings to load
          await page.waitForSelector('.internship_meta', { timeout: 10000 });
          
          const pageJobs = await page.evaluate(() => {
            const jobElements = document.querySelectorAll('.internship_meta');
            const jobs = [];
            
            jobElements.forEach((element) => {
              try {
                const titleElement = element.querySelector('.company a, .profile_on_detail_page');
                const companyElement = element.querySelector('.company a, .profile_on_detail_page');
                const locationElement = element.querySelector('.location_link');
                const stipendElement = element.querySelector('.stipend');
                const durationElement = element.querySelector('.duration');
                const linkElement = element.querySelector('a');
                
                if (titleElement && companyElement) {
                  const job = {
                    title: titleElement.textContent?.trim() || '',
                    company: companyElement.textContent?.trim() || '',
                    location: locationElement?.textContent?.trim() || '',
                    stipend: stipendElement?.textContent?.trim() || '',
                    duration: durationElement?.textContent?.trim() || '',
                    url: linkElement?.href || '',
                    sourceId: linkElement?.href?.split('/').pop() || ''
                  };
                  
                  if (job.title && job.company) {
                    jobs.push(job);
                  }
                }
              } catch (error) {
                console.error('Error parsing job element:', error);
              }
            });
            
            return jobs;
          });
          
          jobs.push(...pageJobs);
          logger.info(`Scraped ${pageJobs.length} jobs from Internshala page ${pageNum}`);
          
          // Add delay between requests
          await page.waitForTimeout(2000);
          
        } catch (error) {
          logger.error(`Error scraping Internshala page ${pageNum}:`, error.message);
          break;
        }
      }
      
      await page.close();
      
      // Save jobs to database
      let savedCount = 0;
      for (const jobData of jobs) {
        try {
          await ScrapedJob.findOneAndUpdate(
            { source: 'internshala', sourceId: jobData.sourceId },
            {
              ...jobData,
              source: 'internshala',
              sourceUrl: jobData.url,
              category: 'Technology', // Default category
              jobType: 'private',
              status: 'active',
              lastScraped: new Date()
            },
            { upsert: true, new: true }
          );
          savedCount++;
        } catch (error) {
          logger.error('Error saving Internshala job:', error.message);
        }
      }
      
      logger.info(`Successfully scraped and saved ${savedCount} Internshala jobs`);
      return savedCount;
      
    } catch (error) {
      logger.error('Error in Internshala jobs scraping:', error);
      throw error;
    }
  }

  // Internshala Internships Scraper
  async scrapeInternshalaInternships() {
    try {
      logger.info('Starting Internshala internships scraping...');
      
      await this.initBrowser();
      const page = await this.browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      const internships = [];
      const maxPages = 5;
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const url = `https://internshala.com/internships/page-${pageNum}`;
        
        try {
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
          await page.waitForSelector('.internship_meta', { timeout: 10000 });
          
          const pageInternships = await page.evaluate(() => {
            const internshipElements = document.querySelectorAll('.internship_meta');
            const internships = [];
            
            internshipElements.forEach((element) => {
              try {
                const titleElement = element.querySelector('.profile_on_detail_page');
                const companyElement = element.querySelector('.company a, .profile_on_detail_page');
                const locationElement = element.querySelector('.location_link');
                const stipendElement = element.querySelector('.stipend');
                const durationElement = element.querySelector('.duration');
                const linkElement = element.querySelector('a');
                
                if (titleElement && companyElement) {
                  const internship = {
                    title: titleElement.textContent?.trim() || '',
                    company: companyElement.textContent?.trim() || '',
                    location: locationElement?.textContent?.trim() || '',
                    stipend: stipendElement?.textContent?.trim() || '',
                    duration: durationElement?.textContent?.trim() || '',
                    url: linkElement?.href || '',
                    sourceId: linkElement?.href?.split('/').pop() || ''
                  };
                  
                  if (internship.title && internship.company) {
                    internships.push(internship);
                  }
                }
              } catch (error) {
                console.error('Error parsing internship element:', error);
              }
            });
            
            return internships;
          });
          
          internships.push(...pageInternships);
          logger.info(`Scraped ${pageInternships.length} internships from Internshala page ${pageNum}`);
          
          await page.waitForTimeout(2000);
          
        } catch (error) {
          logger.error(`Error scraping Internshala page ${pageNum}:`, error.message);
          break;
        }
      }
      
      await page.close();
      
      // Save internships to database
      let savedCount = 0;
      for (const internshipData of internships) {
        try {
          await ScrapedInternship.findOneAndUpdate(
            { source: 'internshala', sourceId: internshipData.sourceId },
            {
              ...internshipData,
              source: 'internshala',
              sourceUrl: internshipData.url,
              status: 'active',
              lastScraped: new Date()
            },
            { upsert: true, new: true }
          );
          savedCount++;
        } catch (error) {
          logger.error('Error saving Internshala internship:', error.message);
        }
      }
      
      logger.info(`Successfully scraped and saved ${savedCount} Internshala internships`);
      return savedCount;
      
    } catch (error) {
      logger.error('Error in Internshala internships scraping:', error);
      throw error;
    }
  }

  // Unstop Jobs Scraper
  async scrapeUnstopJobs() {
    try {
      logger.info('Starting Unstop jobs scraping...');
      
      await this.initBrowser();
      const page = await this.browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      const jobs = [];
      const maxPages = 5;
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const url = `https://unstop.com/jobs?page=${pageNum}`;
        
        try {
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
          
          // Wait for job listings to load
          await page.waitForSelector('[data-testid="job-card"], .job-card', { timeout: 10000 });
          
          const pageJobs = await page.evaluate(() => {
            const jobElements = document.querySelectorAll('[data-testid="job-card"], .job-card, .job-item');
            const jobs = [];
            
            jobElements.forEach((element) => {
              try {
                const titleElement = element.querySelector('h3, .job-title, .title');
                const companyElement = element.querySelector('.company-name, .company, .organization');
                const locationElement = element.querySelector('.location, .job-location');
                const salaryElement = element.querySelector('.salary, .compensation');
                const linkElement = element.querySelector('a');
                
                if (titleElement && companyElement) {
                  const job = {
                    title: titleElement.textContent?.trim() || '',
                    company: companyElement.textContent?.trim() || '',
                    location: locationElement?.textContent?.trim() || '',
                    salary: salaryElement?.textContent?.trim() || '',
                    url: linkElement?.href || '',
                    sourceId: linkElement?.href?.split('/').pop() || Date.now().toString()
                  };
                  
                  if (job.title && job.company) {
                    jobs.push(job);
                  }
                }
              } catch (error) {
                console.error('Error parsing Unstop job element:', error);
              }
            });
            
            return jobs;
          });
          
          jobs.push(...pageJobs);
          logger.info(`Scraped ${pageJobs.length} jobs from Unstop page ${pageNum}`);
          
          await page.waitForTimeout(2000);
          
        } catch (error) {
          logger.error(`Error scraping Unstop page ${pageNum}:`, error.message);
          break;
        }
      }
      
      await page.close();
      
      // Save jobs to database
      let savedCount = 0;
      for (const jobData of jobs) {
        try {
          await ScrapedJob.findOneAndUpdate(
            { source: 'unstop', sourceId: jobData.sourceId },
            {
              ...jobData,
              source: 'unstop',
              sourceUrl: jobData.url,
              category: 'Technology', // Default category
              jobType: 'private',
              status: 'active',
              lastScraped: new Date()
            },
            { upsert: true, new: true }
          );
          savedCount++;
        } catch (error) {
          logger.error('Error saving Unstop job:', error.message);
        }
      }
      
      logger.info(`Successfully scraped and saved ${savedCount} Unstop jobs`);
      return savedCount;
      
    } catch (error) {
      logger.error('Error in Unstop jobs scraping:', error);
      throw error;
    }
  }

  // Unstop Internships Scraper
  async scrapeUnstopInternships() {
    try {
      logger.info('Starting Unstop internships scraping...');
      
      await this.initBrowser();
      const page = await this.browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      const internships = [];
      const maxPages = 5;
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const url = `https://unstop.com/internships?page=${pageNum}`;
        
        try {
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
          await page.waitForSelector('[data-testid="internship-card"], .internship-card', { timeout: 10000 });
          
          const pageInternships = await page.evaluate(() => {
            const internshipElements = document.querySelectorAll('[data-testid="internship-card"], .internship-card, .internship-item');
            const internships = [];
            
            internshipElements.forEach((element) => {
              try {
                const titleElement = element.querySelector('h3, .internship-title, .title');
                const companyElement = element.querySelector('.company-name, .company, .organization');
                const locationElement = element.querySelector('.location, .internship-location');
                const stipendElement = element.querySelector('.stipend, .compensation');
                const durationElement = element.querySelector('.duration, .period');
                const linkElement = element.querySelector('a');
                
                if (titleElement && companyElement) {
                  const internship = {
                    title: titleElement.textContent?.trim() || '',
                    company: companyElement.textContent?.trim() || '',
                    location: locationElement?.textContent?.trim() || '',
                    stipend: stipendElement?.textContent?.trim() || '',
                    duration: durationElement?.textContent?.trim() || '',
                    url: linkElement?.href || '',
                    sourceId: linkElement?.href?.split('/').pop() || Date.now().toString()
                  };
                  
                  if (internship.title && internship.company) {
                    internships.push(internship);
                  }
                }
              } catch (error) {
                console.error('Error parsing Unstop internship element:', error);
              }
            });
            
            return internships;
          });
          
          internships.push(...pageInternships);
          logger.info(`Scraped ${pageInternships.length} internships from Unstop page ${pageNum}`);
          
          await page.waitForTimeout(2000);
          
        } catch (error) {
          logger.error(`Error scraping Unstop page ${pageNum}:`, error.message);
          break;
        }
      }
      
      await page.close();
      
      // Save internships to database
      let savedCount = 0;
      for (const internshipData of internships) {
        try {
          await ScrapedInternship.findOneAndUpdate(
            { source: 'unstop', sourceId: internshipData.sourceId },
            {
              ...internshipData,
              source: 'unstop',
              sourceUrl: internshipData.url,
              status: 'active',
              lastScraped: new Date()
            },
            { upsert: true, new: true }
          );
          savedCount++;
        } catch (error) {
          logger.error('Error saving Unstop internship:', error.message);
        }
      }
      
      logger.info(`Successfully scraped and saved ${savedCount} Unstop internships`);
      return savedCount;
      
    } catch (error) {
      logger.error('Error in Unstop internships scraping:', error);
      throw error;
    }
  }

  // Main scraping method
  async scrapeAll() {
    if (this.isScraping) {
      logger.warn('Scraping already in progress, skipping...');
      return;
    }

    this.isScraping = true;
    const results = {};

    try {
      logger.info('Starting full scraping process...');
      
      // Scrape all sources
      results.internshalaJobs = await this.scrapeInternshalaJobs();
      results.internshalaInternships = await this.scrapeInternshalaInternships();
      results.unstopJobs = await this.scrapeUnstopJobs();
      results.unstopInternships = await this.scrapeUnstopInternships();
      
      // Mark old entries as expired (older than 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      await ScrapedJob.updateMany(
        { lastScraped: { $lt: sevenDaysAgo }, status: 'active' },
        { status: 'expired' }
      );
      
      await ScrapedInternship.updateMany(
        { lastScraped: { $lt: sevenDaysAgo }, status: 'active' },
        { status: 'expired' }
      );
      
      logger.info('Scraping completed successfully:', results);
      
    } catch (error) {
      logger.error('Error during scraping process:', error);
      throw error;
    } finally {
      this.isScraping = false;
      await this.closeBrowser();
    }

    return results;
  }

  // Get scraping statistics
  async getScrapingStats() {
    try {
      const jobStats = await ScrapedJob.aggregate([
        {
          $group: {
            _id: '$source',
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            expired: { $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } }
          }
        }
      ]);

      const internshipStats = await ScrapedInternship.aggregate([
        {
          $group: {
            _id: '$source',
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            expired: { $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } }
          }
        }
      ]);

      return {
        jobs: jobStats,
        internships: internshipStats
      };
    } catch (error) {
      logger.error('Error getting scraping stats:', error);
      throw error;
    }
  }
}

module.exports = new ScraperService();
