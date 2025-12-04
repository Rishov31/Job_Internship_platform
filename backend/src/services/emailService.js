const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.init();
  }

  init() {
    try {
      // Email configuration from environment variables
      const emailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      };

      // Only configure if credentials are provided
      if (emailConfig.auth.user && emailConfig.auth.pass) {
        this.transporter = nodemailer.createTransport(emailConfig);
        this.isConfigured = true;
        logger.info('Email service configured successfully');
      } else {
        logger.warn('Email service not configured - SMTP credentials missing. Email notifications will be disabled.');
        this.isConfigured = false;
      }
    } catch (error) {
      logger.error('Error initializing email service:', error.message);
      this.isConfigured = false;
    }
  }

  async sendEmail({ to, subject, html, text }) {
    if (!this.isConfigured || !this.transporter) {
      logger.warn('Email service not configured. Skipping email send.');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'Job Platform'}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Error sending email to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Notification email templates
  getJobAlertEmail(job, user) {
    return {
      subject: `New Job Alert: ${job.title} at ${job.company}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .job-card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Job Alert!</h1>
            </div>
            <div class="content">
              <p>Hi ${user.fullName},</p>
              <p>We found a new job that matches your preferences:</p>
              <div class="job-card">
                <h2>${job.title}</h2>
                <p><strong>Company:</strong> ${job.company}</p>
                <p><strong>Location:</strong> ${job.location}</p>
                ${job.salary ? `<p><strong>Salary:</strong> ${job.salary.text || 'Not specified'}</p>` : ''}
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/jobs/${job._id}" class="button">View Job Details</a>
              </div>
              <p>Don't miss this opportunity!</p>
              <div class="footer">
                <p>You're receiving this because you have job alerts enabled.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }

  getApplicationStatusEmail(application, status, user) {
    const statusMessages = {
      submitted: 'Your application has been submitted successfully!',
      viewed: 'Your application has been viewed by the employer.',
      shortlisted: 'Congratulations! You have been shortlisted for this position.',
      interview: 'Great news! You have been selected for an interview.',
      rejected: 'Thank you for your interest. Unfortunately, your application was not selected.',
      accepted: 'Congratulations! Your application has been accepted!',
    };

    const statusEmojis = {
      submitted: '✅',
      viewed: '👀',
      shortlisted: '🎉',
      interview: '📅',
      rejected: '😔',
      accepted: '🎊',
    };

    return {
      subject: `${statusEmojis[status]} Application Update: ${application.job?.title || 'Your Application'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .status-card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${statusEmojis[status]} Application Update</h1>
            </div>
            <div class="content">
              <p>Hi ${user.fullName},</p>
              <p>${statusMessages[status]}</p>
              <div class="status-card">
                <h2>${application.job?.title || 'Job Application'}</h2>
                <p><strong>Company:</strong> ${application.job?.company || 'N/A'}</p>
                <p><strong>Status:</strong> <span style="text-transform: capitalize; font-weight: bold;">${status}</span></p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/jobseeker/applications" class="button">View Application</a>
              </div>
              <div class="footer">
                <p>Keep checking your dashboard for more updates!</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }

  getNewApplicationEmail(application, job, employer) {
    return {
      subject: `New Application Received: ${application.applicant?.fullName || 'Candidate'} for ${job.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .application-card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📥 New Application Received</h1>
            </div>
            <div class="content">
              <p>Hi ${employer.fullName},</p>
              <p>You have received a new application for your job posting:</p>
              <div class="application-card">
                <h2>${job.title}</h2>
                <p><strong>Applicant:</strong> ${application.applicant?.fullName || 'Candidate'}</p>
                <p><strong>Applied on:</strong> ${new Date(application.appliedAt).toLocaleDateString()}</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/employer/applications/${application._id}" class="button">Review Application</a>
              </div>
              <div class="footer">
                <p>Don't forget to review and respond to candidates promptly!</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }

  getInterviewScheduledEmail(interview, user) {
    return {
      subject: `Interview Scheduled: ${interview.job?.title || 'Your Interview'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .interview-card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Interview Scheduled</h1>
            </div>
            <div class="content">
              <p>Hi ${user.fullName},</p>
              <p>An interview has been scheduled for you:</p>
              <div class="interview-card">
                <h2>${interview.job?.title || 'Interview'}</h2>
                <p><strong>Company:</strong> ${interview.job?.company || 'N/A'}</p>
                <p><strong>Date:</strong> ${interview.date ? new Date(interview.date).toLocaleDateString() : 'TBD'}</p>
                <p><strong>Time:</strong> ${interview.time || 'TBD'}</p>
                ${interview.location ? `<p><strong>Location:</strong> ${interview.location}</p>` : ''}
                ${interview.notes ? `<p><strong>Notes:</strong> ${interview.notes}</p>` : ''}
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/jobseeker/applications" class="button">View Details</a>
              </div>
              <p>Good luck with your interview!</p>
              <div class="footer">
                <p>We'll send you a reminder 24 hours before the interview.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }

  getProfileIncompleteEmail(user, completionPercentage) {
    return {
      subject: `Complete Your Profile - ${completionPercentage}% Complete`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .progress-bar { background: #e0e0e0; height: 30px; border-radius: 15px; overflow: hidden; margin: 20px 0; }
            .progress-fill { background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 Complete Your Profile</h1>
            </div>
            <div class="content">
              <p>Hi ${user.fullName},</p>
              <p>Your profile is ${completionPercentage}% complete. Complete your profile to increase your visibility to employers!</p>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${completionPercentage}%">${completionPercentage}%</div>
              </div>
              <p>Complete your profile to:</p>
              <ul>
                <li>Get more job recommendations</li>
                <li>Increase your chances of being noticed by employers</li>
                <li>Access all platform features</li>
              </ul>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/jobseeker/profile" class="button">Complete Profile</a>
              <div class="footer">
                <p>A complete profile helps employers find you!</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }

  getJobExpiringEmail(job, employer) {
    return {
      subject: `Job Post Expiring Soon: ${job.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .job-card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .button { display: inline-block; padding: 12px 30px; background: #f59e0b; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Job Post Expiring Soon</h1>
            </div>
            <div class="content">
              <p>Hi ${employer.fullName},</p>
              <p>Your job post is expiring soon. Consider extending the deadline to get more applications:</p>
              <div class="job-card">
                <h2>${job.title}</h2>
                <p><strong>Company:</strong> ${job.company}</p>
                <p><strong>Location:</strong> ${job.location}</p>
                <p><strong>Applications:</strong> ${job.applicationsCount || 0}</p>
                <p><strong>Expires:</strong> ${job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'Soon'}</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/employer/jobs/${job._id}/edit" class="button">Extend Deadline</a>
              </div>
              <div class="footer">
                <p>Don't miss out on great candidates!</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }
}

module.exports = new EmailService();

