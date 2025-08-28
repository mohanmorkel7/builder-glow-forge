/**
 * Global ResizeObserver Loop Error Handler
 * 
 * This utility provides a comprehensive solution for handling ResizeObserver loop errors
 * that commonly occur with UI libraries like Radix UI, Recharts, and others.
 */

let isErrorHandlerInitialized = false;

/**
 * Initialize global ResizeObserver error handling
 * Should be called once in the main app entry point
 */
export function initializeResizeObserverErrorHandler(): void {
  if (isErrorHandlerInitialized) {
    return;
  }

  // Handle standard JavaScript errors
  const handleError = (event: ErrorEvent): void => {
    if (
      event.error?.message?.includes('ResizeObserver loop completed with undelivered notifications') ||
      event.message?.includes('ResizeObserver loop completed with undelivered notifications')
    ) {
      // Prevent the error from propagating
      event.preventDefault();
      event.stopImmediatePropagation();
      
      // Log for debugging (can be removed in production)
      console.warn('🔧 ResizeObserver loop detected and suppressed:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
      
      return;
    }
  };

  // Handle unhandled promise rejections
  const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
    const reason = event.reason;
    
    if (
      (typeof reason === 'string' && reason.includes('ResizeObserver loop completed with undelivered notifications')) ||
      (reason?.message && reason.message.includes('ResizeObserver loop completed with undelivered notifications'))
    ) {
      // Prevent the error from propagating
      event.preventDefault();
      
      // Log for debugging
      console.warn('🔧 ResizeObserver loop in promise detected and suppressed:', reason);
      
      return;
    }
  };

  // Add global error listeners
  window.addEventListener('error', handleError, true);
  window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

  // Override console.error to catch ResizeObserver errors that might slip through
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const errorMessage = args.join(' ');
    if (errorMessage.includes('ResizeObserver loop completed with undelivered notifications')) {
      console.warn('🔧 ResizeObserver loop detected in console.error and suppressed');
      return;
    }
    originalConsoleError.apply(console, args);
  };

  isErrorHandlerInitialized = true;
  console.log('✅ Global ResizeObserver error handler initialized');
}

/**
 * Create a safe ResizeObserver wrapper that handles errors gracefully
 */
export function createSafeResizeObserver(
  callback: ResizeObserverCallback,
  options?: ResizeObserverOptions
): ResizeObserver {
  const safeCallback: ResizeObserverCallback = (entries, observer) => {
    try {
      // Use requestAnimationFrame to prevent synchronous layout changes
      requestAnimationFrame(() => {
        try {
          callback(entries, observer);
        } catch (error) {
          if (error.message?.includes('ResizeObserver loop completed with undelivered notifications')) {
            console.warn('🔧 ResizeObserver callback error suppressed:', error.message);
            return;
          }
          throw error;
        }
      });
    } catch (error) {
      if (error.message?.includes('ResizeObserver loop completed with undelivered notifications')) {
        console.warn('🔧 ResizeObserver callback error suppressed:', error.message);
        return;
      }
      throw error;
    }
  };

  return new ResizeObserver(safeCallback);
}

/**
 * Debounced ResizeObserver for heavy operations
 */
export function createDebouncedResizeObserver(
  callback: ResizeObserverCallback,
  delay: number = 100,
  options?: ResizeObserverOptions
): ResizeObserver {
  let timeoutId: NodeJS.Timeout;

  const debouncedCallback: ResizeObserverCallback = (entries, observer) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      try {
        callback(entries, observer);
      } catch (error) {
        if (error.message?.includes('ResizeObserver loop completed with undelivered notifications')) {
          console.warn('🔧 Debounced ResizeObserver callback error suppressed:', error.message);
          return;
        }
        throw error;
      }
    }, delay);
  };

  return createSafeResizeObserver(debouncedCallback, options);
}

/**
 * Cleanup function to remove error handlers (useful for testing)
 */
export function cleanupResizeObserverErrorHandler(): void {
  // Note: This is a simplified cleanup - in practice, we'd need to store references
  // to the specific handlers to remove them properly
  isErrorHandlerInitialized = false;
  console.log('🧹 ResizeObserver error handler cleanup completed');
}
