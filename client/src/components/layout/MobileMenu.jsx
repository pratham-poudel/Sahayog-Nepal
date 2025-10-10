import { useContext, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { API_BASE_URL } from '../../config/index.js';
import Logo from '../ui/Logo';

const MobileMenu = ({ isOpen, onClose }) => {
  const { isAuthenticated, user, logoutAndRedirect } = useAuthContext();
  const { theme } = useTheme();
  const [location, navigate] = useLocation();

  const handleLinkClick = () => {
    onClose();
  };

  // Don't render anything if not open
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className={`fixed top-16 inset-x-0 z-50 md:hidden`}
      style={{
        display: isOpen ? 'block' : 'none',
        maxHeight: 'calc(100vh - 64px)',
        overflowY: 'auto'
      }}
    >
      <div className="bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 space-y-2">
          {/* Mobile Menu Logo */}
          <div className="flex justify-center py-3 border-b border-gray-200 dark:border-gray-700 mb-2">
            <Logo size="medium" onClick={handleLinkClick} />
          </div>
          
          <Link href="/" onClick={handleLinkClick}>
            <div className="block py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium">
              Home
            </div>
          </Link>
          <Link href="/explore" onClick={handleLinkClick}>
            <div className="block py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium">
              Explore
            </div>
          </Link>
          <Link href="/start-campaign" onClick={handleLinkClick}>
            <div className="block py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium">
              Start a Campaign
            </div>
          </Link>
          <Link href="/about" onClick={handleLinkClick}>
            <div className="block py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium">
              About Us
            </div>
          </Link>
          
          {/* User-specific links when authenticated */}
          {isAuthenticated && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2"></div>                <div className="px-4 py-2">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                    {user?.profilePicture ? (
                      <img src={`${API_BASE_URL}/public/images/profiles/${user.profilePicture}`} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-600 font-medium text-lg">{user?.name?.charAt(0) || "U"}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{user?.name || "User"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || ""}</p>
                  </div>
                </div>
              </div>
              <Link href="/dashboard" onClick={handleLinkClick}>
                <div className="block py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium">
                  <i className="ri-dashboard-line mr-2"></i> Dashboard
                </div>
              </Link>
              <Link href="/profile" onClick={handleLinkClick}>
                <div className="block py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium">
                  <i className="ri-user-line mr-2"></i> Profile
                </div>
              </Link>
            </>
          )}
          
          <div className="flex flex-col space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700 mt-3">
            {/* Theme toggle section */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-300">
                Dark Mode
              </span>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                  {theme === 'dark' ? 'On' : 'Off'}
                </span>
              </div>
            </div>
            
            {isAuthenticated ? (
              <button
                className="py-3 px-5 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                onClick={() => {
                  onClose();
                  logoutAndRedirect('/');
                }}
              >
                <i className="ri-logout-box-line mr-2"></i> Log Out
              </button>
            ) : (
              <>
                <Link href="/login" onClick={handleLinkClick}>
                  <div className="block text-center py-3 px-5 border-2 border-[#8B2325] text-[#8B2325] dark:text-[#a32729] dark:border-[#a32729] rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
                    Log In
                  </div>
                </Link>
                <Link href="/signup" onClick={handleLinkClick}>
                  <div className="block text-center py-3 px-5 bg-[#8B2325] hover:bg-[#7a1f21] text-white rounded-lg transition-colors font-medium">
                    Sign Up
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
