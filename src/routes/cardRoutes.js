const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const authMiddleware = require('../middleware/authMiddleware');

// All card routes require authentication
router.use(authMiddleware);

// Get user's saved cards
router.get('/', cardController.getUserCards);

// Add a new card
router.post('/', cardController.addCard);

// Get default card
router.get('/default', cardController.getDefaultCard);

// Update card (set as default, etc.)
router.put('/:cardId', cardController.updateCard);

// Remove a card
router.delete('/:cardId', cardController.removeCard);

module.exports = router;
