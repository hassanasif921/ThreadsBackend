const { admin } = require('../config/firebase');
const Notification = require('../models/Notification');
const DeviceToken = require('../models/DeviceToken');

class NotificationService {
  constructor() {
    this.isFirebaseConfigured = !!admin.apps.length;
  }

  /**
   * Send push notification to a single user
   * @param {string} userId - User ID
   * @param {Object} notification - Notification data
   * @param {string} notification.title - Notification title
   * @param {string} notification.body - Notification body
   * @param {string} notification.type - Notification type
   * @param {Object} notification.data - Additional data
   * @param {string} notification.priority - Notification priority
   */
  async sendToUser(userId, notification) {
    try {
      // Save notification to database
      const savedNotification = await this.saveNotification(userId, notification);

      if (!this.isFirebaseConfigured) {
        console.log('Firebase not configured. Notification saved but not sent.');
        return { success: true, saved: true, sent: false };
      }

      // Get user's active device tokens
      const deviceTokens = await DeviceToken.find({
        userId: userId,
        isActive: true
      });

      if (deviceTokens.length === 0) {
        console.log(`No active device tokens found for user ${userId}`);
        return { success: true, saved: true, sent: false, reason: 'No active tokens' };
      }

      // Prepare FCM message
      const message = this.prepareFCMMessage(notification, deviceTokens.map(dt => dt.token));

      // Send notification
      const response = await admin.messaging().sendMulticast(message);

      // Update notification status
      await this.updateNotificationStatus(savedNotification._id, response);

      // Handle failed tokens
      await this.handleFailedTokens(deviceTokens, response);

      return {
        success: true,
        saved: true,
        sent: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      };

    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send push notification to multiple users
   * @param {Array} userIds - Array of user IDs
   * @param {Object} notification - Notification data
   */
  async sendToMultipleUsers(userIds, notification) {
    const results = [];

    for (const userId of userIds) {
      try {
        const result = await this.sendToUser(userId, notification);
        results.push({ userId, ...result });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Send notification to all users
   * @param {Object} notification - Notification data
   * @param {Object} filters - Optional filters (platform, etc.)
   */
  async sendToAllUsers(notification, filters = {}) {
    try {
      // Get all active device tokens
      const deviceTokens = await DeviceToken.find({ isActive: true });
      const userIds = [...new Set(deviceTokens.map(dt => dt.userId))];

      return await this.sendToMultipleUsers(userIds, notification);
    } catch (error) {
      console.error('Error sending notification to all users:', error);
      throw error;
    }
  }

  /**
   * Schedule a notification for later delivery
   * @param {string} userId - User ID
   * @param {Object} notification - Notification data
   * @param {Date} scheduledFor - When to send the notification
   */
  async scheduleNotification(userId, notification, scheduledFor) {
    try {
      const notificationData = {
        ...notification,
        scheduledFor: scheduledFor
      };

      return await this.saveNotification(userId, notificationData);
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications() {
    try {
      const now = new Date();
      const scheduledNotifications = await Notification.find({
        scheduledFor: { $lte: now },
        isSent: false,
        isActive: true
      });

      for (const notification of scheduledNotifications) {
        try {
          await this.sendToUser(notification.userId, {
            title: notification.title,
            body: notification.body,
            type: notification.type,
            data: notification.data,
            priority: notification.priority
          });
        } catch (error) {
          console.error(`Error sending scheduled notification ${notification._id}:`, error);
        }
      }

      return scheduledNotifications.length;
    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
      throw error;
    }
  }

  /**
   * Save notification to database
   */
  async saveNotification(userId, notification) {
    const notificationDoc = new Notification({
      userId,
      title: notification.title,
      body: notification.body,
      type: notification.type || 'general',
      data: notification.data || {},
      priority: notification.priority || 'normal',
      scheduledFor: notification.scheduledFor
    });

    return await notificationDoc.save();
  }


  /**
   * Prepare FCM message
   */
  prepareFCMMessage(notification, tokens) {
    const message = {
      tokens: tokens,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        type: notification.type || 'general',
        ...notification.data
      },
      android: {
        priority: notification.priority === 'high' ? 'high' : 'normal',
        notification: {
          channelId: 'stitch_notifications',
          priority: notification.priority === 'high' ? 'high' : 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.body
            },
            badge: 1,
            sound: 'default'
          }
        }
      }
    };

    return message;
  }

  /**
   * Update notification status after sending
   */
  async updateNotificationStatus(notificationId, response) {
    await Notification.findByIdAndUpdate(notificationId, {
      isSent: true,
      sentAt: new Date()
    });
  }

  /**
   * Handle failed tokens (mark as inactive)
   */
  async handleFailedTokens(deviceTokens, response) {
    if (response.failureCount > 0) {
      const failedTokens = [];
      
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (errorCode === 'messaging/invalid-registration-token' || 
              errorCode === 'messaging/registration-token-not-registered') {
            failedTokens.push(deviceTokens[idx].token);
          }
        }
      });

      // Mark failed tokens as inactive
      if (failedTokens.length > 0) {
        await DeviceToken.updateMany(
          { token: { $in: failedTokens } },
          { isActive: false }
        );
      }
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, options = {}) {
    const {
      limit = 20,
      offset = 0,
      unreadOnly = false,
      type = null
    } = options;

    const query = { userId, isActive: true };
    
    if (unreadOnly) {
      query.isRead = false;
    }
    
    if (type) {
      query.type = type;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
      isActive: true
    });

    return {
      notifications,
      unreadCount
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    return await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
  }
}

module.exports = new NotificationService();
