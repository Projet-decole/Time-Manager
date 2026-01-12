// frontend/src/components/features/time-tracking/template-mode/TemplateCard.jsx
// Story 4.10: Implement Template Mode UI - Template Card Component

import { forwardRef, useState, useRef, useEffect } from 'react';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { TemplateEntryItem } from './TemplateEntryItem';

/**
 * TemplateCard - Template preview card for list display
 *
 * @param {Object} props
 * @param {Object} props.template - Template data
 * @param {function} props.onClick - Click to view details
 * @param {function} props.onApply - Apply template handler
 * @param {function} props.onEdit - Edit template handler
 * @param {function} props.onDelete - Delete template handler
 * @param {string} [props.className] - Additional CSS classes
 */
const TemplateCard = forwardRef(({
  template,
  onClick,
  onApply,
  onEdit,
  onDelete,
  className = '',
  ...props
}, ref) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const {
    name,
    description,
    entries = []
  } = template;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Calculate total duration
  const calculateTotalMinutes = () => {
    return entries.reduce((total, entry) => {
      if (!entry.startTime || !entry.endTime) return total;
      const [startH, startM] = entry.startTime.split(':').map(Number);
      const [endH, endM] = entry.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      return total + Math.max(0, endMinutes - startMinutes);
    }, 0);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const totalMinutes = calculateTotalMinutes();
  const blocksCount = entries.length;
  const previewEntries = entries.slice(0, 3);

  // Handle card click
  const handleCardClick = () => {
    onClick?.(template);
  };

  // Handle apply button click
  const handleApplyClick = (e) => {
    e.stopPropagation();
    onApply?.(template);
  };

  // Toggle menu
  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  // Handle edit
  const handleEdit = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit?.(template);
  };

  // Handle delete
  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete?.(template);
  };

  return (
    <Card
      ref={ref}
      className={`
        cursor-pointer hover:shadow-md transition-shadow
        ${className}
      `.trim()}
      onClick={handleCardClick}
      {...props}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-medium text-gray-900 truncate">{name}</h3>
            {description && (
              <p className="text-sm text-gray-500 line-clamp-2 mt-1">{description}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
          <span className="flex items-center gap-1">
            <BlocksIcon />
            {blocksCount} bloc{blocksCount !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <ClockIcon />
            {formatDuration(totalMinutes)}
          </span>
        </div>

        {/* Preview entries */}
        {previewEntries.length > 0 && (
          <div className="space-y-1 mb-3 border-t border-gray-100 pt-3">
            {previewEntries.map((entry, index) => (
              <TemplateEntryItem
                key={index}
                entry={entry}
                compact
              />
            ))}
            {entries.length > 3 && (
              <p className="text-xs text-gray-400 mt-1">
                +{entries.length - 3} autre{entries.length - 3 > 1 ? 's' : ''} bloc{entries.length - 3 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <Button
            size="sm"
            onClick={handleApplyClick}
            className="flex items-center gap-1"
          >
            <PlayIcon />
            Appliquer
          </Button>

          {/* Options menu */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="px-2"
              aria-label="Options"
            >
              <DotsIcon />
            </Button>

            {showMenu && (
              <div className="absolute right-0 bottom-full mb-1 w-36 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={handleEdit}
                  className="w-full px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                >
                  Modifier
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});

TemplateCard.displayName = 'TemplateCard';

// Icons
function BlocksIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
    </svg>
  );
}

export { TemplateCard };
export default TemplateCard;
