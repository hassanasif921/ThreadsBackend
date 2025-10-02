const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// All notification routes require authentication
router.use(authMiddleware);

// Device token management
router.post('/device-token/:userId', notificationController.registerDeviceToken);
router.put('/device-token/:userId', notificationController.updateDeviceToken);
router.delete('/device-token/:userId', notificationController.unregisterDeviceToken);

// User notifications
router.get('/:userId', notificationController.getUserNotifications);
router.get('/:userId/unread-count', notificationController.getUnreadCount);
router.put('/:userId/:notificationId/read', notificationController.markNotificationAsRead);
router.put('/:userId/read-all', notificationController.markAllNotificationsAsRead);

// Test notification (for development)
router.post('/test/:userId', notificationController.sendTestNotification);

module.exports = router;
