const axios = require('axios');
require('dotenv').config();

/**
 * Sinch Verification Service
 * This utility handles phone number verification using Sinch API
 */
class SinchVerification {
  constructor() {
    this.appKey = process.env.SINCH_APP_KEY;
    this.appSecret = process.env.SINCH_APP_SECRET;
    this.baseUrl = 'https://verification.api.sinch.com/verification/v1';
  }

  /**
   * Initiate phone verification via SMS
   * @param {string} phoneNumber - The phone number to verify (E.164 format)
   * @returns {Promise<Object>} - Verification response
   */
  async startVerification(phoneNumber) {
    try {
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/verifications`,
        auth: {
          username: this.appKey,
          password: this.appSecret
        },
        data: {
          identity: {
            type: 'number',
            endpoint: phoneNumber
          },
          method: 'sms'
        }
      });

      return {
        success: true,
        id: response.data.id,
        status: response.data.status
      };
    } catch (error) {
      console.error('Sinch verification error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Verify the code received by the user
   * @param {string} verificationId - The ID received from startVerification
   * @param {string} code - The verification code received by the user
   * @returns {Promise<Object>} - Verification result
   */
  async verifyCode(verificationId, code) {
    try {
      const response = await axios({
        method: 'put',
        url: `${this.baseUrl}/verifications/id/${verificationId}`,
        auth: {
          username: this.appKey,
          password: this.appSecret
        },
        data: {
          method: 'sms',
          sms: {
            code: code
          }
        }
      });

      return {
        success: true,
        status: response.data.status
      };
    } catch (error) {
      console.error('Sinch verification error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

module.exports = new SinchVerification();
