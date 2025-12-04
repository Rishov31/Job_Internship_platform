const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Get all notifications for the authenticated user
 */
exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      limit = 50,
      skip = 0,
      isRead,
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const options = {
      limit: parseInt(limit),
      skip: parseInt(skip),
      isRead: isRead !== undefined ? isRead === 'true' : null,
      type: type || null,
      sortBy,
      sortOrder,
    };

    const result = await notificationService.getUserNotifications(userId, options);

    res.json({
      success: true,
      notifications: result.notifications,
      total: result.total,
      unreadCount: result.unreadCount,
      hasMore: result.hasMore,
    });
  } catch (error) {
    logger.error('Error getting notifications:', error.message);
    next(error);
  }
};

/**
 * Get unread notification count
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.getUserNotifications(userId, {
      limit: 1,
      isRead: false,
    });

    res.json({
      success: true,
      unreadCount: result.unreadCount,
    });
  } catch (error) {
    logger.error('Error getting unread count:', error.message);
    next(error);
  }
};

/**
 * Mark a notification as read
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await notificationService.markAsRead(notificationId, userId);

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error.message);
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error.message);
    next(error);
  }
};

/**
 * Delete a notification
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await notificationService.deleteNotification(notificationId, userId);

    res.json({
      success: true,
      message: 'Notification deleted successfully',
      notification,
    });
  } catch (error) {
    logger.error('Error deleting notification:', error.message);
    next(error);
  }
};

/**
 * Delete all read notifications
 */
exports.deleteAllRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.deleteAllRead(userId);

    res.json({
      success: true,
      message: 'All read notifications deleted successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    logger.error('Error deleting read notifications:', error.message);
    next(error);
  }
};

