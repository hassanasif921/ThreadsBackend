const Step = require('../models/Step');
const Stitch = require('../models/Stitch');
const { processUploadedFiles } = require('../utils/fileUtils');

// Get all steps for a stitch
exports.getStepsByStitch = async (req, res) => {
  try {
    const { id: stitchId } = req.params;

    // Verify stitch exists
    const stitch = await Stitch.findOne({ _id: stitchId, isActive: true });
    if (!stitch) {
      return res.status(404).json({
        success: false,
        message: 'Stitch not found'
      });
    }

    const steps = await Step.find({ stitch: stitchId, isActive: true })
      .sort({ stepNumber: 1 });

    res.json({
      success: true,
      data: steps
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching steps',
      error: error.message
    });
  }
};

// Create new step
exports.createStep = async (req, res) => {
  try {
    const { stitchId } = req.params;
    const stepData = { ...req.body, stitch: stitchId };

    // Verify stitch exists
    const stitch = await Stitch.findOne({ _id: stitchId, isActive: true });
    if (!stitch) {
      return res.status(404).json({
        success: false,
        message: 'Stitch not found'
      });
    }

    // Process uploaded files
    if (req.files) {
      if (req.files.images) {
        stepData.images = processUploadedFiles(req.files.images);
      }
      if (req.files.videos) {
        stepData.videos = processUploadedFiles(req.files.videos);
      }
    }

    const step = new Step(stepData);
    await step.save();

    res.status(201).json({
      success: true,
      data: step,
      message: 'Step created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating step',
      error: error.message
    });
  }
};

// Update step
exports.updateStep = async (req, res) => {
  try {
    const { stitchId, stepId } = req.params;
    const stepData = { ...req.body };

    // Process uploaded files
    if (req.files) {
      if (req.files.images) {
        stepData.images = processUploadedFiles(req.files.images);
      }
      if (req.files.videos) {
        stepData.videos = processUploadedFiles(req.files.videos);
      }
    }

    const step = await Step.findOneAndUpdate(
      { _id: stepId, stitch: stitchId, isActive: true },
      stepData,
      { new: true, runValidators: true }
    );

    if (!step) {
      return res.status(404).json({
        success: false,
        message: 'Step not found'
      });
    }

    res.json({
      success: true,
      data: step,
      message: 'Step updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating step',
      error: error.message
    });
  }
};

// Delete step (soft delete)
exports.deleteStep = async (req, res) => {
  try {
    const { stitchId, stepId } = req.params;

    const step = await Step.findOneAndUpdate(
      { _id: stepId, stitch: stitchId, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!step) {
      return res.status(404).json({
        success: false,
        message: 'Step not found'
      });
    }

    res.json({
      success: true,
      message: 'Step deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting step',
      error: error.message
    });
  }
};
