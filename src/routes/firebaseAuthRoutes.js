const express = require('express');
const router = express.Router();
const firebaseAuthController = require('../controllers/firebaseAuthController');
const authMiddleware = require('../middleware/authMiddleware');

// Firebase authentication route - verify token and sign in/register user
router.post('/verify-token', firebaseAuthController.verifyTokenAndSignIn);

// Update user profile after Firebase authentication (protected route)
router.put('/profile/:userId', authMiddleware, firebaseAuthController.updateProfile);

module.exports = router;
