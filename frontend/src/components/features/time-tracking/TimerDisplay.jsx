// frontend/src/components/features/time-tracking/TimerDisplay.jsx
// Story 4.4: Simple Mode UI - Timer Display Component

import { forwardRef } from 'react';

/**
 * TimerDisplay - Large elapsed time display
 *
 * Design specs:
 * - Font: Display 48px (from UX spec)
 * - Color: Neutral 900 when idle, different color when running
 * - Subtle pulse animation when running
 *
 * @param {Object} props
 * @param {string} props.time - Formatted time (HH:MM:SS)
 * @param {boolean} [props.isRunning=false] - Animation state
 * @param {string} [props.className] - Additional CSS classes
 */
const TimerDisplay = forwardRef(({
  time = '00:00:00',
  isRunning = false,
  className = '',
  ...props
}, ref) => {
  // Split time into parts for styling
  const [hours, minutes, seconds] = time.split(':');

  // Base styles
  const baseStyles = 'font-mono tabular-nums tracking-wider';

  // Size styles - large display (48px equivalent)
  const sizeStyles = 'text-5xl sm:text-6xl font-bold';

  // Color styles based on state
  const colorStyles = isRunning ? 'text-gray-900' : 'text-gray-400';

  // Animation styles
  const animationStyles = isRunning ? 'animate-pulse-subtle' : '';

  return (
    <div
      ref={ref}
      className={`${baseStyles} ${sizeStyles} ${colorStyles} ${animationStyles} ${className}`.trim()}
      role="timer"
      aria-live="polite"
      aria-label={`Temps ecoule: ${hours} heures, ${minutes} minutes, ${seconds} secondes`}
      {...props}
    >
      <span className="inline-block">{hours}</span>
      <span className={`inline-block mx-1 ${isRunning ? 'animate-blink' : ''}`}>:</span>
      <span className="inline-block">{minutes}</span>
      <span className={`inline-block mx-1 ${isRunning ? 'animate-blink' : ''}`}>:</span>
      <span className="inline-block">{seconds}</span>
    </div>
  );
});

TimerDisplay.displayName = 'TimerDisplay';

// CSS animations moved to src/index.css for proper loading
// Classes used: .animate-pulse-subtle, .animate-blink

export { TimerDisplay };
export default TimerDisplay;
