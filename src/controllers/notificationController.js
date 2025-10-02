const notificationService = require('../services/notificationService');
const DeviceToken = require('../models/DeviceToken');
const Notification = require('../models/Notification');

// Register device token
async function registerDeviceToken(req, res) {
  try {
    const { userId } = req.params;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Check if device token already exists for this user
    let deviceToken = await DeviceToken.findOne({ userId, token });

    if (deviceToken) {
      // Update existing token
      deviceToken.isActive = true;
      deviceToken.lastUsed = new Date();
      await deviceToken.save();
    } else {
      // Create new device token
      deviceToken = new DeviceToken({
        userId,
        token
      });
      
      await deviceToken.save();
    }

    res.json({
      success: true,
      message: 'Device token registered successfully',
      data: deviceToken
    });
  } catch (error) {
    console.error('Error registering device token:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering device token',
      error: error.message
    });
  }
}

// Update device token status (enable/disable)
async function updateDeviceToken(req, res) {
  try {
    const { userId } = req.params;
    const { token, isActive = true } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const deviceToken = await DeviceToken.findOneAndUpdate(
      { userId, token },
      { 
        isActive: isActive,
        lastUsed: new Date()
      },
      { new: true }
    );

    if (!deviceToken) {
      return res.status(404).json({
        success: false,
        message: 'Device token not found'
      });
    }

    res.json({
      success: true,
      message: 'Device token updated successfully',
      data: deviceToken
    });
  } catch (error) {
    console.error('Error updating device token:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating device token',
      error: error.message
    });
  }
}

// Get user notifications
async function getUserNotifications(req, res) {
  try {
    const { userId } = req.params;
    const { 
      limit = 20, 
      offset = 0, 
      unreadOnly = false, 
      type 
    } = req.query;

    const options = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      unreadOnly: unreadOnly === 'true',
      type: type || null
    };

    const result = await notificationService.getUserNotifications(userId, options);

    res.json({
      success: true,
      data: result.notifications,
      unreadCount: result.unreadCount,
      pagination: {
        limit: options.limit,
        offset: options.offset,
        hasMore: result.notifications.length === options.limit
      }
    });
  } catch (error) {
    console.error('Error getting user notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting notifications',
      error: error.message
    });
  }
}

// Mark notification as read
async function markNotificationAsRead(req, res) {
  try {
    const { userId, notificationId } = req.params;

    const notification = await notificationService.markAsRead(notificationId, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
}

// Mark all notifications as read
async function markAllNotificationsAsRead(req, res) {
  try {
    const { userId } = req.params;

    const result = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
}

// Send test notification (for development/admin use)
async function sendTestNotification(req, res) {
  try {
    const { userId } = req.params;
    const { title, body, type = 'general', data = {} } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Title and body are required'
      });
    }

    const result = await notificationService.sendToUser(userId, {
      title,
      body,
      type,
      data
    });

    res.json({
      success: true,
      message: 'Test notification sent',
      data: result
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test notification',
      error: error.message
    });
  }
}


// Unregister device token
async function unregisterDeviceToken(req, res) {
  try {
    const { userId } = req.params;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const result = await DeviceToken.findOneAndUpdate(
      { userId, token },
      { isActive: false },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Device token not found'
      });
    }

    res.json({
      success: true,
      message: 'Device token unregistered successfully'
    });
  } catch (error) {
    console.error('Error unregistering device token:', error);
    res.status(500).json({
      success: false,
      message: 'Error unregistering device token',
      error: error.message
    });
  }
}

// Get unread notification count
async function getUnreadCount(req, res) {
  try {
    const { userId } = req.params;

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
      isActive: true
    });

    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting unread count',
      error: error.message
    });
  }
}

module.exports = {
  registerDeviceToken,
  updateDeviceToken,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  sendTestNotification,
  unregisterDeviceToken,
  getUnreadCount
};
