const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (for reading materials)
router.get('/', materialController.getAllMaterials);
router.get('/types', materialController.getMaterialTypes);
router.get('/fibers', materialController.getMaterialFibers);
router.get('/brands', materialController.getMaterialBrands);
router.get('/:id', materialController.getMaterialById);

// Protected routes (for creating/updating materials)
router.post('/', authMiddleware, materialController.createMaterial);
router.put('/:id', authMiddleware, materialController.updateMaterial);
router.delete('/:id', authMiddleware, materialController.deleteMaterial);

module.exports = router;
