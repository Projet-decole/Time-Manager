// frontend/src/components/features/dashboard/DashboardCharts.jsx
// Story 6.4: Employee Dashboard Charts

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { DonutChart, LineChart } from '../../charts';
import { useDashboardByProject, useDashboardTrend } from '../../../hooks/useDashboard';
import { ProjectDrillDown } from './ProjectDrillDown';
import { Skeleton } from '../../ui/Skeleton';

/**
 * PeriodSelector Component
 * Tab-like selector for switching between periods
 *
 * @param {Object} props
 * @param {Array<{value: string, label: string}>} props.options - Period options
 * @param {string} props.value - Currently selected value
 * @param {Function} props.onChange - Callback when selection changes
 */
const PeriodSelector = ({ options, value, onChange }) => {
  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-0.5" data-testid="period-selector">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            value === option.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          data-testid={`period-option-${option.value}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

/**
 * EmptyState Component
 * Displayed when no data is available
 */
const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-gray-500" data-testid="chart-empty-state">
    <EmptyChartIcon className="w-12 h-12 mb-3 text-gray-300" />
    <p className="text-sm">{message}</p>
    <p className="text-xs text-gray-400 mt-1">Commencez a enregistrer du temps pour voir les statistiques</p>
  </div>
);

/**
 * EmptyChartIcon - Inline SVG icon for empty state
 */
function EmptyChartIcon({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}

/**
 * DashboardCharts Component
 * Displays donut chart (time by project) and line chart (daily trend)
 *
 * Features:
 * - Donut chart showing time distribution by project
 * - Line chart showing daily hours trend
 * - Period selectors for both charts
 * - Responsive grid layout
 * - Click on donut segment opens project drill-down
 */
export const DashboardCharts = () => {
  // Period states
  const [period, setPeriod] = useState('week');
  const [trendDays, setTrendDays] = useState(30);

  // Drill-down state
  const [selectedProject, setSelectedProject] = useState(null);

  // Fetch data using hooks
  const { data: projectData, loading: projectLoading } = useDashboardByProject(period);
  const { data: trendData, loading: trendLoading } = useDashboardTrend(trendDays);

  // Period options for donut chart
  const periodOptions = [
    { value: 'week', label: 'Semaine' },
    { value: 'month', label: 'Mois' }
  ];

  // Days options for trend chart
  const daysOptions = [
    { value: '7', label: '7j' },
    { value: '30', label: '30j' },
    { value: '90', label: '90j' }
  ];

  /**
   * Handle donut segment click
   * Opens the drill-down panel with project details
   */
  const handleProjectClick = (segmentData) => {
    if (segmentData) {
      setSelectedProject({
        projectId: segmentData.projectId,
        name: segmentData.name,
        value: segmentData.value
      });
    }
  };

  /**
   * Close the drill-down panel
   */
  const handleCloseDrillDown = () => {
    setSelectedProject(null);
  };

  /**
   * Handle trend days change (convert string to number)
   */
  const handleDaysChange = (value) => {
    setTrendDays(Number(value));
  };

  // Prepare chart data from API response
  const donutData = projectData?.breakdown?.map(p => ({
    name: p.projectName,
    value: p.hours,
    projectId: p.projectId
  })) || [];

  const trendChartData = trendData?.trend || [];
  const dailyTarget = trendData?.dailyTarget || 7;
  const averageHours = trendData?.average;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8" data-testid="dashboard-charts">
      {/* Distribution by Project - Donut Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Repartition par projet</CardTitle>
          <PeriodSelector
            options={periodOptions}
            value={period}
            onChange={setPeriod}
          />
        </CardHeader>
        <CardContent>
          {projectLoading ? (
            <div className="flex items-center justify-center" style={{ height: 300 }}>
              <Skeleton className="rounded-full w-[200px] h-[200px]" />
            </div>
          ) : donutData.length === 0 ? (
            <EmptyState message="Aucun projet enregistre" />
          ) : (
            <>
              <DonutChart
                data={donutData}
                loading={false}
                height={300}
                onSegmentClick={handleProjectClick}
              />
              {projectData?.totalHours !== undefined && (
                <p className="text-center text-sm text-gray-500 mt-2" data-testid="project-total-hours">
                  Total: {projectData.totalHours}h
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Daily Trend - Line Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Tendance journaliere</CardTitle>
          <PeriodSelector
            options={daysOptions}
            value={String(trendDays)}
            onChange={handleDaysChange}
          />
        </CardHeader>
        <CardContent>
          {trendLoading ? (
            <Skeleton className="w-full" style={{ height: 300 }} />
          ) : trendChartData.length === 0 ? (
            <EmptyState message="Aucune donnee de tendance" />
          ) : (
            <>
              <LineChart
                data={trendChartData}
                loading={false}
                height={300}
                xKey="date"
                yKey="hours"
                targetValue={dailyTarget}
                targetLabel="Objectif"
              />
              {averageHours !== undefined && (
                <p className="text-center text-sm text-gray-500 mt-2" data-testid="trend-average">
                  Moyenne: {averageHours}h/jour
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Project Drill-Down Panel */}
      {selectedProject && (
        <ProjectDrillDown
          project={selectedProject}
          period={period}
          onClose={handleCloseDrillDown}
        />
      )}
    </div>
  );
};

export default DashboardCharts;
