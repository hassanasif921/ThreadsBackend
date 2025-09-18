const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadProfile } = require('../middleware/uploadMiddleware');

// User registration route
router.post('/register', userController.register);

// Email verification route
router.post('/verify-email', userController.verifyEmail);

// Resend OTP route
router.post('/resend-otp', userController.resendOTP);

// Accept terms and conditions route
router.post('/accept-terms', userController.acceptTerms);

// Forgot password route
router.post('/forgot-password', userController.forgotPassword);

// Verify reset OTP route
router.post('/verify-reset-otp', userController.verifyResetOTP);

// Reset password route
router.post('/reset-password', userController.resetPassword);

// User login route
router.post('/login', userController.login);

// Get user profile route (protected by JWT auth)
router.get('/profile/:id', authMiddleware, userController.getProfile);

// Protected routes (require authentication)
router.post('/profile', authMiddleware, uploadProfile.single('profilePicture'), userController.updateProfile);
router.post('/change-password', authMiddleware, userController.changePassword);

module.exports = router;
