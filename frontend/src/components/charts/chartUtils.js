// frontend/src/components/charts/chartUtils.js
// Story 6.2: Reusable Chart Components - Utilities and Color Palette

/**
 * Consistent color palette for all chart components
 * Following the design system colors
 */
export const CHART_COLORS = {
  primary: '#3B82F6',   // blue
  success: '#22C55E',   // green
  warning: '#F59E0B',   // amber
  danger: '#EF4444',    // red
  neutral: '#6B7280',   // gray
  // Series colors for multi-segment charts
  series: [
    '#3B82F6', // blue
    '#22C55E', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#06B6D4', // cyan
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
    '#6366F1'  // indigo
  ]
};

/**
 * Format number with French locale
 * @param {number} value - The number to format
 * @param {number} decimals - Maximum decimal places
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Format value as percentage
 * @param {number} value - The percentage value
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return `${formatNumber(value)}%`;
};

/**
 * Get color based on progress percentage
 * Green >= 80%, Yellow 50-79%, Red < 50%
 * @param {number} value - Current value
 * @param {number} max - Maximum value
 * @returns {string} Color hex code
 */
export const getProgressColor = (value, max) => {
  if (!max || max === 0) return CHART_COLORS.neutral;

  const percentage = (value / max) * 100;
  if (percentage >= 80) return CHART_COLORS.success;
  if (percentage >= 50) return CHART_COLORS.warning;
  return CHART_COLORS.danger;
};

/**
 * Get trend indicator with icon, color and label
 * @param {number} value - Trend value (positive = up, negative = down, 0 = neutral)
 * @returns {Object} Object with icon, color, and label properties
 */
export const getTrendIndicator = (value) => {
  if (value > 0) {
    return {
      icon: '\u2191', // Up arrow
      color: CHART_COLORS.success,
      label: 'En hausse'
    };
  }
  if (value < 0) {
    return {
      icon: '\u2193', // Down arrow
      color: CHART_COLORS.danger,
      label: 'En baisse'
    };
  }
  return {
    icon: '\u2192', // Right arrow (stable)
    color: CHART_COLORS.neutral,
    label: 'Stable'
  };
};

/**
 * Format duration in hours
 * @param {number} hours - Hours value
 * @returns {string} Formatted hours string
 */
export const formatHours = (hours) => {
  if (hours === null || hours === undefined || isNaN(hours)) {
    return '0h';
  }
  return `${formatNumber(hours)}h`;
};

/**
 * Calculate percentage of value against total
 * @param {number} value - The value
 * @param {number} total - The total
 * @returns {number} Percentage (0-100)
 */
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return (value / total) * 100;
};
