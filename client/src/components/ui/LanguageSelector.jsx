import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  
  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ne', name: 'नेपाली', flag: '🇳🇵' },
  ];
  
  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  const selectLanguage = (langCode) => {
    setLanguage(langCode);
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <motion.button
        onClick={toggleDropdown}
        className="flex items-center space-x-1 p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 focus:outline-none"
        whileTap={{ scale: 0.95 }}
        title="Change language"
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="text-sm hidden md:inline-block">{currentLanguage.name}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </motion.button>
      
      {isOpen && (
        <motion.div 
          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => selectLanguage(lang.code)}
              className={`block w-full text-left px-4 py-2 text-sm ${
                lang.code === language 
                  ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.name}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default LanguageSelector;