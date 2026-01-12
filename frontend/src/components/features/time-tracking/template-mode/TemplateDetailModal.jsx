// frontend/src/components/features/time-tracking/template-mode/TemplateDetailModal.jsx
// Story 4.10: Implement Template Mode UI - Template Detail Modal Component

import { useMemo } from 'react';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';
import { TemplateEntryItem } from './TemplateEntryItem';

/**
 * TemplateDetailModal - View template full details
 *
 * @param {Object} props
 * @param {boolean} props.open - Modal visibility
 * @param {function} props.onClose - Close handler
 * @param {Object} props.template - Template data with entries
 * @param {function} props.onApply - Apply template handler
 * @param {function} props.onEdit - Edit template handler
 * @param {function} props.onDelete - Delete template handler
 * @param {boolean} [props.isLoading=false] - Loading state
 */
export function TemplateDetailModal({
  open,
  onClose,
  template,
  onApply,
  onEdit,
  onDelete,
  isLoading = false
}) {
  // Calculate stats
  const stats = useMemo(() => {
    if (!template || !template.entries) {
      return { blocksCount: 0, totalMinutes: 0, formattedDuration: '0h' };
    }

    const blocksCount = template.entries.length;
    const totalMinutes = template.entries.reduce((total, entry) => {
      if (!entry.startTime || !entry.endTime) return total;
      const [startH, startM] = entry.startTime.split(':').map(Number);
      const [endH, endM] = entry.endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      return total + Math.max(0, endMinutes - startMinutes);
    }, 0);

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    let formattedDuration = '0h';
    if (hours === 0 && mins > 0) formattedDuration = `${mins}m`;
    else if (mins === 0) formattedDuration = `${hours}h`;
    else formattedDuration = `${hours}h ${mins}m`;

    return { blocksCount, totalMinutes, formattedDuration };
  }, [template]);

  if (!template) return null;

  const { name, description, entries = [] } = template;
  const sortedEntries = [...entries].sort((a, b) => {
    const aTime = a.startTime || '00:00';
    const bTime = b.startTime || '00:00';
    return aTime.localeCompare(bTime);
  });

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={name}
      size="lg"
    >
      <div className="space-y-4">
        {/* Description */}
        {description && (
          <p className="text-gray-600">{description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600 py-2 border-y border-gray-100">
          <span className="flex items-center gap-1">
            <BlocksIcon />
            <strong>{stats.blocksCount}</strong> bloc{stats.blocksCount !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <ClockIcon />
            <strong>{stats.formattedDuration}</strong> total
          </span>
        </div>

        {/* Entries list */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          <h4 className="font-medium text-gray-900 mb-2">Blocs de temps</h4>
          {sortedEntries.length > 0 ? (
            sortedEntries.map((entry, index) => (
              <TemplateEntryItem
                key={entry.id || index}
                entry={entry}
              />
            ))
          ) : (
            <p className="text-gray-500 text-sm italic py-4 text-center">
              Aucun bloc dans ce template
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          {/* Delete button */}
          <Button
            variant="ghost"
            onClick={() => onDelete?.(template)}
            disabled={isLoading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Supprimer
          </Button>

          {/* Edit and Apply buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onEdit?.(template)}
              disabled={isLoading}
            >
              Modifier
            </Button>
            <Button
              onClick={() => onApply?.(template)}
              disabled={isLoading}
              className="flex items-center gap-1"
            >
              <PlayIcon />
              Appliquer
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

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

export default TemplateDetailModal;
