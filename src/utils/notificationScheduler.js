const notificationService = require('../services/notificationService');
const cron = require('node-cron');

class NotificationScheduler {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  /**
   * Start the notification scheduler
   * Runs every minute to check for scheduled notifications
   */
  start() {
    if (this.isRunning) {
      console.log('Notification scheduler is already running');
      return;
    }

    // Run every minute
    this.cronJob = cron.schedule('* * * * *', async () => {
      try {
        const processedCount = await notificationService.processScheduledNotifications();
        if (processedCount > 0) {
          console.log(`Processed ${processedCount} scheduled notifications`);
        }
      } catch (error) {
        console.error('Error in notification scheduler:', error);
      }
    }, {
      scheduled: false
    });

    this.cronJob.start();
    this.isRunning = true;
    console.log('Notification scheduler started');
  }

  /**
   * Stop the notification scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    console.log('Notification scheduler stopped');
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.cronJob ? this.cronJob.nextDates() : null
    };
  }

  /**
   * Schedule practice reminders for users
   * @param {string} userId - User ID
   * @param {Date} reminderTime - When to send the reminder
   * @param {Object} stitchInfo - Stitch information
   */
  async schedulePracticeReminder(userId, reminderTime, stitchInfo) {
    try {
      await notificationService.scheduleNotification(userId, {
        title: '🧵 Time to Practice!',
        body: `Don't forget to continue working on "${stitchInfo.name}". You're making great progress!`,
        type: 'reminder',
        data: {
          stitchId: stitchInfo.id,
          stitchName: stitchInfo.name,
          reminderType: 'practice'
        }
      }, reminderTime);

      console.log(`Practice reminder scheduled for user ${userId} at ${reminderTime}`);
    } catch (error) {
      console.error('Error scheduling practice reminder:', error);
      throw error;
    }
  }

  /**
   * Schedule daily motivation notifications
   * @param {string} userId - User ID
   * @param {string} timeOfDay - Time to send (e.g., '09:00')
   */
  async scheduleDailyMotivation(userId, timeOfDay = '09:00') {
    try {
      const motivationalMessages = [
        "Start your day with some stitching! ✨",
        "A few stitches a day keeps the stress away! 🧘‍♀️",
        "Your next masterpiece is waiting! 🎨",
        "Time to create something beautiful! 💝",
        "Let's make today productive with some stitching! 🌟"
      ];

      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      
      // Schedule for tomorrow at the specified time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const [hours, minutes] = timeOfDay.split(':');
      tomorrow.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await notificationService.scheduleNotification(userId, {
        title: '🌅 Good Morning, Stitcher!',
        body: randomMessage,
        type: 'reminder',
        data: {
          reminderType: 'daily_motivation'
        }
      }, tomorrow);

      console.log(`Daily motivation scheduled for user ${userId} at ${tomorrow}`);
    } catch (error) {
      console.error('Error scheduling daily motivation:', error);
      throw error;
    }
  }

  /**
   * Schedule weekly progress summary
   * @param {string} userId - User ID
   * @param {number} dayOfWeek - Day of week (0 = Sunday, 6 = Saturday)
   * @param {string} timeOfDay - Time to send (e.g., '18:00')
   */
  async scheduleWeeklyProgressSummary(userId, dayOfWeek = 0, timeOfDay = '18:00') {
    try {
      const nextSunday = new Date();
      const daysUntilSunday = (7 - nextSunday.getDay() + dayOfWeek) % 7;
      nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
      
      const [hours, minutes] = timeOfDay.split(':');
      nextSunday.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await notificationService.scheduleNotification(userId, {
        title: '📊 Weekly Progress Summary',
        body: 'Check out your stitching progress from this week! You\'re doing amazing!',
        type: 'reminder',
        data: {
          reminderType: 'weekly_summary'
        }
      }, nextSunday);

      console.log(`Weekly progress summary scheduled for user ${userId} at ${nextSunday}`);
    } catch (error) {
      console.error('Error scheduling weekly progress summary:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new NotificationScheduler();
