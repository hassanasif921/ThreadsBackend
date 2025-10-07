const squareService = require('../services/squareService');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

// Get subscription plans
exports.getSubscriptionPlans = async (req, res) => {
  try {
    // Define plan features
    const monthlyFeatures = [
      'Access to all premium stitches',
      'High-quality images and videos',
      'Detailed step-by-step instructions',
      'Pattern downloads',
      'Expert tips and techniques',
      'Progress tracking',
      'Unlimited access to premium content'
    ];

    const yearlyFeatures = [
      ...monthlyFeatures,
      '2 months free (save 17%)',
      'Priority customer support',
      'Early access to new patterns',
      'Exclusive yearly subscriber content'
    ];

    // Define production-ready subscription plans
    const finalPlans = [
      {
        id: process.env.SQUARE_MONTHLY_PLAN_ID || 'monthly',
        name: 'Premium Monthly',
        description: 'Monthly subscription to premium content',
        price: {
          amount: 999, // $9.99
          currency: 'USD'
        },
        billingPeriod: 'MONTHLY',
        features: monthlyFeatures,
        isRecommended: false,
        savings: null,
        displayPrice: '$9.99/month'
      },
      {
        id: process.env.SQUARE_YEARLY_PLAN_ID || 'yearly',
        name: 'Premium Yearly',
        description: 'Yearly subscription to premium content with savings',
        price: {
          amount: 9999, // $99.99
          currency: 'USD'
        },
        billingPeriod: 'ANNUAL',
        features: yearlyFeatures,
        isRecommended: true,
        savings: 'Save 17% with annual billing',
        displayPrice: '$99.99/year'
      }
    ];

    res.json({
      success: true,
      data: finalPlans,
      message: 'Subscription plans retrieved successfully',
      planCount: finalPlans.length
    });
  } catch (error) {
    console.error('Error in getSubscriptionPlans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription plans',
      error: error.message
    });
  }
};

// Get user's current subscription
exports.getUserSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const subscription = await Subscription.findOne({ userId })
      .populate('userId', 'firstName lastName email subscriptionStatus premiumAccessUntil');

    if (!subscription) {
      return res.json({
        success: true,
        data: {
          planType: 'free',
          status: 'inactive',
          hasPremiumAccess: false
        }
      });
    }

    res.json({
      success: true,
      data: {
        ...subscription.toObject(),
        hasPremiumAccess: subscription.hasPremiumAccess,
        needsRenewal: subscription.needsRenewal()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription',
      error: error.message
    });
  }
};

// Create subscription
exports.createSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId, paymentMethodId } = req.body;

    if (!planId || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID and payment method ID are required'
      });
    }

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({ 
      userId, 
      status: { $in: ['active', 'pending'] } 
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription'
      });
    }

    const result = await squareService.createSubscription(userId, planId, paymentMethodId);

    res.status(201).json({
      success: true,
      data: result.dbSubscription,
      message: 'Subscription created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating subscription',
      error: error.message
    });
  }
};

// Update subscription
exports.updateSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planId } = req.body;

    const subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // For now, we'll just update the plan type in our database
    // In a real implementation, you'd call Square API to update the subscription
    subscription.planType = squareService.getPlanTypeFromId(planId);
    await subscription.save();

    res.json({
      success: true,
      data: subscription,
      message: 'Subscription updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating subscription',
      error: error.message
    });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.query.user_id;
    console.log(userId)
    const { cancelAtPeriodEnd = true } = req.body;

    const result = await squareService.cancelSubscription(userId, cancelAtPeriodEnd);

    res.json({
      success: true,
      data: result,
      message: cancelAtPeriodEnd 
        ? 'Subscription will be cancelled at the end of the current period'
        : 'Subscription cancelled immediately'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error cancelling subscription',
      error: error.message
    });
  }
};

// Start free trial
exports.startFreeTrial = async (req, res) => {
  try {
    const userId = req.user.id;
    const { trialDays = 7 } = req.body;

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
        message: 'Free trial already used'
      });
    }

    await user.startFreeTrial(trialDays);

    // Create subscription record for trial
    const subscription = await Subscription.findOneAndUpdate(
      { userId },
      {
        userId,
        planType: 'free',
        status: 'active',
        isTrialActive: true,
        trialStart: new Date(),
        trialEnd: user.premiumAccessUntil
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      data: {
        user: {
          subscriptionStatus: user.subscriptionStatus,
          premiumAccessUntil: user.premiumAccessUntil,
          trialUsed: user.trialUsed
        },
        subscription
      },
      message: `Free trial started for ${trialDays} days`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Error starting free trial'
    });
  }
};

// Process one-time payment
exports.processPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, currency = 'USD', paymentMethodId, description } = req.body;

    if (!amount || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Amount and payment method ID are required'
      });
    }

    const customer = await squareService.getOrCreateCustomer(userId);
    const payment = await squareService.processPayment(
      amount, 
      currency, 
      paymentMethodId, 
      customer.id
    );

    res.json({
      success: true,
      data: payment,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error processing payment',
      error: error.message
    });
  }
};

// Handle Square webhooks
exports.handleWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;
    
    // Verify webhook signature (implement signature verification for production)
    // const signature = req.headers['x-square-signature'];
    // if (!verifyWebhookSignature(req.body, signature)) {
    //   return res.status(401).json({ success: false, message: 'Invalid signature' });
    // }

    await squareService.handleWebhookEvent(type, data);

    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
};

// Get subscription analytics (admin only)
exports.getSubscriptionAnalytics = async (req, res) => {
  try {
    const analytics = await Subscription.aggregate([
      {
        $group: {
          _id: '$planType',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          activeSubscriptions: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const premiumUsers = await User.countDocuments({ 
      subscriptionStatus: { $in: ['premium_monthly', 'premium_yearly', 'trial'] } 
    });

    res.json({
      success: true,
      data: {
        planAnalytics: analytics,
        totalUsers,
        premiumUsers,
        conversionRate: totalUsers > 0 ? (premiumUsers / totalUsers * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};
