import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const TurnstileWidget = forwardRef(({ 
  siteKey, 
  onVerify, 
  onExpire, 
  onError, 
  theme = 'light', 
  size = 'normal',
  className = '',
  autoReset = true, // Automatically reset on error
  resetDelay = 3000 // Delay before auto-reset (ms)
}, ref) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [widgetId, setWidgetId] = useState(null);
  const [error, setError] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const containerRef = useRef(null);
  const resetTimeoutRef = useRef(null);

  useEffect(() => {
    const loadTurnstile = () => {
      // Check if script already exists
      if (document.querySelector('script[src*="turnstile"]')) {
        if (window.turnstile) {
          setIsLoaded(true);
        }
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.onload = () => {
        setIsLoaded(true);
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

    // Clean up existing widget first
    if (widgetId !== null) {
      try {
        window.turnstile.remove(widgetId);
        setWidgetId(null);
      } catch (error) {
        console.warn('Error removing existing widget:', error);
      }
    }

    // Clear the container to ensure clean state
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    setTimeout(() => {
      if (!containerRef.current) return;
      
      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: handleVerify,
          'expired-callback': handleExpire,
          'error-callback': handleError,
          theme,
          size
        });
        setWidgetId(id);
      } catch (error) {
        console.error('Error rendering Turnstile widget:', error);
        handleError('render-error');
      }
    }, 100);
  };

  // Enhanced error handling callbacks
  const handleError = (errorCode) => {
    console.error('Turnstile error:', errorCode);
    setError(errorCode);
    
    if (onError) {
      onError(errorCode);
    }

    // Auto-reset on error if enabled
    if (autoReset) {
      resetTimeoutRef.current = setTimeout(() => {
        reset();
      }, resetDelay);
    }
  };

  const handleExpire = () => {
    console.log('Turnstile token expired');
    setIsExpired(true);
    
    if (onExpire) {
      onExpire();
    }

    // Auto-reset on expiry if enabled
    if (autoReset) {
      resetTimeoutRef.current = setTimeout(() => {
        reset();
      }, resetDelay);
    }
  };

  const handleVerify = (token) => {
    console.log('Turnstile verification successful');
    setError(null);
    setIsExpired(false);
    
    if (onVerify) {
      onVerify(token);
    }
  };

  const reset = () => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }

    if (window.turnstile && widgetId !== null) {
      try {
        // Try to reset first, if that fails, remove and recreate
        window.turnstile.reset(widgetId);
        setError(null);
        setIsExpired(false);
      } catch (error) {
        console.warn('Error resetting widget, recreating:', error);
        // If reset fails, remove and recreate the widget
        try {
          window.turnstile.remove(widgetId);
          setWidgetId(null);
          setError(null);
          setIsExpired(false);
          // Trigger re-render by updating isLoaded
          setTimeout(() => renderWidget(), 100);
        } catch (removeError) {
          console.error('Error removing widget:', removeError);
        }
      }
    }
  };

  // Expose reset method via ref
  useImperativeHandle(ref, () => ({
    reset,
    getWidgetId: () => widgetId,
    isExpired: () => isExpired,
    hasError: () => !!error
  }));

  // Render widget when loaded and ensure single instance
  useEffect(() => {
    if (isLoaded && !widgetId) {
      renderWidget();
    }
  }, [isLoaded, widgetId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }

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
        {error && (
          <div className="text-center">
            <div className="text-red-500 text-sm mb-2">
              Security verification failed. Please try again.
            </div>
            <button
              type="button"
              onClick={reset}
              className="px-3 py-1 bg-[#8B2325] text-white text-sm rounded hover:bg-[#7A1F21] transition-colors"
            >
              Retry
            </button>
          </div>
        )}
        {isExpired && !error && (
          <div className="text-center">
            <div className="text-yellow-600 text-sm mb-2">
              Security verification expired. Please verify again.
            </div>
            <button
              type="button"
              onClick={reset}
              className="px-3 py-1 bg-[#8B2325] text-white text-sm rounded hover:bg-[#7A1F21] transition-colors"
            >
              Verify Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

TurnstileWidget.displayName = 'TurnstileWidget';

export default TurnstileWidget;
