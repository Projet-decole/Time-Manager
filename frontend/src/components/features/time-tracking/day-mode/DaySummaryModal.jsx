// frontend/src/components/features/time-tracking/day-mode/DaySummaryModal.jsx
// Story 4.7: Day Mode UI with Timeline - End Day Summary Modal

import { useMemo } from 'react';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';

/**
 * DaySummaryModal - Shows summary when ending a day
 *
 * @param {Object} props
 * @param {boolean} props.open - Modal visibility
 * @param {function} props.onClose - Close handler
 * @param {Object} props.summary - Day summary data
 * @param {function} [props.onSaveAsTemplate] - Save as template handler (Story 4.10)
 */
export function DaySummaryModal({
  open,
  onClose,
  summary,
  onSaveAsTemplate
}) {
  // Format duration from minutes
  const formatDuration = (minutes) => {
    if (minutes === null || minutes === undefined) return '--:--';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  };

  // Calculate breakdown by project
  const projectBreakdown = useMemo(() => {
    if (!summary?.blocks) return [];

    const byProject = {};
    summary.blocks.forEach(block => {
      const projectName = block.project?.name || 'Sans projet';
      const projectId = block.projectId || 'none';
      if (!byProject[projectId]) {
        byProject[projectId] = {
          name: projectName,
          minutes: 0,
          color: block.project?.color || '#6B7280'
        };
      }
      byProject[projectId].minutes += block.durationMinutes || 0;
    });

    return Object.values(byProject).sort((a, b) => b.minutes - a.minutes);
  }, [summary]);

  // Calculate breakdown by category
  const categoryBreakdown = useMemo(() => {
    if (!summary?.blocks) return [];

    const byCategory = {};
    summary.blocks.forEach(block => {
      const categoryName = block.category?.name || 'Sans categorie';
      const categoryId = block.categoryId || 'none';
      if (!byCategory[categoryId]) {
        byCategory[categoryId] = {
          name: categoryName,
          minutes: 0,
          color: block.category?.color || '#6B7280'
        };
      }
      byCategory[categoryId].minutes += block.durationMinutes || 0;
    });

    return Object.values(byCategory).sort((a, b) => b.minutes - a.minutes);
  }, [summary]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!summary) return null;

    const totalMinutes = summary.durationMinutes || 0;
    const allocatedMinutes = summary.meta?.totalBlocksMinutes ||
      summary.blocks?.reduce((sum, b) => sum + (b.durationMinutes || 0), 0) || 0;
    const unallocatedMinutes = summary.meta?.unallocatedMinutes ||
      (totalMinutes - allocatedMinutes);
    const allocationPercentage = totalMinutes > 0
      ? Math.round((allocatedMinutes / totalMinutes) * 100)
      : 0;

    return {
      totalMinutes,
      allocatedMinutes,
      unallocatedMinutes,
      allocationPercentage
    };
  }, [summary]);

  // Format time
  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!summary) return null;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Journee terminee"
      size="md"
    >
      <div className="space-y-6">
        {/* Success message */}
        <div className="flex items-center justify-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Time range */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            {formatTime(summary.startTime)} - {formatTime(summary.endTime)}
          </p>
        </div>

        {/* Main stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {stats ? formatDuration(stats.totalMinutes) : '--:--'}
            </p>
            <p className="text-xs text-gray-500 uppercase">Duree totale</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {stats ? formatDuration(stats.allocatedMinutes) : '--:--'}
            </p>
            <p className="text-xs text-gray-500 uppercase">Temps alloue</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-500">
              {stats ? formatDuration(stats.unallocatedMinutes) : '--:--'}
            </p>
            <p className="text-xs text-gray-500 uppercase">Non alloue</p>
          </div>
        </div>

        {/* Allocation bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Repartition du temps</span>
            <span className="font-medium">{stats?.allocationPercentage || 0}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${stats?.allocationPercentage || 0}%` }}
            />
          </div>
        </div>

        {/* Breakdown sections */}
        <div className="grid grid-cols-2 gap-4">
          {/* By Project */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Par projet</h4>
            <div className="space-y-1">
              {projectBreakdown.length > 0 ? (
                projectBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 truncate">{item.name}</span>
                    <span className="text-gray-900 font-medium">
                      {formatDuration(item.minutes)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">Aucun projet</p>
              )}
            </div>
          </div>

          {/* By Category */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Par categorie</h4>
            <div className="space-y-1">
              {categoryBreakdown.length > 0 ? (
                categoryBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-gray-600 truncate">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.name}
                    </span>
                    <span className="text-gray-900 font-medium">
                      {formatDuration(item.minutes)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400">Aucune categorie</p>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          {/* Save as Template button (Story 4.10) */}
          {onSaveAsTemplate && summary?.blocks?.length > 0 && (
            <Button
              variant="outline"
              onClick={() => onSaveAsTemplate(summary)}
              className="flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Enregistrer comme template
            </Button>
          )}

          {/* Close button */}
          <Button onClick={onClose} className={`min-w-[120px] ${!onSaveAsTemplate || !summary?.blocks?.length ? 'mx-auto' : ''}`}>
            Fermer
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default DaySummaryModal;
