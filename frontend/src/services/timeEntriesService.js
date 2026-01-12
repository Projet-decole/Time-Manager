// frontend/src/services/timeEntriesService.js
// Story 4.4: Simple Mode UI - Time Entries Service

import api from '../lib/api';

/**
 * Service for managing time entries and timer operations
 * Story 4.4: Simple Mode UI
 */
export const timeEntriesService = {
  /**
   * Get all time entries with optional filters and pagination
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Items per page
   * @param {string} [options.startDate] - Filter by start date (ISO string)
   * @param {string} [options.endDate] - Filter by end date (ISO string)
   * @returns {Promise<Object>} Response with data and pagination meta
   */
  async getAll({ page = 1, limit = 20, startDate, endDate } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });

    if (startDate) {
      params.append('startDate', startDate);
    }
    if (endDate) {
      params.append('endDate', endDate);
    }

    const response = await api.get(`/time-entries?${params}`);
    return response;
  },

  /**
   * Get a single time entry by ID
   * @param {string} id - Time entry ID
   * @returns {Promise<Object>} Time entry data
   */
  async getById(id) {
    const response = await api.get(`/time-entries/${id}`);
    return response;
  },

  /**
   * Get the currently active timer (if any)
   * @returns {Promise<Object>} Response with active timer data or null
   */
  async getActive() {
    const response = await api.get('/time-entries/active');
    return response;
  },

  /**
   * Start a new timer
   * @param {Object} options - Timer options
   * @param {string} [options.projectId] - Project ID to associate
   * @param {string} [options.categoryId] - Category ID to associate
   * @param {string} [options.description] - Description text
   * @returns {Promise<Object>} Created time entry data
   */
  async startTimer({ projectId, categoryId, description } = {}) {
    const data = {};
    if (projectId) data.projectId = projectId;
    if (categoryId) data.categoryId = categoryId;
    if (description) data.description = description;

    const response = await api.post('/time-entries/start', data);
    return response;
  },

  /**
   * Stop the active timer
   * @param {Object} options - Optional updates to apply when stopping
   * @param {string} [options.projectId] - Project ID to update
   * @param {string} [options.categoryId] - Category ID to update
   * @param {string} [options.description] - Description to update
   * @returns {Promise<Object>} Completed time entry data
   */
  async stopTimer({ projectId, categoryId, description } = {}) {
    const data = {};
    if (projectId !== undefined) data.projectId = projectId;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (description !== undefined) data.description = description;

    const response = await api.post('/time-entries/stop', data);
    return response;
  },

  /**
   * Create a manual time entry (not using timer)
   * @param {Object} entryData - Time entry data
   * @param {string} entryData.startTime - Start time (ISO string)
   * @param {string} entryData.endTime - End time (ISO string)
   * @param {string} [entryData.projectId] - Project ID
   * @param {string} [entryData.categoryId] - Category ID
   * @param {string} [entryData.description] - Description
   * @returns {Promise<Object>} Created time entry data
   */
  async create({ startTime, endTime, projectId, categoryId, description }) {
    const data = { startTime, endTime };
    if (projectId) data.projectId = projectId;
    if (categoryId) data.categoryId = categoryId;
    if (description) data.description = description;

    const response = await api.post('/time-entries', data);
    return response;
  },

  /**
   * Update a time entry
   * @param {string} id - Time entry ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated time entry data
   */
  async update(id, updateData) {
    const response = await api.patch(`/time-entries/${id}`, updateData);
    return response;
  },

  /**
   * Delete a time entry
   * @param {string} id - Time entry ID
   * @returns {Promise<Object>} Response data
   */
  async delete(id) {
    const response = await api.delete(`/time-entries/${id}`);
    return response;
  },

  // ========================================
  // Day Mode - Day Container (Story 4.5)
  // ========================================

  /**
   * Start a workday
   * @param {Object} [data] - Optional data
   * @param {string} [data.description] - Day description
   * @returns {Promise<Object>} Created day entry data
   */
  async startDay(data = {}) {
    const response = await api.post('/time-entries/day/start', data);
    return response;
  },

  /**
   * End the active workday
   * @returns {Promise<Object>} Completed day entry with summary
   */
  async endDay() {
    const response = await api.post('/time-entries/day/end', {});
    return response;
  },

  /**
   * Get the currently active day (if any)
   * @returns {Promise<Object>} Response with active day data and blocks
   */
  async getActiveDay() {
    const response = await api.get('/time-entries/day/active');
    return response;
  },

  // ========================================
  // Day Mode - Time Blocks (Story 4.6)
  // ========================================

  /**
   * Get all blocks for the active day
   * @returns {Promise<Object>} Response with blocks array
   */
  async getDayBlocks() {
    const response = await api.get('/time-entries/day/blocks');
    return response;
  },

  /**
   * Create a time block in the active day
   * @param {Object} data - Block data
   * @param {string} data.startTime - Block start time (ISO string)
   * @param {string} data.endTime - Block end time (ISO string)
   * @param {string} [data.projectId] - Project ID
   * @param {string} [data.categoryId] - Category ID
   * @param {string} [data.description] - Block description
   * @returns {Promise<Object>} Created block data
   */
  async createDayBlock(data) {
    const response = await api.post('/time-entries/day/blocks', data);
    return response;
  },

  /**
   * Update a time block
   * @param {string} blockId - Block ID
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated block data
   */
  async updateDayBlock(blockId, data) {
    const response = await api.patch(`/time-entries/day/blocks/${blockId}`, data);
    return response;
  },

  /**
   * Delete a time block
   * @param {string} blockId - Block ID
   * @returns {Promise<Object>} Response data
   */
  async deleteDayBlock(blockId) {
    const response = await api.delete(`/time-entries/day/blocks/${blockId}`);
    return response;
  },

  /**
   * Get time entries filtered by entry mode
   * @param {Object} options - Query options
   * @param {string} [options.entryMode] - Filter by entry mode ('simple', 'day', 'template')
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Items per page
   * @returns {Promise<Object>} Response with data and pagination
   */
  async getByMode({ entryMode, page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });
    if (entryMode) {
      params.append('entryMode', entryMode);
    }
    const response = await api.get(`/time-entries?${params}`);
    return response;
  }
};

export default timeEntriesService;
