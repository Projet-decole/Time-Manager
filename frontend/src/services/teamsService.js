// frontend/src/services/teamsService.js
// Story 3.6: Admin Management UI - Teams

import api from '../lib/api';

/**
 * Service for managing teams (manager-only operations)
 * Story 3.6: Admin Management UI - Teams
 */
export const teamsService = {
  /**
   * Get all teams with pagination
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Items per page
   * @returns {Promise<Object>} Response with data and pagination meta
   */
  async getAll({ page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });

    const response = await api.get(`/teams?${params}`);
    return response;
  },

  /**
   * Get a single team by ID
   * @param {string} id - Team ID
   * @returns {Promise<Object>} Team data
   */
  async getById(id) {
    const response = await api.get(`/teams/${id}`);
    return response;
  },

  /**
   * Create a new team
   * @param {Object} teamData - Team data
   * @param {string} teamData.name - Team name (required)
   * @param {string} [teamData.description] - Team description (optional)
   * @returns {Promise<Object>} Created team data
   */
  async create({ name, description }) {
    const data = { name };
    if (description) {
      data.description = description;
    }
    const response = await api.post('/teams', data);
    return response;
  },

  /**
   * Update a team
   * @param {string} id - Team ID
   * @param {Object} updateData - Data to update
   * @param {string} [updateData.name] - Team name
   * @param {string} [updateData.description] - Team description
   * @returns {Promise<Object>} Updated team data
   */
  async update(id, { name, description }) {
    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;

    const response = await api.patch(`/teams/${id}`, data);
    return response;
  },

  /**
   * Delete a team
   * @param {string} id - Team ID
   * @returns {Promise<Object>} Response
   */
  async delete(id) {
    const response = await api.delete(`/teams/${id}`);
    return response;
  },

  // ========== TEAM MEMBERS ==========

  /**
   * Get team members
   * @param {string} teamId - Team ID
   * @returns {Promise<Object>} Members list
   */
  async getMembers(teamId) {
    const response = await api.get(`/teams/${teamId}/members`);
    return response;
  },

  /**
   * Add a member to a team
   * @param {string} teamId - Team ID
   * @param {string} userId - User ID to add
   * @returns {Promise<Object>} Response
   */
  async addMember(teamId, userId) {
    const response = await api.post(`/teams/${teamId}/members`, { userId });
    return response;
  },

  /**
   * Remove a member from a team
   * @param {string} teamId - Team ID
   * @param {string} userId - User ID to remove
   * @returns {Promise<Object>} Response
   */
  async removeMember(teamId, userId) {
    const response = await api.delete(`/teams/${teamId}/members/${userId}`);
    return response;
  },

  // ========== TEAM PROJECTS ==========

  /**
   * Get team projects
   * @param {string} teamId - Team ID
   * @returns {Promise<Object>} Projects list
   */
  async getProjects(teamId) {
    const response = await api.get(`/teams/${teamId}/projects`);
    return response;
  },

  /**
   * Assign a project to a team
   * @param {string} teamId - Team ID
   * @param {string} projectId - Project ID to assign
   * @returns {Promise<Object>} Response
   */
  async assignProject(teamId, projectId) {
    const response = await api.post(`/teams/${teamId}/projects`, { projectId });
    return response;
  },

  /**
   * Unassign a project from a team
   * @param {string} teamId - Team ID
   * @param {string} projectId - Project ID to unassign
   * @returns {Promise<Object>} Response
   */
  async unassignProject(teamId, projectId) {
    const response = await api.delete(`/teams/${teamId}/projects/${projectId}`);
    return response;
  }
};

export default teamsService;
