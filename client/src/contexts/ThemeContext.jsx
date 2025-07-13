import { createContext, useState, useEffect, useContext } from "react";

// Create a context for theme management
export const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Check for user preference in localStorage or use system preference as fallback
  const getInitialTheme = () => {
    if (typeof window !== "undefined" && window.localStorage) {
      const storedTheme = window.localStorage.getItem("theme");
      if (storedTheme) {
        return storedTheme;
      }

      const userMedia = window.matchMedia("(prefers-color-scheme: dark)");
      if (userMedia.matches) {
        return "dark";
      }
    }

    return "light"; // Default theme
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Toggle between light and dark modes
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Update localStorage and apply theme when theme state changes
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove the previous theme class and add the new one
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    // Update localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Provide theme context to children
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook for using the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};