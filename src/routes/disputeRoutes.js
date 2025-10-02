const express = require('express');
const router = express.Router();
const disputeController = require('../controllers/disputeController');
const authMiddleware = require('../middleware/authMiddleware');

// Public dispute information (no authentication required)
router.get('/categories', disputeController.getDisputeCategories);

// All routes below require authentication
router.use(authMiddleware);

// User dispute management
router.post('/:userId', disputeController.createDispute);
router.get('/:userId', disputeController.getUserDisputes);
router.get('/:userId/stats', disputeController.getUserDisputeStats);
router.get('/:userId/:disputeId', disputeController.getDisputeById);
router.put('/:userId/:disputeId', disputeController.updateDispute);
router.delete('/:userId/:disputeId', disputeController.cancelDispute);

// Post-resolution actions
router.post('/:userId/:disputeId/rating', disputeController.addSatisfactionRating);

module.exports = router;
