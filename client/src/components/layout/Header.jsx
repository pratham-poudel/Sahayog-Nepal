import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuthContext } from '../../contexts/AuthContext';
import Navbar from './Navbar';
import MobileMenu from './MobileMenu';
import ThemeToggle from '../ui/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [visible, setVisible] = useState(true);
  const { isAuthenticated, user, logoutAndRedirect } = useAuthContext();
  const [location] = useLocation();
  
  // Track scroll position and update header visibility
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Set the current scroll position
      setScrollPosition(currentScrollY);
      
      // Show header when scrolling up or at the top
      // Hide when scrolling down past threshold (50px)
      if (currentScrollY < 50 || currentScrollY < lastScrollY) {
        setVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setVisible(false);
      }
      
      lastScrollY = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const toggleMobileMenu = () => {
    console.log('Toggle mobile menu called');
    setMobileMenuOpen(prevState => {
      const newState = !prevState;
      console.log('Setting mobile menu to:', newState);
      return newState;
    });
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);
  
  // Only close menus on route change if they are open
  useEffect(() => {
    if (mobileMenuOpen || userMenuOpen) {
      console.log('Route changed, closing menus');
      setMobileMenuOpen(false);
      setUserMenuOpen(false);
    }
  }, [location]);

  return (
    <motion.header 
      className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-800/30"
      initial={{ opacity: 1, y: 0 }}
      animate={{ 
        opacity: visible ? 1 : 0,
        y: visible ? 0 : -100,
        transition: { 
          duration: 0.3,
          ease: "easeInOut"
        }
      }}
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center bg-[#8B2325] rounded-full mr-2 shadow-md">
                <span className="text-white font-bold text-lg md:text-xl">S</span>
              </div>
              <div className="text-xl md:text-2xl font-poppins font-bold">
                <span className="text-[#8B2325] dark:text-[#a32729]">Sahayog</span><span className="text-[#D5A021] dark:text-[#e5b43c]">Nepal</span>
              </div>
            </Link>
          </div>
          
          <Navbar />
          
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <div className="flex-shrink-0">
              <ThemeToggle />
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              className="flex items-center justify-center w-12 h-12 text-white bg-[#8B2325] dark:bg-[#a32729] rounded-md md:hidden"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleMobileMenu();
              }}
              aria-label="Toggle menu"
            >
              <i className="ri-menu-line text-3xl"></i>
            </button>
            
            {/* Auth Buttons or User Menu */}
            {isAuthenticated ? (
              <div className="hidden md:block relative user-menu-container">
                <button 
                  className="flex items-center space-x-2 focus:outline-none"
                  onClick={toggleUserMenu}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                    {user?.profileImage ? (
                      <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-600 font-medium text-lg">{user?.name?.charAt(0) || "U"}</span>
                    )}
                  </div>
                  <span className="hidden lg:block text-gray-700 dark:text-gray-300 font-medium">
                    {user?.name?.split(' ')[0] || "User"}
                  </span>
                  <i className="ri-arrow-down-s-line text-lg text-gray-500 dark:text-gray-400"></i>
                </button>
                
                <AnimatePresence mode="wait" initial={false}>
                  {userMenuOpen && (
                    <motion.div 
                      key="user-menu"
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 border border-gray-100 dark:border-gray-700"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Link href="/dashboard" onClick={() => setUserMenuOpen(false)}>
                        <div className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                          <i className="ri-dashboard-line mr-2"></i> Dashboard
                        </div>
                      </Link>
                      <Link href="/profile" onClick={() => setUserMenuOpen(false)}>
                        <div className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                          <i className="ri-user-line mr-2"></i> Profile
                        </div>
                      </Link>
                      <Link href="/start-campaign" onClick={() => setUserMenuOpen(false)}>
                        <div className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                          <i className="ri-add-circle-line mr-2"></i> Start Campaign
                        </div>
                      </Link>
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                      <button 
                        className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => logoutAndRedirect('/')}
                      >
                        <i className="ri-logout-box-line mr-2"></i> Log Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link href="/login">
                  <div className="py-2 px-5 border-2 border-[#8B2325] text-[#8B2325] dark:text-[#a32729] dark:border-[#a32729] rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm font-medium">
                    Log In
                  </div>
                </Link>
                <Link href="/signup">
                  <div className="py-2 px-5 bg-[#8B2325] hover:bg-[#7a1f21] text-white rounded-lg transition-colors shadow-sm font-medium">
                    Sign Up
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <MobileMenu isOpen={mobileMenuOpen} onClose={toggleMobileMenu} />
    </motion.header>
  );
};

export default Header;
