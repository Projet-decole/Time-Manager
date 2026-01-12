// frontend/src/components/features/dashboard/DashboardKPIs.jsx
// Story 6.3: Employee Dashboard KPIs Section

import { Link } from 'react-router-dom';
import { KPICard } from '../../charts/KPICard';
import { TimesheetStatusBadge } from './TimesheetStatusBadge';

// SVG Icon Components (following project pattern - inline SVGs)
function ClockIcon({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CalendarIcon({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function TrendingUpIcon({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function FileCheckIcon({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}

/**
 * TimesheetStatusCard Component
 * Displays the current timesheet status with a link to view it
 *
 * @param {Object} props
 * @param {Object} props.status - Timesheet status data
 * @param {string} props.status.current - Current status ('draft' | 'submitted' | 'validated' | 'rejected')
 * @param {number} props.status.validated - Number of validated timesheets
 * @param {number} props.status.pending - Number of pending timesheets
 * @param {string} props.status.currentWeekStart - ISO date string for current week start
 */
const TimesheetStatusCard = ({ status }) => {
  // Handle edge case where status might be missing
  if (!status) {
    return (
      <div className="bg-white border rounded-lg p-6" data-testid="timesheet-status-card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500">Feuille de temps</p>
          <FileCheckIcon className="w-4 h-4 text-gray-400" />
        </div>
        <p className="text-gray-400 text-sm">Aucune donnee</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-6" data-testid="timesheet-status-card">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">Feuille de temps</p>
        <FileCheckIcon className="w-4 h-4 text-gray-400" />
      </div>

      <div className="mb-3">
        <TimesheetStatusBadge status={status.current} size="lg" />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {status.validated} validee{status.validated !== 1 ? 's' : ''}
        </span>
        <Link
          to={`/timesheets?week=${status.currentWeekStart}`}
          className="text-blue-600 hover:underline"
          data-testid="timesheet-link"
        >
          Voir &rarr;
        </Link>
      </div>

      {status.pending > 0 && (
        <p className="text-xs text-amber-600 mt-2" data-testid="pending-warning">
          {status.pending} en attente de validation
        </p>
      )}
    </div>
  );
};

/**
 * DashboardKPIs Component
 * Displays a grid of 4 KPI cards for the employee dashboard
 *
 * Layout:
 * - 1 column on mobile
 * - 2 columns on tablet (sm breakpoint)
 * - 4 columns on desktop (lg breakpoint)
 *
 * @param {Object} props
 * @param {Object} props.data - Dashboard data containing summary, comparison, and timesheetStatus
 * @param {boolean} [props.loading=false] - Loading state
 */
export const DashboardKPIs = ({ data, loading = false }) => {
  // Loading state - show skeleton cards
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="dashboard-kpis-loading">
        {[1, 2, 3, 4].map(i => (
          <KPICard key={i} loading title="" value={0} />
        ))}
      </div>
    );
  }

  // Handle missing data
  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500" data-testid="dashboard-kpis-empty">
        Aucune donnee disponible
      </div>
    );
  }

  const { summary, comparison, timesheetStatus } = data;

  // Calculate weekly progress percentage
  const weeklyProgress = summary?.weeklyTarget > 0
    ? Math.round((summary.hoursThisWeek / summary.weeklyTarget) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" data-testid="dashboard-kpis">
      {/* Hours This Week */}
      <KPICard
        title="Heures cette semaine"
        value={summary?.hoursThisWeek || 0}
        unit="h"
        target={summary?.weeklyTarget || null}
        trend={comparison?.weekOverWeek || null}
        icon={ClockIcon}
      />

      {/* Hours This Month */}
      <KPICard
        title="Heures ce mois"
        value={summary?.hoursThisMonth || 0}
        unit="h"
        target={summary?.monthlyTarget || null}
        trend={comparison?.monthOverMonth || null}
        icon={CalendarIcon}
      />

      {/* Weekly Progress */}
      <KPICard
        title="Progression semaine"
        value={weeklyProgress}
        unit="%"
        target={100}
        icon={TrendingUpIcon}
      />

      {/* Timesheet Status */}
      <TimesheetStatusCard status={timesheetStatus} />
    </div>
  );
};

export { TimesheetStatusCard };
export default DashboardKPIs;
