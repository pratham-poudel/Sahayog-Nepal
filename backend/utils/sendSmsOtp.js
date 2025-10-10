const axios = require('axios');

/**
 * Send OTP to phone number via SMS using AkashSMS API
 * @param {string} phoneNumber - The phone number to send SMS to
 * @param {string} otp - The OTP code to send
 * @returns {Promise<boolean>} - Returns true if SMS was sent successfully
 */
const sendSmsOtp = async (phoneNumber, otp) => {
    try {
        const apiKey = process.env.AKASHSMS_API_KEY;
        const apiUrl = process.env.AKASHSMS_API_URL;

        // Validate API credentials
        if (!apiKey || !apiUrl) {
            console.error('SMS API credentials not configured');
            throw new Error('SMS service not configured. Please contact support.');
        }

        // Validate phone number
        if (!phoneNumber || typeof phoneNumber !== 'string') {
            throw new Error('Invalid phone number');
        }

        // Format the SMS message
        const body = `Your verification OTP is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`;

        // Build the API URL with parameters
        const url = `${apiUrl}/?auth_token=${encodeURIComponent(apiKey)}&to=${encodeURIComponent(phoneNumber)}&text=${encodeURIComponent(body)}`;

        // Send SMS via GET request
        const response = await axios.get(url);

        console.log('SMS sent successfully:', response.data);
        console.log(`[SMS OTP SENT] Phone: ${phoneNumber}, Timestamp: ${new Date().toISOString()}`);

        return true;
    } catch (error) {
        console.error('Error sending SMS OTP:', error.message);
        
        // Log detailed error for debugging
        if (error.response) {
            console.error('SMS API Error Response:', {
                status: error.response.status,
                data: error.response.data
            });
        }

        throw new Error('Failed to send SMS. Please try again later.');
    }
};

module.exports = { sendSmsOtp };
