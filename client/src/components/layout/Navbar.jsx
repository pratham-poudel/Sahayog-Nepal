import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const Navbar = () => {
  const [location] = useLocation();
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => {
    // Check if page is already translated
    const isTranslated = document.documentElement.classList.contains('translated-ltr') || 
                         document.documentElement.classList.contains('translated-rtl');
    if (isTranslated) {
      setCurrentLang('ne');
    }
  }, []);

  const toggleLanguage = async () => {
    const newLang = currentLang === 'en' ? 'ne' : 'en';
    
    if (newLang === 'ne') {
      // Translate to Nepali
      document.documentElement.lang = 'en'; // Set source language
      
      // Check if browser supports translation API
      if ('translation' in window) {
        try {
          const translator = await window.translation.createTranslator({
            sourceLanguage: 'en',
            targetLanguage: 'ne'
          });
          await translator.translate(document.body);
          setCurrentLang('ne');
        } catch (error) {
          console.log('Translation API not available, using fallback');
          triggerBrowserTranslation();
        }
      } else {
        // Fallback: Try to trigger browser's built-in translation
        triggerBrowserTranslation();
      }
    } else {
      // Revert to English - reload the page to clear translation
      setCurrentLang('en');
      document.documentElement.lang = 'en';
      
      // Check if Google Translate is active and restore original
      const frame = document.querySelector('.goog-te-banner-frame');
      if (frame) {
        const restoreButton = frame.contentDocument?.querySelector('.goog-close-link');
        if (restoreButton) restoreButton.click();
      } else {
        // For other translation methods, reload
        window.location.reload();
      }
    }
  };

  const triggerBrowserTranslation = () => {
    // Method 1: Use Google Translate Element (most reliable)
    if (!window.googleTranslateElementInit) {
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      
      window.googleTranslateElementInit = function() {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'ne,en',
          autoDisplay: false,
        }, 'google_translate_element');
        
        // Auto-trigger translation to Nepali
        setTimeout(() => {
          const select = document.querySelector('.goog-te-combo');
          if (select) {
            select.value = 'ne';
            select.dispatchEvent(new Event('change'));
            setCurrentLang('ne');
          }
        }, 1000);
      };
      
      document.head.appendChild(script);
      
      // Create hidden container for Google Translate widget
      if (!document.getElementById('google_translate_element')) {
        const div = document.createElement('div');
        div.id = 'google_translate_element';
        div.style.display = 'none';
        document.body.appendChild(div);
      }
    } else {
      // Widget already exists, just change the language
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        select.value = 'ne';
        select.dispatchEvent(new Event('change'));
        setCurrentLang('ne');
      }
    }
  };

  const links = [
    { path: '/', label: 'Home' },
    { path: '/explore', label: 'Explore' },
    { path: '/start-campaign', label: 'Start a Campaign' },
    { path: '/about', label: 'About Us' }
  ];

  return (
    <nav className="hidden lg:flex items-center mx-4 lg:mx-6">
      <ul className="flex flex-wrap justify-center space-x-2 lg:space-x-5 font-medium text-gray-800 dark:text-gray-200">
        {links.map((link) => (
          <li key={link.path} className="relative whitespace-nowrap">
            <Link href={link.path}>
              <div className={`block py-2 px-2 lg:px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                location === link.path 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {link.label}
                {location === link.path && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </div>
            </Link>
          </li>
        ))}
        <li className="relative whitespace-nowrap">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
            title={currentLang === 'en' ? 'Switch to Nepali' : 'Switch to English'}
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" 
              />
            </svg>
            <span className="text-sm font-medium">
              {currentLang === 'en' ? 'नेपाली' : 'English'}
            </span>
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
