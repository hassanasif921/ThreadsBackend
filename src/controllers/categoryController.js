const Stitch = require('../models/Stitch');
const Family = require('../models/Family');

// Get stitches grouped by categories (families)
exports.getStitchesByCategory = async (req, res) => {
  try {
    const { 
      includeSteps = false,
      difficulty,
      usage,
      tags,
      materials,
      search
    } = req.query;

    // Build filter for stitches
    const stitchFilter = { isActive: true };
    
    if (difficulty) stitchFilter.difficulty = difficulty;
    if (usage) stitchFilter.usages = { $in: Array.isArray(usage) ? usage : [usage] };
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      stitchFilter.tags = { $in: tagArray };
    }
    if (materials) {
      const materialArray = Array.isArray(materials) ? materials : [materials];
      stitchFilter.materials = { $in: materialArray };
    }
    if (search) {
      stitchFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { alternativeNames: { $regex: search, $options: 'i' } }
      ];
    }

    // Get all families (categories)
    const families = await Family.find({ isActive: true }).sort({ name: 1 });

    const categorizedStitches = [];

    for (const family of families) {
      // Add family filter to stitch filter
      const familyStitchFilter = { ...stitchFilter, family: family._id };
      
      // Get stitches for this family
      let stitchQuery = Stitch.find(familyStitchFilter)
        .populate('difficulty', 'name level color')
        .populate('usages', 'name description')
        .populate('tags', 'name')
        .populate('swatches', 'name hexCode')
        .populate('materials', 'name type fiber brand color')
        .sort({ name: 1 });

      const stitches = await stitchQuery;

      // If includeSteps is true, get steps for each stitch
      if (includeSteps === 'true') {
        const Step = require('../models/Step');
        for (let stitch of stitches) {
          const steps = await Step.find({ stitch: stitch._id, isActive: true })
            .sort({ stepNumber: 1 });
          stitch = stitch.toObject();
          stitch.steps = steps;
        }
      }

      // Only include families that have stitches
      if (stitches.length > 0) {
        categorizedStitches.push({
          category: {
            _id: family._id,
            name: family.name,
            description: family.description,
            icon: family.icon || null
          },
          stitchCount: stitches.length,
          stitches: stitches
        });
      }
    }

    res.json({
      success: true,
      data: categorizedStitches,
      totalCategories: categorizedStitches.length,
      totalStitches: categorizedStitches.reduce((sum, cat) => sum + cat.stitchCount, 0)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stitches by category',
      error: error.message
    });
  }
};

// Get specific category with its stitches
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeSteps = false, page = 1, limit = 20 } = req.query;

    // Get the family (category)
    const family = await Family.findOne({ _id: id, isActive: true });
    
    if (!family) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const skip = (page - 1) * limit;

    // Get stitches for this family with pagination
    let stitchQuery = Stitch.find({ family: family._id, isActive: true })
      .populate('difficulty', 'name level color')
      .populate('usages', 'name description')
      .populate('tags', 'name')
      .populate('swatches', 'name hexCode')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const stitches = await stitchQuery;
    const totalStitches = await Stitch.countDocuments({ family: family._id, isActive: true });

    // If includeSteps is true, get steps for each stitch
    if (includeSteps === 'true') {
      const Step = require('../models/Step');
      for (let i = 0; i < stitches.length; i++) {
        const steps = await Step.find({ stitch: stitches[i]._id, isActive: true })
          .sort({ stepNumber: 1 });
        stitches[i] = stitches[i].toObject();
        stitches[i].steps = steps;
      }
    }

    res.json({
      success: true,
      data: {
        category: {
          _id: family._id,
          name: family.name,
          description: family.description,
          icon: family.icon || null
        },
        stitches: stitches,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalStitches / limit),
          totalItems: totalStitches,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

// Get categories summary (just names and counts)
exports.getCategoriesSummary = async (req, res) => {
  try {
    const categories = await Family.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'stitches',
          localField: '_id',
          foreignField: 'family',
          as: 'stitches'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          icon: 1,
          stitchCount: {
            $size: {
              $filter: {
                input: '$stitches',
                cond: { $eq: ['$$this.isActive', true] }
              }
            }
          }
        }
      },
      { $match: { stitchCount: { $gt: 0 } } },
      { $sort: { name: 1 } }
    ]);

    res.json({
      success: true,
      data: categories,
      totalCategories: categories.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories summary',
      error: error.message
    });
  }
};
