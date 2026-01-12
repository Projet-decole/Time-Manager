// frontend/src/components/charts/ProgressBar.jsx
// Story 6.2: Reusable Chart Components - ProgressBar

import { getProgressColor, formatPercentage } from './chartUtils';

/**
 * ProgressBar Component
 * Displays a horizontal progress bar with dynamic color based on progress
 *
 * Color coding:
 * - Green: >= 80%
 * - Yellow/Amber: 50-79%
 * - Red: < 50%
 *
 * @param {Object} props
 * @param {number} props.value - Current value
 * @param {number} props.max - Maximum value
 * @param {string} [props.label] - Optional label text
 * @param {boolean} [props.showPercentage=true] - Whether to show percentage text
 * @param {string} [props.height='h-2'] - Height class for the bar
 * @param {string} [props.className] - Additional CSS classes
 */
export const ProgressBar = ({
  value,
  max,
  label = null,
  showPercentage = true,
  height = 'h-2',
  className = ''
}) => {
  // Calculate percentage
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const clampedPercentage = Math.min(percentage, 100);
  const color = getProgressColor(value, max);

  return (
    <div className={`w-full ${className}`} data-testid="progress-bar">
      {/* Label and percentage header */}
      {(label || showPercentage) && (
        <div className="flex justify-between text-sm mb-1">
          {label && (
            <span className="text-gray-500" data-testid="progress-bar-label">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="font-medium text-gray-900" data-testid="progress-bar-percentage">
              {formatPercentage(percentage)}
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${height}`}>
        <div
          className="h-full rounded-full transition-all duration-300 ease-in-out"
          style={{
            width: `${clampedPercentage}%`,
            backgroundColor: color
          }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          data-testid="progress-bar-fill"
        />
      </div>
    </div>
  );
};

export default ProgressBar;
