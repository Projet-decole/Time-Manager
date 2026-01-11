// frontend/src/hooks/useAuth.js

import { useContext } from 'react';
import AuthContext from '../contexts/AuthContext';

/**
 * Hook to access auth context
 * Must be used within an AuthProvider
 * @returns {Object} Auth context value { user, isAuthenticated, isLoading, login, logout, refreshUser }
 * @throws {Error} If used outside AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
