// frontend/src/components/features/time-tracking/template-mode/TemplateEntryItem.jsx
// Story 4.10: Implement Template Mode UI - Template Entry Display Component

import { forwardRef } from 'react';
import { Badge } from '../../../ui/Badge';

/**
 * TemplateEntryItem - Display a single entry in a template
 *
 * @param {Object} props
 * @param {Object} props.entry - Entry data
 * @param {string} props.entry.startTime - Start time (HH:MM)
 * @param {string} props.entry.endTime - End time (HH:MM)
 * @param {Object} [props.entry.project] - Project data
 * @param {Object} [props.entry.category] - Category data
 * @param {string} [props.entry.description] - Entry description
 * @param {boolean} [props.compact=false] - Show compact version (for card preview)
 * @param {function} [props.onClick] - Click handler
 * @param {string} [props.className] - Additional CSS classes
 */
const TemplateEntryItem = forwardRef(({
  entry,
  compact = false,
  onClick,
  className = '',
  ...props
}, ref) => {
  const {
    startTime,
    endTime,
    project,
    category,
    description
  } = entry;

  // Calculate duration
  const calculateDuration = () => {
    if (!startTime || !endTime) return null;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const durationMinutes = endMinutes - startMinutes;

    if (durationMinutes <= 0) return null;

    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins}m`;
  };

  const duration = calculateDuration();

  if (compact) {
    return (
      <div
        ref={ref}
        className={`flex items-center gap-2 text-xs text-gray-600 ${className}`.trim()}
        {...props}
      >
        <span className="font-medium text-gray-700">{startTime}-{endTime}</span>
        {project && (
          <span className="truncate">{project.code || project.name}</span>
        )}
        {category && (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: category.color || '#6B7280' }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`
        flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50
        ${onClick ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}
        ${className}
      `.trim()}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      {...props}
    >
      {/* Time block */}
      <div className="flex flex-col items-center min-w-[70px]">
        <span className="font-medium text-gray-900">{startTime}</span>
        <span className="text-xs text-gray-400">|</span>
        <span className="font-medium text-gray-900">{endTime}</span>
        {duration && (
          <span className="text-xs text-gray-500 mt-1">({duration})</span>
        )}
      </div>

      {/* Entry details */}
      <div className="flex-1 min-w-0">
        {/* Project */}
        <div className="flex items-center gap-2 mb-1">
          {project ? (
            <span className="font-medium text-gray-900 truncate">
              {project.code ? `${project.code} - ${project.name}` : project.name}
            </span>
          ) : (
            <span className="text-gray-500 italic">Sans projet</span>
          )}
        </div>

        {/* Category */}
        {category && (
          <Badge
            className="mb-1"
            style={{
              backgroundColor: `${category.color}20`,
              color: category.color,
              borderColor: category.color
            }}
          >
            {category.name}
          </Badge>
        )}

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
            {description}
          </p>
        )}
      </div>
    </div>
  );
});

TemplateEntryItem.displayName = 'TemplateEntryItem';

export { TemplateEntryItem };
export default TemplateEntryItem;
