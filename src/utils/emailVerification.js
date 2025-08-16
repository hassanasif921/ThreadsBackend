const sgMail = require('@sendgrid/mail');
require('dotenv').config();

/**
 * Email Verification Service
 * This utility handles email OTP verification using Twilio SendGrid
 */
class EmailVerification {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    this.fromEmail = process.env.FROM_EMAIL;
    this.otpExpiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;
  }

  /**
   * Generate a random OTP code
   * @param {number} length - Length of the OTP code
   * @returns {string} - Generated OTP code
   */
  generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    
    return otp;
  }

  /**
   * Send OTP via email
   * @param {string} email - Recipient's email address
   * @param {string} firstName - Recipient's first name
   * @param {string} otp - OTP code to send
   * @returns {Promise<Object>} - Email sending response
   */
  async sendOTP(email, firstName, otp) {
    try {
      const msg = {
        to: email,
        from: this.fromEmail,
        subject: 'Your Verification Code',
        text: `Hello ${firstName},\n\nYour verification code is: ${otp}\n\nThis code will expire in ${this.otpExpiryMinutes} minutes.\n\nIf you did not request this code, please ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Verification</h2>
            <p>Hello ${firstName},</p>
            <p>Your verification code is:</p>
            <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
              ${otp}
            </div>
            <p>This code will expire in ${this.otpExpiryMinutes} minutes.</p>
            <p>If you did not request this code, please ignore this email.</p>
          </div>
        `
      };

      await sgMail.send(msg);
      
      return {
        success: true,
        message: 'OTP sent successfully'
      };
    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate OTP expiry time
   * @returns {Date} - Expiry date and time
   */
  calculateExpiryTime() {
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + this.otpExpiryMinutes);
    return expiryTime;
  }

  /**
   * Check if OTP is expired
   * @param {Date} expiryTime - OTP expiry time
   * @returns {boolean} - True if expired, false otherwise
   */
  isOTPExpired(expiryTime) {
    const currentTime = new Date();
    return currentTime > new Date(expiryTime);
  }
}

module.exports = new EmailVerification();
