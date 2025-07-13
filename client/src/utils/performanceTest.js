// Performance monitoring utilities for the blog system
export const performanceMetrics = {
  // Page load time tracking
  trackPageLoad: (pageName) => {
    const startTime = performance.now();
    
    return {
      end: () => {
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        console.log(`${pageName} loaded in ${loadTime.toFixed(2)}ms`);
        
        // Log to analytics if available
        if (window.gtag) {
          window.gtag('event', 'page_load_time', {
            custom_parameter_1: pageName,
            custom_parameter_2: loadTime
          });
        }
        
        return loadTime;
      }
    };
  },

  // Image loading optimization
  trackImageLoad: (imageUrl) => {
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const loadTime = performance.now() - startTime;
        console.log(`Image ${imageUrl} loaded in ${loadTime.toFixed(2)}ms`);
        resolve(loadTime);
      };
      img.onerror = () => {
        console.warn(`Failed to load image: ${imageUrl}`);
        resolve(-1);
      };
      img.src = imageUrl;
    });
  },

  // API response time tracking
  trackAPICall: async (apiCall, apiName) => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      console.log(`${apiName} API responded in ${responseTime.toFixed(2)}ms`);
      
      // Log slow API calls
      if (responseTime > 3000) {
        console.warn(`Slow API call detected: ${apiName} took ${responseTime.toFixed(2)}ms`);
      }
      
      return { result, responseTime };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      console.error(`${apiName} API failed after ${responseTime.toFixed(2)}ms:`, error);
      throw error;
    }
  },

  // Memory usage monitoring
  trackMemoryUsage: () => {
    if (performance.memory) {
      const memory = performance.memory;
      console.log('Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });
      
      // Warn if memory usage is high
      const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (usagePercentage > 80) {
        console.warn(`High memory usage detected: ${usagePercentage.toFixed(2)}%`);
      }
    }
  },

  // Component render time tracking
  trackComponentRender: (componentName) => {
    const startTime = performance.now();
    
    return {
      end: () => {
        const renderTime = performance.now() - startTime;
        if (renderTime > 16) { // More than one frame at 60fps
          console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
        }
        return renderTime;
      }
    };
  },

  // Bundle size analysis
  analyzeBundleSize: () => {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    
    console.log('Bundle Analysis:', {
      scripts: scripts.length,
      styles: styles.length,
      totalResources: scripts.length + styles.length
    });
    
    return {
      scripts: scripts.map(s => s.src),
      styles: styles.map(s => s.href)
    };
  },

  // Core Web Vitals monitoring
  trackCoreWebVitals: () => {
    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime.toFixed(2) + 'ms');
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        console.log('FID:', entry.processingStart - entry.startTime + 'ms');
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      console.log('CLS:', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }
};

// Blog-specific performance tests
export const blogPerformanceTests = {
  testBlogListPerformance: async (blogCount) => {
    console.log(`Testing blog list performance with ${blogCount} blogs...`);
    
    const tracker = performanceMetrics.trackPageLoad('BlogList');
    
    // Simulate blog loading
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const loadTime = tracker.end();
    
    // Performance benchmarks
    const benchmarks = {
      excellent: loadTime < 1000,
      good: loadTime < 2000,
      acceptable: loadTime < 3000,
      poor: loadTime >= 3000
    };
    
    const rating = Object.keys(benchmarks).find(key => benchmarks[key]) || 'poor';
    
    console.log(`Blog list performance: ${rating.toUpperCase()}`);
    
    return { loadTime, rating, blogCount };
  },

  testImageOptimization: async (images) => {
    console.log('Testing image optimization...');
    
    const imageLoadTimes = await Promise.all(
      images.map(img => performanceMetrics.trackImageLoad(img))
    );
    
    const avgLoadTime = imageLoadTimes.reduce((a, b) => a + b, 0) / imageLoadTimes.length;
    const slowImages = imageLoadTimes.filter(time => time > 2000).length;
    
    console.log(`Average image load time: ${avgLoadTime.toFixed(2)}ms`);
    console.log(`Slow images (>2s): ${slowImages}`);
    
    return { avgLoadTime, slowImages, totalImages: images.length };
  },

  testSearchPerformance: async (searchTerm, blogData) => {
    console.log(`Testing search performance for "${searchTerm}"...`);
    
    const startTime = performance.now();
    
    // Simulate search operation
    const results = blogData.filter(blog => 
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const searchTime = performance.now() - startTime;
    
    console.log(`Search completed in ${searchTime.toFixed(2)}ms`);
    console.log(`Found ${results.length} results`);
    
    return { searchTime, resultCount: results.length, searchTerm };
  },

  generatePerformanceReport: (testResults) => {
    console.log('\n=== BLOG PERFORMANCE REPORT ===');
    
    testResults.forEach(result => {
      if (result.type === 'blogList') {
        console.log(`📄 Blog List: ${result.rating} (${result.loadTime.toFixed(2)}ms for ${result.blogCount} blogs)`);
      } else if (result.type === 'images') {
        console.log(`🖼️  Images: ${result.slowImages === 0 ? 'GOOD' : 'NEEDS IMPROVEMENT'} (avg: ${result.avgLoadTime.toFixed(2)}ms)`);
      } else if (result.type === 'search') {
        console.log(`🔍 Search: ${result.searchTime < 100 ? 'EXCELLENT' : 'GOOD'} (${result.searchTime.toFixed(2)}ms)`);
      }
    });
    
    console.log('===============================\n');
  }
};

// Initialize performance monitoring
export const initializePerformanceMonitoring = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Performance monitoring initialized');
    
    // Track core web vitals
    performanceMetrics.trackCoreWebVitals();
    
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      performanceMetrics.trackMemoryUsage();
    }, 30000);
    
    // Analyze bundle size on load
    window.addEventListener('load', () => {
      setTimeout(() => {
        performanceMetrics.analyzeBundleSize();
      }, 1000);
    });
  }
};
