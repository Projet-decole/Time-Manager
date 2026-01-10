// frontend/src/lib/api.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/**
 * Centralized API client with automatic auth handling
 * - Auto-attaches Authorization header if token exists
 * - Dispatches 'auth:logout' event on 401 responses
 * - Handles JSON parsing and error responses
 */
const api = {
  /**
   * Make an HTTP request to the API
   * @param {string} endpoint - API endpoint (e.g., '/users/me')
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Parsed JSON response
   * @throws {Error} On non-2xx responses or network errors
   */
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('accessToken');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      }
    });

    // Handle 401 Unauthorized - trigger logout
    if (response.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    // Parse JSON response
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error('Invalid JSON response');
    }

    // Throw on error responses
    if (!response.ok) {
      const error = new Error(data.error?.message || 'Request failed');
      error.code = data.error?.code;
      error.status = response.status;
      throw error;
    }

    return data;
  },

  /**
   * GET request
   * @param {string} url - API endpoint
   * @returns {Promise<Object>} Response data
   */
  get(url) {
    return api.request(url);
  },

  /**
   * POST request
   * @param {string} url - API endpoint
   * @param {Object} body - Request body
   * @returns {Promise<Object>} Response data
   */
  post(url, body) {
    return api.request(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  /**
   * PATCH request
   * @param {string} url - API endpoint
   * @param {Object} body - Request body
   * @returns {Promise<Object>} Response data
   */
  patch(url, body) {
    return api.request(url, {
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  },

  /**
   * DELETE request
   * @param {string} url - API endpoint
   * @returns {Promise<Object>} Response data
   */
  delete(url) {
    return api.request(url, { method: 'DELETE' });
  }
};

export default api;
