import React, { useCallback, useEffect, useState } from 'react';
import { useSafeResizeObserver } from '../hooks/useSafeResizeObserver';

/**
 * Example component demonstrating safe ResizeObserver usage
 * This can be used as a template for other components that need resize observation
 */
interface SafeResizableComponentProps {
  children: React.ReactNode;
  onResize?: (width: number, height: number) => void;
  debounce?: number;
  className?: string;
}

export function SafeResizableComponent({
  children,
  onResize,
  debounce = 100,
  className = '',
}: SafeResizableComponentProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const handleResize = useCallback<ResizeObserverCallback>((entries) => {
    if (entries.length > 0) {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
      onResize?.(width, height);
    }
  }, [onResize]);

  const elementRef = useSafeResizeObserver<HTMLDivElement>(handleResize, {
    debounce,
    enabled: true,
  });

  return (
    <div ref={elementRef} className={className}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 right-0 bg-gray-800 text-white text-xs p-1 opacity-50">
          {dimensions.width}x{dimensions.height}
        </div>
      )}
    </div>
  );
}

/**
 * Higher-order component to wrap any component with safe resize observation
 */
export function withSafeResizeObserver<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    debounce?: number;
    onResize?: (width: number, height: number) => void;
  }
) {
  return function SafeResizeWrapper(props: P) {
    const handleResize = useCallback<ResizeObserverCallback>((entries) => {
      if (entries.length > 0 && options?.onResize) {
        const { width, height } = entries[0].contentRect;
        options.onResize(width, height);
      }
    }, []);

    const elementRef = useSafeResizeObserver<HTMLDivElement>(handleResize, {
      debounce: options?.debounce ?? 100,
      enabled: !!options?.onResize,
    });

    return (
      <div ref={options?.onResize ? elementRef : undefined}>
        <WrappedComponent {...props} />
      </div>
    );
  };
}
