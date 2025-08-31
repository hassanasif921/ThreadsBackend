const express = require('express');
const router = express.Router();
const taxonomyController = require('../controllers/taxonomyController');
const authMiddleware = require('../middleware/authMiddleware');

// Family routes
router.get('/families', taxonomyController.getAllFamilies);
router.get('/families/:id', taxonomyController.getFamilyById);
router.post('/families', authMiddleware, taxonomyController.createFamily);
router.put('/families/:id', authMiddleware, taxonomyController.updateFamily);
router.delete('/families/:id', authMiddleware, taxonomyController.deleteFamily);

// Usage routes
router.get('/usages', taxonomyController.getAllUsages);
router.get('/usages/:id', taxonomyController.getUsageById);
router.post('/usages', authMiddleware, taxonomyController.createUsage);
router.put('/usages/:id', authMiddleware, taxonomyController.updateUsage);
router.delete('/usages/:id', authMiddleware, taxonomyController.deleteUsage);

// Difficulty routes
router.get('/difficulties', taxonomyController.getAllDifficulties);
router.get('/difficulties/:id', taxonomyController.getDifficultyById);
router.post('/difficulties', authMiddleware, taxonomyController.createDifficulty);
router.put('/difficulties/:id', authMiddleware, taxonomyController.updateDifficulty);
router.delete('/difficulties/:id', authMiddleware, taxonomyController.deleteDifficulty);

// Tag routes
router.get('/tags', taxonomyController.getAllTags);
router.get('/tags/:id', taxonomyController.getTagById);
router.post('/tags', authMiddleware, taxonomyController.createTag);
router.put('/tags/:id', authMiddleware, taxonomyController.updateTag);
router.delete('/tags/:id', authMiddleware, taxonomyController.deleteTag);

// Swatch routes
router.get('/swatches', taxonomyController.getAllSwatches);
router.get('/swatches/:id', taxonomyController.getSwatchById);
router.post('/swatches', authMiddleware, taxonomyController.createSwatch);
router.put('/swatches/:id', authMiddleware, taxonomyController.updateSwatch);
router.delete('/swatches/:id', authMiddleware, taxonomyController.deleteSwatch);

module.exports = router;
