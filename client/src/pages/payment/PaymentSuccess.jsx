import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import paymentService from '../../services/paymentService';
import { motion } from 'framer-motion';
import { APP_CONFIG } from '../../config/index';

const PaymentSuccess = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchAttempted, setFetchAttempted] = useState(false);

  // Parse query parameters
  const query = new URLSearchParams(window.location.search);
  const paymentId = query.get('paymentId');
  const pidx = query.get('pidx');
  const status = query.get('status');
  
  // Handle scenarios where we have status but not paymentId (direct Khalti callback)
  const isDirectKhaltiCallback = pidx && !paymentId;

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (fetchAttempted) return; // Prevent multiple fetch attempts
      
      try {
        setLoading(true);
        setFetchAttempted(true);
        
        // If we have a paymentId, fetch the payment details
        if (paymentId) {
          const response = await paymentService.getPaymentById(paymentId);
          if (response.success) {
            setPayment(response.data);
          } else {
            throw new Error(response.message || 'Failed to fetch payment details');
          }
        } 
        // If we have a pidx (from Khalti callback), verify the payment
        else if (pidx) {
          console.log('Verifying payment with pidx:', pidx);
          const response = await paymentService.verifyKhaltiPayment(pidx);
          if (response.success) {
            setPayment(response.data);
            // If we got the payment data successfully but don't have a paymentId in URL,
            // update the URL to include it (to prevent future API calls)
            if (response.data && response.data.paymentId && !paymentId) {
              const newUrl = `${window.location.pathname}?paymentId=${response.data.paymentId}`;
              window.history.replaceState(null, '', newUrl);
            }
          } else {
            throw new Error(response.message || 'Failed to verify payment');
          }
        } else {
          throw new Error('Payment ID or PIDX not found in URL');
        }      } catch (error) {
        console.error('Error fetching payment details:', error);
        setError(error.message || 'Something went wrong');
        toast({
          title: "Error",
          description: error.message || 'Failed to load payment details',
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (!payment && !error && (paymentId || pidx)) {
      fetchPaymentDetails();
    }
  }, [paymentId, pidx, toast, payment, error, fetchAttempted]);

  // Check if payment status indicates it's not actually successful
  const isNotSuccessful = payment && 
    ['User canceled', 'Expired', 'Failed'].includes(payment.status);

  // Redirect to cancel page if payment status indicates failure
  useEffect(() => {
    if (isNotSuccessful) {
      navigate(`/payment/cancel?paymentId=${payment._id}&status=${payment.status}`);
    }
  }, [isNotSuccessful, payment, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 mx-auto border-4 border-primary-500 border-t-transparent rounded-full mb-6"></div>
          <h2 className="text-2xl font-bold mb-2">Verifying your payment...</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we confirm your donation.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Payment Verification Failed</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/">
              <motion.button 
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Go Home
              </motion.button>
            </Link>
            <Link href="/explore">
              <motion.button 
  className="px-6 py-3 bg-red-800 text-white rounded-lg font-medium"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Explore Campaigns
</motion.button>

            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If we've determined this payment isn't actually successful but haven't redirected yet
  if (isNotSuccessful) {
    return null; // Return nothing while waiting for redirect
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div 
        className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-bold mb-2">Thank You!</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
            Your donation has been successfully processed.
          </p>
          
          {payment && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-8 max-w-md mx-auto text-left">
              <h3 className="font-semibold text-lg mb-4 text-center">Donation Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Campaign:</span>
                  <span className="font-medium">{payment.campaignId?.title || 'Campaign'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                  <span className="font-medium">{APP_CONFIG.currencySymbol} {payment.amount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Platform Fee:</span>
                  <span className="font-medium">{APP_CONFIG.currencySymbol} {payment.platformFee}</span>
                </div>
                
                <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Total:</span>
                  <span className="font-bold text-primary-600">{APP_CONFIG.currencySymbol} {payment.totalAmount}</span>
                </div>
                
                <div className="flex justify-between pt-2 mt-2">
                  <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                  <span className="font-medium text-xs break-all">{payment.transactionId || 'Pending'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="font-medium text-green-600">{payment.status}</span>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            A confirmation email has been sent to your registered email address.
            Thank you for your generosity and support!
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link href="/">
              <motion.button 
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 rounded-lg font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Go Home
              </motion.button>
            </Link>
            <Link href="/explore">
              <motion.button 
                className="px-6 py-3 bg-red-800 text-white rounded-lg font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Explore More Campaigns
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess; 