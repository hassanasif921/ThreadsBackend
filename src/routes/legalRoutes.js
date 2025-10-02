const express = require('express');
const router = express.Router();
const legalController = require('../controllers/legalController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.get('/privacy-policy', legalController.getPrivacyPolicy);
router.get('/terms-conditions', legalController.getTermsAndConditions);
router.get('/all', legalController.getAllLegalContent);
router.get('/:type', legalController.getContentByType);

// Admin routes (require authentication)
router.use(authMiddleware); // Apply auth middleware to routes below

router.post('/:type', legalController.createOrUpdateLegalContent);
router.put('/:type', legalController.createOrUpdateLegalContent);
router.get('/:type/history', legalController.getContentHistory);
router.delete('/:type', legalController.deleteLegalContent);

module.exports = router;
