const Family = require('../models/Family');
const Usage = require('../models/Usage');
const Difficulty = require('../models/Difficulty');
const Tag = require('../models/Tag');
const Swatch = require('../models/Swatch');

// Family Controllers
exports.getAllFamilies = async (req, res) => {
  try {
    const families = await Family.find({ isActive: true }).sort({ name: 1 });
    res.json({
      success: true,
      data: families
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching families',
      error: error.message
    });
  }
};

exports.getFamilyById = async (req, res) => {
  try {
    const family = await Family.findOne({ _id: req.params.id, isActive: true });
    if (!family) {
      return res.status(404).json({
        success: false,
        message: 'Family not found'
      });
    }
    res.json({
      success: true,
      data: family
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching family',
      error: error.message
    });
  }
};

exports.createFamily = async (req, res) => {
  try {
    const family = new Family(req.body);
    await family.save();
    res.status(201).json({
      success: true,
      data: family,
      message: 'Family created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating family',
      error: error.message
    });
  }
};

exports.updateFamily = async (req, res) => {
  try {
    const family = await Family.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      req.body,
      { new: true, runValidators: true }
    );
    if (!family) {
      return res.status(404).json({
        success: false,
        message: 'Family not found'
      });
    }
    res.json({
      success: true,
      data: family,
      message: 'Family updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating family',
      error: error.message
    });
  }
};

exports.deleteFamily = async (req, res) => {
  try {
    const family = await Family.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { isActive: false },
      { new: true }
    );
    if (!family) {
      return res.status(404).json({
        success: false,
        message: 'Family not found'
      });
    }
    res.json({
      success: true,
      message: 'Family deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting family',
      error: error.message
    });
  }
};

// Usage Controllers
exports.getAllUsages = async (req, res) => {
  try {
    const usages = await Usage.find({ isActive: true }).sort({ name: 1 });
    res.json({
      success: true,
      data: usages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching usages',
      error: error.message
    });
  }
};

exports.getUsageById = async (req, res) => {
  try {
    const usage = await Usage.findOne({ _id: req.params.id, isActive: true });
    if (!usage) {
      return res.status(404).json({
        success: false,
        message: 'Usage not found'
      });
    }
    res.json({
      success: true,
      data: usage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching usage',
      error: error.message
    });
  }
};

exports.createUsage = async (req, res) => {
  try {
    const usage = new Usage(req.body);
    await usage.save();
    res.status(201).json({
      success: true,
      data: usage,
      message: 'Usage created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating usage',
      error: error.message
    });
  }
};

exports.updateUsage = async (req, res) => {
  try {
    const usage = await Usage.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      req.body,
      { new: true, runValidators: true }
    );
    if (!usage) {
      return res.status(404).json({
        success: false,
        message: 'Usage not found'
      });
    }
    res.json({
      success: true,
      data: usage,
      message: 'Usage updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating usage',
      error: error.message
    });
  }
};

exports.deleteUsage = async (req, res) => {
  try {
    const usage = await Usage.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { isActive: false },
      { new: true }
    );
    if (!usage) {
      return res.status(404).json({
        success: false,
        message: 'Usage not found'
      });
    }
    res.json({
      success: true,
      message: 'Usage deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting usage',
      error: error.message
    });
  }
};

// Difficulty Controllers
exports.getAllDifficulties = async (req, res) => {
  try {
    const difficulties = await Difficulty.find({ isActive: true }).sort({ level: 1 });
    res.json({
      success: true,
      data: difficulties
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching difficulties',
      error: error.message
    });
  }
};

exports.getDifficultyById = async (req, res) => {
  try {
    const difficulty = await Difficulty.findOne({ _id: req.params.id, isActive: true });
    if (!difficulty) {
      return res.status(404).json({
        success: false,
        message: 'Difficulty not found'
      });
    }
    res.json({
      success: true,
      data: difficulty
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching difficulty',
      error: error.message
    });
  }
};

exports.createDifficulty = async (req, res) => {
  try {
    const difficulty = new Difficulty(req.body);
    await difficulty.save();
    res.status(201).json({
      success: true,
      data: difficulty,
      message: 'Difficulty created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating difficulty',
      error: error.message
    });
  }
};

exports.updateDifficulty = async (req, res) => {
  try {
    const difficulty = await Difficulty.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      req.body,
      { new: true, runValidators: true }
    );
    if (!difficulty) {
      return res.status(404).json({
        success: false,
        message: 'Difficulty not found'
      });
    }
    res.json({
      success: true,
      data: difficulty,
      message: 'Difficulty updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating difficulty',
      error: error.message
    });
  }
};

exports.deleteDifficulty = async (req, res) => {
  try {
    const difficulty = await Difficulty.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { isActive: false },
      { new: true }
    );
    if (!difficulty) {
      return res.status(404).json({
        success: false,
        message: 'Difficulty not found'
      });
    }
    res.json({
      success: true,
      message: 'Difficulty deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting difficulty',
      error: error.message
    });
  }
};

// Tag Controllers
exports.getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find({ isActive: true }).sort({ name: 1 });
    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tags',
      error: error.message
    });
  }
};

exports.getTagById = async (req, res) => {
  try {
    const tag = await Tag.findOne({ _id: req.params.id, isActive: true });
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }
    res.json({
      success: true,
      data: tag
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tag',
      error: error.message
    });
  }
};

exports.createTag = async (req, res) => {
  try {
    const tag = new Tag(req.body);
    await tag.save();
    res.status(201).json({
      success: true,
      data: tag,
      message: 'Tag created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating tag',
      error: error.message
    });
  }
};

exports.updateTag = async (req, res) => {
  try {
    const tag = await Tag.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      req.body,
      { new: true, runValidators: true }
    );
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }
    res.json({
      success: true,
      data: tag,
      message: 'Tag updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating tag',
      error: error.message
    });
  }
};

exports.deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { isActive: false },
      { new: true }
    );
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }
    res.json({
      success: true,
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting tag',
      error: error.message
    });
  }
};

// Swatch Controllers
exports.getAllSwatches = async (req, res) => {
  try {
    const swatches = await Swatch.find({ isActive: true }).sort({ name: 1 });
    res.json({
      success: true,
      data: swatches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching swatches',
      error: error.message
    });
  }
};

exports.getSwatchById = async (req, res) => {
  try {
    const swatch = await Swatch.findOne({ _id: req.params.id, isActive: true });
    if (!swatch) {
      return res.status(404).json({
        success: false,
        message: 'Swatch not found'
      });
    }
    res.json({
      success: true,
      data: swatch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching swatch',
      error: error.message
    });
  }
};

exports.createSwatch = async (req, res) => {
  try {
    const swatch = new Swatch(req.body);
    await swatch.save();
    res.status(201).json({
      success: true,
      data: swatch,
      message: 'Swatch created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating swatch',
      error: error.message
    });
  }
};

exports.updateSwatch = async (req, res) => {
  try {
    const swatch = await Swatch.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      req.body,
      { new: true, runValidators: true }
    );
    if (!swatch) {
      return res.status(404).json({
        success: false,
        message: 'Swatch not found'
      });
    }
    res.json({
      success: true,
      data: swatch,
      message: 'Swatch updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating swatch',
      error: error.message
    });
  }
};

exports.deleteSwatch = async (req, res) => {
  try {
    const swatch = await Swatch.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { isActive: false },
      { new: true }
    );
    if (!swatch) {
      return res.status(404).json({
        success: false,
        message: 'Swatch not found'
      });
    }
    res.json({
      success: true,
      message: 'Swatch deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting swatch',
      error: error.message
    });
  }
};
