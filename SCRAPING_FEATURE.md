# Job and Internship Scraping Feature

This document describes the new scraping feature that automatically collects jobs and internships from external platforms (Internshala and Unstop) and integrates them with your existing job platform.

## Features

### 🔍 **Automatic Data Collection**
- **Daily Scraping**: Automatically scrapes jobs and internships every day at 2 AM
- **Multiple Sources**: Collects data from Internshala and Unstop platforms
- **Smart Deduplication**: Prevents duplicate entries using source-specific IDs

### 📊 **Combined Dashboard**
- **Unified View**: Users see both platform jobs and scraped jobs in one place
- **Source Indicators**: Clear badges showing whether jobs are from your platform or external sources
- **External Links**: Direct links to original job postings on external platforms

### 🛠️ **Admin Management**
- **Scheduler Control**: Start/stop automatic scraping
- **Manual Triggering**: Run scraping on-demand
- **Statistics Dashboard**: View scraping statistics and data health
- **Cleanup Tools**: Remove expired data automatically

## Architecture

### Backend Components

#### Models
- `ScrapedJob`: Stores scraped job data with source information
- `ScrapedInternship`: Stores scraped internship data with source information

#### Services
- `ScraperService`: Handles web scraping logic for both platforms
- `SchedulerService`: Manages cron jobs for automatic scraping

#### Controllers
- `JobController`: Updated to include scraped jobs in listings
- `InternshipController`: Updated to include scraped internships in listings
- `ScraperController`: Admin interface for scraper management

### Frontend Components

#### Updated Components
- `JobSeekerJobList`: Shows combined jobs with source badges
- `InternshipList`: Shows combined internships with source badges
- `AdminDashboard`: New scraper management tab

#### New API Functions
- `internshipApi.js`: Complete internship management API
- `scraperApi.js`: Admin scraper control API

## Data Flow

1. **Automatic Scraping**: Scheduler runs daily at 2 AM
2. **Data Collection**: Scrapers collect jobs/internships from external platforms
3. **Data Storage**: New entries are saved to MongoDB with source tracking
4. **Data Merging**: Frontend combines platform jobs with scraped jobs
5. **User Display**: Users see unified job listings with source indicators

## Configuration

### Environment Variables
Make sure your `.env` file includes:
```
MONGODB_URI=your_mongodb_connection_string
```

### Dependencies Added
- `axios`: HTTP client for API requests
- `cheerio`: HTML parsing for web scraping
- `puppeteer`: Browser automation for dynamic content
- `node-cron`: Task scheduling

## Usage

### For Users
1. Navigate to `/jobseeker/jobs` or `/jobseeker/internships`
2. View combined listings from all sources
3. Use source badges to identify job origin
4. Click external links to apply on original platforms

### For Admins
1. Access admin dashboard at `/admin/dashboard`
2. Go to "Scraper" tab
3. Monitor scraping statistics
4. Start/stop scheduler as needed
5. Trigger manual scraping when required

## API Endpoints

### Public Endpoints
- `GET /api/jobs?includeScraped=true` - Get jobs including scraped data
- `GET /api/internships?includeScraped=true` - Get internships including scraped data

### Admin Endpoints
- `GET /api/scraper/stats` - Get scraping statistics
- `POST /api/scraper/trigger` - Trigger manual scraping
- `POST /api/scraper/scheduler/start` - Start scheduler
- `POST /api/scraper/scheduler/stop` - Stop scheduler
- `GET /api/scraper/scheduler/status` - Get scheduler status
- `POST /api/scraper/cleanup` - Cleanup expired data

## Data Management

### Automatic Cleanup
- **Expired Data**: Jobs/internships older than 7 days are marked as expired
- **Weekly Cleanup**: Data older than 30 days is automatically deleted
- **Storage Optimization**: Prevents database bloat from old scraped data

### Data Quality
- **Validation**: Only valid jobs/internships with required fields are saved
- **Error Handling**: Failed scraping attempts are logged but don't break the system
- **Retry Logic**: Built-in retry mechanisms for failed requests

## Monitoring

### Logs
- All scraping activities are logged with timestamps
- Error logs help identify and fix scraping issues
- Performance metrics track scraping efficiency

### Statistics
- Total scraped jobs and internships by source
- Active vs expired data counts
- Scheduler status and last run times

## Troubleshooting

### Common Issues

1. **Scraping Fails**
   - Check internet connection
   - Verify target websites are accessible
   - Review browser automation logs

2. **No Data Appearing**
   - Ensure scheduler is running
   - Check MongoDB connection
   - Verify scraper routes are accessible

3. **Performance Issues**
   - Monitor database size
   - Run cleanup operations
   - Adjust scraping frequency if needed

### Support
For issues or questions about the scraping feature, check the logs and admin dashboard statistics first. The system is designed to be self-healing and will retry failed operations automatically.

## Future Enhancements

Potential improvements for the scraping system:
- Add more job platforms (LinkedIn, Indeed, etc.)
- Implement machine learning for job categorization
- Add email notifications for new job matches
- Create advanced filtering based on scraped data
- Implement user preferences for job sources
