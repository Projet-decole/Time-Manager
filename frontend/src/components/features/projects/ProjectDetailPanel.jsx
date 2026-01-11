// frontend/src/components/features/projects/ProjectDetailPanel.jsx
// Story 3.7: Admin Management UI - Projects

import { useEffect, useRef } from 'react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { BudgetProgress } from './BudgetProgress';

/**
 * Project detail panel (side panel / sheet)
 * Story 3.7: Admin Management UI - Projects
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the panel is open
 * @param {Function} props.onClose - Callback to close the panel
 * @param {Object|null} props.project - Project data to display
 * @param {Array} [props.teams=[]] - Teams assigned to the project
 * @param {Function} props.onEdit - Callback when edit is clicked
 * @param {boolean} [props.loading=false] - Whether teams data is loading
 */
export function ProjectDetailPanel({
  isOpen,
  onClose,
  project,
  teams = [],
  onEdit,
  loading = false
}) {
  const panelRef = useRef(null);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !project) return null;

  const isArchived = project.status === 'archived';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-md bg-white shadow-xl overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 id="panel-title" className="text-lg font-semibold text-gray-900">
              Details du projet
            </h2>
            <Badge variant={isArchived ? 'secondary' : 'default'}>
              {isArchived ? 'Archive' : 'Actif'}
            </Badge>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Project Code */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Code</h3>
            <p className="font-mono text-lg text-blue-600">{project.code}</p>
          </div>

          {/* Project Name */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Nom</h3>
            <p className="text-gray-900">{project.name}</p>
          </div>

          {/* Description */}
          {project.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
            </div>
          )}

          {/* Budget Progress */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Budget</h3>
            <BudgetProgress
              budgetHours={project.budgetHours}
              trackedHours={project.totalHoursTracked || 0}
            />
          </div>

          {/* Hours Tracked */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Heures totales</h3>
            <p className="text-2xl font-bold text-gray-900">
              {(project.totalHoursTracked || 0).toFixed(1)}h
            </p>
          </div>

          {/* Assigned Teams */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Equipes assignees</h3>
            {loading ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                <span>Chargement...</span>
              </div>
            ) : teams.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {teams.map((team) => (
                  <Badge key={team.id} variant="outline">
                    {team.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Aucune equipe assignee</p>
            )}
          </div>

          {/* Created/Updated dates */}
          <div className="pt-4 border-t text-sm text-gray-500 space-y-1">
            {project.createdAt && (
              <p>Cree le: {new Date(project.createdAt).toLocaleDateString('fr-FR')}</p>
            )}
            {project.updatedAt && (
              <p>Modifie le: {new Date(project.updatedAt).toLocaleDateString('fr-FR')}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
          <Button onClick={() => onEdit(project)} className="w-full">
            Modifier le projet
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailPanel;
