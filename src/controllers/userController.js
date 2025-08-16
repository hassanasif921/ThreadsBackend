const User = require('../models/User');
const emailVerification = require('../utils/emailVerification');
const jwtUtils = require('../utils/jwtUtils');

/**
 * User Controller
 * Handles user-related operations including registration and verification
 */
const userController = {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response with user data or error
   */
  register: async (req, res) => {
    try {
      const { firstName, lastName, phoneNumber, email, password } = req.body;

      // Check if user already exists by phone number or email
      const existingUser = await User.findOne({ $or: [{ phoneNumber }, { email }] });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: existingUser.email === email ? 'User with this email already exists' : 'User with this phone number already exists'
        });
      }

      // Generate OTP for email verification
      const otp = emailVerification.generateOTP();
      const otpExpiry = emailVerification.calculateExpiryTime();
      
      // Create new user
      const user = new User({
        firstName,
        lastName,
        phoneNumber,
        email,
        password,
        otp,
        otpExpiry
      });

      // Save user to database
      await user.save();

      // Try to send OTP via email
      try {
        const emailResult = await emailVerification.sendOTP(email, firstName, otp);
        
        if (emailResult.success) {
          return res.status(201).json({
            success: true,
            message: 'User registered successfully. Verification code sent to your email.',
            userId: user._id
          });
        } else {
          // If email sending fails, set OTP to "0000"
          user.otp = "0000";
          await user.save();
          
          return res.status(201).json({
            success: true,
            message: 'User registered successfully. ',
            userId: user._id
          });
        }
      } catch (error) {
        console.error('Email sending error:', error);
        
        // If email sending throws an error, set OTP to "0000"
        user.otp = "0000";
        await user.save();
        
        return res.status(201).json({
          success: true,
          message: 'User registered successfully. ',
          userId: user._id
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during registration',
        error: error.message
      });
    }
  },

  /**
   * Verify user's email with OTP code
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response with verification status
   */
  verifyEmail: async (req, res) => {
    try {
      const { userId, otp } = req.body;

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if OTP is the dummy code "0000"
      if (otp !== "0000") {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code'
        });
      }
      
      // No need to check expiry for dummy code

      // Update user verification status
      user.emailVerified = true;
      user.otp = null; // Clear OTP after successful verification
      user.otpExpiry = null; // Clear OTP expiry
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      console.error('Verification error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during verification',
        error: error.message
      });
    }
  },

  /**
   * Get user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response with user data
   */
  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response with authentication status
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if password is correct
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if email is verified
      if (!user.emailVerified) {
        return res.status(401).json({
          success: false,
          message: 'Email not verified',
          userId: user._id
        });
      }

      // Generate JWT token
      const token = jwtUtils.generateToken(user);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during login',
        error: error.message
      });
    }
  },

  getProfile: async (req, res) => {
    try {
      const userId = req.params.id;
      
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      return res.status(200).json({
        success: true,
        user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
};

module.exports = userController;
