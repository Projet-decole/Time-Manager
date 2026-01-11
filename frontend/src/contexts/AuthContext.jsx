// frontend/src/contexts/AuthContext.jsx

import { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

/**
 * Auth context for managing authentication state across the app
 * @type {React.Context}
 */
const AuthContext = createContext(null);

/**
 * AuthProvider component that wraps the app and provides auth state
 * Features:
 * - Auto-restores session on mount if token exists
 * - Listens for forced logout events (401 responses)
 * - Provides login, logout, and refreshUser functions
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      if (authService.isAuthenticated()) {
        try {
          const profile = await authService.getProfile();
          setUser(profile);
        } catch {
          // Token invalid or expired - clean up
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  // Listen for forced logout events (triggered by 401 responses)
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  /**
   * Log in a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Login response data
   */
  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  }, []);

  /**
   * Log out the current user
   */
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  /**
   * Refresh user profile data from the server
   * Useful after profile updates
   * @throws {Error} If profile fetch fails (caller should handle)
   */
  const refreshUser = useCallback(async () => {
    // Let errors propagate to caller - don't clear user state on error
    // 401 errors will be handled by the auth:logout event listener
    const profile = await authService.getProfile();
    setUser(profile);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
