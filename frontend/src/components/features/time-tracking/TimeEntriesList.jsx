// frontend/src/components/features/time-tracking/TimeEntriesList.jsx
// Story 4.4: Simple Mode UI - Time Entries List Component
// Story 4.11: Added Edit/Delete callbacks

import { forwardRef } from 'react';
import { TimeEntryCard } from './TimeEntryCard';

/**
 * TimeEntriesList - Recent entries grouped by date
 *
 * Features:
 * - Groups entries by date
 * - Highlights today's entries
 * - Sorted by startTime descending (most recent first)
 * - Shows loading skeleton during fetch
 * - Shows empty state when no entries
 * - Story 4.11: Edit/Delete actions via contextual menu
 *
 * @param {Object} props
 * @param {Array} props.groupedEntries - Entries grouped by date
 * @param {boolean} [props.loading=false] - Loading state
 * @param {string} [props.error=null] - Error message
 * @param {function} [props.onEdit] - Edit handler for entries
 * @param {function} [props.onDelete] - Delete handler for entries
 * @param {string} [props.className] - Additional CSS classes
 */
const TimeEntriesList = forwardRef(({
  groupedEntries = [],
  loading = false,
  error = null,
  onEdit,
  onDelete,
  className = '',
  ...props
}, ref) => {
  // Loading skeleton
  if (loading) {
    return (
      <div ref={ref} className={`space-y-6 ${className}`.trim()} {...props}>
        <LoadingSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div ref={ref} className={`${className}`.trim()} {...props}>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">
            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (groupedEntries.length === 0) {
    return (
      <div ref={ref} className={`${className}`.trim()} {...props}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div ref={ref} className={`space-y-6 ${className}`.trim()} {...props}>
      {groupedEntries.map((group) => (
        <div key={group.date}>
          {/* Date Header */}
          <div className="flex items-center gap-3 mb-3">
            <h3 className={`text-sm font-semibold ${group.isToday ? 'text-blue-600' : 'text-gray-500'}`}>
              {group.label}
            </h3>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">
              {group.entries.length} entree{group.entries.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Entries */}
          <div className="space-y-3">
            {group.entries.map((entry) => (
              <TimeEntryCard
                key={entry.id}
                entry={entry}
                isToday={group.isToday}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

TimeEntriesList.displayName = 'TimeEntriesList';

/**
 * Loading skeleton component
 */
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Date header skeleton */}
      <div className="flex items-center gap-3 mb-3">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="flex-1 h-px bg-gray-200" />
        <div className="h-3 w-16 bg-gray-200 rounded" />
      </div>

      {/* Entry skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-4 mb-3 border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-20 bg-gray-200 rounded" />
                <div className="h-5 w-16 bg-gray-200 rounded-full" />
              </div>
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>
            <div className="h-7 w-16 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="text-gray-300 mb-4">
        <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        Aucune entree de temps
      </h3>
      <p className="text-gray-500">
        Commencez a suivre votre temps en cliquant sur le bouton Demarrer.
      </p>
    </div>
  );
}

export { TimeEntriesList };
export default TimeEntriesList;
