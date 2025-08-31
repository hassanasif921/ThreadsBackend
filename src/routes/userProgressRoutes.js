const express = require('express');
const router = express.Router();
const userProgressController = require('../controllers/userProgressController');
const authMiddleware = require('../middleware/authMiddleware');

// All user progress routes require authentication
router.use(authMiddleware);

// Get user's favorite stitches
router.get('/favorites', userProgressController.getFavoriteStitches);

// Get user's progress statistics
router.get('/stats', userProgressController.getProgressStats);

module.exports = router;
