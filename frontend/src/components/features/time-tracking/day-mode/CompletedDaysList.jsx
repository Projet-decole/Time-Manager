// frontend/src/components/features/time-tracking/day-mode/CompletedDaysList.jsx
// Story 4.7: Day Mode UI with Timeline - Recent Completed Days List

import { forwardRef } from 'react';
import { Card } from '../../../ui/Card';

/**
 * CompletedDaysList - Shows recent completed days
 *
 * @param {Object} props
 * @param {Array} props.days - Array of completed day entries
 * @param {function} [props.onDayClick] - Click handler to view day details
 * @param {boolean} [props.loading=false] - Loading state
 * @param {string} [props.className] - Additional CSS classes
 */
const CompletedDaysList = forwardRef(({
  days = [],
  onDayClick,
  loading = false,
  className = '',
  ...props
}, ref) => {
  // Format date
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format duration from minutes
  const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined) return '--:--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };

  // Get unique projects from blocks
  const getProjectNames = (day) => {
    if (!day.blocks || day.blocks.length === 0) return 'Aucun bloc';

    const projectSet = new Set();
    day.blocks.forEach(block => {
      const name = block.project?.code || block.project?.name;
      if (name) projectSet.add(name);
    });

    if (projectSet.size === 0) return `${day.blocks.length} bloc(s)`;

    const names = Array.from(projectSet);
    if (names.length > 2) {
      return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
    }
    return names.join(', ');
  };

  // Loading skeleton
  if (loading) {
    return (
      <div ref={ref} className={`space-y-2 ${className}`} {...props}>
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="animate-pulse bg-gray-100 rounded-lg h-20"
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (days.length === 0) {
    return (
      <div
        ref={ref}
        className={`text-center py-8 text-gray-500 ${className}`}
        {...props}
      >
        <svg
          className="mx-auto h-12 w-12 text-gray-300 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm">Aucune journee recente</p>
      </div>
    );
  }

  return (
    <div ref={ref} className={`space-y-2 ${className}`} {...props}>
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Journees recentes
      </h3>

      {days.map(day => (
        <Card
          key={day.id}
          className={`p-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all ${onDayClick ? 'touch-manipulation' : ''}`}
          onClick={() => onDayClick && onDayClick(day)}
          role={onDayClick ? 'button' : undefined}
          tabIndex={onDayClick ? 0 : undefined}
          onKeyDown={(e) => e.key === 'Enter' && onDayClick && onDayClick(day)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 capitalize">
                {formatDate(day.startTime)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {getProjectNames(day)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {formatDuration(day.durationMinutes)}
              </p>
              <p className="text-xs text-gray-500">
                {day.blocks?.length || 0} bloc{(day.blocks?.length || 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
});

CompletedDaysList.displayName = 'CompletedDaysList';

export { CompletedDaysList };
export default CompletedDaysList;
