import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import PlatformFeeSlider from './PlatformFeeSlider';
import { useAuthContext } from '../../contexts/AuthContext';
import paymentService from '../../services/paymentService';
import { APP_CONFIG, PAYMENT_CONFIG } from '../../config/index';
import { useToast } from '@/hooks/use-toast';

const PaymentMethodOption = ({ id, icon, label, selected, onClick }) => (
  <motion.div
    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
      selected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400' : 'border-gray-200 dark:border-gray-700'
    }`}
    onClick={onClick}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <input 
      type="radio" 
      id={id} 
      name="payment-method" 
      className="mr-2 text-primary-600 focus:ring-primary-500" 
      checked={selected}
      onChange={() => {}}
    />
    {icon}
    <label htmlFor={id} className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-200 cursor-pointer">
      {label}
    </label>
  </motion.div>
);

// Mobile payment option component
const MobilePaymentOption = ({ id, logo, label, selected, onClick }) => (
  <motion.div
    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
      selected ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400' : 'border-gray-200 dark:border-gray-700'
    }`}
    onClick={onClick}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <input 
      type="radio" 
      id={id} 
      name="mobile-payment" 
      className="mr-2 text-primary-600 focus:ring-primary-500" 
      checked={selected}
      onChange={() => {}}
    />
    {logo}
    <label htmlFor={id} className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-200 cursor-pointer">
      {label}
    </label>
  </motion.div>
);

// Confetti animation component
const DonationConfetti = ({ isVisible, onComplete }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed inset-0 pointer-events-none z-50 flex justify-center items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {Array.from({ length: 150 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              initial={{ 
                top: "50%",
                left: "50%",
                scale: 0,
                backgroundColor: getRandomColor()
              }}
              animate={{ 
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                scale: Math.random() * 1.5 + 0.5,
                opacity: [1, 0],
              }}
              transition={{
                duration: Math.random() * 2 + 1,
                ease: "easeOut",
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Helper function to get random confetti colors
const getRandomColor = () => {
  const colors = [
    '#FF5A5F', // Primary red
    '#00A699', // Teal
    '#FC642D', // Orange
    '#FFB400', // Yellow
    '#7B0051', // Purple
    '#4764AE', // Nepal blue
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Fonepay QR code modal component
const FonepayModal = ({ isOpen, onClose, qrCode, paymentId }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Scan QR Code to Pay</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="bg-white p-4 rounded-lg mb-4">
            {/* QR Code display */}
            <img 
              src={`data:image/png;base64,${qrCode}`}
              alt="Payment QR Code"
              className="w-64 h-64"
            />
          </div>
          
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              1. Open your Fonepay app
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              2. Scan this QR code
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              3. Confirm the payment in your app
            </p>
          </div>
          
          <div className="w-full">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DonationForm = ({ campaignId, campaignTitle = "This Campaign" }) => {
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [platformFee, setPlatformFee] = useState(PAYMENT_CONFIG.defaultPlatformFee); // Use default platform fee from config
  const [calculationSummary, setCalculationSummary] = useState({
    baseDonation: 0,
    platformFeeAmount: 0,
    totalAmount: 0
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [mobilePaymentMethod, setMobilePaymentMethod] = useState('esewa');
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfetti, setShowConfetti] = useState(false);
  const [impactDescription, setImpactDescription] = useState('');
  const formRef = useRef(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuthContext();
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Fonepay related states
  const [showFonepayModal, setShowFonepayModal] = useState(false);
  const [fonepayData, setFonepayData] = useState(null);
  const [fonepayWebSocket, setFonepayWebSocket] = useState(null);
  const [fonepayStatusInterval, setFonepayStatusInterval] = useState(null);

  const predefinedAmounts = ['1000', '2000', '5000', '10000'];
  const quickPresetAmounts = ['100', '500', '1000', '2500'];

  // Auto-fill user information when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Auto-fill name and email if user is logged in
      if (user.name && !name) {
        setName(user.name);
      }
      if (user.email && !email) {
        setEmail(user.email);
      }
    }
  }, [isAuthenticated, user, name, email]);

  // Cleanup for websocket and intervals
  useEffect(() => {
    return () => {
      // Close WebSocket connection if active
      if (fonepayWebSocket && fonepayWebSocket.readyState === WebSocket.OPEN) {
        fonepayWebSocket.close();
      }
      
      // Clear any active intervals
      if (fonepayStatusInterval) {
        clearInterval(fonepayStatusInterval);
      }
    };
  }, [fonepayWebSocket, fonepayStatusInterval]);

  // Impact descriptions based on donation amount
  useEffect(() => {
    const amount = calculationSummary.baseDonation;
    if (amount >= 10000) {
      setImpactDescription('Your generous donation can help rebuild homes for multiple families.');
    } else if (amount >= 5000) {
      setImpactDescription('You could provide clean water access for an entire village.');
    } else if (amount >= 2000) {
      setImpactDescription('You can supply educational materials for a classroom of students.');
    } else if (amount >= 1000) {
      setImpactDescription('Your donation can provide meals for a family for a week.');
    } else if (amount > 0) {
      setImpactDescription('Every little bit helps create positive change.');
    } else {
      setImpactDescription('');
    }
  }, [calculationSummary.baseDonation]);

  // Calculate fee and total whenever amount or platformFee changes
  useEffect(() => {
    const donationAmount = amount === 'custom' ? (customAmount ? parseInt(customAmount) : 0) : (amount ? parseInt(amount) : 0);
    const feeAmount = (donationAmount * platformFee) / 100;
    const total = donationAmount + feeAmount;

    setCalculationSummary({
      baseDonation: donationAmount,
      platformFeeAmount: feeAmount,
      totalAmount: total
    });
  }, [amount, customAmount, platformFee]);

  const handleAmountClick = (value) => {
    setAmount(value);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(value);
    setAmount('custom');
  };

  const handleFeeChange = (newFee) => {
    setPlatformFee(newFee);
  };

  const nextStep = () => {
    const donationAmount = amount === 'custom' ? customAmount : amount;
    
    // Form validation
    const donationValue = parseInt(donationAmount);
    if (!donationAmount || donationValue < 50) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid donation amount (minimum Rs. 50).",
        variant: "destructive"
      });
      return;
    }

    if (donationValue > 500000) {
      toast({
        title: "Amount exceeds limit",
        description: "The maximum donation amount is Rs. 500,000. Please enter a smaller amount.",
        variant: "destructive"
      });
      return;
    }
    
    // Scroll form to top when changing steps
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    setCurrentStep(2);
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation for step 2
    if (currentStep === 2) {
      // Validate email is provided
      if (!email.trim()) {
        toast({
          title: "Email required",
          description: "Please provide your email address to receive the donation receipt.",
          variant: "destructive"
        });
        return;
      }
      
      // Validate name if not anonymous
      if (!isAnonymous && !name.trim()) {
        toast({
          title: "Name required",
          description: "Please provide your name or choose to donate anonymously.",
          variant: "destructive"
        });
        return;
      }
    }

    // Allow guest donations - no login required

    setIsLoading(true);
    setProcessingPayment(true);
    
    try {
      // Prepare payment data
      const donationAmount = amount === 'custom' ? parseInt(customAmount) : parseInt(amount);
      
      // Check minimum amount
      if (donationAmount < 10) {
        toast({
          title: "Invalid amount",
          description: `Minimum donation amount is Rs. 10`,
          variant: "destructive"
        });
        setIsLoading(false);
        setProcessingPayment(false);
        return;
      }
      
      const paymentData = {
        campaignId,
        amount: donationAmount * 100, // Convert NPR to paisa (1 NPR = 100 paisa)
        platformFee: Math.round(calculationSummary.platformFeeAmount * 100), // Convert to paisa
        platformFeePercentage: platformFee,
        totalAmount: Math.round(calculationSummary.totalAmount * 100), // Convert to paisa
        donorName: isAnonymous ? 'Anonymous' : name,
        donorEmail: email,
        donorMessage: message,
        isAnonymous
      };

      console.log('Payment Data:', paymentData);

      // Choose payment processor based on payment method
      if (paymentMethod === 'mobileBanking') {
        if (mobilePaymentMethod === 'khalti') {
          // Initiate Khalti payment
          const response = await paymentService.initiateKhaltiPayment(paymentData);
          
          if (response.success) {
            // Log the payment data for debugging
            console.log('Khalti payment initiated successfully:', response.data);
            
            // Redirect to Khalti payment page
            if (response.data?.paymentUrl) {
              window.location.href = response.data.paymentUrl;
            } else {
              throw new Error('Payment URL not received from server');
            }
          } else {
            throw new Error(response.message || 'Failed to initiate payment');
          }
        } else if (mobilePaymentMethod === 'esewa') {
          // Initiate eSewa payment
          const response = await paymentService.initiateEsewaPayment(paymentData);
          
          if (response.success) {
            // Log the payment data for debugging
            console.log('eSewa payment initiated successfully:', response.data);
            
            // Show loading message
            toast({
              title: "Processing Payment",
              description: "You will be redirected to eSewa to complete your payment."
            });
            
            try {
              const formUrl = response.data.formUrl;
              const formData = response.data.esewaFormData;
              
              if (!formUrl || !formData) {
                throw new Error('eSewa form data not received from server');
              }
              
              console.log('eSewa form URL:', formUrl);
              console.log('eSewa form data:', formData);
              
              // Create a form element exactly like in the example
              const form = document.createElement('form');
              form.method = 'POST';
              form.action = formUrl;
              form.style.display = 'none';
              form.enctype = 'application/x-www-form-urlencoded';
              
              // Add form fields exactly as needed
              Object.entries(formData).forEach(([key, value]) => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                // Convert all values to string and escape any special characters
                input.value = String(value);
                form.appendChild(input);
                console.log(`Added form field: ${key}=${value}`);
              });
              
              // Append form to body
              document.body.appendChild(form);
              
              // Submit the form immediately (don't wait)
              console.log('Submitting eSewa form...');
              form.submit();
              
              // Remove the form after submission
              setTimeout(() => {
                if (document.body.contains(form)) {
                  document.body.removeChild(form);
                }
              }, 1000);
            } catch (error) {
              console.error('Error submitting eSewa form:', error);
              throw new Error('Failed to redirect to eSewa payment page: ' + error.message);
            }
          } else {
            throw new Error(response.message || 'Failed to initiate payment');
          }
        } else if (mobilePaymentMethod === 'fonepay') {
          // Initiate Fonepay payment (previously named phonepay)
          const response = await paymentService.initiateFonepayPayment(paymentData);
          
          if (response.success) {
            console.log('Fonepay payment initiated successfully:', response.data);
            
            // Show modal with QR code and initialize websocket connection
            setFonepayData(response.data);
            setShowFonepayModal(true);
            
            // Initialize WebSocket connection to listen for payment status
            try {
              const ws = new WebSocket(response.data.webSocketUrl);
              
              ws.onopen = () => {
                console.log('WebSocket connection established');
                setFonepayWebSocket(ws);
              };
              
              ws.onmessage = async (event) => {
                console.log('WebSocket message received:', event.data);
                
                try {
                  const data = JSON.parse(event.data);
                  
                  // Check if this is a transaction status update
                  if (data.transactionStatus) {
                    const statusData = JSON.parse(data.transactionStatus);
                    
                    // QR verified message
                    if (statusData.qrVerified) {
                      toast({
                        title: "QR Code Scanned",
                        description: "Your QR code has been scanned. Please complete the payment in your phone app."
                      });
                    }
                    
                    // Payment success/fail message
                    if (statusData.paymentSuccess === true) {
                      toast({
                        title: "Payment Successful",
                        description: "Your payment has been processed successfully."
                      });
                      
                      // Verify payment status with our server
                      const statusCheck = await paymentService.checkFonepayStatus(response.data.paymentId);
                      
                      if (statusCheck.success && statusCheck.data.status === 'Completed') {
                        // Close modal and redirect to success page
                        setShowFonepayModal(false);
                        window.location.href = `/payment/success?paymentId=${response.data.paymentId}`;
                      }
                    } else if (statusData.paymentSuccess === false) {
                      toast({
                        title: "Payment Failed",
                        description: "The payment was not successful. Please try again.",
                        variant: "destructive"
                      });
                      
                      // Close modal and redirect to failure page
                      setShowFonepayModal(false);
                      window.location.href = `/payment/cancel?paymentId=${response.data.paymentId}`;
                    }
                  }
                } catch (error) {
                  console.error('Error processing WebSocket message:', error);
                }
              };
              
              ws.onerror = (error) => {
                console.error('WebSocket error:', error);
              };
              
              ws.onclose = () => {
                console.log('WebSocket connection closed');
                setFonepayWebSocket(null);
              };
              
              // Start a timer to check payment status every 5 seconds as a fallback
              const statusCheckInterval = setInterval(async () => {
                try {
                  const statusCheck = await paymentService.checkFonepayStatus(response.data.paymentId);
                  
                  if (statusCheck.success) {
                    console.log('Fonepay status check:', statusCheck.data);
                    
                    if (statusCheck.data.status === 'Completed') {
                      clearInterval(statusCheckInterval);
                      setShowFonepayModal(false);
                      window.location.href = `/payment/success?paymentId=${response.data.paymentId}`;
                    } else if (statusCheck.data.status === 'Failed') {
                      clearInterval(statusCheckInterval);
                      setShowFonepayModal(false);
                      window.location.href = `/payment/cancel?paymentId=${response.data.paymentId}`;
                    }
                  }
                } catch (error) {
                  console.error('Error checking Fonepay status:', error);
                }
              }, 5000);
              
              // Store interval ID for cleanup
              setFonepayStatusInterval(statusCheckInterval);
              
            } catch (error) {
              console.error('Error establishing WebSocket connection:', error);
              toast({
                title: "Connection Error",
                description: "Could not establish connection to payment gateway. Please try again.",
                variant: "destructive"
              });
              setIsLoading(false);
              setProcessingPayment(false);
            }
          } else {
            throw new Error(response.message || 'Failed to initiate payment');
          }
        }
      } else if (paymentMethod === 'card') {
        // Credit/debit card payment - this would be integrated separately
        toast({
          title: "Coming Soon",
          description: "Card payment option will be available soon."
        });
        setIsLoading(false);
        setProcessingPayment(false);
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
      setProcessingPayment(false);
    }
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden"
      ref={formRef}
    >
      <div className="p-6">
        <h3 className="font-bold text-xl mb-2 text-gray-900 dark:text-white">Support This Cause</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
          Your donation will make a real difference in Nepal
        </p>
        
        <form onSubmit={handleSubmit}>
          {/* Step 1: Donation Amount */}
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <span className="flex items-center justify-center bg-[#8B2325] text-white w-6 h-6 rounded-full text-xs mr-2">1</span>
                      Choose Donation Amount
                    </h4>
                    
                    {/* Quick Donation Presets */}
                    <div className="mb-5">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                        Quick Donation Presets
                      </label>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {quickPresetAmounts.map((value) => (
                          <motion.button
                            key={`quick-${value}`}
                            type="button"
                            className={`px-3 py-1.5 rounded-full text-center text-sm whitespace-nowrap ${
                              amount === value 
                                ? 'bg-[#8B2325] text-white shadow-sm' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                            } transition-all`}
                            onClick={() => handleAmountClick(value)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Rs. {parseInt(value).toLocaleString()}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {predefinedAmounts.map((value) => (
                        <motion.button
                          key={value}
                          type="button"
                          className={`py-3 px-4 rounded-lg text-center font-medium ${
                            amount === value 
                              ? 'bg-[#8B2325] text-white shadow-md' 
                              : 'border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#8B2325] dark:hover:border-[#8B2325]'
                          } transition-all`}
                          onClick={() => handleAmountClick(value)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Rs. {parseInt(value).toLocaleString()}
                        </motion.button>
                      ))}
                    </div>
                    
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                        Rs.
                      </span>
                      <input
                        type="text"
                        placeholder="Enter custom amount"
                        className={`w-full pl-10 py-3 px-4 border-2 ${
                          amount === 'custom' 
                            ? 'border-primary-500 dark:border-primary-400 ring-4 ring-primary-500/20 dark:ring-primary-400/20' 
                            : 'border-gray-200 dark:border-gray-700'
                        } rounded-lg focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                        value={customAmount}
                        onChange={handleCustomAmountChange}
                        onClick={() => setAmount('custom')}
                      />
                    </div>
                    
                    {/* Impact message */}
                    <AnimatePresence>
                      {impactDescription && (
                        <motion.div 
                          className="mt-4 text-sm text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 flex items-start"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{impactDescription}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Platform Fee Slider */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <span className="flex items-center justify-center bg-primary-600 text-white w-6 h-6 rounded-full text-xs mr-2">2</span>
                      Platform Fee
                    </h4>
                    <PlatformFeeSlider onFeeChange={handleFeeChange} defaultValue={13} />
                  </div>
                  
                  {/* Calculation Summary */}
                  {calculationSummary.baseDonation > 0 && (
                    <motion.div 
                      className="p-4 rounded-lg mb-2 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Donation Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Donation amount:</span>
                          <span className="font-medium text-gray-900 dark:text-white">Rs. {calculationSummary.baseDonation.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Platform fee ({platformFee.toFixed(1)}%):</span>
                          <span className="font-medium text-gray-900 dark:text-white">Rs. {calculationSummary.platformFeeAmount.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-gray-300 dark:border-gray-700 pt-2 mt-2 font-bold flex justify-between">
                          <span className="text-gray-900 dark:text-white">Total amount:</span>
                          <span className="text-primary-600 dark:text-primary-400">Rs. {calculationSummary.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <motion.button
                    type="button"
                    className="w-full py-3.5 px-6 bg-[#8B2325] hover:bg-[#7a1f21] text-white font-medium rounded-lg shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={nextStep}
                    disabled={calculationSummary.baseDonation < 50}
                  >
                    Continue to Payment
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </motion.button>
                </div>
              </motion.div>
            )}
            
            {/* Step 2: Personal Info & Payment */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <span className="flex items-center justify-center bg-primary-600 text-white w-6 h-6 rounded-full text-xs mr-2">1</span>
                      Personal Information
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="anonymous"
                          checked={isAnonymous}
                          onChange={() => setIsAnonymous(!isAnonymous)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-1"
                        />
                        <label htmlFor="anonymous" className="ml-2 text-gray-700 dark:text-gray-300 text-sm">
                          Donate anonymously (your name will not be displayed publicly)
                        </label>
                      </div>
                      
                      {/* Only show name field if not anonymous */}
                      {!isAnonymous && (
                        <div>
                          <input
                            type="text"
                            placeholder={isAuthenticated && user?.name ? "Name (auto-filled from your account)" : "Your Name"}
                            className={`w-full py-3 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                              isAuthenticated && user?.name && name === user.name 
                                ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/10' 
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                          {isAuthenticated && user?.name && name === user.name && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Auto-filled from your account
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div>
                        <input
                          type="email"
                          placeholder={isAuthenticated && user?.email ? "Email (auto-filled from your account)" : "Email Address (required for receipt)"}
                          className={`w-full py-3 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                            isAuthenticated && user?.email && email === user.email 
                              ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/10' 
                              : 'border-gray-200 dark:border-gray-700'
                          }`}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                        {isAuthenticated && user?.email && email === user.email && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Auto-filled from your account
                          </p>
                        )}
                      </div>
                      
                      {/* Only show message field if not anonymous */}
                      {!isAnonymous && (
                        <div>
                          <textarea
                            placeholder="Leave a message (optional)"
                            rows={2}
                            className="w-full py-3 px-4 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Payment Method */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <span className="flex items-center justify-center bg-primary-600 text-white w-6 h-6 rounded-full text-xs mr-2">2</span>
                      Payment Method
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <PaymentMethodOption
                        id="card"
                        icon={
                          <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        }
                        label="Credit / Debit Card"
                        selected={paymentMethod === 'card'}
                        onClick={() => setPaymentMethod('card')}
                      />
                      
                      <PaymentMethodOption
                        id="mobileBanking"
                        icon={
                          <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        }
                        label="Mobile Banking"
                        selected={paymentMethod === 'mobileBanking'}
                        onClick={() => setPaymentMethod('mobileBanking')}
                      />
                    </div>
                    
                    {/* Mobile Banking Options */}
                    {paymentMethod === 'mobileBanking' && (
                      <div className="mt-3 space-y-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Select Payment Method
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <MobilePaymentOption
                            id="esewa"
                            logo={
                              <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/20 p-1.5 rounded-md">
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                </svg>
                              </div>
                            }
                            label="eSewa"
                            selected={mobilePaymentMethod === 'esewa'}
                            onClick={() => setMobilePaymentMethod('esewa')}
                          />
                          
                          <MobilePaymentOption
                            id="khalti"
                            logo={
                              <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900/20 p-1.5 rounded-md">
                                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                </svg>
                              </div>
                            }
                            label="Khalti"
                            selected={mobilePaymentMethod === 'khalti'}
                            onClick={() => setMobilePaymentMethod('khalti')}
                          />
                          
                          <MobilePaymentOption
                            id="fonepay"
                            logo={
                              <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/20 p-1.5 rounded-md">
                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                                </svg>
                              </div>
                            }
                            label="Fonepay"
                            selected={mobilePaymentMethod === 'fonepay'}
                            onClick={() => setMobilePaymentMethod('fonepay')}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Additional payment fields would go here based on selected method */}
                  </div>
                  
                  {/* Summary */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Total amount:</span>
                      <span className="font-bold text-lg text-primary-600 dark:text-primary-400">Rs. {calculationSummary.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      By proceeding, you agree to our Terms of Service and Privacy Policy.
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <motion.button
                      type="button"
                      className="py-3.5 px-6 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={prevStep}
                    >
                      Back
                    </motion.button>
                    
                    <motion.button
                      type="submit"
                      className="flex-1 py-3.5 px-6  bg-[#8B2325] text-white hover:bg-primary-700  font-medium rounded-lg shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          Complete Donation
                          <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
      
      {/* Fonepay QR Modal */}
      <FonepayModal 
        isOpen={showFonepayModal}
        onClose={() => {
          setShowFonepayModal(false);
          if (fonepayWebSocket && fonepayWebSocket.readyState === WebSocket.OPEN) {
            fonepayWebSocket.close();
          }
          if (fonepayStatusInterval) {
            clearInterval(fonepayStatusInterval);
          }
          setIsLoading(false);
          setProcessingPayment(false);
        }}
        qrCode={fonepayData?.qrCode}
        paymentId={fonepayData?.paymentId}
      />
      
      {/* Donation success animation */}
      <DonationConfetti 
        isVisible={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
    </div>
  );
};

export default DonationForm;
