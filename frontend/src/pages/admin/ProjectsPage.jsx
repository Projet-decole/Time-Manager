// frontend/src/pages/admin/ProjectsPage.jsx
// Story 3.7: Admin Management UI - Projects

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { projectsService } from '../../services/projectsService';
import { ProjectsList } from '../../components/features/projects/ProjectsList';
import { ProjectForm } from '../../components/features/projects/ProjectForm';
import { ProjectDetailPanel } from '../../components/features/projects/ProjectDetailPanel';

/**
 * Admin Projects page - displays project list with CRUD operations
 * Requires manager role (protected by RoleProtectedRoute)
 * Story 3.7: Admin Management UI - Projects
 */
export default function ProjectsPage() {
  // Projects state
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Filter state
  const [showArchived, setShowArchived] = useState(false);

  // Modal state for create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail panel state
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectTeams, setSelectedProjectTeams] = useState([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Success message state
  const [successMessage, setSuccessMessage] = useState(null);

  // Next code preview for create modal
  const [nextCode, setNextCode] = useState(null);

  /**
   * Calculate next project code based on existing projects
   */
  const calculateNextCode = useCallback((projectsList) => {
    if (!projectsList || projectsList.length === 0) {
      setNextCode('PRJ-001');
      return;
    }

    // Find the highest code number
    const codeNumbers = projectsList
      .map(p => {
        const match = p.code?.match(/PRJ-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));

    const maxNumber = codeNumbers.length > 0 ? Math.max(...codeNumbers) : 0;
    const nextNumber = maxNumber + 1;
    setNextCode(`PRJ-${String(nextNumber).padStart(3, '0')}`);
  }, []);

  /**
   * Fetch projects from API
   */
  const fetchProjects = useCallback(async (page = 1, includeArchived = showArchived) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await projectsService.getAll({
        page,
        limit: pagination.limit,
        includeArchived
      });

      if (response.success) {
        setProjects(response.data);
        setPagination(response.meta?.pagination || {
          page,
          limit: 20,
          total: response.data.length,
          totalPages: 1
        });
        // Calculate next code for create modal preview
        calculateNextCode(response.data);
      } else {
        setError('Erreur lors du chargement des projets');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des projets');
    } finally {
      setIsLoading(false);
    }
  }, [showArchived, pagination.limit, calculateNextCode]);

  // Fetch on mount and when filter changes
  useEffect(() => {
    fetchProjects(1, showArchived);
  }, [showArchived]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Handle toggle show archived
   */
  const handleToggleArchived = () => {
    setShowArchived(!showArchived);
  };

  /**
   * Handle pagination
   */
  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      fetchProjects(pagination.page - 1, showArchived);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      fetchProjects(pagination.page + 1, showArchived);
    }
  };

  /**
   * Handle opening create modal
   */
  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  /**
   * Handle opening edit modal
   */
  const handleOpenEditModal = (project) => {
    setEditingProject(project);
    setModalError(null);
    setIsModalOpen(true);
    // Close detail panel if open
    setIsDetailOpen(false);
  };

  /**
   * Handle closing modal
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    setModalError(null);
  };

  /**
   * Handle form submission (create or update)
   */
  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    setModalError(null);

    try {
      if (editingProject) {
        // Update existing project
        const response = await projectsService.update(editingProject.id, formData);
        if (response.success) {
          setSuccessMessage('Projet modifie avec succes');
          // Update local state
          setProjects(prev => prev.map(p =>
            p.id === editingProject.id ? { ...p, ...response.data } : p
          ));
        }
      } else {
        // Create new project
        const response = await projectsService.create(formData);
        if (response.success) {
          setSuccessMessage(`Projet cree avec succes (Code: ${response.data.code})`);
          // Refresh the list
          fetchProjects(pagination.page, showArchived);
        }
      }

      handleCloseModal();

      // Clear success message after 4 seconds
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      if (err.code === 'DUPLICATE_NAME') {
        setModalError('Un projet avec ce nom existe deja');
      } else if (err.code === 'NOT_FOUND') {
        setModalError('Projet non trouve');
      } else {
        setModalError(err.message || 'Erreur lors de l\'operation');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle archive project
   */
  const handleArchive = async (projectId) => {
    if (!window.confirm('Etes-vous sur de vouloir archiver ce projet ?')) {
      return;
    }

    try {
      const response = await projectsService.archive(projectId);
      if (response.success) {
        setSuccessMessage('Projet archive avec succes');

        if (showArchived) {
          // Update local state
          setProjects(prev => prev.map(p =>
            p.id === projectId ? { ...p, status: 'archived' } : p
          ));
        } else {
          // Remove from list
          setProjects(prev => prev.filter(p => p.id !== projectId));
        }

        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'archivage');
    }
  };

  /**
   * Handle restore project
   */
  const handleRestore = async (projectId) => {
    try {
      const response = await projectsService.restore(projectId);
      if (response.success) {
        setSuccessMessage('Projet restaure avec succes');

        // Update local state
        setProjects(prev => prev.map(p =>
          p.id === projectId ? { ...p, status: 'active' } : p
        ));

        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la restauration');
    }
  };

  /**
   * Handle row click for details - fetches full project data including teams
   */
  const handleRowClick = async (project) => {
    setSelectedProject(project);
    setSelectedProjectTeams([]);
    setIsDetailOpen(true);
    setIsDetailLoading(true);

    try {
      const response = await projectsService.getById(project.id);
      if (response.success) {
        setSelectedProject(response.data);
        setSelectedProjectTeams(response.data.teams || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des details:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  /**
   * Handle close detail panel
   */
  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedProject(null);
  };

  const showPagination = pagination.totalPages > 1;

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Gestion des projets</CardTitle>
            <div className="flex items-center gap-4">
              {/* Show Archived Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={handleToggleArchived}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Afficher archives</span>
              </label>

              {/* Create Project button */}
              <Button onClick={handleOpenCreateModal}>
                Nouveau projet
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Success message */}
          {successMessage && (
            <Alert variant="success" className="mb-4">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* Projects List */}
          <ProjectsList
            projects={projects}
            loading={isLoading}
            onEdit={handleOpenEditModal}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onRowClick={handleRowClick}
          />

          {/* Pagination */}
          {showPagination && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600 space-x-2">
                <span>{pagination.total} projets</span>
                <span>-</span>
                <span>Page {pagination.page} sur {pagination.totalPages}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={pagination.page <= 1}
                >
                  Precedent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <ProjectForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        project={editingProject}
        isLoading={isSubmitting}
        error={modalError}
        nextCode={editingProject ? null : nextCode}
      />

      {/* Detail Panel */}
      <ProjectDetailPanel
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        project={selectedProject}
        teams={selectedProjectTeams}
        onEdit={handleOpenEditModal}
        loading={isDetailLoading}
      />
    </div>
  );
}
