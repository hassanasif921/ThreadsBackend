const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { requirePremiumAccess, checkTrialEligibility, validateSubscriptionOwnership } = require('../middleware/subscriptionMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/plans', subscriptionController.getSubscriptionPlans);
router.post('/webhook', subscriptionController.handleWebhook);

// Protected routes (require authentication)
router.use(authMiddleware); // Apply authentication to all routes below

// User subscription management
router.get('/my-subscription', subscriptionController.getUserSubscription);
router.post('/subscribe', subscriptionController.createSubscription);
router.put('/update', subscriptionController.updateSubscription);
router.post('/cancel', subscriptionController.cancelSubscription);

// Trial management
router.post('/start-trial', checkTrialEligibility, subscriptionController.startFreeTrial);

// Payment processing
router.post('/payment', subscriptionController.processPayment);

// Premium content access (example protected route)
router.get('/premium-content', requirePremiumAccess, (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to premium content!',
    data: {
      premiumFeatures: [
        'High quality images',
        'Video tutorials',
        'Detailed instructions',
        'Pattern downloads',
        'Exclusive content'
      ]
    }
  });
});

// Admin routes (require admin role) - TODO: Add proper admin middleware
router.get('/analytics', subscriptionController.getSubscriptionAnalytics);

// Subscription-specific routes with ownership validation
router.get('/:subscriptionId', validateSubscriptionOwnership, (req, res) => {
  res.json({
    success: true,
    data: req.subscription
  });
});

module.exports = router;
