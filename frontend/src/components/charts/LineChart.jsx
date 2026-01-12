// frontend/src/components/charts/LineChart.jsx
// Story 6.2: Reusable Chart Components - LineChart

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import { CHART_COLORS, formatNumber } from './chartUtils';
import { Skeleton } from '../ui/Skeleton';

/**
 * Custom tooltip for the line chart
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
 * LineChart Component
 * Displays data as a line chart with optional target line
 *
 * @param {Object} props
 * @param {Array<Object>} props.data - Chart data array
 * @param {boolean} [props.loading=false] - Loading state
 * @param {number} [props.height=300] - Chart height
 * @param {string} [props.xKey='date'] - Key for X axis data
 * @param {string} [props.yKey='hours'] - Key for Y axis data
 * @param {number} [props.targetValue] - Optional target line value
 * @param {string} [props.targetLabel='Objectif'] - Label for target line
 * @param {string} [props.color] - Line color
 * @param {function} [props.valueFormatter] - Custom value formatter for tooltip
 * @param {function} [props.xAxisFormatter] - Custom formatter for X axis labels
 */
export const LineChart = ({
  data = [],
  loading = false,
  height = 300,
  xKey = 'date',
  yKey = 'hours',
  targetValue = null,
  targetLabel = 'Objectif',
  color = CHART_COLORS.primary,
  valueFormatter,
  xAxisFormatter
}) => {
  // Loading state
  if (loading) {
    return (
      <Skeleton className="w-full" style={{ height }} data-testid="line-chart-loading" />
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-500"
        style={{ height }}
        data-testid="line-chart-empty"
      >
        Aucune donnee disponible
      </div>
    );
  }

  // Format date for display if xAxisFormatter not provided
  const defaultDateFormatter = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      });
    } catch {
      return dateString;
    }
  };

  const formatXAxis = xAxisFormatter || defaultDateFormatter;

  // Prepare data with formatted display values
  const formattedData = data.map(item => ({
    ...item,
    displayX: formatXAxis(item[xKey])
  }));

  return (
    <div data-testid="line-chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={formattedData}
          margin={{ top: 10, right: 30, bottom: 5, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="displayX"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip valueFormatter={valueFormatter} />} />
          {targetValue !== null && (
            <ReferenceLine
              y={targetValue}
              stroke={CHART_COLORS.warning}
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: targetLabel,
                position: 'insideBottomRight',
                fontSize: 12,
                fill: CHART_COLORS.warning
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 4, fill: color, strokeWidth: 2, stroke: 'white' }}
            activeDot={{ r: 6, fill: color, strokeWidth: 2, stroke: 'white' }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;
