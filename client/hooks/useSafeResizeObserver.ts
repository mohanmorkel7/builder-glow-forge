import { useEffect, useRef, useCallback } from 'react';
import { createSafeResizeObserver, createDebouncedResizeObserver } from '../utils/resizeObserverHandler';

/**
 * Safe ResizeObserver hook that handles errors gracefully
 */
export function useSafeResizeObserver<T extends Element>(
  callback: ResizeObserverCallback,
  options?: {
    debounce?: number;
    enabled?: boolean;
  }
) {
  const elementRef = useRef<T>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Stable callback that uses the current callback ref
  const stableCallback = useCallback<ResizeObserverCallback>((entries, observer) => {
    callbackRef.current(entries, observer);
  }, []);

  // Setup and cleanup observer
  useEffect(() => {
    const element = elementRef.current;
    const enabled = options?.enabled !== false;

    if (!element || !enabled) {
      return;
    }

    // Create safe observer (with optional debouncing)
    if (options?.debounce && options.debounce > 0) {
      observerRef.current = createDebouncedResizeObserver(stableCallback, options.debounce);
    } else {
      observerRef.current = createSafeResizeObserver(stableCallback);
    }

    // Start observing
    observerRef.current.observe(element);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [stableCallback, options?.debounce, options?.enabled]);

  return elementRef;
}

/**
 * Hook for observing multiple elements safely
 */
export function useSafeMultiResizeObserver(
  callback: ResizeObserverCallback,
  elements: (Element | null)[],
  options?: {
    debounce?: number;
    enabled?: boolean;
  }
) {
  const observerRef = useRef<ResizeObserver | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Stable callback that uses the current callback ref
  const stableCallback = useCallback<ResizeObserverCallback>((entries, observer) => {
    callbackRef.current(entries, observer);
  }, []);

  useEffect(() => {
    const validElements = elements.filter((el): el is Element => el !== null);
    const enabled = options?.enabled !== false;

    if (validElements.length === 0 || !enabled) {
      return;
    }

    // Create safe observer (with optional debouncing)
    if (options?.debounce && options.debounce > 0) {
      observerRef.current = createDebouncedResizeObserver(stableCallback, options.debounce);
    } else {
      observerRef.current = createSafeResizeObserver(stableCallback);
    }

    // Observe all valid elements
    validElements.forEach(element => {
      observerRef.current?.observe(element);
    });

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [elements, stableCallback, options?.debounce, options?.enabled]);
}

/**
 * Hook for safe window resize handling (uses ResizeObserver on document.body)
 */
export function useSafeWindowResize(
  callback: (width: number, height: number) => void,
  options?: {
    debounce?: number;
    enabled?: boolean;
  }
) {
  const resizeCallback = useCallback<ResizeObserverCallback>((entries) => {
    if (entries.length > 0) {
      const { width, height } = entries[0].contentRect;
      callback(width, height);
    }
  }, [callback]);

  useEffect(() => {
    const enabled = options?.enabled !== false;
    if (!enabled) return;

    // Create safe observer for body element
    const observer = options?.debounce && options.debounce > 0
      ? createDebouncedResizeObserver(resizeCallback, options.debounce)
      : createSafeResizeObserver(resizeCallback);

    // Observe the body element
    observer.observe(document.body);

    return () => {
      observer.disconnect();
    };
  }, [resizeCallback, options?.debounce, options?.enabled]);
}
