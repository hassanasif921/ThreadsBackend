# Push Notifications Guide

This guide explains how to implement and use the push notification system in the Stitch Dictionary mobile app backend.

## Overview

The push notification system is built using Firebase Cloud Messaging (FCM) and provides:
- Real-time push notifications to mobile devices
- Device token management
- Notification preferences per user
- Scheduled notifications
- Achievement and milestone notifications
- Practice reminders and motivational messages

## Architecture

### Components

1. **Models**
   - `Notification` - Stores notification history and scheduled notifications
   - `DeviceToken` - Manages user device tokens and notification preferences

2. **Services**
   - `NotificationService` - Core notification sending logic
   - `NotificationScheduler` - Handles scheduled notifications

3. **Controllers**
   - `NotificationController` - API endpoints for notification management

4. **Utilities**
   - `NotificationHelpers` - Common notification scenarios

## API Endpoints

### Device Token Management

#### Register Device Token
```http
POST /api/notifications/device-token/:userId
```

**Request Body:**
```json
{
  "token": "fcm_device_token_here"
}
```

#### Update Device Token Status
```http
PUT /api/notifications/device-token/:userId
```

**Request Body:**
```json
{
  "token": "fcm_device_token_here",
  "isActive": true
}
```

#### Unregister Device Token
```http
DELETE /api/notifications/device-token/:userId
```

**Request Body:**
```json
{
  "token": "fcm_device_token_here"
}
```

### Notification Management

#### Get User Notifications
```http
GET /api/notifications/:userId?limit=20&offset=0&unreadOnly=false&type=achievement
```

#### Mark Notification as Read
```http
PUT /api/notifications/:userId/:notificationId/read
```

#### Mark All Notifications as Read
```http
PUT /api/notifications/:userId/read-all
```

#### Get Unread Count
```http
GET /api/notifications/:userId/unread-count
```

### Testing

#### Send Test Notification
```http
POST /api/notifications/test/:userId
```

**Request Body:**
```json
{
  "title": "Test Notification",
  "body": "This is a test notification",
  "type": "general",
  "data": {
    "testData": "value"
  }
}
```

## Usage Examples

### Sending Notifications

#### Basic Notification
```javascript
const notificationService = require('./services/notificationService');

await notificationService.sendToUser('user123', {
  title: 'Welcome!',
  body: 'Welcome to Stitch Dictionary!',
  type: 'general',
  data: { welcomeMessage: true }
});
```

#### Achievement Notification
```javascript
await notificationService.sendToUser('user123', {
  title: '🎉 Stitch Completed!',
  body: 'Congratulations! You completed "Basic Chain Stitch"',
  type: 'achievement',
  data: {
    stitchId: 'stitch_id',
    stitchName: 'Basic Chain Stitch',
    completionPercentage: 100
  }
});
```

#### Scheduled Notification
```javascript
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

await notificationService.scheduleNotification('user123', {
  title: 'Practice Reminder',
  body: 'Time to continue your stitching practice!',
  type: 'reminder'
}, tomorrow);
```

### Using Helper Functions

```javascript
const notificationHelpers = require('./utils/notificationHelpers');

// Welcome new user
await notificationHelpers.sendWelcomeNotification('user123', 'John');

// Announce new stitch
await notificationHelpers.announceNewStitch(stitchObject);

// Send practice reminder
await notificationHelpers.sendPracticeReminder('user123', 3);

// Send achievement
await notificationHelpers.sendAchievementNotification('user123', 'first_stitch', {
  stitchName: 'Basic Chain Stitch'
});
```

## Notification Types

### Achievement Notifications
- Stitch completion milestones (25%, 50%, 75%, 100%)
- First stitch completed
- Multiple stitches completed (5, 10, etc.)
- Practice streaks
- Favorite collection milestones

### Reminder Notifications
- Daily practice reminders
- Inactive user reminders
- Weekly progress summaries
- Scheduled practice sessions

### Update Notifications
- New stitch announcements
- Stitch updates for favorited items
- App updates and announcements

### General Notifications
- Welcome messages
- Tips and tutorials
- Community updates

## Firebase Configuration

### Environment Variables
Add these to your `.env` file:

```env
# Option 1: Service Account JSON as string
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project",...}

# Option 2: Path to service account file
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccount.json
```

### Service Account Setup
1. Go to Firebase Console
2. Project Settings → Service Accounts
3. Generate new private key
4. Download JSON file or copy content to environment variable

## Mobile App Integration

### iOS Setup
1. Add Firebase SDK to your iOS project
2. Configure APNs certificates in Firebase Console
3. Request notification permissions
4. Get FCM token and register with backend

```swift
Messaging.messaging().token { token, error in
  if let error = error {
    print("Error fetching FCM registration token: \(error)")
  } else if let token = token {
    // Send token to your backend
    registerDeviceToken(token: token, platform: "ios")
  }
}
```

### Android Setup
1. Add Firebase SDK to your Android project
2. Configure Firebase in your app
3. Request notification permissions
4. Get FCM token and register with backend

```kotlin
FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
    if (!task.isSuccessful) {
        Log.w(TAG, "Fetching FCM registration token failed", task.exception)
        return@addOnCompleteListener
    }

    val token = task.result
    // Send token to your backend
    registerDeviceToken(token, "android")
}
```

## Notification Payload Structure

### Standard Payload
```json
{
  "notification": {
    "title": "Notification Title",
    "body": "Notification body text"
  },
  "data": {
    "type": "achievement",
    "stitchId": "stitch_123",
    "customData": "value"
  },
  "android": {
    "priority": "high",
    "notification": {
      "channelId": "stitch_notifications",
      "priority": "high"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "alert": {
          "title": "Notification Title",
          "body": "Notification body text"
        },
        "badge": 1,
        "sound": "default"
      }
    }
  }
}
```

## Best Practices

### 1. Notification Frequency
- Limit notifications to avoid user fatigue
- Respect user preferences and time zones
- Use scheduling for non-urgent notifications

### 2. Personalization
- Include user's name when appropriate
- Reference specific stitches or progress
- Tailor content to user's skill level

### 3. Error Handling
- Handle invalid tokens gracefully
- Retry failed notifications with exponential backoff
- Log errors for monitoring

### 4. Performance
- Batch notifications when possible
- Use background jobs for bulk notifications
- Monitor notification delivery rates

### 5. User Experience
- Provide clear notification settings
- Allow users to customize notification types
- Include deep links to relevant app sections

## Monitoring and Analytics

### Key Metrics to Track
- Notification delivery rates
- User engagement with notifications
- Opt-out rates by notification type
- Device token validity

### Logging
The system logs important events:
- Notification sending attempts
- Failed token deliveries
- User preference changes
- Scheduled notification processing

## Troubleshooting

### Common Issues

1. **Notifications not received**
   - Check Firebase configuration
   - Verify device token is valid
   - Check user notification settings
   - Verify app is properly configured for push notifications

2. **Invalid registration token errors**
   - Tokens are automatically marked as inactive
   - App should re-register token when needed

3. **Scheduling not working**
   - Ensure notification scheduler is running
   - Check server timezone settings
   - Verify scheduled notification format

### Debug Mode
Enable debug logging by setting environment variable:
```env
DEBUG_NOTIFICATIONS=true
```

## Security Considerations

1. **Token Management**
   - Store tokens securely
   - Regularly clean up inactive tokens
   - Validate token ownership

2. **User Privacy**
   - Respect notification preferences
   - Don't send sensitive information in notifications
   - Provide clear opt-out mechanisms

3. **Rate Limiting**
   - Implement rate limits for notification sending
   - Prevent spam and abuse
   - Monitor for unusual patterns
