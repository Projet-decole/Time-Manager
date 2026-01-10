// frontend/src/services/authService.js

import api from '../lib/api';

/**
 * Authentication service for managing user sessions
 * Handles login, logout, profile operations, and token storage
 */
export const authService = {
  /**
   * Log in a user with email and password
   * Stores tokens in localStorage on success
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data and session info
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });

    if (response.success && response.data.session) {
      localStorage.setItem('accessToken', response.data.session.accessToken);
      localStorage.setItem('refreshToken', response.data.session.refreshToken);
    }

    return response.data;
  },

  /**
   * Log out the current user
   * Clears tokens from localStorage even if API call fails
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore API errors - we still want to clear local state
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  /**
   * Get the current user's profile
   * @returns {Promise<Object>} User profile data
   */
  async getProfile() {
    const response = await api.get('/users/me');
    return response.data;
  },

  /**
   * Update the current user's profile
   * @param {Object} data - Profile data to update { firstName?, lastName?, weeklyHoursTarget? }
   * @returns {Promise<Object>} Updated profile data
   */
  async updateProfile(data) {
    const response = await api.patch('/users/me', data);
    return response.data;
  },

  /**
   * Request a password reset email
   * @param {string} email - User email
   * @returns {Promise<Object>} Response data
   */
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token from email
   * @param {string} password - New password
   * @returns {Promise<Object>} Response data
   */
  async resetPassword(token, password) {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  /**
   * Check if user has a valid access token in localStorage
   * Note: This doesn't verify the token is valid with the server
   * @returns {boolean} True if access token exists
   */
  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  },

  /**
   * Get the current access token
   * Used by external services that need direct token access (e.g., WebSocket connections)
   * For API requests, use the api client which handles auth automatically
   * @returns {string|null} Access token or null
   */
  getAccessToken() {
    return localStorage.getItem('accessToken');
  }
};

export default authService;
