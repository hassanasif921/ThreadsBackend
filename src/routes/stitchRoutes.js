const express = require('express');
const router = express.Router();
const stitchController = require('../controllers/stitchController');
const stepController = require('../controllers/stepController');
const userProgressController = require('../controllers/userProgressController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Protected stitch routes (require authentication)
router.get('/', authMiddleware, stitchController.getAllStitches);
router.get('/search', authMiddleware, stitchController.searchStitches);
router.get('/:id', authMiddleware, stitchController.getStitchById);
router.get('/:id/steps', authMiddleware, stepController.getStepsByStitch);

// Protected stitch routes (require authentication)
router.post('/', authMiddleware, upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 5 }
]), stitchController.createStitch);

router.put('/:id', authMiddleware, upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 5 }
]), stitchController.updateStitch);

router.delete('/:id', authMiddleware, stitchController.deleteStitch);

// Step routes
router.post('/:stitchId/steps', authMiddleware, upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'videos', maxCount: 2 }
]), stepController.createStep);

router.put('/:stitchId/steps/:stepId', authMiddleware, upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'videos', maxCount: 2 }
]), stepController.updateStep);

router.delete('/:stitchId/steps/:stepId', authMiddleware, stepController.deleteStep);

// User progress routes (require authentication)
router.get('/:id/progress', authMiddleware, userProgressController.getUserProgress);
router.post('/:id/progress', authMiddleware, userProgressController.updateUserProgress);
router.post('/:id/favorite', authMiddleware, userProgressController.toggleFavorite);
router.post('/:id/steps/:stepId/complete', authMiddleware, userProgressController.markStepComplete);
router.delete('/:id/steps/:stepId/complete', authMiddleware, userProgressController.unmarkStepComplete);

module.exports = router;
