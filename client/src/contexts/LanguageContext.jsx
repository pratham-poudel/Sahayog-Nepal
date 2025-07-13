import { createContext, useState, useEffect, useContext } from "react";

// Create a context for language management
export const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
});

// Language provider component
export const LanguageProvider = ({ children }) => {
  // Check for user preference in localStorage or use default language
  const getInitialLanguage = () => {
    if (typeof window !== "undefined" && window.localStorage) {
      const storedLanguage = window.localStorage.getItem("language");
      if (storedLanguage) {
        return storedLanguage;
      }
    }
    return "en"; // Default language is English
  };

  const [language, setLanguage] = useState(getInitialLanguage);

  // Update localStorage when language state changes
  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  // Provide language context to children
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook for using the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}; 