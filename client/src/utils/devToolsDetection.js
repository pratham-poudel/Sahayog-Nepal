/**
 * DevTools Detection Utility
 * Implements multiple detection methods to identify when browser DevTools are open
 * Note: No detection method is 100% unbreakable, but this makes it significantly harder
 */

class DevToolsDetector {
  constructor(options = {}) {
    this.isDevToolsOpen = false;
    this.callbacks = [];
    this.checkInterval = options.checkInterval || 1000;
    this.debuggerCheckInterval = options.debuggerCheckInterval || 100;
    this.intervalId = null;
    this.debuggerIntervalId = null;
    this.thresholdWidth = options.thresholdWidth || 160;
    this.thresholdHeight = options.thresholdHeight || 160;
    
    // Detection flags
    this.detectionMethods = {
      windowSize: true,
      debugger: true,
      toString: true,
      performance: true,
      consoleCheck: true
    };

    // Bind methods
    this.detectDevTools = this.detectDevTools.bind(this);
    this.checkWindowSize = this.checkWindowSize.bind(this);
    this.checkDebugger = this.checkDebugger.bind(this);
    this.checkConsole = this.checkConsole.bind(this);
    this.checkPerformance = this.checkPerformance.bind(this);
  }

  /**
   * Method 1: Check window size difference
   * When DevTools is open, there's a difference between window.outerWidth/Height and innerWidth/Height
   */
  checkWindowSize() {
    const widthThreshold = window.outerWidth - window.innerWidth > this.thresholdWidth;
    const heightThreshold = window.outerHeight - window.innerHeight > this.thresholdHeight;
    
    // Also check for docked DevTools
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    if (isFirefox) {
      return widthThreshold || heightThreshold;
    }
    
    return widthThreshold && heightThreshold;
  }

  /**
   * Method 2: Debugger statement
   * This will pause execution if DevTools is open
   */
  checkDebugger() {
    const start = performance.now();
    // This will cause a breakpoint if DevTools is open
    // We immediately continue, but measure the time it took
    debugger; // eslint-disable-line no-debugger
    const end = performance.now();
    
    // If DevTools is open, this will take longer due to the pause
    return end - start > 100;
  }

  /**
   * Method 3: Console toString override
   * DevTools calls toString on console arguments
   */
  checkConsole() {
    let devtoolsOpen = false;
    const element = new Image();
    
    Object.defineProperty(element, 'id', {
      get: function() {
        devtoolsOpen = true;
        return 'devtools-detector';
      }
    });
    
    // This will trigger the getter if console is open
    console.log('%c', element);
    console.clear();
    
    return devtoolsOpen;
  }

  /**
   * Method 4: Performance timing check
   * Execution is slower when DevTools is open
   */
  checkPerformance() {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      // Busy loop
    }
    const end = performance.now();
    
    // Arbitrary threshold - adjust based on testing
    return end - start > 10;
  }

  /**
   * Method 5: Function toString check
   * DevTools may modify function toString
   */
  checkToString() {
    const func = function() {};
    const toString = func.toString();
    
    // Check if toString has been modified
    return toString.includes('native code') === false && 
           toString.includes('function') === false;
  }

  /**
   * Main detection method combining all techniques
   */
  detectDevTools() {
    let detected = false;
    const results = {};

    if (this.detectionMethods.windowSize) {
      results.windowSize = this.checkWindowSize();
      detected = detected || results.windowSize;
    }

    if (this.detectionMethods.debugger) {
      results.debugger = this.checkDebugger();
      detected = detected || results.debugger;
    }

    if (this.detectionMethods.toString) {
      results.toString = this.checkToString();
      detected = detected || results.toString;
    }

    if (this.detectionMethods.performance) {
      results.performance = this.checkPerformance();
      detected = detected || results.performance;
    }

    if (this.detectionMethods.consoleCheck) {
      results.consoleCheck = this.checkConsole();
      detected = detected || results.consoleCheck;
    }

    // Update state if changed
    if (detected !== this.isDevToolsOpen) {
      this.isDevToolsOpen = detected;
      this.triggerCallbacks(detected, results);
    }

    return detected;
  }

  /**
   * Register a callback to be called when DevTools state changes
   */
  onDetect(callback) {
    if (typeof callback === 'function') {
      this.callbacks.push(callback);
    }
  }

  /**
   * Trigger all registered callbacks
   */
  triggerCallbacks(isOpen, results) {
    this.callbacks.forEach(callback => {
      try {
        callback(isOpen, results);
      } catch (error) {
        console.error('Error in DevTools detection callback:', error);
      }
    });
  }

  /**
   * Start continuous detection
   */
  start() {
    if (this.intervalId) {
      return; // Already started
    }

    // Initial check
    this.detectDevTools();

    // Regular checks
    this.intervalId = setInterval(() => {
      this.detectDevTools();
    }, this.checkInterval);

    // More frequent debugger checks
    this.debuggerIntervalId = setInterval(() => {
      if (this.detectionMethods.debugger) {
        const detected = this.checkDebugger();
        if (detected !== this.isDevToolsOpen) {
          this.isDevToolsOpen = detected;
          this.triggerCallbacks(detected, { debugger: detected });
        }
      }
    }, this.debuggerCheckInterval);
  }

  /**
   * Stop detection
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.debuggerIntervalId) {
      clearInterval(this.debuggerIntervalId);
      this.debuggerIntervalId = null;
    }
  }

  /**
   * Get current state
   */
  isOpen() {
    return this.isDevToolsOpen;
  }
}

// Singleton instance
let detectorInstance = null;

/**
 * Initialize DevTools detector
 */
export const initDevToolsDetector = (options = {}) => {
  if (!detectorInstance) {
    detectorInstance = new DevToolsDetector(options);
  }
  return detectorInstance;
};

/**
 * Get detector instance
 */
export const getDevToolsDetector = () => {
  if (!detectorInstance) {
    detectorInstance = new DevToolsDetector();
  }
  return detectorInstance;
};

/**
 * Hook for React components
 */
export const useDevToolsDetection = (onDetect) => {
  const detector = getDevToolsDetector();
  
  if (onDetect) {
    detector.onDetect(onDetect);
  }
  
  return {
    start: () => detector.start(),
    stop: () => detector.stop(),
    isOpen: () => detector.isOpen()
  };
};

export default DevToolsDetector;
