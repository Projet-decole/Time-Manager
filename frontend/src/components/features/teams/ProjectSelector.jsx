// frontend/src/components/features/teams/ProjectSelector.jsx
// Story 3.6: Project selection modal for assigning projects to a team

import { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Alert, AlertDescription } from '../../ui/Alert';
import api from '../../../lib/api';

/**
 * ProjectSelector modal component for assigning projects to a team
 * Story 3.6: AC8 - Assign/Unassign Project
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onSelect - Callback when a project is selected
 * @param {Array} [props.excludeProjectIds=[]] - Project IDs to exclude (already assigned)
 * @param {boolean} [props.isLoading=false] - Whether selection is in progress
 * @param {string|null} [props.error=null] - Error message to display
 */
export function ProjectSelector({
  isOpen,
  onClose,
  onSelect,
  excludeProjectIds = [],
  isLoading = false,
  error = null
}) {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Fetch projects when modal opens
  useEffect(() => {
    const fetchProjects = async () => {
      if (!isOpen) return;

      setLoadingProjects(true);
      setLoadError(null);

      try {
        // Fetch all projects
        const response = await api.get('/projects?limit=100');
        if (response.success) {
          setProjects(response.data || []);
        } else {
          setLoadError('Erreur lors du chargement des projets');
        }
      } catch (err) {
        setLoadError(err.message || 'Erreur lors du chargement des projets');
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [isOpen]);

  // Filter projects: exclude already-assigned and apply search
  const filteredProjects = useMemo(() => {
    const excludeSet = new Set(excludeProjectIds);

    return projects
      .filter((project) => !excludeSet.has(project.id))
      .filter((project) => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
          project.name.toLowerCase().includes(search) ||
          project.code?.toLowerCase().includes(search) ||
          project.description?.toLowerCase().includes(search)
        );
      });
  }, [projects, excludeProjectIds, searchTerm]);

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  const handleSelect = (project) => {
    onSelect(project);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Assigner un projet">
      {(error || loadError) && (
        <Alert variant="error" className="mb-4">
          <AlertDescription>{error || loadError}</AlertDescription>
        </Alert>
      )}

      {/* Search input */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Rechercher par nom ou code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Projects list */}
      <div className="max-h-[300px] overflow-y-auto border rounded-md">
        {loadingProjects ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm
              ? 'Aucun projet trouve'
              : 'Aucun projet disponible'
            }
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredProjects.map((project) => (
              <li
                key={project.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {project.name}
                  </p>
                  {project.code && (
                    <p className="text-sm text-gray-500">Code: {project.code}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading}
                  onClick={() => handleSelect(project)}
                >
                  {isLoading ? 'Assignation...' : 'Assigner'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Close button */}
      <div className="flex justify-end pt-4 border-t mt-4">
        <Button variant="outline" onClick={handleClose}>
          Fermer
        </Button>
      </div>
    </Modal>
  );
}

export default ProjectSelector;
