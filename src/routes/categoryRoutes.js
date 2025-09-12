const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');

// Get all stitches grouped by categories
router.get('/', categoryController.getStitchesByCategory);

// Get categories summary (names and counts only)
router.get('/summary', categoryController.getCategoriesSummary);

// Get specific category with its stitches
router.get('/:id', categoryController.getCategoryById);

module.exports = router;
