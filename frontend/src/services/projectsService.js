// frontend/src/services/projectsService.js
// Story 3.7: Admin Management UI - Projects

import api from '../lib/api';

/**
 * Service for managing projects (manager-only operations)
 * Story 3.7: Admin Management UI - Projects
 */
export const projectsService = {
  /**
   * Get all projects with optional archived filter
   * @param {Object} options - Query options
   * @param {boolean} [options.includeArchived=false] - Include archived projects
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Items per page
   * @returns {Promise<Object>} Response with data and pagination meta
   */
  async getAll({ includeArchived = false, page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });

    if (includeArchived) {
      params.append('includeArchived', 'true');
    }

    const response = await api.get(`/projects?${params}`);
    return response;
  },

  /**
   * Get a single project by ID
   * @param {string} id - Project ID
   * @returns {Promise<Object>} Project data with details
   */
  async getById(id) {
    const response = await api.get(`/projects/${id}`);
    return response;
  },

  /**
   * Create a new project
   * @param {Object} projectData - Project data
   * @param {string} projectData.name - Project name (required)
   * @param {string} [projectData.description] - Project description
   * @param {number} [projectData.budgetHours] - Budget hours
   * @returns {Promise<Object>} Created project data with generated code
   */
  async create({ name, description, budgetHours }) {
    const data = { name };
    if (description) data.description = description;
    if (budgetHours !== undefined && budgetHours !== null && budgetHours !== '') {
      data.budgetHours = Number(budgetHours);
    }

    const response = await api.post('/projects', data);
    return response;
  },

  /**
   * Update a project
   * @param {string} id - Project ID
   * @param {Object} updateData - Data to update
   * @param {string} [updateData.name] - Project name
   * @param {string} [updateData.description] - Project description
   * @param {number} [updateData.budgetHours] - Budget hours (null to remove)
   * @returns {Promise<Object>} Updated project data
   */
  async update(id, { name, description, budgetHours }) {
    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (budgetHours !== undefined) {
      data.budgetHours = budgetHours === '' || budgetHours === null ? null : Number(budgetHours);
    }

    const response = await api.patch(`/projects/${id}`, data);
    return response;
  },

  /**
   * Archive a project
   * @param {string} id - Project ID
   * @returns {Promise<Object>} Updated project data
   */
  async archive(id) {
    const response = await api.post(`/projects/${id}/archive`);
    return response;
  },

  /**
   * Restore an archived project
   * @param {string} id - Project ID
   * @returns {Promise<Object>} Updated project data
   */
  async restore(id) {
    const response = await api.post(`/projects/${id}/restore`);
    return response;
  }
};

export default projectsService;
