const UserProgress = require('../models/UserProgress');
const Stitch = require('../models/Stitch');
const Step = require('../models/Step');

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
        completedSteps: [{ step: stepId }]
      });
    } else {
      // Check if step is already completed
      const existingStep = progress.completedSteps.find(
        cs => cs.step.toString() === stepId
      );
      
      if (!existingStep) {
        progress.completedSteps.push({ step: stepId });
      }
    }

    await progress.save();
    await progress.populate('completedSteps.step', 'stepNumber instruction');

    res.json({
      success: true,
      data: progress,
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
