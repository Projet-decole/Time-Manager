// frontend/src/components/features/dashboard/ProjectDrillDown.jsx
// Story 6.4: Employee Dashboard Charts - Project Drill-Down Panel

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sheet } from '../../ui/Sheet';
import { Button } from '../../ui/Button';
import { timeEntriesService } from '../../../services/timeEntriesService';

// SVG Icon Components (following project pattern - inline SVGs)

/**
 * ClockIcon - Inline SVG for time display
 */
function ClockIcon({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

/**
 * ExternalLinkIcon - Inline SVG for link to history
 */
function ExternalLinkIcon({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

/**
 * Format duration from minutes to hours and minutes string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration (e.g., "2h 30min")
 */
const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '0min';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

/**
 * Format ISO date string to French locale date
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date (e.g., "15 janv. 2024")
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

/**
 * Get period date range based on period type
 * @param {string} period - 'week' or 'month'
 * @returns {Object} { startDate, endDate } as ISO strings
 */
const getPeriodDateRange = (period) => {
  const now = new Date();
  let startDate, endDate;

  if (period === 'week') {
    // Get start of current week (Monday)
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startDate = new Date(now.setDate(diff));
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  } else {
    // Get start of current month
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  };
};

/**
 * ProjectDrillDown Component
 * Side panel showing detailed time entries for a specific project
 *
 * @param {Object} props
 * @param {Object} props.project - Project data { projectId, name, value (hours) }
 * @param {string} props.period - Current period ('week' | 'month')
 * @param {Function} props.onClose - Callback to close the panel
 */
export const ProjectDrillDown = ({ project, period, onClose }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch time entries for this project when opened
  useEffect(() => {
    const fetchEntries = async () => {
      if (!project?.projectId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get date range for current period
        const { startDate, endDate } = getPeriodDateRange(period);

        // Fetch all entries for the date range
        // Note: The API currently doesn't support projectId filter,
        // so we fetch all and filter client-side
        const response = await timeEntriesService.getAll({
          startDate,
          endDate,
          limit: 100
        });

        if (response.success && response.data) {
          // Filter entries by projectId
          const projectEntries = response.data.filter(
            entry => entry.projectId === project.projectId
          );
          setEntries(projectEntries);
        } else {
          setEntries([]);
        }
      } catch (err) {
        console.error('Failed to fetch entries:', err);
        setError('Erreur lors du chargement des entrees');
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [project?.projectId, period]);

  // Get period label for display
  const periodLabel = period === 'week' ? 'cette semaine' : 'ce mois';

  return (
    <Sheet
      isOpen={true}
      onClose={onClose}
      title={project?.name || 'Projet'}
      description={`${project?.value || 0}h ${periodLabel}`}
      data-testid="project-drilldown"
    >
      <div className="space-y-4" data-testid="project-drilldown-content">
        {/* Summary */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <ClockIcon className="w-5 h-5" />
            <span className="text-lg font-semibold">{project?.value || 0}h</span>
            <span className="text-sm text-blue-600">{periodLabel}</span>
          </div>
        </div>

        {/* Entries List */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Entrees de temps ({entries.length})
          </h4>

          {loading ? (
            <div className="space-y-2" data-testid="drilldown-loading">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="text-red-500 text-sm py-4 text-center" data-testid="drilldown-error">
              {error}
            </div>
          ) : entries.length === 0 ? (
            <p className="text-gray-500 text-center py-8" data-testid="drilldown-empty">
              Aucune entree trouvee pour ce projet
            </p>
          ) : (
            <div className="space-y-3" data-testid="drilldown-entries">
              {entries.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                  data-testid="drilldown-entry"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {entry.description || 'Sans description'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(entry.startTime)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600 ml-3">
                    <ClockIcon className="w-4 h-4" />
                    <span>{formatDuration(entry.durationMinutes)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Link to History */}
        <div className="border-t pt-4">
          <Button
            variant="outline"
            className="w-full"
            asChild
            data-testid="view-history-link"
          >
            <Link to={`/time-tracking?projectId=${project?.projectId || ''}`}>
              <ExternalLinkIcon className="w-4 h-4 mr-2" />
              Voir tout l'historique
            </Link>
          </Button>
        </div>
      </div>
    </Sheet>
  );
};

export default ProjectDrillDown;
