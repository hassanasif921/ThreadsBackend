const jwt = require('jsonwebtoken');

/**
 * JWT Utility functions for token generation and verification
 */
const jwtUtils = {
  /**
   * Generate a JWT token for a user or custom payload
   * @param {Object} user - User object containing id and other data, or custom payload
   * @param {String} expiresIn - Optional custom expiration time (e.g., '15m', '1h', '7d')
   * @returns {String} JWT token
   */
  generateToken: (user, expiresIn = null) => {
    // If user is a regular user object with _id
    if (user._id) {
      return jwt.sign(
        { 
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        process.env.JWT_SECRET,
        { expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '30d' }
      );
    } 
    // If user is a custom payload
    else {
      return jwt.sign(
        user,
        process.env.JWT_SECRET,
        { expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || '30d' }
      );
    }
  },

  /**
   * Verify a JWT token
   * @param {String} token - JWT token to verify
   * @returns {Object} Decoded token payload or null if invalid
   */
  verifyToken: (token) => {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
};

module.exports = jwtUtils;
