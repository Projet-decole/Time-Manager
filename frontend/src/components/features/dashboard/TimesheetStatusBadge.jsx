// frontend/src/components/features/dashboard/TimesheetStatusBadge.jsx
// Story 6.3: Employee Dashboard KPIs Section - Timesheet Status Badge

import { Badge } from '../../ui/Badge';

/**
 * Status configuration for timesheet states
 */
const STATUS_CONFIG = {
  draft: {
    label: 'Brouillon',
    variant: 'secondary',
    className: 'bg-gray-100 text-gray-800'
  },
  submitted: {
    label: 'Soumis',
    variant: 'default',
    className: 'bg-blue-100 text-blue-800'
  },
  validated: {
    label: 'Valide',
    variant: 'default',
    className: 'bg-green-100 text-green-800'
  },
  rejected: {
    label: 'Rejete',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800'
  }
};

/**
 * TimesheetStatusBadge Component
 * Displays a colored badge for timesheet status
 *
 * @param {Object} props
 * @param {string} props.status - 'draft' | 'submitted' | 'validated' | 'rejected'
 * @param {string} [props.size='md'] - 'sm' | 'md' | 'lg'
 * @param {string} [props.className] - Additional CSS classes
 */
export const TimesheetStatusBadge = ({
  status,
  size = 'md',
  className = ''
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  };

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${sizeClasses[size]} ${className}`}
      data-testid="timesheet-status-badge"
    >
      {config.label}
    </Badge>
  );
};

export default TimesheetStatusBadge;
