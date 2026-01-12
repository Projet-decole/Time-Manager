// frontend/src/components/features/time-tracking/day-mode/DayHeader.jsx
// Story 4.7: Day Mode UI with Timeline - Day Info Header

import { forwardRef, useMemo } from 'react';

/**
 * DayHeader - Displays day information and statistics
 *
 * @param {Object} props
 * @param {Object} props.day - Active day data
 * @param {Object} props.stats - Day statistics { totalMinutes, allocatedMinutes, unallocatedMinutes, allocationPercentage }
 * @param {string} [props.className] - Additional CSS classes
 */
const DayHeader = forwardRef(({
  day,
  stats,
  className = '',
  ...props
}, ref) => {
  // Format date
  const formattedDate = useMemo(() => {
    if (!day?.startTime) return '';
    const date = new Date(day.startTime);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [day?.startTime]);

  // Format start time
  const formattedStartTime = useMemo(() => {
    if (!day?.startTime) return '';
    const date = new Date(day.startTime);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [day?.startTime]);

  // Format duration from minutes
  const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined) return '--:--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };

  if (!day) return null;

  return (
    <div
      ref={ref}
      className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`.trim()}
      {...props}
    >
      {/* Date */}
      <h2 className="text-lg font-semibold text-gray-900 capitalize mb-3">
        Journee du {formattedDate}
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Start Time */}
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Debut</span>
          <span className="text-sm font-medium text-gray-900">{formattedStartTime}</span>
        </div>

        {/* Total Duration */}
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Duree</span>
          <span className="text-sm font-medium text-gray-900">
            {stats ? formatDuration(stats.totalMinutes) : '--:--'}
          </span>
        </div>

        {/* Allocated Time */}
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Alloue</span>
          <span className="text-sm font-medium text-green-600">
            {stats ? formatDuration(stats.allocatedMinutes) : '--:--'}
          </span>
        </div>

        {/* Allocation Percentage */}
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Repartition</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${stats?.allocationPercentage || 0}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900">
              {stats?.allocationPercentage || 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

DayHeader.displayName = 'DayHeader';

export { DayHeader };
export default DayHeader;
