// frontend/src/components/features/time-tracking/TimerButton.jsx
// Story 4.4: Simple Mode UI - Timer Button Component

import { forwardRef } from 'react';

/**
 * TimerButton - XXL button for start/stop timer
 *
 * Design specs (from UX):
 * - Size: 80px minimum height, touch-friendly
 * - Idle: Green (#22C55E), text "DEMARRER"
 * - Running: Red (#EF4444), text "TERMINER"
 * - Disabled: Gray, shows spinner when loading
 * - Touch target: >44px (WCAG compliant)
 *
 * @param {Object} props
 * @param {boolean} props.isRunning - Timer is running
 * @param {boolean} props.isLoading - Loading state (starting or stopping)
 * @param {function} props.onClick - Click handler
 * @param {string} [props.className] - Additional CSS classes
 */
const TimerButton = forwardRef(({
  isRunning = false,
  isLoading = false,
  onClick,
  className = '',
  ...props
}, ref) => {
  // Base styles for XXL button
  const baseStyles = `
    w-full max-w-xs
    h-20 min-h-[80px]
    flex items-center justify-center
    rounded-2xl
    text-lg font-bold uppercase tracking-wide
    transition-all duration-200
    focus:outline-none focus:ring-4 focus:ring-offset-2
    disabled:cursor-not-allowed disabled:opacity-70
    touch-manipulation
  `;

  // State-specific styles
  const stateStyles = isRunning
    ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-300 shadow-lg shadow-red-200'
    : 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-300 shadow-lg shadow-green-200';

  // Disabled/loading styles override state styles
  const finalStyles = isLoading
    ? `${baseStyles} bg-gray-400 text-white cursor-not-allowed`
    : `${baseStyles} ${stateStyles}`;

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={`${finalStyles} ${className}`.trim()}
      aria-label={isRunning ? 'Arreter le timer' : 'Demarrer le timer'}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner />
      ) : isRunning ? (
        <span className="flex items-center gap-2">
          <StopIcon />
          TERMINER
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <PlayIcon />
          DEMARRER
        </span>
      )}
    </button>
  );
});

TimerButton.displayName = 'TimerButton';

/**
 * Loading spinner component
 */
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Play icon component
 */
function PlayIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/**
 * Stop icon component
 */
function StopIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
  );
}

export { TimerButton };
export default TimerButton;
