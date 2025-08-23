const { auth, isConfigured } = require('../config/firebase');
const User = require('../models/User');
const jwtUtils = require('../utils/jwtUtils');

/**
 * Firebase Authentication Controller
 * Handles authentication using Firebase tokens from mobile apps
 */
const firebaseAuthController = {
  /**
   * Verify Firebase ID token and sign in or register user
   * @param {Object} req - Express request object with idToken in body
   * @param {Object} res - Express response object
   * @returns {Object} - Response with JWT token and user data
   */
  verifyTokenAndSignIn: async (req, res) => {
    try {
      // Check if Firebase is configured
      if (!isConfigured) {
        return res.status(501).json({
          success: false,
          message: 'Firebase authentication is not configured on the server'
        });
      }

      const { idToken, termsAccepted } = req.body;
      
      if (!idToken) {
        return res.status(400).json({
          success: false,
          message: 'ID token is required'
        });
      }
      
      // Verify the Firebase ID token
      const decodedToken = await auth.verifyIdToken(idToken);
      
      // Extract user information from the decoded token
      const {
        uid: firebaseUid,
        email,
        email_verified: emailVerified,
        name,
        picture,
        firebase: { sign_in_provider: provider }
      } = decodedToken;
      
      // Check if user already exists in our database
      let user = await User.findOne({ firebaseUid });
      
      if (!user) {
        // Check if user exists with the same email
        user = await User.findOne({ email });
        
        if (user) {
          // Update existing user with Firebase UID
          user.firebaseUid = firebaseUid;
          
          // If user wasn't verified before but is now verified through Firebase
          if (!user.emailVerified && emailVerified) {
            user.emailVerified = true;
          }
          
          await user.save();
        } else {
          // Create new user
          // Extract first and last name from the full name
          let firstName = name;
          let lastName = '';
          
          if (name && name.includes(' ')) {
            const nameParts = name.split(' ');
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
          }
          
          user = new User({
            firstName,
            lastName,
            email,
            emailVerified,
            firebaseUid,
            // Set provider-specific fields
            ...(provider === 'google.com' && { googleId: decodedToken.sub }),
            ...(provider === 'apple.com' && { appleId: decodedToken.sub }),
            // Generate a random password as we'll use Firebase for auth
            password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
            // Set a placeholder phone number (can be updated later)
            phoneNumber: 'Please update'
          });
          
          await user.save();
        }
      }
      
      // Check if terms are accepted or being accepted now
      if (!user.termsAccepted && !termsAccepted) {
        return res.status(403).json({
          success: false,
          message: 'Terms and conditions must be accepted',
          requiresTerms: true,
          userId: user._id
        });
      }
      
      // Update terms acceptance if provided in this request
      if (!user.termsAccepted && termsAccepted) {
        user.termsAccepted = true;
        user.termsAcceptedAt = new Date();
        await user.save();
      }
      
      // Generate JWT token for our API
      const token = jwtUtils.generateToken(user);
      
      return res.status(200).json({
        success: true,
        message: 'Authentication successful',
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          emailVerified: user.emailVerified,
          termsAccepted: user.termsAccepted
        }
      });
    } catch (error) {
      console.error('Firebase authentication error:', error);
      return res.status(401).json({
        success: false,
        message: 'Authentication failed',
        error: error.message
      });
    }
  },
  
  /**
   * Update user profile after authentication
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response with updated user data
   */
  updateProfile: async (req, res) => {
    try {
      const { userId } = req.params;
      const { firstName, lastName, phoneNumber } = req.body;
      
      // Find user by ID
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Update user fields
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (phoneNumber) user.phoneNumber = phoneNumber;
      
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          emailVerified: user.emailVerified
        }
      });
    } catch (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during profile update',
        error: error.message
      });
    }
  }
};

module.exports = firebaseAuthController;
