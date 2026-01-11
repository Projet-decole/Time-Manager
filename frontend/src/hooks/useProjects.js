// frontend/src/hooks/useProjects.js
// Story 3.7: Admin Management UI - Projects

import { useState, useEffect, useCallback } from 'react';
import { projectsService } from '../services/projectsService';

/**
 * Hook for managing projects data and state
 * Story 3.7: Admin Management UI - Projects
 *
 * @param {Object} options - Hook options
 * @param {boolean} [options.includeArchived=false] - Include archived projects
 * @returns {Object} Projects state and actions
 */
export function useProjects({ includeArchived = false } = {}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  /**
   * Fetch projects from API
   */
  const fetchProjects = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await projectsService.getAll({
        includeArchived,
        page,
        limit: pagination.limit
      });

      if (response.success) {
        setProjects(response.data);
        setPagination(response.meta?.pagination || {
          page,
          limit: 20,
          total: response.data.length,
          totalPages: 1
        });
      } else {
        setError('Erreur lors du chargement des projets');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  }, [includeArchived, pagination.limit]);

  /**
   * Create a new project
   */
  const createProject = useCallback(async (projectData) => {
    const response = await projectsService.create(projectData);
    if (response.success) {
      // Refresh list to get updated data
      await fetchProjects(pagination.page);
    }
    return response;
  }, [fetchProjects, pagination.page]);

  /**
   * Update a project
   */
  const updateProject = useCallback(async (id, projectData) => {
    const response = await projectsService.update(id, projectData);
    if (response.success) {
      // Update local state
      setProjects(prev => prev.map(p =>
        p.id === id ? { ...p, ...response.data } : p
      ));
    }
    return response;
  }, []);

  /**
   * Archive a project
   */
  const archiveProject = useCallback(async (id) => {
    const response = await projectsService.archive(id);
    if (response.success) {
      // Update local state or refetch
      if (includeArchived) {
        setProjects(prev => prev.map(p =>
          p.id === id ? { ...p, status: 'archived' } : p
        ));
      } else {
        // Remove from list if not showing archived
        setProjects(prev => prev.filter(p => p.id !== id));
      }
    }
    return response;
  }, [includeArchived]);

  /**
   * Restore an archived project
   */
  const restoreProject = useCallback(async (id) => {
    const response = await projectsService.restore(id);
    if (response.success) {
      setProjects(prev => prev.map(p =>
        p.id === id ? { ...p, status: 'active' } : p
      ));
    }
    return response;
  }, []);

  /**
   * Get project details
   */
  const getProjectDetails = useCallback(async (id) => {
    const response = await projectsService.getById(id);
    return response;
  }, []);

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      fetchProjects(pagination.page + 1);
    }
  }, [fetchProjects, pagination.page, pagination.totalPages]);

  /**
   * Go to previous page
   */
  const prevPage = useCallback(() => {
    if (pagination.page > 1) {
      fetchProjects(pagination.page - 1);
    }
  }, [fetchProjects, pagination.page]);

  /**
   * Refresh projects
   */
  const refresh = useCallback(() => {
    fetchProjects(pagination.page);
  }, [fetchProjects, pagination.page]);

  // Initial fetch
  useEffect(() => {
    fetchProjects(1);
  }, [fetchProjects]);

  return {
    // State
    projects,
    loading,
    error,
    pagination,

    // Actions
    createProject,
    updateProject,
    archiveProject,
    restoreProject,
    getProjectDetails,
    refresh,
    nextPage,
    prevPage
  };
}

export default useProjects;
