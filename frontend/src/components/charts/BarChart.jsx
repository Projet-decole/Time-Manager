// frontend/src/components/charts/BarChart.jsx
// Story 6.2: Reusable Chart Components - BarChart

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { CHART_COLORS, formatNumber } from './chartUtils';
import { Skeleton } from '../ui/Skeleton';

/**
 * Custom tooltip for the bar chart
 */
const CustomTooltip = ({ active, payload, label, valueFormatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">
          {valueFormatter ? valueFormatter(payload[0].value) : `${formatNumber(payload[0].value)}h`}
        </p>
      </div>
    );
  }
  return null;
};

/**
 * BarChart Component
 * Displays data as a bar chart (horizontal or vertical)
 *
 * @param {Object} props
 * @param {Array<{name: string, value: number, color?: string}>} props.data - Chart data
 * @param {boolean} [props.loading=false] - Loading state
 * @param {number} [props.height=300] - Chart height
 * @param {string} [props.orientation='vertical'] - Bar orientation ('horizontal' | 'vertical')
 * @param {string} [props.nameKey='name'] - Key for category names
 * @param {string} [props.valueKey='value'] - Key for values
 * @param {Object} [props.thresholds] - Color thresholds { warning: number, danger: number }
 * @param {string} [props.color] - Default bar color
 * @param {function} [props.valueFormatter] - Custom value formatter for tooltip
 */
export const BarChart = ({
  data = [],
  loading = false,
  height = 300,
  orientation = 'vertical',
  nameKey = 'name',
  valueKey = 'value',
  thresholds = null,
  color = CHART_COLORS.primary,
  valueFormatter
}) => {
  // Loading state
  if (loading) {
    return (
      <Skeleton className="w-full" style={{ height }} data-testid="bar-chart-loading" />
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-500"
        style={{ height }}
        data-testid="bar-chart-empty"
      >
        Aucune donnee disponible
      </div>
    );
  }

  /**
   * Get bar color based on value and thresholds
   */
  const getBarColor = (value) => {
    if (!thresholds) return color;
    if (value >= thresholds.danger) return CHART_COLORS.danger;
    if (value >= thresholds.warning) return CHART_COLORS.warning;
    return CHART_COLORS.success;
  };

  const isHorizontal = orientation === 'horizontal';

  return (
    <div data-testid="bar-chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout={isHorizontal ? 'vertical' : 'horizontal'}
          margin={{
            top: 10,
            right: 30,
            bottom: 5,
            left: isHorizontal ? 80 : 0
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          {isHorizontal ? (
            <>
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                type="category"
                dataKey={nameKey}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={false}
                width={80}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={nameKey}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={false}
              />
            </>
          )}
          <Tooltip content={<CustomTooltip valueFormatter={valueFormatter} />} />
          <Bar
            dataKey={valueKey}
            radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || getBarColor(entry[valueKey])}
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChart;
