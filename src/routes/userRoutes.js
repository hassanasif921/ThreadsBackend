const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// User registration route
router.post('/register', userController.register);

// Email verification route
router.post('/verify-email', userController.verifyEmail);

// User login route
router.post('/login', userController.login);

// Get user profile route (protected by JWT auth)
router.get('/profile/:id', authMiddleware, userController.getProfile);

module.exports = router;
