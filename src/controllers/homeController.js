const Stitch = require('../models/Stitch');
const UserProgress = require('../models/UserProgress');
const Step = require('../models/Step');

// Get featured stitches for home page
exports.getFeaturedStitches = async (req, res) => {
  try {
    const { limit = 6, category, userId } = req.query;

    // Build filter for featured stitches
    const filter = { 
      isActive: true,
      isFeatured: true
    };

    // Add category filter if provided (and not 'all')
    if (category && category.toLowerCase() !== 'all') {
      filter.family = category;
    }

    const featuredStitches = await Stitch.find(filter)
      .populate('family', 'name')
      .populate('difficulty', 'name level color')
      .populate('materials', 'name type fiber brand')
      .select('name description referenceNumber featuredImage images difficulty family materials')
      .sort({ createdAt: -1 }) // Most recent first
      .limit(parseInt(limit));

    // If userId provided, add user progress data
    let stitchesWithProgress = featuredStitches;
    if (userId) {
      stitchesWithProgress = await addUserProgressToStitches(featuredStitches, userId);
    }

    res.json({
      success: true,
      data: stitchesWithProgress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured stitches',
      error: error.message
    });
  }
};

// Get user's favorite stitches
exports.getFavoriteStitches = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const favoriteProgress = await UserProgress.find({
      userId: userId,
      isFavorite: true,
      isActive: true
    })
      .populate({
        path: 'stitch',
        populate: [
          { path: 'family', select: 'name' },
          { path: 'difficulty', select: 'name level color' },
          { path: 'materials', select: 'name type fiber brand' }
        ]
      })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit));

    const favoriteStitches = favoriteProgress.map(progress => ({
      ...progress.stitch.toObject(),
      userProgress: {
        isFavorite: progress.isFavorite,
        completedSteps: progress.completedSteps.length,
        practiceCount: progress.practiceCount,
        lastPracticed: progress.lastPracticed,
        notes: progress.notes
      }
    }));

    res.json({
      success: true,
      data: favoriteStitches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching favorite stitches',
      error: error.message
    });
  }
};

// Get continue learning stitches for a user
exports.getContinueLearning = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, category } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Build the populate query with category filter
    const populateQuery = {
      path: 'stitch',
      match: { isActive: true },
      populate: [
        { path: 'family', select: 'name' },
        { path: 'difficulty', select: 'name level color' },
        { path: 'materials', select: 'name type fiber brand' }
      ]
    };

    // Add category filter to stitch match if provided (and not 'all')
    if (category && category.toLowerCase() !== 'all') {
      populateQuery.match.family = category;
    }

    // Get user progress for stitches that are in progress (not completed)
    const userProgress = await UserProgress.find({
      userId: userId,
      isActive: true,
      $and: [
        { completedSteps: { $exists: true, $gt: 0 } }, // Has started
        { $expr: { $lt: ['$completedSteps', { $size: '$stitch.steps' }] } } // Not completed
      ]
    })
      .populate(populateQuery)
      .sort({ lastPracticed: -1 })
      .limit(parseInt(limit));

    // Filter out any null stitches and calculate progress
    const continueLearningData = userProgress
      .filter(progress => progress.stitch)
      .map(progress => {
        const stitch = progress.stitch.toObject();
        const totalSteps = stitch.steps ? stitch.steps.length : 0;
        const completedSteps = progress.completedSteps || 0;
        const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

        return {
          ...stitch,
          userProgress: {
            completedSteps,
            totalSteps,
            progressPercentage,
            lastPracticed: progress.lastPracticed,
            practiceCount: progress.practiceCount || 0,
            notes: progress.notes
          }
        };
      });

    res.json({
      success: true,
      data: continueLearningData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching continue learning stitches',
      error: error.message
    });
  }
};

// Get home page data (combined endpoint)
exports.getHomePageData = async (req, res) => {
  try {
    const { userId } = req.query;
    const featuredLimit = 6;
    const favoritesLimit = 4;
    const continueLimit = 4;

    // Get featured stitches
    const featuredStitches = await Stitch.find({ 
      isActive: true,
      featuredImage: { $exists: true, $ne: null }
    })
      .populate('family', 'name')
      .populate('difficulty', 'name level color')
      .populate('materials', 'name type fiber brand')
      .select('name description referenceNumber featuredImage images difficulty family materials')
      .sort({ createdAt: -1 })
      .limit(featuredLimit);

    const homeData = {
      featured: featuredStitches,
      favorites: [],
      continueLearning: []
    };

    // If user is provided, get their personalized data
    if (userId) {
      // Get favorites
      const favoriteProgress = await UserProgress.find({
        userId: userId,
        isFavorite: true,
        isActive: true
      })
        .populate({
          path: 'stitch',
          populate: [
            { path: 'family', select: 'name' },
            { path: 'difficulty', select: 'name level color' },
            { path: 'materials', select: 'name type fiber brand' }
          ]
        })
        .sort({ updatedAt: -1 })
        .limit(favoritesLimit);

      homeData.favorites = favoriteProgress.map(progress => ({
        ...progress.stitch.toObject(),
        userProgress: {
          isFavorite: progress.isFavorite,
          completedSteps: progress.completedSteps.length,
          practiceCount: progress.practiceCount,
          lastPracticed: progress.lastPracticed
        }
      }));

      // Get continue learning
      const inProgressStitches = await UserProgress.find({
        userId: userId,
        isActive: true,
        $and: [
          { completedSteps: { $exists: true, $not: { $size: 0 } } },
          { 'completedSteps.0': { $exists: true } }
        ]
      })
        .populate({
          path: 'stitch',
          populate: [
            { path: 'family', select: 'name' },
            { path: 'difficulty', select: 'name level color' },
            { path: 'materials', select: 'name type fiber brand' }
          ]
        })
        .sort({ lastPracticed: -1, updatedAt: -1 })
        .limit(continueLimit);

      const Step = require('../models/Step');
      homeData.continueLearning = await Promise.all(
        inProgressStitches.map(async (progress) => {
          const totalSteps = await Step.countDocuments({ 
            stitch: progress.stitch._id, 
            isActive: true 
          });
          
          const completedStepsCount = progress.completedSteps.length;
          const progressPercentage = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0;

          return {
            ...progress.stitch.toObject(),
            userProgress: {
              completedSteps: completedStepsCount,
              totalSteps: totalSteps,
              progressPercentage: progressPercentage,
              lastPracticed: progress.lastPracticed
            }
          };
        })
      );
    }

    res.json({
      success: true,
      data: homeData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching home page data',
      error: error.message
    });
  }
};

// Helper function to add user progress to stitches array
async function addUserProgressToStitches(stitches, userId) {
  const stitchesWithProgress = [];
  
  for (const stitch of stitches) {
    const stitchObj = stitch.toObject();
    
    // Get total steps for this stitch
    const totalSteps = await Step.countDocuments({ 
      stitch: stitch._id, 
      isActive: true 
    });
    
    // Get user progress for this stitch
    const userProgress = await UserProgress.findOne({
      userId: userId,
      stitch: stitch._id,
      isActive: true
    });
    
    // Add progress data to stitch object
    stitchObj.userProgress = {
      currentStep: userProgress ? (userProgress.completedSteps ? userProgress.completedSteps.length : 0) : 0,
      totalSteps: totalSteps,
      isCompleted: userProgress ? (userProgress.completedSteps ? userProgress.completedSteps.length >= totalSteps : false) : false,
      isFavorite: userProgress ? (userProgress.isFavorite || false) : false,
      lastPracticed: userProgress ? userProgress.lastPracticed : null,
      practiceCount: userProgress ? (userProgress.practiceCount || 0) : 0
    };
    
    stitchesWithProgress.push(stitchObj);
  }
  
  return stitchesWithProgress;
}
