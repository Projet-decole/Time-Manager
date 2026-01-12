// frontend/src/components/features/time-tracking/day-mode/StartDayButton.jsx
// Story 4.7: Day Mode UI with Timeline - Start Day Button

import { forwardRef } from 'react';

/**
 * StartDayButton - Large CTA button for starting a workday
 *
 * Design specs (from UX):
 * - Size: 80px minimum height, touch-friendly
 * - Color: Green (#22C55E)
 * - Disabled: Gray, shows spinner when loading
 * - Touch target: >44px (WCAG compliant)
 *
 * @param {Object} props
 * @param {boolean} [props.isLoading=false] - Loading state
 * @param {function} props.onClick - Click handler
 * @param {string} [props.className] - Additional CSS classes
 */
const StartDayButton = forwardRef(({
  isLoading = false,
  onClick,
  className = '',
  ...props
}, ref) => {
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

  const stateStyles = isLoading
    ? 'bg-gray-400 text-white cursor-not-allowed'
    : 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-300 shadow-lg shadow-green-200';

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={`${baseStyles} ${stateStyles} ${className}`.trim()}
      aria-label="Demarrer la journee"
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <span className="flex items-center gap-2">
          <SunIcon />
          DEMARRER LA JOURNEE
        </span>
      )}
    </button>
  );
});

StartDayButton.displayName = 'StartDayButton';

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
 * Sun icon for start day button
 */
function SunIcon() {
  return (
    <svg
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

export { StartDayButton };
export default StartDayButton;
