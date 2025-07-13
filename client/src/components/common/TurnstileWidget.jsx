import { useState, useEffect, useRef } from 'react';

const TurnstileWidget = ({ 
  siteKey, 
  onVerify, 
  onExpire, 
  onError, 
  theme = 'light', 
  size = 'normal',
  className = '' 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [widgetId, setWidgetId] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const loadTurnstile = () => {
      // Check if script already exists
      if (document.querySelector('script[src*="turnstile"]')) {
        if (window.turnstile) {
          setIsLoaded(true);
          renderWidget();
        }
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.onload = () => {
        setIsLoaded(true);
        renderWidget();
      };
      script.onerror = () => {
        console.error('Failed to load Turnstile script');
        if (onError) onError();
      };
      document.head.appendChild(script);
    };

    loadTurnstile();
  }, []);

  const renderWidget = () => {
    if (!window.turnstile || !containerRef.current) return;

    setTimeout(() => {
      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onVerify,
          'expired-callback': onExpire,
          'error-callback': onError,
          theme,
          size
        });
        setWidgetId(id);
      } catch (error) {
        console.error('Error rendering Turnstile widget:', error);
        if (onError) onError();
      }
    }, 100);
  };

  const reset = () => {
    if (window.turnstile && widgetId !== null) {
      try {
        window.turnstile.reset(widgetId);
      } catch (error) {
        console.error('Error resetting Turnstile widget:', error);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.turnstile && widgetId !== null) {
        try {
          window.turnstile.remove(widgetId);
        } catch (error) {
          console.error('Error removing Turnstile widget:', error);
        }
      }
    };
  }, [widgetId]);

  return (
    <div className={`turnstile-container ${className}`}>
      <div 
        ref={containerRef} 
        className="min-h-[65px] flex items-center justify-center"
      >
        {!isLoaded && (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8B2325]"></div>
            <span className="text-sm">Loading security verification...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TurnstileWidget;
