const User = require('../models/User');
const Subscription = require('../models/Subscription');

// Middleware to check if user has premium access
exports.requirePremiumAccess = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user has premium access
    const hasPremiumAccess = user.hasPremiumAccess();
    
    if (!hasPremiumAccess) {
      // Check subscription table for more detailed info
      const subscription = await Subscription.findOne({ userId });
      
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required to access this content',
        code: 'PREMIUM_REQUIRED',
        data: {
          currentPlan: user.subscriptionStatus,
          trialUsed: user.trialUsed,
          hasSubscription: !!subscription,
          subscriptionStatus: subscription?.status || 'none'
        }
      });
    }

    // Add subscription info to request for use in controllers
    req.userSubscription = {
      status: user.subscriptionStatus,
      premiumAccessUntil: user.premiumAccessUntil,
      hasPremiumAccess: true
    };

    next();
  } catch (error) {
    console.error('Premium access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking subscription status',
      error: error.message
    });
  }
};

// Middleware to check subscription status and add to request (non-blocking)
exports.checkSubscriptionStatus = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      req.userSubscription = {
        status: 'free',
        hasPremiumAccess: false,
        isAuthenticated: false
      };
      return next();
    }

    const user = await User.findById(userId);
    if (!user) {
      req.userSubscription = {
        status: 'free',
        hasPremiumAccess: false,
        isAuthenticated: true
      };
      return next();
    }

    const subscription = await Subscription.findOne({ userId });
    const hasPremiumAccess = user.hasPremiumAccess();

    req.userSubscription = {
      status: user.subscriptionStatus,
      premiumAccessUntil: user.premiumAccessUntil,
      hasPremiumAccess,
      isAuthenticated: true,
      trialUsed: user.trialUsed,
      subscription: subscription ? {
        planType: subscription.planType,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        needsRenewal: subscription.needsRenewal()
      } : null
    };

    next();
  } catch (error) {
    console.error('Subscription status check error:', error);
    // Don't block the request, just set default values
    req.userSubscription = {
      status: 'free',
      hasPremiumAccess: false,
      isAuthenticated: !!req.user?.id
    };
    next();
  }
};

// Middleware to filter premium content based on subscription
exports.filterPremiumContent = (req, res, next) => {
  // Don't filter content - let controller handle access control
  // This allows showing all stitches with proper access indicators
  next();
};

// Middleware to check trial eligibility
exports.checkTrialEligibility = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.trialUsed) {
      return res.status(400).json({
        success: false,
        message: 'Free trial already used',
        code: 'TRIAL_ALREADY_USED'
      });
    }

    // Check if user already has an active subscription
    const subscription = await Subscription.findOne({ 
      userId, 
      status: { $in: ['active', 'pending'] } 
    });

    if (subscription && subscription.planType !== 'free') {
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription',
        code: 'ALREADY_SUBSCRIBED'
      });
    }

    next();
  } catch (error) {
    console.error('Trial eligibility check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking trial eligibility',
      error: error.message
    });
  }
};

// Middleware to validate subscription ownership
exports.validateSubscriptionOwnership = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const subscriptionId = req.params.subscriptionId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const subscription = await Subscription.findOne({ 
      _id: subscriptionId,
      userId: userId 
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found or access denied'
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Subscription ownership validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating subscription ownership',
      error: error.message
    });
  }
};
