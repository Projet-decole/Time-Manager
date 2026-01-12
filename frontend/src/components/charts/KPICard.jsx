// frontend/src/components/charts/KPICard.jsx
// Story 6.2: Reusable Chart Components - KPICard

import { Card, CardContent } from '../ui/Card';
import { Progress } from '../ui/Progress';
import { Skeleton } from '../ui/Skeleton';
import { getTrendIndicator, formatNumber, getProgressColor } from './chartUtils';

/**
 * KPICard Component
 * Displays a key performance indicator with optional progress and trend
 *
 * @param {Object} props
 * @param {string} props.title - KPI title
 * @param {number} props.value - KPI value
 * @param {string} [props.unit=''] - Value unit (e.g., 'h', '%')
 * @param {number} [props.target] - Optional target value
 * @param {number} [props.trend] - Optional trend percentage (positive = up, negative = down)
 * @param {React.ComponentType} [props.icon] - Optional icon component
 * @param {boolean} [props.loading=false] - Loading state
 * @param {string} [props.className] - Additional CSS classes
 */
export const KPICard = ({
  title,
  value,
  unit = '',
  target = null,
  trend = null,
  icon: Icon = null,
  loading = false,
  className = ''
}) => {
  // Loading state
  if (loading) {
    return (
      <Card className={className} data-testid="kpi-card-loading">
        <CardContent className="pt-6">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  const trendInfo = trend !== null ? getTrendIndicator(trend) : null;
  const progress = target && target > 0 ? (value / target) * 100 : null;
  const progressColor = target ? getProgressColor(value, target) : null;

  return (
    <Card className={className} data-testid="kpi-card">
      <CardContent className="pt-6">
        {/* Header with title and icon */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500">{title}</p>
          {Icon && (
            <Icon className="w-4 h-4 text-gray-400" aria-hidden="true" />
          )}
        </div>

        {/* Value display */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-gray-900" data-testid="kpi-value">
            {formatNumber(value)}
          </span>
          {unit && (
            <span className="text-lg text-gray-500">{unit}</span>
          )}
          {target !== null && (
            <span className="text-sm text-gray-400">
              / {formatNumber(target)}{unit}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {progress !== null && (
          <Progress
            value={Math.min(progress, 100)}
            className="h-2 mb-2"
            indicatorColor={progressColor}
          />
        )}

        {/* Trend indicator */}
        {trendInfo && (
          <div
            className="flex items-center gap-1 text-sm"
            style={{ color: trendInfo.color }}
            data-testid="kpi-trend"
          >
            <span aria-label={trendInfo.label}>{trendInfo.icon}</span>
            <span>{formatNumber(Math.abs(trend))}%</span>
            <span className="text-gray-500">vs sem. derniere</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KPICard;
