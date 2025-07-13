import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import paymentService from '../../services/paymentService';
import { APP_CONFIG } from '../../config/index';
import { useToast } from '@/hooks/use-toast';

const PaymentCancel = () => {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Parse query parameters
  const query = new URLSearchParams(window.location.search);
  const paymentId = query.get('paymentId');
  const status = query.get('status');
  
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (paymentId) {
        try {
          setLoading(true);
          const response = await paymentService.getPaymentById(paymentId);          if (response.success) {
            setPayment(response.data);
          } else {
            toast({
              title: "Error",
              description: "Could not fetch payment details",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error fetching payment details:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to load payment details",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    fetchPaymentDetails();
  }, [paymentId, toast]);
  
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div 
        className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-bold mb-2">Payment Canceled</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
            {status === 'User canceled' 
              ? 'You have canceled the payment process.' 
              : 'Your payment was not completed.'}
          </p>
          
          {payment && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-8 max-w-md mx-auto text-left">
              <h3 className="font-semibold text-lg mb-4 text-center">Donation Details</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Campaign:</span>
                  <span className="font-medium">{payment.campaignId?.title || 'Campaign'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                  <span className="font-medium">{APP_CONFIG.currencySymbol} {(payment.amount / 100).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="font-medium text-amber-600">{payment.status}</span>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Would you like to try again or explore other campaigns?
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {payment && (
              <Link href={`/campaign/${payment.campaignId?._id}`}>
                <motion.button 
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try Again
                </motion.button>
              </Link>
            )}
            
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
                className="px-6 py-3 border border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400 rounded-lg font-medium"
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

export default PaymentCancel; 