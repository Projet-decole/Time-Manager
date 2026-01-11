// frontend/src/hooks/useTeams.js
// Story 3.6: Admin Management UI - Teams

import { useState, useEffect, useCallback, useRef } from 'react';
import { teamsService } from '../services/teamsService';

/**
 * Custom hook for managing teams data and operations
 * Story 3.6: Admin Management UI - Teams
 *
 * @param {Object} options - Hook options
 * @param {number} [options.page=1] - Current page
 * @param {number} [options.limit=20] - Items per page
 * @returns {Object} Teams state and operations
 */
export const useTeams = ({ page = 1, limit = 20 } = {}) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const isMountedRef = useRef(true);

  /**
   * Fetch teams from API
   */
  const fetchTeams = useCallback(async (fetchPage = page) => {
    setLoading(true);
    setError(null);

    try {
      const response = await teamsService.getAll({ page: fetchPage, limit });

      // Only update state if component is still mounted
      if (!isMountedRef.current) return;

      if (response.success) {
        setTeams(response.data);
        setPagination(response.meta?.pagination || {
          page: fetchPage,
          limit,
          total: response.data.length,
          totalPages: 1
        });
      } else {
        setError('Erreur lors du chargement des equipes');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err.message || 'Erreur lors du chargement des equipes');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [page, limit]);

  /**
   * Create a new team
   */
  const createTeam = async (teamData) => {
    const response = await teamsService.create(teamData);
    if (response.success) {
      await fetchTeams(pagination.page);
    }
    return response;
  };

  /**
   * Update a team
   */
  const updateTeam = async (id, teamData) => {
    const response = await teamsService.update(id, teamData);
    if (response.success) {
      await fetchTeams(pagination.page);
    }
    return response;
  };

  /**
   * Delete a team
   */
  const deleteTeam = async (id) => {
    const response = await teamsService.delete(id);
    if (response.success) {
      await fetchTeams(pagination.page);
    }
    return response;
  };

  /**
   * Refresh teams list
   */
  const refresh = useCallback(() => {
    return fetchTeams(pagination.page);
  }, [fetchTeams, pagination.page]);

  /**
   * Go to a specific page
   */
  const goToPage = useCallback((newPage) => {
    fetchTeams(newPage);
  }, [fetchTeams]);

  // Initial fetch with cleanup
  useEffect(() => {
    isMountedRef.current = true;
    fetchTeams();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchTeams]);

  return {
    teams,
    loading,
    error,
    pagination,
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    refresh,
    goToPage
  };
};

/**
 * Custom hook for managing a single team's details
 * Includes members and projects management
 *
 * @param {string} teamId - Team ID
 * @returns {Object} Team details state and operations
 */
export const useTeamDetails = (teamId) => {
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [membersError, setMembersError] = useState(null);
  const [projectsError, setProjectsError] = useState(null);
  const isMountedRef = useRef(true);

  /**
   * Fetch team details
   */
  const fetchTeam = useCallback(async () => {
    if (!teamId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await teamsService.getById(teamId);
      if (!isMountedRef.current) return;

      if (response.success) {
        setTeam(response.data);
      } else {
        setError('Erreur lors du chargement de l\'equipe');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err.message || 'Erreur lors du chargement de l\'equipe');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [teamId]);

  /**
   * Fetch team members
   */
  const fetchMembers = useCallback(async () => {
    if (!teamId) return;

    setMembersError(null);

    try {
      const response = await teamsService.getMembers(teamId);
      if (!isMountedRef.current) return;

      if (response.success) {
        // Flatten nested user data: { user: { firstName, ... } } -> { firstName, ... }
        // Use user.id as id since removeMember expects userId
        const flattenedMembers = (response.data || []).map(member => ({
          id: member.user?.id || member.userId,
          membershipId: member.id,
          firstName: member.user?.firstName || '',
          lastName: member.user?.lastName || '',
          email: member.user?.email || '',
          role: member.user?.role || ''
        }));
        setMembers(flattenedMembers);
      } else {
        setMembersError('Erreur lors du chargement des membres');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setMembersError(err.message || 'Erreur lors du chargement des membres');
    }
  }, [teamId]);

  /**
   * Fetch team projects
   */
  const fetchProjects = useCallback(async () => {
    if (!teamId) return;

    setProjectsError(null);

    try {
      const response = await teamsService.getProjects(teamId);
      if (!isMountedRef.current) return;

      if (response.success) {
        // Flatten nested project data: { project: { name, ... } } -> { name, ... }
        // Use project.id as id since unassignProject expects projectId
        const flattenedProjects = (response.data || []).map(teamProject => ({
          id: teamProject.project?.id || teamProject.projectId,
          assignmentId: teamProject.id,
          name: teamProject.project?.name || '',
          code: teamProject.project?.code || '',
          description: teamProject.project?.description || '',
          status: teamProject.project?.status || '',
          budgetHours: teamProject.project?.budgetHours || 0
        }));
        setProjects(flattenedProjects);
      } else {
        setProjectsError('Erreur lors du chargement des projets');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setProjectsError(err.message || 'Erreur lors du chargement des projets');
    }
  }, [teamId]);

  /**
   * Add a member to the team
   */
  const addMember = async (userId) => {
    const response = await teamsService.addMember(teamId, userId);
    if (response.success) {
      await fetchMembers();
      await fetchTeam();
    }
    return response;
  };

  /**
   * Remove a member from the team
   */
  const removeMember = async (userId) => {
    const response = await teamsService.removeMember(teamId, userId);
    if (response.success) {
      await fetchMembers();
      await fetchTeam();
    }
    return response;
  };

  /**
   * Assign a project to the team
   */
  const assignProject = async (projectId) => {
    const response = await teamsService.assignProject(teamId, projectId);
    if (response.success) {
      await fetchProjects();
    }
    return response;
  };

  /**
   * Unassign a project from the team
   */
  const unassignProject = async (projectId) => {
    const response = await teamsService.unassignProject(teamId, projectId);
    if (response.success) {
      await fetchProjects();
    }
    return response;
  };

  /**
   * Refresh all team data
   */
  const refresh = useCallback(async () => {
    await Promise.all([fetchTeam(), fetchMembers(), fetchProjects()]);
  }, [fetchTeam, fetchMembers, fetchProjects]);

  // Initial fetch when teamId changes with cleanup
  useEffect(() => {
    isMountedRef.current = true;

    if (teamId) {
      fetchTeam();
      fetchMembers();
      fetchProjects();
    } else {
      setTeam(null);
      setMembers([]);
      setProjects([]);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [teamId, fetchTeam, fetchMembers, fetchProjects]);

  return {
    team,
    members,
    projects,
    loading,
    error,
    membersError,
    projectsError,
    fetchTeam,
    fetchMembers,
    fetchProjects,
    addMember,
    removeMember,
    assignProject,
    unassignProject,
    refresh
  };
};

export default useTeams;
