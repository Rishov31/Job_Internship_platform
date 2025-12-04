const Notification = require('../models/Notification');
const User = require('../models/User');
const emailService = require('./emailService');
const logger = require('../utils/logger');

class NotificationService {
  /**
   * Create a notification for a user
   * @param {Object} options - Notification options
   * @param {String} options.userId - User ID to notify
   * @param {String} options.type - Notification type
   * @param {String} options.title - Notification title
   * @param {String} options.message - Notification message
   * @param {Object} options.metadata - Additional metadata
   * @param {String} options.priority - Priority level (low, medium, high, urgent)
   * @param {String} options.relatedJob - Related job ID (optional)
   * @param {String} options.relatedApplication - Related application ID (optional)
   * @param {String} options.relatedUser - Related user ID (optional)
   * @param {Boolean} options.sendEmail - Whether to send email notification (default: true)
   */
  async createNotification({
    userId,
    type,
    title,
    message,
    metadata = {},
    priority = 'medium',
    relatedJob = null,
    relatedApplication = null,
    relatedUser = null,
    sendEmail = true,
  }) {
    try {
      // Create notification in database
      const notification = await Notification.create({
        user: userId,
        type,
        title,
        message,
        metadata,
        priority,
        relatedJob,
        relatedApplication,
        relatedUser,
      });

      // Send email notification if requested
      if (sendEmail) {
        await this.sendEmailNotification(notification);
      }

      logger.info(`Notification created: ${type} for user ${userId}`);
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error.message);
      throw error;
    }
  }

  /**
   * Send email notification for a notification
   */
  async sendEmailNotification(notification) {
    try {
      const user = await User.findById(notification.user);
      if (!user || !user.email) {
        logger.warn(`Cannot send email: user ${notification.user} not found or has no email`);
        return;
      }

      let emailTemplate = null;

      // Get appropriate email template based on notification type
      switch (notification.type) {
        case 'job_alert':
          if (notification.relatedJob) {
            const Job = require('../models/Job');
            const ScrapedJob = require('../models/ScrapedJob');
            let job = await Job.findById(notification.relatedJob);
            if (!job) {
              job = await ScrapedJob.findById(notification.relatedJob);
            }
            if (job) {
              emailTemplate = emailService.getJobAlertEmail(job, user);
            }
          }
          break;

        case 'application_submitted':
        case 'application_viewed':
        case 'application_shortlisted':
        case 'application_rejected':
        case 'application_accepted':
          if (notification.relatedApplication) {
            const Application = require('../models/Application');
            const application = await Application.findById(notification.relatedApplication)
              .populate('job')
              .populate('applicant');
            if (application) {
              const status = notification.type.replace('application_', '');
              emailTemplate = emailService.getApplicationStatusEmail(application, status, user);
            }
          }
          break;

        case 'new_application':
          if (notification.relatedApplication && notification.relatedJob) {
            const Application = require('../models/Application');
            const Job = require('../models/Job');
            const application = await Application.findById(notification.relatedApplication)
              .populate('applicant');
            const job = await Job.findById(notification.relatedJob);
            if (application && job) {
              emailTemplate = emailService.getNewApplicationEmail(application, job, user);
            }
          }
          break;

        case 'interview_scheduled':
        case 'interview_reminder':
          if (notification.metadata.interview) {
            emailTemplate = emailService.getInterviewScheduledEmail(notification.metadata.interview, user);
          }
          break;

        case 'profile_incomplete':
          if (notification.metadata.completionPercentage !== undefined) {
            emailTemplate = emailService.getProfileIncompleteEmail(user, notification.metadata.completionPercentage);
          }
          break;

        case 'job_expiring_soon':
          if (notification.relatedJob) {
            const Job = require('../models/Job');
            const job = await Job.findById(notification.relatedJob);
            if (job) {
              emailTemplate = emailService.getJobExpiringEmail(job, user);
            }
          }
          break;

        default:
          // Generic email template for other notification types
          emailTemplate = {
            subject: notification.title,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                  .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>${notification.title}</h1>
                  </div>
                  <div class="content">
                    <p>Hi ${user.fullName},</p>
                    <p>${notification.message}</p>
                    <div class="footer">
                      <p>Visit your dashboard for more details.</p>
                    </div>
                  </div>
                </div>
              </body>
              </html>
            `,
          };
      }

      if (emailTemplate) {
        const result = await emailService.sendEmail({
          to: user.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });

        if (result.success) {
          notification.emailSent = true;
          notification.emailSentAt = new Date();
          await notification.save();
        }
      }
    } catch (error) {
      logger.error('Error sending email notification:', error.message);
      // Don't throw error - notification is still created even if email fails
    }
  }

  /**
   * Create notifications for multiple users (e.g., job alerts)
   */
  async createBulkNotifications(notifications) {
    try {
      const created = await Notification.insertMany(notifications);
      logger.info(`Created ${created.length} bulk notifications`);
      
      // Send emails asynchronously (don't wait)
      created.forEach(notification => {
        this.sendEmailNotification(notification).catch(err => {
          logger.error(`Error sending email for notification ${notification._id}:`, err.message);
        });
      });

      return created;
    } catch (error) {
      logger.error('Error creating bulk notifications:', error.message);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        limit = 50,
        skip = 0,
        isRead = null,
        type = null,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      const query = { user: userId };
      if (isRead !== null) query.isRead = isRead;
      if (type) query.type = type;

      const notifications = await Notification.find(query)
        .populate('relatedJob')
        .populate('relatedApplication')
        .populate('relatedUser', 'fullName email')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip));

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

      return {
        notifications,
        total,
        unreadCount,
        hasMore: skip + notifications.length < total,
      };
    } catch (error) {
      logger.error('Error getting user notifications:', error.message);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        user: userId,
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      if (!notification.isRead) {
        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();
      }

      return notification;
    } catch (error) {
      logger.error('Error marking notification as read:', error.message);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { user: userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      return result;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error.message);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        user: userId,
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      return notification;
    } catch (error) {
      logger.error('Error deleting notification:', error.message);
      throw error;
    }
  }

  /**
   * Delete all read notifications for a user
   */
  async deleteAllRead(userId) {
    try {
      const result = await Notification.deleteMany({
        user: userId,
        isRead: true,
      });

      return result;
    } catch (error) {
      logger.error('Error deleting read notifications:', error.message);
      throw error;
    }
  }
}

module.exports = new NotificationService();

