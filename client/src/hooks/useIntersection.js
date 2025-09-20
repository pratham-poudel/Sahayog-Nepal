import { useEffect, useRef, useState } from 'react';

/**
 * Custom intersection observer hook
 * @param {Object} options - Intersection Observer options
 * @returns {Object} - { ref, isIntersecting, entry }
 */
export const useIntersection = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      setEntry(entry);
    }, {
      threshold: options.threshold || 0.1,
      root: options.root || null,
      rootMargin: options.rootMargin || '0px'
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [options.threshold, options.root, options.rootMargin]);

  return { ref, isIntersecting, entry };
};