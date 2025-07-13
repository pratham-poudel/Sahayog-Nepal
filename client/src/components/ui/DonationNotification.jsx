import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Array of dummy donation data for demonstration
const dummyDonations = [
  { id: 1, name: 'Rajesh Sharma', amount: 3000, campaign: 'Clean Water for Sindhuli' },
  { id: 2, name: 'Anonymous', amount: 5000, campaign: 'Support Earthquake Victims' },
  { id: 3, name: 'Anita Gurung', amount: 1500, campaign: 'Education for All' },
  { id: 4, name: 'Anonymous', amount: 10000, campaign: 'Medical Supplies for Rural Areas' },
  { id: 5, name: 'Dipak Thapa', amount: 2500, campaign: 'Rebuild Schools in Dolakha' },
  { id: 6, name: 'Sita Rai', amount: 750, campaign: 'Women Empowerment Initiative' },
  { id: 7, name: 'Anonymous', amount: 8000, campaign: 'Kathmandu Youth Sports' },
  { id: 8, name: 'Binod Basnet', amount: 1200, campaign: 'Sustainable Farming in Terai' },
  { id: 9, name: 'Sunita Magar', amount: 4500, campaign: 'Clean Air Initiative' },
  { id: 10, name: 'Anonymous', amount: 2000, campaign: 'Preserve Cultural Heritage' },
];

const DonationNotification = () => {
  const [currentDonation, setCurrentDonation] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  
  // Function to pick a random donation from our dummy data
  const getRandomDonation = () => {
    const randomIndex = Math.floor(Math.random() * dummyDonations.length);
    return dummyDonations[randomIndex];
  };
  
  // Effect for showing notifications at random intervals
  useEffect(() => {
    // Show initial notification after a short delay
    const initialTimer = setTimeout(() => {
      setCurrentDonation(getRandomDonation());
      setShowNotification(true);
    }, 3000);
    
    // Set up an interval to show new notifications periodically
    const interval = setInterval(() => {
      // Hide the current notification
      setShowNotification(false);
      
      // After hiding, change the donation data and show again
      setTimeout(() => {
        setCurrentDonation(getRandomDonation());
        setShowNotification(true);
      }, 500);
    }, 15000); // Show a new notification every 15 seconds
    
    // Notification disappears after 5 seconds
    const hideTimer = setInterval(() => {
      if (showNotification) {
        setShowNotification(false);
      }
    }, 6000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      clearInterval(hideTimer);
    };
  }, []);
  
  // Effect to handle hiding the current notification
  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 6000);
      
      return () => clearTimeout(timer);
    }
  }, [showNotification]);
  
  // If no donation to show, render nothing
  if (!currentDonation) return null;
  
  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          className="fixed bottom-4 right-4 z-50 max-w-xs"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <div className="bg-green-50 dark:bg-green-900/40 rounded-lg shadow-lg overflow-hidden flex border border-green-200 dark:border-green-800">
            {/* Accent bar */}
            <div className="w-1.5 bg-gradient-to-b from-green-500 to-green-600"></div>
            
            <div className="p-2.5 flex items-start">
              {/* Image/icon for the notification */}
              <div className="mr-2 flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-800/60 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17A3 3 0 015 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                    <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                  </svg>
                </div>
              </div>
              
              {/* Notification content */}
              <div className="flex-1">
                <h5 className="font-medium text-gray-900 dark:text-white text-xs">New Donation!</h5>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                  {currentDonation.name === 'Anonymous' 
                    ? 'Someone' 
                    : <span className="font-medium">{currentDonation.name}</span>
                  } donated <span className="font-medium text-green-600 dark:text-green-400">Rs. {currentDonation.amount.toLocaleString()}</span>
                </p>
              </div>
              
              {/* Close button */}
              <button 
                onClick={() => setShowNotification(false)}
                className="ml-1 text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DonationNotification;