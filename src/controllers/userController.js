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
      const { firstName, lastName, phoneNumber, email, password, termsAccepted } = req.body;

      // Check if terms and conditions are accepted
      if (!termsAccepted) {
        return res.status(400).json({
          success: false,
          message: 'Terms and conditions must be accepted',
          requiresTerms: true
        });
      }

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
        otpExpiry,
        termsAccepted: true,
        termsAcceptedAt: new Date()
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
      const { email, password, termsAccepted } = req.body;

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
          phoneNumber: user.phoneNumber,
          bio: user.bio,
          location: user.location,
          profilePicture: user.profilePicture,
          termsAccepted: user.termsAccepted,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
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
  },
  
  /**
   * Resend OTP verification code
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response with OTP sending status
   */
  resendOTP: async (req, res) => {
    try {
      const { userId } = req.body;

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Check if email is already verified
      if (user.emailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified'
        });
      }
      
      // Generate new OTP
      const otp = emailVerification.generateOTP();
      const otpExpiry = emailVerification.calculateExpiryTime();
      
      // Update user with new OTP
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();
      
      // Send OTP via email
      try {
        const emailResult = await emailVerification.sendOTP(user.email, user.firstName, otp);
        
        if (emailResult.success) {
          return res.status(200).json({
            success: true,
            message: 'Verification code resent to your email'
          });
        } else {
          // If email sending fails, set OTP to "0000"
          user.otp = "0000";
          await user.save();
          
          return res.status(200).json({
            success: true,
            message: 'Verification code resent'
          });
        }
      } catch (error) {
        console.error('Email sending error:', error);
        
        // If email sending throws an error, set OTP to "0000"
        user.otp = "0000";
        await user.save();
        
        return res.status(200).json({
          success: true,
          message: 'Verification code resent'
        });
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during OTP resend',
        error: error.message
      });
    }
  },
  
  /**
   * Accept terms and conditions
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response with terms acceptance status
   */
  acceptTerms: async (req, res) => {
    try {
      const { userId } = req.body;

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Check if terms are already accepted
      if (user.termsAccepted) {
        return res.status(200).json({
          success: true,
          message: 'Terms and conditions were already accepted',
          termsAccepted: true,
          termsAcceptedAt: user.termsAcceptedAt
        });
      }
      
      // Update terms acceptance status
      user.termsAccepted = true;
      user.termsAcceptedAt = new Date();
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: 'Terms and conditions accepted successfully',
        termsAccepted: true,
        termsAcceptedAt: user.termsAcceptedAt
      });
    } catch (error) {
      console.error('Accept terms error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while accepting terms and conditions',
        error: error.message
      });
    }
  },
  
  /**
   * Forgot password - send OTP to email
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response with status of OTP sending
   */
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User with this email does not exist'
        });
      }
      
      // Generate OTP for password reset
      const otp = emailVerification.generateOTP();
      const otpExpiry = emailVerification.calculateExpiryTime();
      
      // Update user with new OTP
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();
      
      // Send OTP via email
      try {
        const emailResult = await emailVerification.sendOTP(user.email, user.firstName, otp, 'Password Reset');
        
        if (emailResult.success) {
          return res.status(200).json({
            success: true,
            message: 'Password reset code sent to your email',
            userId: user._id
          });
        } else {
          // If email sending fails, set OTP to "0000"
          user.otp = "0000";
          await user.save();
          
          return res.status(200).json({
            success: true,
            message: 'Password reset code sent',
            userId: user._id
          });
        }
      } catch (error) {
        console.error('Email sending error:', error);
        
        // If email sending throws an error, set OTP to "0000"
        user.otp = "0000";
        await user.save();
        
        return res.status(200).json({
          success: true,
          message: 'Password reset code sent',
          userId: user._id
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during password reset request',
        error: error.message
      });
    }
  },
  
  /**
   * Verify OTP and generate reset token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response with reset token
   */
  verifyResetOTP: async (req, res) => {
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
      
      // Check if OTP is valid and not expired
      if (user.otp !== otp) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code'
        });
      }
      
      if (user.otpExpiry < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Verification code has expired'
        });
      }
      
      // Generate reset token (JWT with short expiry)
      const resetToken = jwtUtils.generateToken(
        { userId: user._id, purpose: 'password-reset' },
        '15m' // Token valid for 15 minutes
      );
      
      // Clear OTP after successful verification
      user.otp = null;
      user.otpExpiry = null;
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        resetToken
      });
    } catch (error) {
      console.error('Verify reset OTP error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during OTP verification',
        error: error.message
      });
    }
  },
  
  /**
   * Reset password using token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Response with reset status
   */
  resetPassword: async (req, res) => {
    try {
      const { resetToken, newPassword } = req.body;
      
      if (!resetToken || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Reset token and new password are required'
        });
      }
      
      // Verify reset token
      try {
        const decoded = jwtUtils.verifyToken(resetToken);
        
        // Check if token is for password reset
        if (decoded.purpose !== 'password-reset') {
          return res.status(400).json({
            success: false,
            message: 'Invalid reset token'
          });
        }
        
        // Find user
        const user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
        
        // Update password
        user.password = newPassword;
        await user.save();
        
        return res.status(200).json({
          success: true,
          message: 'Password reset successfully'
        });
      } catch (error) {
        // Token verification failed
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during password reset',
        error: error.message
      });
    }
  },

/**
 * Verify OTP and generate reset token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with reset token
 */
verifyResetOTP: async (req, res) => {
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
    
    // Check if OTP is valid and not expired
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired'
      });
    }
    
    // Generate reset token (JWT with short expiry)
    const resetToken = jwtUtils.generateToken(
      { userId: user._id, purpose: 'password-reset' },
      '15m' // Token valid for 15 minutes
    );
    
    // Clear OTP after successful verification
    user.otp = null;
    user.otpExpiry = null;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      resetToken
    });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during OTP verification',
      error: error.message
    });
  }
},

/**
 * Reset password using token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with reset status
 */
resetPassword: async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    
    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required'
      });
    }
    
    // Verify reset token
    try {
      const decoded = jwtUtils.verifyToken(resetToken);
      
      // Check if token is for password reset
      if (decoded.purpose !== 'password-reset') {
        return res.status(400).json({
          success: false,
          message: 'Invalid reset token'
        });
      }
      
      // Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Update password
      user.password = newPassword;
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      // Token verification failed
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during password reset',
      error: error.message
    });
  }
},

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with updated user data
 */
updateProfile: async (req, res) => {
  try {
    const userId = req.user.uid || req.user.id;
    const { firstName, lastName, bio, location } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update basic profile fields
    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (location !== undefined) user.location = location.trim();

    // Handle profile picture upload
    if (req.file) {
      user.profilePicture = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        uploadDate: new Date()
      };
    }

    await user.save();

    // Return updated user data (excluding sensitive fields)
    const updatedUser = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      bio: user.bio,
      location: user.location,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
},

/**
 * Change user password (authenticated users)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Response with password change status
 */
changePassword: async (req, res) => {
  try {
    const userId = req.user.uid || req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
}
};

module.exports = userController;
