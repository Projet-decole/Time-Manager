// frontend/src/components/charts/DonutChart.jsx
// Story 6.2: Reusable Chart Components - DonutChart

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CHART_COLORS, formatNumber, formatPercentage } from './chartUtils';
import { Skeleton } from '../ui/Skeleton';

/**
 * Custom tooltip for the donut chart
 */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-gray-900">{data.name}</p>
        <p className="text-sm text-gray-600">
          {formatNumber(data.value)}h ({formatPercentage(data.percentage)})
        </p>
      </div>
    );
  }
  return null;
};

/**
 * Custom legend renderer
 */
const renderLegend = (props) => {
  const { payload } = props;
  return (
    <ul className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry, index) => (
        <li key={`legend-${index}`} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-700">
            {entry.value} ({formatPercentage(entry.payload.percentage)})
          </span>
        </li>
      ))}
    </ul>
  );
};

/**
 * DonutChart Component
 * Displays data as a donut/pie chart with legend and tooltips
 *
 * @param {Object} props
 * @param {Array<{name: string, value: number, color?: string}>} props.data - Chart data
 * @param {boolean} [props.loading=false] - Loading state
 * @param {number} [props.height=300] - Chart height
 * @param {number} [props.innerRadius=60] - Inner radius of donut
 * @param {number} [props.outerRadius=100] - Outer radius of donut
 * @param {boolean} [props.showLegend=true] - Whether to show legend
 */
export const DonutChart = ({
  data = [],
  loading = false,
  height = 300,
  innerRadius = 60,
  outerRadius = 100,
  showLegend = true
}) => {
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Skeleton className="rounded-full" style={{ width: outerRadius * 2, height: outerRadius * 2 }} />
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-gray-500"
        style={{ height }}
        data-testid="donut-chart-empty"
      >
        Aucune donnee disponible
      </div>
    );
  }

  // Calculate total and percentages
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
  const dataWithPercentage = data.map((item, index) => ({
    ...item,
    percentage: total > 0 ? (item.value / total) * 100 : 0,
    color: item.color || CHART_COLORS.series[index % CHART_COLORS.series.length]
  }));

  return (
    <div data-testid="donut-chart" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dataWithPercentage}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {dataWithPercentage.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend content={renderLegend} />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DonutChart;
