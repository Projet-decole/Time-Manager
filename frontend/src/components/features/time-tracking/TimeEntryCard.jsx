// frontend/src/components/features/time-tracking/TimeEntryCard.jsx
// Story 4.4: Simple Mode UI - Time Entry Card Component
// Story 4.11: Added Edit/Delete menu

import { forwardRef, useState, useRef, useEffect } from 'react';
import { Badge } from '../../ui/Badge';

/**
 * TimeEntryCard - Single time entry display
 *
 * Displays: project name, category with color, duration (HH:MM), description
 * Story 4.11: Added contextual menu with Edit/Delete actions
 *
 * @param {Object} props
 * @param {Object} props.entry - Time entry data
 * @param {string} props.entry.id - Entry ID
 * @param {string} props.entry.startTime - Start time ISO string
 * @param {string} [props.entry.endTime] - End time ISO string
 * @param {number} [props.entry.durationMinutes] - Duration in minutes
 * @param {string} [props.entry.description] - Entry description
 * @param {Object} [props.entry.project] - Project data
 * @param {Object} [props.entry.category] - Category data
 * @param {boolean} [props.isToday=false] - Whether entry is from today (for highlighting)
 * @param {function} [props.onEdit] - Edit handler
 * @param {function} [props.onDelete] - Delete handler
 * @param {string} [props.className] - Additional CSS classes
 */
const TimeEntryCard = forwardRef(({
  entry,
  isToday = false,
  onEdit,
  onDelete,
  className = '',
  ...props
}, ref) => {
  const {
    startTime,
    endTime,
    durationMinutes,
    description,
    project,
    category
  } = entry;

  // Menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Handle edit click
  const handleEdit = () => {
    setMenuOpen(false);
    if (onEdit) {
      onEdit(entry);
    }
  };

  // Handle delete click
  const handleDelete = () => {
    setMenuOpen(false);
    if (onDelete) {
      onDelete(entry);
    }
  };

  // Format time range
  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format duration as HH:MM
  const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined) return '--:--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Truncate description if too long
  const truncateDescription = (text, maxLength = 100) => {
    if (!text) return null;
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Card background based on today status
  const bgStyles = isToday
    ? 'bg-blue-50 border-blue-200'
    : 'bg-white border-gray-200';

  return (
    <div
      ref={ref}
      className={`border rounded-lg p-4 ${bgStyles} ${className}`.trim()}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left side: Project, Category, Description */}
        <div className="flex-1 min-w-0">
          {/* Project Name */}
          <div className="flex items-center gap-2 mb-1">
            {project ? (
              <span className="font-medium text-gray-900 truncate">
                {project.code ? `${project.code}` : project.name}
              </span>
            ) : (
              <span className="text-gray-400 italic">Sans projet</span>
            )}

            {/* Category Badge */}
            {category && (
              <Badge
                variant="secondary"
                className="flex-shrink-0"
                style={{
                  backgroundColor: `${category.color}20`,
                  color: category.color,
                  borderColor: category.color
                }}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: category.color }}
                />
                {category.name}
              </Badge>
            )}
          </div>

          {/* Time Range */}
          <div className="text-sm text-gray-500 mb-1">
            {formatTime(startTime)} - {formatTime(endTime)}
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {truncateDescription(description)}
            </p>
          )}
        </div>

        {/* Right side: Duration and Menu */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900 tabular-nums">
            {formatDuration(durationMinutes)}
          </span>

          {/* Contextual Menu - Story 4.11 */}
          {(onEdit || onDelete) && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Options"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div
                  className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
                  role="menu"
                >
                  {onEdit && (
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      role="menuitem"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Modifier
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      role="menuitem"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Supprimer
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

TimeEntryCard.displayName = 'TimeEntryCard';

export { TimeEntryCard };
export default TimeEntryCard;
