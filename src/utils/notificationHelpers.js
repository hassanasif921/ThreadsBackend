const notificationService = require('../services/notificationService');
const notificationScheduler = require('./notificationScheduler');

/**
 * Notification helper functions for common scenarios
 */

/**
 * Send welcome notification to new users
 * @param {string} userId - User ID
 * @param {string} userName - User's name
 */
async function sendWelcomeNotification(userId, userName = 'Stitcher') {
  try {
    await notificationService.sendToUser(userId, {
      title: `Welcome to Stitch Dictionary, ${userName}! 🎉`,
      body: 'Start exploring beautiful stitches and begin your creative journey today!',
      type: 'general',
      data: {
        welcomeMessage: true,
        userName: userName
      }
    });
  } catch (error) {
    console.error('Error sending welcome notification:', error);
  }
}

/**
 * Send new stitch announcement to all users
 * @param {Object} stitch - Stitch object
 */
async function announceNewStitch(stitch) {
  try {
    await notificationService.sendToAllUsers({
      title: '✨ New Stitch Available!',
      body: `Check out the new "${stitch.name}" stitch. Perfect for your next project!`,
      type: 'new_stitch',
      data: {
        stitchId: stitch._id,
        stitchName: stitch.name,
        difficulty: stitch.difficulty?.name || 'Unknown'
      }
    });
  } catch (error) {
    console.error('Error announcing new stitch:', error);
  }
}

/**
 * Send stitch update notification to users who favorited it
 * @param {string} stitchId - Stitch ID
 * @param {string} stitchName - Stitch name
 * @param {string} updateMessage - Update description
 */
async function notifyStitchUpdate(stitchId, stitchName, updateMessage) {
  try {
    // Find users who have favorited this stitch
    const UserProgress = require('../models/UserProgress');
    const favoritedBy = await UserProgress.find({
      stitch: stitchId,
      isFavorite: true,
      isActive: true
    }).distinct('userId');

    if (favoritedBy.length > 0) {
      await notificationService.sendToMultipleUsers(favoritedBy, {
        title: '📝 Stitch Updated!',
        body: `"${stitchName}" has been updated: ${updateMessage}`,
        type: 'stitch_update',
        data: {
          stitchId: stitchId,
          stitchName: stitchName,
          updateMessage: updateMessage
        }
      });
    }
  } catch (error) {
    console.error('Error notifying stitch update:', error);
  }
}

/**
 * Send practice reminder to users with incomplete stitches
 * @param {string} userId - User ID
 * @param {number} daysInactive - Days since last practice
 */
async function sendPracticeReminder(userId, daysInactive = 3) {
  try {
    const UserProgress = require('../models/UserProgress');
    const Stitch = require('../models/Stitch');
    
    // Find incomplete stitches for the user
    const incompleteProgress = await UserProgress.find({
      userId: userId,
      isActive: true,
      completedSteps: { $exists: true, $not: { $size: 0 } },
      lastPracticed: { $lt: new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000) }
    }).populate('stitch', 'name').limit(1);

    if (incompleteProgress.length > 0) {
      const stitch = incompleteProgress[0].stitch;
      await notificationService.sendToUser(userId, {
        title: '🧵 Missing Your Stitching?',
        body: `You haven't worked on "${stitch.name}" in ${daysInactive} days. Ready to continue?`,
        type: 'reminder',
        data: {
          stitchId: stitch._id,
          stitchName: stitch.name,
          daysInactive: daysInactive
        }
      });
    }
  } catch (error) {
    console.error('Error sending practice reminder:', error);
  }
}

/**
 * Send achievement notification for reaching milestones
 * @param {string} userId - User ID
 * @param {string} achievementType - Type of achievement
 * @param {Object} data - Achievement data
 */
async function sendAchievementNotification(userId, achievementType, data) {
  try {
    const achievements = {
      first_stitch: {
        title: '🎊 First Stitch Completed!',
        body: 'Congratulations on completing your first stitch! This is just the beginning of your journey.'
      },
      five_stitches: {
        title: '🌟 5 Stitches Mastered!',
        body: 'Amazing! You\'ve completed 5 stitches. You\'re becoming quite the expert!'
      },
      ten_stitches: {
        title: '🏆 10 Stitches Champion!',
        body: 'Incredible! 10 completed stitches! Your skills are really developing.'
      },
      practice_streak: {
        title: '🔥 Practice Streak!',
        body: `${data.streakDays} days in a row! Your dedication is inspiring!`
      },
      favorite_milestone: {
        title: '❤️ Favorite Collector!',
        body: `You've favorited ${data.favoriteCount} stitches! Building quite the collection!`
      }
    };

    const achievement = achievements[achievementType];
    if (achievement) {
      await notificationService.sendToUser(userId, {
        title: achievement.title,
        body: achievement.body,
        type: 'achievement',
        data: {
          achievementType: achievementType,
          ...data
        }
      });
    }
  } catch (error) {
    console.error('Error sending achievement notification:', error);
  }
}

/**
 * Schedule daily practice reminders for a user
 * @param {string} userId - User ID
 * @param {string} preferredTime - Preferred time (e.g., '19:00')
 */
async function scheduleDailyReminders(userId, preferredTime = '19:00') {
  try {
    await notificationScheduler.scheduleDailyMotivation(userId, preferredTime);
  } catch (error) {
    console.error('Error scheduling daily reminders:', error);
  }
}

/**
 * Send notification for app updates or announcements
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data
 */
async function sendAppAnnouncement(title, body, data = {}) {
  try {
    await notificationService.sendToAllUsers({
      title: title,
      body: body,
      type: 'general',
      data: {
        announcement: true,
        ...data
      }
    });
  } catch (error) {
    console.error('Error sending app announcement:', error);
  }
}

/**
 * Send personalized weekly summary
 * @param {string} userId - User ID
 */
async function sendWeeklySummary(userId) {
  try {
    const UserProgress = require('../models/UserProgress');
    
    // Get user's weekly stats
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyProgress = await UserProgress.find({
      userId: userId,
      updatedAt: { $gte: weekAgo },
      isActive: true
    });

    const completedThisWeek = weeklyProgress.filter(p => 
      p.completedSteps && p.completedSteps.some(cs => cs.completedAt >= weekAgo)
    ).length;

    if (completedThisWeek > 0) {
      await notificationService.sendToUser(userId, {
        title: '📊 Your Weekly Progress',
        body: `Great week! You made progress on ${completedThisWeek} stitch${completedThisWeek > 1 ? 'es' : ''}. Keep up the excellent work!`,
        type: 'general',
        data: {
          weeklyStats: true,
          completedThisWeek: completedThisWeek
        }
      });
    }
  } catch (error) {
    console.error('Error sending weekly summary:', error);
  }
}

module.exports = {
  sendWelcomeNotification,
  announceNewStitch,
  notifyStitchUpdate,
  sendPracticeReminder,
  sendAchievementNotification,
  scheduleDailyReminders,
  sendAppAnnouncement,
  sendWeeklySummary
};
