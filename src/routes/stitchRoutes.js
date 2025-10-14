const express = require('express');
const router = express.Router();
const stitchController = require('../controllers/stitchController');
const stepController = require('../controllers/stepController');
const userProgressController = require('../controllers/userProgressController');
const authMiddleware = require('../middleware/authMiddleware');
const { checkSubscriptionStatus, filterPremiumContent, requirePremiumAccess } = require('../middleware/subscriptionMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// Public routes with subscription filtering
router.get('/', checkSubscriptionStatus, filterPremiumContent, stitchController.getAllStitches);
router.get('/search', checkSubscriptionStatus, filterPremiumContent, stitchController.searchStitches);

// Favorites route (must come before /:id route to avoid conflicts)
router.get('/favorites', authMiddleware, checkSubscriptionStatus, userProgressController.getFavorites);

// Protected stitch routes (require authentication)
router.get('/:id', authMiddleware, checkSubscriptionStatus, stitchController.getStitchById);
router.get('/:id/steps', authMiddleware, checkSubscriptionStatus, stepController.getStepsByStitch);

// Premium content routes (require premium subscription)
router.get('/:id/premium-content', authMiddleware, requirePremiumAccess, (req, res) => {
  res.json({
    success: true,
    message: 'Premium content access granted',
    data: {
      highQualityImages: true,
      videoTutorials: true,
      detailedInstructions: true
    }
  });
});

// Admin routes (require authentication)
router.post('/', authMiddleware, upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 5 }
]), stitchController.createStitch);

router.put('/:id', authMiddleware, upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 5 }
]), stitchController.updateStitch);

router.delete('/:id', authMiddleware, stitchController.deleteStitch);

// Step routes
router.get('/:stitchId/steps/:stepId', authMiddleware, checkSubscriptionStatus, stepController.getStepById);

router.post('/:stitchId/steps', authMiddleware, upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'videos', maxCount: 2 }
]), stepController.createStep);

router.patch('/:stitchId/steps/:stepId', authMiddleware, upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'videos', maxCount: 2 }
]), stepController.updateStep);

router.delete('/:stitchId/steps/:stepId', authMiddleware, stepController.deleteStep);

// User progress routes (require authentication)
router.get('/:id/progress', authMiddleware, userProgressController.getUserProgress);
router.post('/:id/progress', authMiddleware, userProgressController.updateUserProgress);

// Favorite routes (require authentication)
router.post('/:id/favorite', authMiddleware, userProgressController.addToFavorites);
router.delete('/:id/favorite', authMiddleware, userProgressController.removeFromFavorites);

// Step completion routes (require authentication)
router.post('/:id/steps/:stepId/complete', authMiddleware, userProgressController.markStepComplete);
router.delete('/:id/steps/:stepId/complete', authMiddleware, userProgressController.unmarkStepComplete);

module.exports = router;
