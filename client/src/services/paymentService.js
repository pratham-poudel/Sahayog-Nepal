import axios from 'axios';
import { API_URL } from '../config/index';

// Service for payment-related API calls
const paymentService = {
  /**
   * Initiate a payment using Khalti
   * @param {Object} paymentData - Payment information including amount, campaignId, etc.
   * @returns {Promise} - Promise with payment initialization data
   */
  initiateKhaltiPayment: async (paymentData) => {
    try {
      // First make a call to our backend to create a payment record and get the payment URL
      const response = await axios.post(`${API_URL}/api/payments/khalti/initiate`, paymentData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to initialize payment');
      }
      
      // Return the payment data which includes the Khalti payment URL
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error initiating Khalti payment:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Payment initialization failed'
      };
    }
  },

  /**
   * Initiate a payment using eSewa
   * @param {Object} paymentData - Payment information including amount, campaignId, etc.
   * @returns {Promise} - Promise with payment initialization data
   */
  initiateEsewaPayment: async (paymentData) => {
    try {
      // Make a call to our backend to create a payment record and get the eSewa form data
      const response = await axios.post(`${API_URL}/api/payments/esewa/initiate`, paymentData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to initialize payment');
      }
      
      // Return the payment data which includes the eSewa form data
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error initiating eSewa payment:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Payment initialization failed'
      };
    }
  },

  /**
   * Initiate a payment using Fonepay (PhonePay)
   * @param {Object} paymentData - Payment information including amount, campaignId, etc.
   * @returns {Promise} - Promise with payment initialization data including QR code
   */
  initiateFonepayPayment: async (paymentData) => {
    try {
      // Make a call to our backend to create a payment record and get the Fonepay QR code
      const response = await axios.post(`${API_URL}/api/payments/fonepay/initiate`, paymentData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to initialize payment');
      }
      
      // Return the payment data which includes the Fonepay QR code
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error initiating Fonepay payment:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Payment initialization failed'
      };
    }
  },
  
  /**
   * Check status of a Fonepay payment
   * @param {string} paymentId - Payment ID to check
   * @returns {Promise} - Promise with payment status information
   */
  checkFonepayStatus: async (paymentId) => {
    try {
      const response = await axios.post(`${API_URL}/api/payments/fonepay/status`, { paymentId }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to check payment status');
      }
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error checking Fonepay payment status:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Payment status check failed'
      };
    }
  },

  /**
   * Create and submit an eSewa payment form
   * @param {Object} formData - Form data for eSewa payment
   * @param {string} formUrl - URL to submit the form to
   * @returns {void} - This function creates and submits a form
   */
  submitEsewaForm: (formData, formUrl) => {
    try {
      console.log('eSewa form data:', formData);
      console.log('eSewa form URL:', formUrl);
      
      // Create a form element
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = formUrl;
      form.target = '_self'; // Open in the same window
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
        console.log(`Added form field: ${key}=${value}`);
      });
      
      // Append form to body
      document.body.appendChild(form);
      
      // Log before submitting
      console.log('Submitting eSewa form...');
      
      // Submit the form
      form.submit();
      
      // Optionally remove the form after submission
      setTimeout(() => {
        if (form && form.parentNode) {
          form.parentNode.removeChild(form);
        }
      }, 1000);
    } catch (error) {
      console.error('Error submitting eSewa form:', error);
      throw new Error('Failed to submit payment form. Please try again.');
    }
  },

  /**
   * Verify Khalti payment status
   * @param {string} pidx - Payment ID from Khalti
   * @returns {Promise} - Promise with payment verification result
   */
  verifyKhaltiPayment: async (pidx) => {
    try {
      const response = await axios.post(`${API_URL}/api/payments/khalti/verify`, { pidx });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Payment verification failed');
      }
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error verifying Khalti payment:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Payment verification failed'
      };
    }
  },

  /**
   * Verify eSewa payment status
   * @param {string} transaction_uuid - Transaction UUID or Payment ID
   * @returns {Promise} - Promise with payment verification result
   */
  verifyEsewaPayment: async (transaction_uuid, paymentId) => {
    try {
      const response = await axios.post(`${API_URL}/api/payments/esewa/verify`, { 
        transaction_uuid,
        paymentId
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Payment verification failed');
      }
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error verifying eSewa payment:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Payment verification failed'
      };
    }
  },

  /**
   * Get payment details by ID
   * @param {string} paymentId - Payment ID to fetch
   * @returns {Promise} - Promise with payment details
   */
  getPaymentById: async (paymentId) => {
    try {
      const response = await axios.get(`${API_URL}/api/payments/${paymentId}`,{
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch payment details');
      }
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching payment:', error);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to fetch payment details'
      };
    }
  },

  /**
   * Get all payments for the logged-in user
   * @returns {Promise} - Promise with user's payments
   */
  getUserPayments: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/payments/user/payments`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user payments:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get all payments for a campaign (campaign owner or admin only)
   * @param {string} campaignId - Campaign ID
   * @returns {Promise} - Promise with campaign payments
   */
  getCampaignPayments: async (campaignId) => {
    try {
      const response = await axios.get(`${API_URL}/api/payments/campaign/${campaignId}`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign payments:', error);
      throw error.response?.data || error;
    }
  },
};

export default paymentService; 