const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/featured', homeController.getFeaturedStitches);
router.get('/home', homeController.getHomePageData);

// Protected routes (require user authentication)
router.get('/favorites/:userId', authMiddleware, homeController.getFavoriteStitches);
router.get('/continue-learning/:userId', authMiddleware, homeController.getContinueLearning);

module.exports = router;
