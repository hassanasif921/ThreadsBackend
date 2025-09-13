const Stitch = require('../models/Stitch');
const Step = require('../models/Step');
const UserProgress = require('../models/UserProgress');
const { processUploadedFiles } = require('../utils/fileUtils');

// Get all stitches with filtering and pagination
exports.getAllStitches = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      family,
      difficulty,
      usage,
      tags,
      materials,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
      userId
    } = req.query;

    const filter = { isActive: true };

    // Apply filters
    if (family) filter.family = family;
    if (difficulty) filter.difficulty = difficulty;
    if (usage) filter.usages = { $in: Array.isArray(usage) ? usage : [usage] };
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }
    if (materials) {
      const materialArray = Array.isArray(materials) ? materials : [materials];
      filter.materials = { $in: materialArray };
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { alternativeNames: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const stitches = await Stitch.find(filter)
      .populate('family', 'name description')
      .populate('difficulty', 'name level color')
      .populate('usages', 'name description')
      .populate('tags', 'name')
      .populate('swatches', 'name hexCode')
      .populate('materials', 'name type fiber brand color')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Stitch.countDocuments(filter);

    // If userId provided, add user progress data
    let stitchesWithProgress = stitches;
    if (userId) {
      stitchesWithProgress = await addUserProgressToStitches(stitches, userId);
    }

    res.json({
      success: true,
      data: stitchesWithProgress,
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
      message: 'Error fetching stitches',
      error: error.message
    });
  }
};

// Search stitches
exports.searchStitches = async (req, res) => {
  try {
    const { q, materials, limit = 10, userId } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const filter = {
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { alternativeNames: { $regex: q, $options: 'i' } }
      ]
    };

    // Add material filter if provided
    if (materials) {
      const materialArray = Array.isArray(materials) ? materials : [materials];
      filter.materials = { $in: materialArray };
    }

    const stitches = await Stitch.find(filter)
      .populate('family', 'name')
      .populate('difficulty', 'name level')
      .populate('materials', 'name type fiber brand')
      .select('name description referenceNumber images materials')
      .limit(parseInt(limit));

    // If userId provided, add user progress data
    let stitchesWithProgress = stitches;
    if (userId) {
      stitchesWithProgress = await addUserProgressToStitches(stitches, userId);
    }

    res.json({
      success: true,
      data: stitchesWithProgress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching stitches',
      error: error.message
    });
  }
};

// Get stitch by ID
exports.getStitchById = async (req, res) => {
  try {
    const { userId } = req.query;
    
    const stitch = await Stitch.findOne({ _id: req.params.id, isActive: true })
      .populate('family', 'name description')
      .populate('difficulty', 'name level color description')
      .populate('usages', 'name description')
      .populate('tags', 'name description')
      .populate('swatches', 'name hexCode description');

    if (!stitch) {
      return res.status(404).json({
        success: false,
        message: 'Stitch not found'
      });
    }

    // If userId provided, add user progress data
    let stitchWithProgress = stitch;
    if (userId) {
      const stitchesWithProgress = await addUserProgressToStitches([stitch], userId);
      stitchWithProgress = stitchesWithProgress[0];
    }

    res.json({
      success: true,
      data: stitchWithProgress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stitch',
      error: error.message
    });
  }
};

// Create new stitch
exports.createStitch = async (req, res) => {
  try {
    const stitchData = { ...req.body };

    // Parse JSON strings for arrays
    if (typeof stitchData.alternativeNames === 'string') {
      stitchData.alternativeNames = JSON.parse(stitchData.alternativeNames);
    }
    if (typeof stitchData.usages === 'string') {
      stitchData.usages = JSON.parse(stitchData.usages);
    }
    if (typeof stitchData.tags === 'string') {
      stitchData.tags = JSON.parse(stitchData.tags);
    }
    if (typeof stitchData.swatches === 'string') {
      stitchData.swatches = JSON.parse(stitchData.swatches);
    }
    if (typeof stitchData.hexCodes === 'string') {
      stitchData.hexCodes = JSON.parse(stitchData.hexCodes);
    }

    // Process uploaded files
    if (req.files) {
      if (req.files.featuredImage) {
        const processedFiles = processUploadedFiles(req.files.featuredImage);
        stitchData.featuredImage = processedFiles[0]; // Take first file as featured image
      }
      if (req.files.images) {
        stitchData.images = processUploadedFiles(req.files.images);
      }
      if (req.files.videos) {
        stitchData.videos = processUploadedFiles(req.files.videos);
      }
    }

    const stitch = new Stitch(stitchData);
    await stitch.save();

    const populatedStitch = await Stitch.findById(stitch._id)
      .populate('family', 'name description')
      .populate('difficulty', 'name level color')
      .populate('usages', 'name description')
      .populate('tags', 'name')
      .populate('swatches', 'name hexCode');

    res.status(201).json({
      success: true,
      data: populatedStitch,
      message: 'Stitch created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating stitch',
      error: error.message
    });
  }
};

// Update stitch
exports.updateStitch = async (req, res) => {
  try {
    const stitchData = { ...req.body };

    // Parse JSON strings for arrays
    if (typeof stitchData.alternativeNames === 'string') {
      stitchData.alternativeNames = JSON.parse(stitchData.alternativeNames);
    }
    if (typeof stitchData.usages === 'string') {
      stitchData.usages = JSON.parse(stitchData.usages);
    }
    if (typeof stitchData.tags === 'string') {
      stitchData.tags = JSON.parse(stitchData.tags);
    }
    if (typeof stitchData.swatches === 'string') {
      stitchData.swatches = JSON.parse(stitchData.swatches);
    }
    if (typeof stitchData.hexCodes === 'string') {
      stitchData.hexCodes = JSON.parse(stitchData.hexCodes);
    }

    // Process uploaded files
    if (req.files) {
      if (req.files.featuredImage) {
        const processedFiles = processUploadedFiles(req.files.featuredImage);
        stitchData.featuredImage = processedFiles[0]; // Take first file as featured image
      }
      if (req.files.images) {
        stitchData.images = processUploadedFiles(req.files.images);
      }
      if (req.files.videos) {
        stitchData.videos = processUploadedFiles(req.files.videos);
      }
    }

    const stitch = await Stitch.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      stitchData,
      { new: true, runValidators: true }
    )
      .populate('family', 'name description')
      .populate('difficulty', 'name level color')
      .populate('usages', 'name description')
      .populate('tags', 'name')
      .populate('swatches', 'name hexCode');

    if (!stitch) {
      return res.status(404).json({
        success: false,
        message: 'Stitch not found'
      });
    }

    res.json({
      success: true,
      data: stitch,
      message: 'Stitch updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating stitch',
      error: error.message
    });
  }
};

// Delete stitch (soft delete)
exports.deleteStitch = async (req, res) => {
  try {
    const stitch = await Stitch.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!stitch) {
      return res.status(404).json({
        success: false,
        message: 'Stitch not found'
      });
    }

    res.json({
      success: true,
      message: 'Stitch deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting stitch',
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
