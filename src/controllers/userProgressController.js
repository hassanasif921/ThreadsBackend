const UserProgress = require('../models/UserProgress');
const Stitch = require('../models/Stitch');
const Step = require('../models/Step');
const notificationService = require('../services/notificationService');

// Get user progress for a stitch
exports.getUserProgress = async (req, res) => {
  try {
    const { id: stitchId } = req.params;
    const userId = req.user.uid || req.user.id;

    const progress = await UserProgress.findOne({
      userId,
      stitch: stitchId,
      isActive: true
    }).populate('completedSteps.step', 'stepNumber instruction');

    if (!progress) {
      return res.json({
        success: true,
        data: {
          userId,
          stitch: stitchId,
          isFavorite: false,
          completedSteps: [],
          notes: '',
          practiceCount: 0,
          lastPracticed: null,
          difficultyRating: null
        }
      });
    }

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user progress',
      error: error.message
    });
  }
};

// Update user progress
exports.updateUserProgress = async (req, res) => {
  try {
    const { id: stitchId } = req.params;
    const userId = req.user.uid || req.user.id;
    const updateData = req.body;

    // Verify stitch exists
    const stitch = await Stitch.findOne({ _id: stitchId, isActive: true });
    if (!stitch) {
      return res.status(404).json({
        success: false,
        message: 'Stitch not found'
      });
    }

    const progress = await UserProgress.findOneAndUpdate(
      { userId, stitch: stitchId },
      { ...updateData, userId, stitch: stitchId },
      { 
        new: true, 
        upsert: true, 
        runValidators: true,
        setDefaultsOnInsert: true
      }
    ).populate('completedSteps.step', 'stepNumber instruction');

    res.json({
      success: true,
      data: progress,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating progress',
      error: error.message
    });
  }
};

// Toggle favorite status
exports.toggleFavorite = async (req, res) => {
  try {
    const { id: stitchId } = req.params;
    const userId = req.user.uid || req.user.id;

    // Verify stitch exists
    const stitch = await Stitch.findOne({ _id: stitchId, isActive: true });
    if (!stitch) {
      return res.status(404).json({
        success: false,
        message: 'Stitch not found'
      });
    }

    // Find existing progress or create new one
    let progress = await UserProgress.findOne({ userId, stitch: stitchId });
    
    if (!progress) {
      progress = new UserProgress({
        userId,
        stitch: stitchId,
        isFavorite: true
      });
    } else {
      progress.isFavorite = !progress.isFavorite;
    }

    await progress.save();

    res.json({
      success: true,
      data: { isFavorite: progress.isFavorite },
      message: progress.isFavorite ? 'Added to favorites' : 'Removed from favorites'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling favorite',
      error: error.message
    });
  }
};

// Mark step as complete
exports.markStepComplete = async (req, res) => {
  try {
    const { id: stitchId, stepId } = req.params;
    const userId = req.user.uid || req.user.id;
    const { notes, difficultyRating, timeSpent } = req.body || {};

    // Verify stitch and step exist
    const stitch = await Stitch.findOne({ _id: stitchId, isActive: true });
    if (!stitch) {
      return res.status(404).json({
        success: false,
        message: 'Stitch not found'
      });
    }

    const step = await Step.findOne({ _id: stepId, stitch: stitchId, isActive: true });
    if (!step) {
      return res.status(404).json({
        success: false,
        message: 'Step not found'
      });
    }

    // Find or create progress
    let progress = await UserProgress.findOne({ userId, stitch: stitchId });
    
    if (!progress) {
      progress = new UserProgress({
        userId,
        stitch: stitchId,
        completedSteps: [{
          step: stepId,
          completedAt: new Date(),
          notes: notes || '',
          difficultyRating: difficultyRating || null,
          timeSpent: timeSpent || null
        }],
        lastPracticed: new Date(),
        practiceCount: 1
      });
    } else {
      // Check if step is already completed
      const existingStepIndex = progress.completedSteps.findIndex(
        cs => cs.step.toString() === stepId
      );
      
      if (existingStepIndex === -1) {
        // Add new completed step
        progress.completedSteps.push({
          step: stepId,
          completedAt: new Date(),
          notes: notes || '',
          difficultyRating: difficultyRating || null,
          timeSpent: timeSpent || null
        });
      } else {
        // Update existing completed step
        progress.completedSteps[existingStepIndex].completedAt = new Date();
        if (notes) progress.completedSteps[existingStepIndex].notes = notes;
        if (difficultyRating) progress.completedSteps[existingStepIndex].difficultyRating = difficultyRating;
        if (timeSpent) progress.completedSteps[existingStepIndex].timeSpent = timeSpent;
      }
      
      // Update overall progress
      progress.lastPracticed = new Date();
      progress.practiceCount = (progress.practiceCount || 0) + 1;
    }

    await progress.save();
    await progress.populate('completedSteps.step', 'stepNumber title instruction');

    // Calculate completion percentage
    const totalSteps = await Step.countDocuments({ stitch: stitchId, isActive: true });
    const completionPercentage = totalSteps > 0 ? Math.round((progress.completedSteps.length / totalSteps) * 100) : 0;

    // Send notifications for achievements
    try {
      // Check if this is a milestone (25%, 50%, 75%, 100%)
      const milestones = [25, 50, 75, 100];
      const currentMilestone = milestones.find(milestone => 
        completionPercentage >= milestone && 
        (progress.completedSteps.length - 1) / totalSteps * 100 < milestone
      );

      if (currentMilestone) {
        const stitch = await Stitch.findById(stitchId).select('name');
        
        if (currentMilestone === 100) {
          // Stitch completed
          await notificationService.sendToUser(userId, {
            title: '🎉 Stitch Completed!',
            body: `Congratulations! You've completed "${stitch.name}". Great work!`,
            type: 'achievement',
            data: {
              stitchId: stitchId,
              stitchName: stitch.name,
              completionPercentage: 100
            }
          });
        } else {
          // Milestone reached
          await notificationService.sendToUser(userId, {
            title: '🌟 Milestone Reached!',
            body: `You're ${currentMilestone}% done with "${stitch.name}". Keep it up!`,
            type: 'achievement',
            data: {
              stitchId: stitchId,
              stitchName: stitch.name,
              milestone: currentMilestone,
              completionPercentage: currentMilestone
            }
          });
        }
      }
    } catch (notificationError) {
      console.error('Error sending achievement notification:', notificationError);
      // Don't fail the main operation if notification fails
    }

    res.json({
      success: true,
      data: {
        ...progress.toObject(),
        completionPercentage,
        totalSteps
      },
      message: 'Step marked as complete'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking step complete',
      error: error.message
    });
  }
};

// Unmark step as complete
exports.unmarkStepComplete = async (req, res) => {
  try {
    const { id: stitchId, stepId } = req.params;
    const userId = req.user.uid || req.user.id;

    const progress = await UserProgress.findOne({ userId, stitch: stitchId });
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'No progress found for this stitch'
      });
    }

    // Remove the step from completed steps
    progress.completedSteps = progress.completedSteps.filter(
      cs => cs.step.toString() !== stepId
    );

    await progress.save();
    await progress.populate('completedSteps.step', 'stepNumber instruction');

    res.json({
      success: true,
      data: progress,
      message: 'Step unmarked as complete'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error unmarking step complete',
      error: error.message
    });
  }
};

// Get user's favorite stitches
exports.getFavoriteStitches = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const favorites = await UserProgress.find({
      userId,
      isFavorite: true,
      isActive: true
    })
      .populate({
        path: 'stitch',
        match: { isActive: true },
        populate: [
          { path: 'family', select: 'name' },
          { path: 'difficulty', select: 'name level color' }
        ]
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ updatedAt: -1 });

    // Filter out any null stitches (in case stitch was deleted)
    const validFavorites = favorites.filter(fav => fav.stitch);

    const total = await UserProgress.countDocuments({
      userId,
      isFavorite: true,
      isActive: true
    });

    res.json({
      success: true,
      data: validFavorites,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching favorite stitches',
      error: error.message
    });
  }
};


// Get user's progress statistics
exports.getProgressStats = async (req, res) => {
  try {
    const userId = req.user.uid;

    const stats = await UserProgress.aggregate([
      { $match: { userId, isActive: true } },
      {
        $group: {
          _id: null,
          totalFavorites: { $sum: { $cond: ['$isFavorite', 1, 0] } },
          totalStitchesStarted: { $sum: 1 },
          totalPracticeCount: { $sum: '$practiceCount' },
          averageDifficultyRating: { $avg: '$difficultyRating' }
        }
      }
    ]);

    const result = stats[0] || {
      totalFavorites: 0,
      totalStitchesStarted: 0,
      totalPracticeCount: 0,
      averageDifficultyRating: null
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching progress statistics',
      error: error.message
    });
  }
};

// Add stitch to favorites
exports.addToFavorites = async (req, res) => {
  try {
    const { id: stitchId } = req.params;
    const userId = req.user.uid || req.user.id;

    // Verify stitch exists
    const stitch = await Stitch.findOne({ _id: stitchId, isActive: true });
    if (!stitch) {
      return res.status(404).json({
        success: false,
        message: 'Stitch not found'
      });
    }

    // Find existing progress or create new one
    let progress = await UserProgress.findOne({ userId, stitch: stitchId });
    
    if (!progress) {
      progress = new UserProgress({
        userId,
        stitch: stitchId,
        isFavorite: true
      });
    } else {
      if (progress.isFavorite) {
        return res.status(400).json({
          success: false,
          message: 'Stitch is already in favorites'
        });
      }
      progress.isFavorite = true;
    }

    await progress.save();

    res.json({
      success: true,
      data: { isFavorite: true },
      message: 'Added to favorites'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding to favorites',
      error: error.message
    });
  }
};

// Remove stitch from favorites
exports.removeFromFavorites = async (req, res) => {
  try {
    const { id: stitchId } = req.params;
    const userId = req.user.uid || req.user.id;

    // Find existing progress
    const progress = await UserProgress.findOne({ userId, stitch: stitchId });
    
    if (!progress || !progress.isFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Stitch is not in favorites'
      });
    }

    progress.isFavorite = false;
    await progress.save();

    res.json({
      success: true,
      data: { isFavorite: false },
      message: 'Removed from favorites'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing from favorites',
      error: error.message
    });
  }
};

// Get all user's favorite stitches
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user.uid || req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    // Find all favorite stitches for the user
    const favoriteProgress = await UserProgress.find({
      userId,
      isFavorite: true,
      isActive: true
    })
    .populate({
      path: 'stitch',
      match: { isActive: true },
      select: 'name description referenceNumber difficulty family usages tags materials featuredImage thumbnailImage author tier premiumFeatures',
      populate: [
        { path: 'family', select: 'name description' },
        { path: 'difficulty', select: 'name level color' },
        { path: 'usages', select: 'name description' },
        { path: 'tags', select: 'name' },
        { path: 'materials', select: 'name type fiber brand color' }
      ]
    })
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ updatedAt: -1 });

    // Filter out any null stitches (in case stitch was deleted)
    const validFavorites = favoriteProgress.filter(progress => progress.stitch);

    // Apply subscription access control to each stitch
    const favoritesWithSubscriptionInfo = validFavorites.map(progress => {
      const stitchObj = progress.stitch.toObject ? progress.stitch.toObject() : progress.stitch;
      const userHasPremium = req.userSubscription?.hasPremiumAccess || false;
      const isFree = stitchObj.tier === 'free' || !stitchObj.tier;
      
      // Add clear access indicators
      stitchObj.is_free = isFree;
      stitchObj.access_level = isFree ? 'free' : 'premium';
      stitchObj.user_has_access = isFree || userHasPremium;
      stitchObj.requires_subscription = !isFree;
      stitchObj.favorited_at = progress.updatedAt;
      
      // If user doesn't have premium access, limit premium content
      if (!isFree && !userHasPremium) {
        stitchObj.description = stitchObj.description ? 
          stitchObj.description.substring(0, 100) + '... [Premium content - Subscribe to see more]' : 
          'Premium content - Subscribe to unlock';
        stitchObj.premiumFeatures = ['Subscribe to unlock premium features'];
      }
      
      return stitchObj;
    });

    // Get total count for pagination
    const totalFavorites = await UserProgress.countDocuments({
      userId,
      isFavorite: true,
      isActive: true
    });

    res.json({
      success: true,
      data: favoritesWithSubscriptionInfo,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalFavorites / limit),
        totalItems: totalFavorites,
        itemsPerPage: parseInt(limit)
      },
      userSubscription: req.userSubscription || { status: 'free', hasPremiumAccess: false }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching favorites',
      error: error.message
    });
  }
};
