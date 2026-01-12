// frontend/src/components/ui/Skeleton.jsx
// Story 6.2: Reusable Chart Components - Skeleton Loading State

import { forwardRef } from 'react';

/**
 * Skeleton loading placeholder component
 * Displays an animated shimmer effect for loading states
 */
const Skeleton = forwardRef(({
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`animate-pulse rounded-md bg-gray-200 ${className}`}
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton';

export { Skeleton };
