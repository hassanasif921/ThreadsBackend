const Step = require('../models/Step');
const Stitch = require('../models/Stitch');
const UserProgress = require('../models/UserProgress');
const { processUploadedFiles } = require('../utils/fileUtils');

// Get all steps for a stitch
exports.getStepsByStitch = async (req, res) => {
  try {
    const { id: stitchId } = req.params;
    const { userId } = req.query;

    // Verify stitch exists
    const stitch = await Stitch.findOne({ _id: stitchId, isActive: true });
    if (!stitch) {
      return res.status(404).json({
        success: false,
        message: 'Stitch not found'
      });
    }

    // Check subscription access
    const userHasPremium = req.userSubscription?.hasPremiumAccess || false;
    const stitchIsFree = stitch.tier === 'free' || !stitch.tier;
    const userHasAccess = stitchIsFree || userHasPremium;

    // If user doesn't have access to premium content, return limited info
    if (!userHasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required to access these steps',
        code: 'PREMIUM_REQUIRED',
        data: {
          stitchName: stitch.name,
          stitchTier: stitch.tier,
          previewSteps: 2, // Show first 2 steps as preview
          totalSteps: await Step.countDocuments({ stitch: stitchId, isActive: true }),
          subscriptionPrompt: {
            message: 'Subscribe to unlock all steps and premium features',
            benefits: ['Complete step-by-step instructions', 'High-quality images', 'Video tutorials', 'Progress tracking']
          }
        },
        userSubscription: req.userSubscription || { status: 'free', hasPremiumAccess: false }
      });
    }

    const steps = await Step.find({ stitch: stitchId, isActive: true })
      .sort({ stepNumber: 1 });

    // If userId provided, add user's active step information
    let stepsWithProgress = steps;
    if (userId) {
      stepsWithProgress = await addActiveStepToSteps(steps, userId, stitchId, userHasPremium, stitchIsFree);
    } else {
      // Add access control info even without userId
      stepsWithProgress = steps.map(step => {
        const stepObj = step.toObject();
        stepObj.is_free = stitchIsFree;
        stepObj.user_has_access = userHasAccess;
        return stepObj;
      });
    }

    res.json({
      success: true,
      data: stepsWithProgress,
      stitch: {
        name: stitch.name,
        tier: stitch.tier,
        is_free: stitchIsFree,
        user_has_access: userHasAccess
      },
      userSubscription: req.userSubscription || { status: 'free', hasPremiumAccess: false }
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

// Helper function to add active step information to steps array
async function addActiveStepToSteps(steps, userId, stitchId, userHasPremium, stitchIsFree) {
  const stepsWithProgress = [];
  
  // Get user progress for this stitch
  const userProgress = await UserProgress.findOne({
    userId: userId,
    stitch: stitchId,
    isActive: true
  });
  
  const currentStep = userProgress ? (userProgress.completedSteps || 0) : 0;
  const nextActiveStep = currentStep + 1; // Next step to work on
  
  for (const step of steps) {
    const stepObj = step.toObject();
    
    // Add subscription access info
    stepObj.is_free = stitchIsFree;
    stepObj.user_has_access = stitchIsFree || userHasPremium;
    
    // Add step status information
    stepObj.stepStatus = {
      isCompleted: step.stepNumber <= currentStep,
      isActive: step.stepNumber === nextActiveStep,
      isLocked: step.stepNumber > nextActiveStep
    };
    
    // If premium content and user doesn't have access, limit content
    if (!stitchIsFree && !userHasPremium) {
      stepObj.description = stepObj.description ? 
        stepObj.description.substring(0, 100) + '... [Premium step - Subscribe to see full instructions]' : 
        'Premium step - Subscribe to unlock';
      stepObj.images = stepObj.images ? stepObj.images.slice(0, 1) : []; // Only show first image
      stepObj.videos = []; // Hide videos for premium content
      stepObj.tips = ['Subscribe to unlock helpful tips'];
    }
    
    stepsWithProgress.push(stepObj);
  }
  
  return stepsWithProgress;
}

// Get individual step by ID
exports.getStepById = async (req, res) => {
  try {
    const { stitchId, stepId } = req.params;
    const userId = req.user?.id;

    // Verify stitch exists
    const stitch = await Stitch.findOne({ _id: stitchId, isActive: true });
    if (!stitch) {
      return res.status(404).json({
        success: false,
        message: 'Stitch not found'
      });
    }

    // Check subscription access
    const userHasPremium = req.userSubscription?.hasPremiumAccess || false;
    const stitchIsFree = stitch.tier === 'free' || !stitch.tier;
    const userHasAccess = stitchIsFree || userHasPremium;

    // If user doesn't have access to premium content, block access
    if (!userHasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required to access this step',
        code: 'PREMIUM_REQUIRED',
        data: {
          stitchName: stitch.name,
          stitchTier: stitch.tier,
          subscriptionPrompt: {
            message: 'Subscribe to unlock this step and all premium features',
            benefits: ['Complete step-by-step instructions', 'High-quality images', 'Video tutorials', 'Progress tracking']
          }
        },
        userSubscription: req.userSubscription || { status: 'free', hasPremiumAccess: false }
      });
    }

    // Find the specific step
    const step = await Step.findOne({ 
      _id: stepId, 
      stitch: stitchId, 
      isActive: true 
    });

    if (!step) {
      return res.status(404).json({
        success: false,
        message: 'Step not found'
      });
    }

    // Add subscription and progress info
    const stepObj = step.toObject();
    stepObj.is_free = stitchIsFree;
    stepObj.user_has_access = userHasAccess;

    // Add user progress if available
    if (userId) {
      const userProgress = await UserProgress.findOne({
        userId: userId,
        stitch: stitchId,
        isActive: true
      });
      
      const currentStep = userProgress ? (userProgress.completedSteps || 0) : 0;
      const nextActiveStep = currentStep + 1;
      
      stepObj.stepStatus = {
        isCompleted: step.stepNumber <= currentStep,
        isActive: step.stepNumber === nextActiveStep,
        isLocked: step.stepNumber > nextActiveStep
      };
    }

    res.json({
      success: true,
      data: stepObj,
      stitch: {
        name: stitch.name,
        tier: stitch.tier,
        is_free: stitchIsFree,
        user_has_access: userHasAccess
      },
      userSubscription: req.userSubscription || { status: 'free', hasPremiumAccess: false }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching step',
      error: error.message
    });
  }
};
