// frontend/src/components/ui/Progress.jsx
// Story 6.2: Reusable Chart Components - Progress Bar UI Component

import { forwardRef } from 'react';

/**
 * Progress bar component
 * Displays a horizontal progress indicator
 *
 * @param {Object} props
 * @param {number} props.value - Progress value (0-100)
 * @param {string} [props.indicatorColor] - Custom color for the indicator
 * @param {string} [props.className] - Additional CSS classes
 */
const Progress = forwardRef(({
  value = 0,
  indicatorColor,
  className = '',
  ...props
}, ref) => {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}
      {...props}
    >
      <div
        className="h-full rounded-full transition-all duration-300 ease-in-out"
        style={{
          width: `${clampedValue}%`,
          backgroundColor: indicatorColor || '#3B82F6'
        }}
      />
    </div>
  );
});

Progress.displayName = 'Progress';

export { Progress };
