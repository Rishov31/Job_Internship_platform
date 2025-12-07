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
    this.shouldStop = false;
    this.currentPage = null;
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
      try {
        await this.browser.close();
      } catch (error) {
        logger.error('Error closing browser:', error.message);
      }
      this.browser = null;
      this.currentPage = null;
    }
  }

  // Stop ongoing scraping operation
  async stopScraping() {
    logger.info('Stop scraping requested...');
    this.shouldStop = true;
    
    // Close browser to interrupt ongoing operations
    if (this.browser) {
      try {
        // Close all pages first
        const pages = await this.browser.pages();
        for (const page of pages) {
          try {
            await page.close();
          } catch (error) {
            // Ignore errors when closing pages
          }
        }
        await this.closeBrowser();
      } catch (error) {
        logger.error('Error stopping browser:', error.message);
      }
    }
    
    logger.info('Scraping stop signal sent');
  }

  // Reset stop flag (called when starting new scraping)
  resetStopFlag() {
    this.shouldStop = false;
  }

  // Helper function to save a single job to database immediately
  async saveJobToDatabase(jobData, source = 'internshala') {
    try {
      // Validate required fields
      if (!jobData.title || !jobData.sourceId || !jobData.url) {
        logger.warn(`Skipping job with missing required fields: ${jobData.title || 'No title'}`);
        return { saved: false, error: 'Missing required fields' };
      }
      
      // Ensure sourceId is valid
      if (!jobData.sourceId || jobData.sourceId.length < 3) {
        jobData.sourceId = Buffer.from(jobData.url).toString('base64').substring(0, 50);
      }
      
      // Truncate fields to match schema constraints
      const title = (jobData.title || '').trim().substring(0, 200);
      const company = (jobData.company || 'Unknown Company').trim().substring(0, 100);
      const location = (jobData.location || 'Not specified').trim().substring(0, 100);
      const category = 'Technology'.substring(0, 50); // Ensure category is within limit
      
      // Build description from available data
      let description = jobData.description || '';
      if (!description || description.trim().length < 20) {
        const descParts = [];
        if (jobData.keyResponsibilities && jobData.keyResponsibilities.length > 0) {
          descParts.push('Key Responsibilities:\n' + jobData.keyResponsibilities.join('\n'));
        }
        if (jobData.requirements && jobData.requirements.length > 0) {
          descParts.push('Requirements:\n' + jobData.requirements.join('\n'));
        }
        if (jobData.skills && jobData.skills.length > 0) {
          descParts.push('Required Skills: ' + jobData.skills.join(', '));
        }
        description = descParts.length > 0 
          ? descParts.join('\n\n') 
          : `${title} position at ${company}. ${location ? `Location: ${location}.` : ''}`;
      }
      
      // Ensure description is not empty (required field)
      if (!description || description.trim().length === 0) {
        description = `${title} position at ${company}. ${location ? `Location: ${location}.` : 'Location not specified.'}`;
      }
      
      // Ensure sourceUrl is valid
      const sourceUrl = jobData.url || '';
      if (!sourceUrl || sourceUrl.trim().length === 0) {
        logger.warn(`Skipping job with invalid URL: ${title}`);
        return { saved: false, error: 'Invalid source URL' };
      }
      
      // Ensure sourceId is valid
      const sourceId = (jobData.sourceId || '').trim();
      if (!sourceId || sourceId.length < 3) {
        logger.warn(`Skipping job with invalid sourceId: ${title}`);
        return { saved: false, error: 'Invalid source ID' };
      }
      
      // Ensure source is valid enum value
      const validSource = (source === 'internshala' || source === 'unstop') ? source : 'internshala';
      
      const jobToSave = {
        title: title,
        company: company,
        location: location,
        description: description.trim(),
        descriptionHtml: (jobData.descriptionHtml || '').trim(),
        fullDetailsHtml: (jobData.fullDetailsHtml || '').trim(),
        category: category,
        jobType: 'private',
        status: 'active',
        source: validSource,
        sourceUrl: sourceUrl.trim(),
        sourceId: sourceId,
        lastScraped: new Date(),
        
        // Salary information - only include if values exist
        salary: {
          currency: 'INR',
          period: 'yearly'
        },
        
        // Experience
        experience: {
          min: (jobData.experienceMin !== undefined && jobData.experienceMin !== null) ? Number(jobData.experienceMin) : 0,
          max: (jobData.experienceMax !== undefined && jobData.experienceMax !== null) ? Number(jobData.experienceMax) : 5
        },
        
        // Skills - filter and limit length
        skills: (jobData.skills || [])
          .filter(s => s && typeof s === 'string' && s.trim().length > 0)
          .map(s => s.trim().substring(0, 100)), // Limit skill length
        
        // Detailed sections - filter empty values
        keyResponsibilities: (jobData.keyResponsibilities || [])
          .filter(r => r && typeof r === 'string' && r.trim().length > 0)
          .map(r => r.trim()),
        requirements: (jobData.requirements || [])
          .filter(r => r && typeof r === 'string' && r.trim().length > 0)
          .map(r => r.trim()),
        otherRequirements: (jobData.otherRequirements || [])
          .filter(r => r && typeof r === 'string' && r.trim().length > 0)
          .map(r => r.trim()),
        workEnvironmentRequirements: (jobData.workEnvironmentRequirements || [])
          .filter(r => r && typeof r === 'string' && r.trim().length > 0)
          .map(r => r.trim()),
        educationQualifications: (jobData.educationQualifications || [])
          .filter(q => q && typeof q === 'string' && q.trim().length > 0)
          .map(q => q.trim()),
        whyCompany: (jobData.whyCompany || [])
          .filter(w => w && typeof w === 'string' && w.trim().length > 0)
          .map(w => w.trim()),
        
        // Dates
        startDate: (jobData.startDate || 'Immediately').substring(0, 100),
        applicationDeadline: jobData.applicationDeadline || null,
        
        // Company details
        companyDetails: {
          description: (jobData.companyDescription || '').trim().substring(0, 1000) // Reasonable limit
        }
      };
      
      // Add salary fields only if they exist
      if (jobData.salaryText || jobData.salary) {
        jobToSave.salary.text = (jobData.salaryText || jobData.salary || '').substring(0, 200);
      }
      if (jobData.salaryMin !== undefined && jobData.salaryMin !== null) {
        jobToSave.salary.min = Number(jobData.salaryMin);
      }
      if (jobData.salaryMax !== undefined && jobData.salaryMax !== null) {
        jobToSave.salary.max = Number(jobData.salaryMax);
      }
      if (jobData.annualCTCMin !== undefined && jobData.annualCTCMin !== null) {
        jobToSave.salary.annualCTCMin = Number(jobData.annualCTCMin);
      }
      if (jobData.annualCTCMax !== undefined && jobData.annualCTCMax !== null) {
        jobToSave.salary.annualCTCMax = Number(jobData.annualCTCMax);
      }
      
      const savedJob = await ScrapedJob.findOneAndUpdate(
        { source: validSource, sourceId: sourceId },
        jobToSave,
        { upsert: true, new: true, runValidators: true }
      );
      
      if (savedJob) {
        logger.debug(`Saved job: ${savedJob.title} (${savedJob._id})`);
        return { saved: true, job: savedJob };
      } else {
        return { saved: false, error: 'Failed to save' };
      }
    } catch (error) {
      logger.error(`Error saving job "${jobData.title || 'Unknown'}":`, error.message);
      if (error.name === 'ValidationError') {
        const validationErrors = {};
        Object.keys(error.errors || {}).forEach(key => {
          validationErrors[key] = error.errors[key].message;
        });
        logger.error('Validation errors:', JSON.stringify(validationErrors, null, 2));
        logger.error('Job data that failed:', JSON.stringify({
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          source: source,
          sourceId: jobData.sourceId,
          hasDescription: !!jobData.description
        }, null, 2));
      }
      return { saved: false, error: error.message };
    }
  }

  // Helper function to scrape detailed job information from Internshala job detail page
  async scrapeInternshalaJobDetails(jobUrl, page) {
    try {
      await page.goto(jobUrl, { waitUntil: 'networkidle2', timeout: 45000 });
      await page.waitForSelector('body', { timeout: 15000 });
      await page.waitForTimeout(2500); // give time for dynamic widgets
      // Wait until the details content (About the job) appears to ensure it's rendered
      try {
        await page.waitForFunction(() => {
          const nodes = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
          return nodes.some(h => /about\s+the\s+job/i.test((h.textContent || '').trim()));
        }, { timeout: 20000 });
      } catch (e) {
        // continue even if not found; we'll use fallbacks in evaluation
      }
      
      const jobDetails = await page.evaluate(() => {
        const getTextContent = (selector) => {
          const element = document.querySelector(selector);
          return element ? element.textContent.trim() : '';
        };
        
        const getTextArray = (selector) => {
          const elements = document.querySelectorAll(selector);
          return Array.from(elements).map(el => el.textContent.trim()).filter(text => text);
        };
        
        const getListItems = (containerSelector) => {
          const container = document.querySelector(containerSelector);
          if (!container) return [];
          const items = container.querySelectorAll('li, .text-container, p');
          return Array.from(items)
            .map(item => item.textContent.trim())
            .filter(text => text && text.length > 10);
        };
        
        // Extract job title
        const title = getTextContent('h1.job-title, h1[class*="title"], .job-detail-header h1, .profile_on_detail_page');
        
        // Extract company name
        const company = getTextContent('.company-name, .company_name, .company-details .company, [class*="company"]');
        
        // Extract location
        const location = getTextContent('.location, .job-location, [class*="location"]');
        
        // Extract salary/CTC
        const salaryText = getTextContent('.salary, .ctc, [class*="salary"], [class*="ctc"]');
        
        // Extract experience
        const experienceText = getTextContent('.experience, [class*="experience"]');
        let experienceMin = 0, experienceMax = 5;
        if (experienceText) {
          const expMatch = experienceText.match(/(\d+)\s*(?:to|-)?\s*(\d+)?/);
          if (expMatch) {
            experienceMin = parseInt(expMatch[1]) || 0;
            experienceMax = parseInt(expMatch[2]) || parseInt(expMatch[1]) || 5;
          }
        }
        
        // Extract start date
        const startDate = getTextContent('.start-date, [class*="start"], .job-start-date') || 'Immediately';
        
        // Extract apply by date
        const applyByText = getTextContent('.apply-by, .deadline, [class*="deadline"], [class*="apply"]');
        let applicationDeadline = null;
        if (applyByText) {
          try {
            // Try to parse date
            const dateMatch = applyByText.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s']*(\d{2,4})/i);
            if (dateMatch) {
              const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
              const month = months.indexOf(dateMatch[2].toLowerCase());
              const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
              applicationDeadline = new Date(year, month, parseInt(dateMatch[1]));
            }
          } catch (e) {}
        }
        
        // Extract skills
        const skills = [];
        const skillElements = document.querySelectorAll('.skill, .skill-tag, [class*="skill"] span, .tags span, .job-skills span');
        skillElements.forEach(el => {
          const skillText = el.textContent.trim();
          if (skillText && skillText.length < 50) {
            skills.push(skillText);
          }
        });
        
        // Utility: find a section by heading text (case-insensitive contains)
        const getSectionByHeading = (needle) => {
          const nodes = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
          const match = nodes.find(h => (h.textContent || '').toLowerCase().includes(needle.toLowerCase()));
          if (!match) return null;
          // climb to a reasonable container wrapping section content
          let node = match;
          for (let i = 0; i < 6 && node && node.parentElement; i++) {
            node = node.parentElement;
            const headingCount = node.querySelectorAll('h1, h2, h3, h4').length;
            if (headingCount >= 1 && node.children.length >= 2) {
              return node;
            }
          }
          return match.parentElement || match;
        };

        // Extract about the job / job description
        let aboutSection = document.querySelector('.job-description, .about-job, [class*="description"], .job-detail-section');
        if (!aboutSection) {
          aboutSection = getSectionByHeading('About the job');
        }
        let description = '';
        let descriptionHtml = '';
        let fullDetailsHtml = '';
        if (aboutSection) {
          // Get all text content from description section
          const paragraphs = aboutSection.querySelectorAll('p, .text-container, div');
          description = Array.from(paragraphs)
            .map(p => p.textContent.trim())
            .filter(text => text && text.length > 20)
            .join('\n\n');
          
          if (!description) {
            description = aboutSection.textContent.trim();
          }
          // Preserve the full HTML for exact rendering
          // Clone node to avoid mutating original and remove scripts/styles for safety on backend storage
          const clone = aboutSection.cloneNode(true);
          clone.querySelectorAll('script, style, noscript').forEach(n => n.remove());
          descriptionHtml = clone.innerHTML.trim();
        }

        // Try to capture the entire details container similar to Internshala's structure
        // Strategy: prefer a section that contains the heading "About the job" and its sibling sections (skills, who can apply, salary, etc.)
        const findContainerFromHeading = () => {
          const container = getSectionByHeading('About the job');
          if (container) {
            const clone = container.cloneNode(true);
            clone.querySelectorAll('script, style, noscript').forEach(n => n.remove());
            return clone.innerHTML.trim();
          }
          return '';
        };

        fullDetailsHtml = findContainerFromHeading();

        // Fallbacks for overall container if heading-based failed
        if (!fullDetailsHtml) {
          const selectors = [
            '.detail_container',
            '.job-details',
            '.internship_details',
            '.job-details-container',
            'main .container',
            'main',
            '#content',
            'article'
          ];
          for (const sel of selectors) {
            const container = document.querySelector(sel);
            if (container) {
              const dc = container.cloneNode(true);
              dc.querySelectorAll('header, footer, nav, script, style, noscript').forEach(n => n.remove());
              const html = dc.innerHTML.trim();
              if (html && html.length > 200) { fullDetailsHtml = html; break; }
            }
          }
        }
        
        // Extract key responsibilities
        const responsibilitiesSection = document.querySelector('.responsibilities, .key-responsibilities, [class*="responsibilit"]');
        const keyResponsibilities = getListItems('.responsibilities, .key-responsibilities, [class*="responsibilit"]');
        
        // Extract requirements
        const requirementsSection = document.querySelector('.requirements, .job-requirements, [class*="requirement"]');
        const requirements = getListItems('.requirements, .job-requirements, [class*="requirement"]');
        
        // Extract other requirements
        const otherRequirementsSection = document.querySelector('.other-requirements, [class*="other-requirement"]');
        const otherRequirements = getListItems('.other-requirements, [class*="other-requirement"]');
        
        // Extract work environment requirements
        const workEnvSection = document.querySelector('.work-environment, [class*="work-env"], [class*="environment"]');
        const workEnvironmentRequirements = getListItems('.work-environment, [class*="work-env"], [class*="environment"]');
        
        // Extract education qualifications
        const educationSection = document.querySelector('.education, .qualification, [class*="education"], [class*="qualification"]');
        const educationQualifications = getListItems('.education, .qualification, [class*="education"], [class*="qualification"]');
        
        // Extract why company / benefits
        const whyCompanySection = document.querySelector('.why-company, .benefits, [class*="benefit"], [class*="why"]');
        const whyCompany = getListItems('.why-company, .benefits, [class*="benefit"], [class*="why"]');
        
        // Extract company description
        const companyDescription = getTextContent('.company-description, .about-company, [class*="company-description"]');
        
        // Parse salary
        let salaryMin = null, salaryMax = null, annualCTCMin = null, annualCTCMax = null;
        if (salaryText) {
          // Try to extract salary range (e.g., "₹ 18,00,000 - 21,60,000")
          const salaryMatch = salaryText.match(/₹?\s*([\d,]+)\s*(?:-|to)\s*₹?\s*([\d,]+)/);
          if (salaryMatch) {
            const min = parseInt(salaryMatch[1].replace(/,/g, ''));
            const max = parseInt(salaryMatch[2].replace(/,/g, ''));
            // If it's in lakhs, convert to actual number
            if (salaryText.includes('LPA') || salaryText.includes('lakh')) {
              annualCTCMin = min * 100000;
              annualCTCMax = max * 100000;
            } else {
              annualCTCMin = min;
              annualCTCMax = max;
            }
          } else {
            // Single value
            const singleMatch = salaryText.match(/₹?\s*([\d,]+)/);
            if (singleMatch) {
              const value = parseInt(singleMatch[1].replace(/,/g, ''));
              if (salaryText.includes('LPA') || salaryText.includes('lakh')) {
                annualCTCMin = value * 100000;
                annualCTCMax = value * 100000;
              } else {
                annualCTCMin = value;
                annualCTCMax = value;
              }
            }
          }
        }
        
        return {
          title,
          company,
          location,
          description,
          descriptionHtml,
          fullDetailsHtml,
          salaryText,
          salaryMin,
          salaryMax,
          annualCTCMin,
          annualCTCMax,
          experienceMin,
          experienceMax,
          startDate,
          applicationDeadline,
          skills: [...new Set(skills)], // Remove duplicates
          keyResponsibilities,
          requirements,
          otherRequirements,
          workEnvironmentRequirements,
          educationQualifications,
          whyCompany,
          companyDescription
        };
      });
      
      return jobDetails;
    } catch (error) {
      logger.error(`Error scraping job details from ${jobUrl}:`, error.message);
      return null;
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
        // Check if scraping should stop
        if (this.shouldStop) {
          logger.info('Scraping stopped during Internshala jobs scraping');
          break;
        }
        
        const url = `https://internshala.com/jobs/page-${pageNum}`;
        
        try {
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
          
          // Check stop flag again after navigation
          if (this.shouldStop) {
            logger.info('Scraping stopped after page navigation');
            break;
          }
          
          // Wait for job listings to load
          await page.waitForSelector('.internship_meta, .job-card, [class*="job"]', { timeout: 10000 });
          
          const pageJobs = await page.evaluate(() => {
            const jobElements = document.querySelectorAll('.internship_meta, .job-card, [class*="job-card"]');
            const jobs = [];
            
            jobElements.forEach((element) => {
              try {
                const titleElement = element.querySelector('.company a, .profile_on_detail_page, h3, .job-title, a[href*="/job/"]');
                const companyElement = element.querySelector('.company a, .profile_on_detail_page, .company-name, .company');
                const locationElement = element.querySelector('.location_link, .location, [class*="location"]');
                const stipendElement = element.querySelector('.stipend, .salary, [class*="salary"]');
                const linkElement = element.querySelector('a[href*="/job/"], a[href*="/internship/"]');
                
                if (titleElement && linkElement) {
                  let jobUrl = linkElement.href;
                  if (!jobUrl.startsWith('http')) {
                    jobUrl = 'https://internshala.com' + jobUrl;
                  }
                  
                  // Extract sourceId more reliably
                  let sourceId = '';
                  // Try to extract from URL - Internshala format: /job/detail/...-{id}
                  const urlParts = jobUrl.split('/');
                  const detailIndex = urlParts.findIndex(part => part === 'detail');
                  if (detailIndex !== -1 && urlParts[detailIndex + 1]) {
                    // Get the part after 'detail' and remove query params
                    sourceId = urlParts[detailIndex + 1].split('?')[0].split('#')[0];
                  } else {
                    // Fallback: use last part of URL
                    sourceId = urlParts[urlParts.length - 1].split('?')[0].split('#')[0];
                  }
                  
                  // If still empty, generate from URL hash
                  if (!sourceId || sourceId.length < 3) {
                    sourceId = Buffer.from(jobUrl).toString('base64').substring(0, 50);
                  }
                  
                  const job = {
                    title: titleElement.textContent?.trim() || '',
                    company: companyElement?.textContent?.trim() || '',
                    location: locationElement?.textContent?.trim() || '',
                    salary: stipendElement?.textContent?.trim() || '',
                    url: jobUrl,
                    sourceId: sourceId
                  };
                  
                  if (job.title && job.url && job.sourceId) {
                    jobs.push(job);
                  }
                }
              } catch (error) {
                console.error('Error parsing job element:', error);
              }
            });
            
            return jobs;
          });
          
          logger.info(`Found ${pageJobs.length} jobs on Internshala page ${pageNum}, now scraping details...`);
          
          // Scrape detailed information for each job
          for (let i = 0; i < pageJobs.length; i++) {
            // Check if scraping should stop
            if (this.shouldStop) {
              logger.info('Scraping stopped during job details scraping');
              break;
            }
            
            const jobData = pageJobs[i];
            try {
              logger.info(`Scraping details for job ${i + 1}/${pageJobs.length}: ${jobData.title}`);
              
              const jobDetails = await this.scrapeInternshalaJobDetails(jobData.url, page);
              
              // Check stop flag after scraping job details
              if (this.shouldStop) {
                logger.info('Scraping stopped after scraping job details');
                break;
              }
              
              if (jobDetails && jobDetails.title) {
                // Merge basic info with detailed info
                const fullJobData = {
                  ...jobData,
                  ...jobDetails,
                  // Use scraped title and company if available, otherwise use basic info
                  title: jobDetails.title || jobData.title,
                  company: jobDetails.company || jobData.company,
                  location: jobDetails.location || jobData.location,
                };
                
                // Save immediately to database
                const saveResult = await this.saveJobToDatabase(fullJobData, 'internshala');
                if (saveResult.saved) {
                  jobs.push(fullJobData); // Keep in array for return count
                }
              } else {
                // If detail scraping failed, use basic info and save immediately
                const saveResult = await this.saveJobToDatabase(jobData, 'internshala');
                if (saveResult.saved) {
                  jobs.push(jobData);
                }
              }
              
              // Add delay between detail page requests
              await page.waitForTimeout(3000);
            } catch (error) {
              logger.error(`Error scraping job details for ${jobData.url}:`, error.message);
              // Still try to save basic job info
              const saveResult = await this.saveJobToDatabase(jobData, 'internshala');
              if (saveResult.saved) {
                jobs.push(jobData);
              }
            }
          }
          
          logger.info(`Scraped ${pageJobs.length} jobs from Internshala page ${pageNum}`);
          
          // Add delay between listing page requests
          await page.waitForTimeout(2000);
          
        } catch (error) {
          logger.error(`Error scraping Internshala page ${pageNum}:`, error.message);
          break;
        }
      }
      
      await page.close();
      
      // Save jobs to database
      let savedCount = 0;
      let errorCount = 0;
      
      for (const jobData of jobs) {
        try {
          // Validate required fields
          if (!jobData.title || !jobData.sourceId || !jobData.url) {
            logger.warn(`Skipping job with missing required fields: ${jobData.title || 'No title'}`);
            errorCount++;
            continue;
          }
          
          // Ensure sourceId is valid (required and unique)
          if (!jobData.sourceId || jobData.sourceId.length < 3) {
            logger.warn(`Invalid sourceId for job: ${jobData.title}, generating new one`);
            jobData.sourceId = Buffer.from(jobData.url).toString('base64').substring(0, 50);
          }
          
          // Build description from available data
          let description = jobData.description || '';
          if (!description || description.trim().length < 20) {
            // Build description from other fields
            const descParts = [];
            if (jobData.keyResponsibilities && jobData.keyResponsibilities.length > 0) {
              descParts.push('Key Responsibilities:\n' + jobData.keyResponsibilities.join('\n'));
            }
            if (jobData.requirements && jobData.requirements.length > 0) {
              descParts.push('Requirements:\n' + jobData.requirements.join('\n'));
            }
            if (jobData.skills && jobData.skills.length > 0) {
              descParts.push('Required Skills: ' + jobData.skills.join(', '));
            }
            description = descParts.length > 0 
              ? descParts.join('\n\n') 
              : `${jobData.title} position at ${jobData.company || 'a company'}. ${jobData.location ? `Location: ${jobData.location}.` : ''}`;
          }
          
          const jobToSave = {
            title: jobData.title.trim(),
            company: (jobData.company || 'Unknown Company').trim(),
            location: (jobData.location || 'Not specified').trim(),
            description: description.trim(),
            descriptionHtml: (jobData.descriptionHtml || '').trim(),
            fullDetailsHtml: (jobData.fullDetailsHtml || '').trim(),
            category: 'Technology', // Default category
            jobType: 'private',
            status: 'active',
            source: 'internshala',
            sourceUrl: jobData.url,
            sourceId: jobData.sourceId.trim(),
            lastScraped: new Date(),
            
            // Salary information
            salary: {
              text: jobData.salaryText || jobData.salary || null,
              min: jobData.salaryMin || null,
              max: jobData.salaryMax || null,
              annualCTCMin: jobData.annualCTCMin || null,
              annualCTCMax: jobData.annualCTCMax || null,
              currency: 'INR',
              period: 'yearly'
            },
            
            // Experience
            experience: {
              min: jobData.experienceMin || 0,
              max: jobData.experienceMax || 5
            },
            
            // Skills
            skills: (jobData.skills || []).filter(s => s && s.trim().length > 0),
            
            // Detailed sections
            keyResponsibilities: (jobData.keyResponsibilities || []).filter(r => r && r.trim().length > 0),
            requirements: (jobData.requirements || []).filter(r => r && r.trim().length > 0),
            otherRequirements: (jobData.otherRequirements || []).filter(r => r && r.trim().length > 0),
            workEnvironmentRequirements: (jobData.workEnvironmentRequirements || []).filter(r => r && r.trim().length > 0),
            educationQualifications: (jobData.educationQualifications || []).filter(q => q && q.trim().length > 0),
            whyCompany: (jobData.whyCompany || []).filter(w => w && w.trim().length > 0),
            
            // Dates
            startDate: jobData.startDate || 'Immediately',
            applicationDeadline: jobData.applicationDeadline || null,
            
            // Company details
            companyDetails: {
              description: (jobData.companyDescription || '').trim()
            }
          };
          
          const savedJob = await ScrapedJob.findOneAndUpdate(
            { source: 'internshala', sourceId: jobToSave.sourceId },
            jobToSave,
            { upsert: true, new: true, runValidators: true }
          );
          
          if (savedJob) {
            savedCount++;
            logger.debug(`Saved job: ${savedJob.title} (${savedJob._id})`);
          } else {
            logger.warn(`Failed to save job: ${jobToSave.title}`);
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          logger.error(`Error saving Internshala job "${jobData.title}":`, error.message);
          logger.error('Full error:', error);
          // Log validation errors in detail
          if (error.name === 'ValidationError') {
            logger.error('Validation errors:', JSON.stringify(error.errors, null, 2));
          }
        }
      }
      
      logger.info(`Saved ${savedCount} Internshala jobs, ${errorCount} errors`);
      
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
        // Check if scraping should stop
        if (this.shouldStop) {
          logger.info('Scraping stopped during Internshala internships scraping');
          break;
        }
        
        const url = `https://internshala.com/internships/page-${pageNum}`;
        
        try {
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
          
          // Check stop flag again after navigation
          if (this.shouldStop) {
            logger.info('Scraping stopped after page navigation');
            break;
          }
          
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
        // Check if scraping should stop
        if (this.shouldStop) {
          logger.info('Scraping stopped during Unstop jobs scraping');
          break;
        }
        
        const url = `https://unstop.com/jobs?page=${pageNum}`;
        
        try {
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
          
          // Check stop flag again after navigation
          if (this.shouldStop) {
            logger.info('Scraping stopped after page navigation');
            break;
          }
          
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
                
                if (titleElement && companyElement && linkElement) {
                  let jobUrl = linkElement.href;
                  if (!jobUrl.startsWith('http')) {
                    jobUrl = 'https://unstop.com' + jobUrl;
                  }
                  
                  // Extract sourceId more reliably
                  let sourceId = '';
                  const urlParts = jobUrl.split('/');
                  // Try to get ID from URL
                  const lastPart = urlParts[urlParts.length - 1].split('?')[0].split('#')[0];
                  if (lastPart && lastPart.length > 3) {
                    sourceId = lastPart;
                  } else {
                    // Generate from URL hash
                    sourceId = Buffer.from(jobUrl).toString('base64').substring(0, 50);
                  }
                  
                  const job = {
                    title: titleElement.textContent?.trim() || '',
                    company: companyElement.textContent?.trim() || '',
                    location: locationElement?.textContent?.trim() || '',
                    salary: salaryElement?.textContent?.trim() || '',
                    url: jobUrl,
                    sourceId: sourceId
                  };
                  
                  if (job.title && job.company && job.url && job.sourceId) {
                    jobs.push(job);
                  }
                }
              } catch (error) {
                console.error('Error parsing Unstop job element:', error);
              }
            });
            
            return jobs;
          });
          
          // Save jobs immediately as they are found
          for (const jobData of pageJobs) {
            if (this.shouldStop) {
              logger.info('Scraping stopped during Unstop jobs saving');
              break;
            }
            
            // Save each job immediately
            const saveResult = await this.saveJobToDatabase(jobData, 'unstop');
            if (saveResult.saved) {
              jobs.push(jobData); // Keep for count
            }
          }
          
          logger.info(`Scraped and saved ${pageJobs.length} jobs from Unstop page ${pageNum}`);
          
          await page.waitForTimeout(2000);
          
        } catch (error) {
          logger.error(`Error scraping Unstop page ${pageNum}:`, error.message);
          break;
        }
      }
      
      await page.close();
      
      // Jobs are already saved incrementally, just return count
      const savedCount = jobs.length;
      logger.info(`Completed Unstop jobs scraping. Total processed: ${savedCount}`);
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
        // Check if scraping should stop
        if (this.shouldStop) {
          logger.info('Scraping stopped during Unstop internships scraping');
          break;
        }
        
        const url = `https://unstop.com/internships?page=${pageNum}`;
        
        try {
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
          
          // Check stop flag again after navigation
          if (this.shouldStop) {
            logger.info('Scraping stopped after page navigation');
            break;
          }
          
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
      return { message: 'Scraping already in progress' };
    }

    this.isScraping = true;
    this.resetStopFlag(); // Reset stop flag when starting
    const results = {};

    try {
      logger.info('Starting full scraping process...');
      
      // Check stop flag before each operation
      if (this.shouldStop) {
        logger.info('Scraping stopped by user');
        return { message: 'Scraping stopped', results: {} };
      }
      
      // Scrape all sources (with stop checks)
      if (!this.shouldStop) {
        results.internshalaJobs = await this.scrapeInternshalaJobs();
      }
      
      if (!this.shouldStop) {
        results.internshalaInternships = await this.scrapeInternshalaInternships();
      }
      
      if (!this.shouldStop) {
        results.unstopJobs = await this.scrapeUnstopJobs();
      }
      
      if (!this.shouldStop) {
        results.unstopInternships = await this.scrapeUnstopInternships();
      }
      
      // Mark old entries as expired (only if not stopped)
      if (!this.shouldStop) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        await ScrapedJob.updateMany(
          { lastScraped: { $lt: sevenDaysAgo }, status: 'active' },
          { status: 'expired' }
        );
        
        await ScrapedInternship.updateMany(
          { lastScraped: { $lt: sevenDaysAgo }, status: 'active' },
          { status: 'expired' }
        );
      }
      
      if (this.shouldStop) {
        logger.info('Scraping stopped by user');
        return { message: 'Scraping stopped', results };
      }
      
      logger.info('Scraping completed successfully:', results);
      
    } catch (error) {
      if (this.shouldStop) {
        logger.info('Scraping stopped by user (during error)');
        return { message: 'Scraping stopped', results };
      }
      logger.error('Error during scraping process:', error);
      throw error;
    } finally {
      this.isScraping = false;
      await this.closeBrowser();
    }

    return results;
  }

  // Get scraping status
  getScrapingStatus() {
    return {
      isScraping: this.isScraping,
      shouldStop: this.shouldStop,
      hasBrowser: !!this.browser
    };
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
