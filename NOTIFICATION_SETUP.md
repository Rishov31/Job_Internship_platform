# Notification Feature Setup Guide

This guide explains how to set up and use the notification feature in the Job/Internship Platform.

## Features Implemented

### For Job Seekers (Candidates)
- ✅ Job Alerts (new jobs matching skills/preferences)
- ✅ Application Updates (submitted, viewed, shortlisted, rejected, accepted)
- ✅ Interview Scheduled & Reminders
- ✅ Profile Notifications (incomplete profile, profile viewed)
- ✅ Account/General (password change, login alerts, feature updates)

### For Employers / Recruiters
- ✅ Applicant Notifications (new application, interview responses)
- ✅ Job Post Notifications (published, expiring soon)
- ✅ General (subscription reminders, platform announcements)

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install nodemailer
```

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=Job Platform

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

**Note for Gmail:**
- You need to use an "App Password" instead of your regular password
- Enable 2-Step Verification in your Google Account
- Generate an App Password: https://myaccount.google.com/apppasswords

### 3. Database

The notification feature uses MongoDB. The Notification model will be created automatically when you start the server.

## Backend API Endpoints

### Get Notifications
```
GET /api/notifications
Query params:
- limit: number (default: 50)
- skip: number (default: 0)
- isRead: boolean (optional)
- type: string (optional)
- sortBy: string (default: 'createdAt')
- sortOrder: 'asc' | 'desc' (default: 'desc')
```

### Get Unread Count
```
GET /api/notifications/unread-count
```

### Mark as Read
```
PATCH /api/notifications/:notificationId/read
```

### Mark All as Read
```
PATCH /api/notifications/read-all
```

### Delete Notification
```
DELETE /api/notifications/:notificationId
```

### Delete All Read Notifications
```
DELETE /api/notifications/read/all
```

## Frontend Components

### NotificationBell Component
A bell icon component that shows unread count and displays notifications in a dropdown.

**Usage:**
```jsx
import NotificationBell from '../components/NotificationBell';

<NotificationBell />
```

### Notifications Page
A full page to view and manage all notifications.

**Route:** `/notifications`

## Integration Points

### Application Status Updates
When an employer updates an application status, notifications are automatically created:
- `application_reviewing`
- `application_shortlisted`
- `application_interview`
- `application_rejected`
- `application_accepted`

### Job Posting
When a job is posted:
- Employer receives `job_published` notification
- Job seekers matching criteria can receive `job_alert` notifications (future enhancement)

### Job Expiry
A scheduled job runs daily at 9 AM to check for jobs expiring in the next 3 days and sends `job_expiring_soon` notifications to employers.

## Scheduled Jobs

The scheduler service includes:
- Daily job expiry check (9 AM)
- Daily scraping (2 AM)
- Weekly cleanup (3 AM Sundays)

## Email Notifications

Email notifications are sent automatically when:
- A notification is created (if email service is configured)
- The notification type has an email template

Email templates are available for:
- Job alerts
- Application status updates
- Interview scheduling
- Profile completion reminders
- Job expiry warnings
- New application notifications

## Testing

### Test Notification Creation
```javascript
// In your backend code or via API
const notificationService = require('./src/services/notificationService');

await notificationService.createNotification({
  userId: 'user-id',
  type: 'application_shortlisted',
  title: 'Application Shortlisted',
  message: 'Your application has been shortlisted!',
  relatedJob: 'job-id',
  relatedApplication: 'application-id',
  priority: 'high',
});
```

### Test Email Service
```javascript
const emailService = require('./src/services/emailService');

await emailService.sendEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<h1>Test</h1>',
});
```

## Troubleshooting

### Email Not Sending
1. Check SMTP credentials in `.env`
2. Verify SMTP settings (host, port, secure)
3. For Gmail, ensure App Password is used (not regular password)
4. Check server logs for email errors

### Notifications Not Appearing
1. Verify user authentication
2. Check database connection
3. Verify notification creation in logs
4. Check frontend API calls in browser console

### Scheduled Jobs Not Running
1. Verify scheduler is initialized in `app.js`
2. Check server logs for scheduler errors
3. Verify MongoDB connection

## Future Enhancements

- Real-time notifications using WebSockets
- Push notifications for mobile
- Notification preferences/settings
- Email notification preferences
- Job alert preferences based on skills/location
- Batch notification sending optimization

## Support

For issues or questions, check:
- Server logs in `backend/src/utils/logger.js`
- Browser console for frontend errors
- MongoDB for notification records

