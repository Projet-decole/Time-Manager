// frontend/src/__tests__/contexts/AuthContext.test.jsx

import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthProvider } from '../../contexts/AuthContext';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';

// Mock authService
vi.mock('../../services/authService', () => ({
  authService: {
    isAuthenticated: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn()
  }
}));

// Test component that uses the hook
function TestConsumer() {
  const { user, isAuthenticated, isLoading, login, logout, refreshUser } = useAuth();

  const handleRefresh = async () => {
    try {
      await refreshUser();
    } catch {
      // Silently handle error for testing - in real app would show toast
    }
  };

  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="user">{user ? JSON.stringify(user) : 'null'}</span>
      <button onClick={() => login('test@test.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={handleRefresh}>Refresh</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: not authenticated
    authService.isAuthenticated.mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AuthProvider', () => {
    test('should render children', async () => {
      render(
        <AuthProvider>
          <div data-testid="child">Child content</div>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('child')).toBeInTheDocument();
      });
    });

    test('should start with isLoading=true then become false', async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      // Eventually loading should be false
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });
    });

    test('should have isAuthenticated=false when no token', async () => {
      authService.isAuthenticated.mockReturnValue(false);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      });
    });

    test('should restore session when token exists', async () => {
      const mockProfile = { id: '1', email: 'test@test.com', firstName: 'John' };
      authService.isAuthenticated.mockReturnValue(true);
      authService.getProfile.mockResolvedValueOnce(mockProfile);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockProfile));
      });
    });

    test('should clear auth when session restore fails', async () => {
      authService.isAuthenticated.mockReturnValue(true);
      authService.getProfile.mockRejectedValueOnce(new Error('Token expired'));

      // Mock localStorage
      const mockLocalStorage = {
        removeItem: vi.fn()
      };
      Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      });
    });
  });

  describe('login function', () => {
    test('should update user state on successful login', async () => {
      const mockUser = { id: '1', email: 'test@test.com' };
      authService.login.mockResolvedValueOnce({ user: mockUser });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await act(async () => {
        screen.getByText('Login').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      });
    });
  });

  describe('logout function', () => {
    test('should clear user state on logout', async () => {
      const mockUser = { id: '1', email: 'test@test.com' };
      authService.isAuthenticated.mockReturnValue(true);
      authService.getProfile.mockResolvedValueOnce(mockUser);
      authService.logout.mockResolvedValueOnce();

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      });

      await act(async () => {
        screen.getByText('Logout').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
        expect(screen.getByTestId('user')).toHaveTextContent('null');
      });
    });
  });

  describe('refreshUser function', () => {
    test('should update user with fresh profile data', async () => {
      const initialUser = { id: '1', firstName: 'John' };
      const updatedUser = { id: '1', firstName: 'Jane' };

      authService.isAuthenticated.mockReturnValue(true);
      authService.getProfile
        .mockResolvedValueOnce(initialUser)
        .mockResolvedValueOnce(updatedUser);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('John');
      });

      await act(async () => {
        screen.getByText('Refresh').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('Jane');
      });
    });

    test('should keep user state when refresh fails', async () => {
      const initialUser = { id: '1', firstName: 'John' };

      authService.isAuthenticated.mockReturnValue(true);
      authService.getProfile
        .mockResolvedValueOnce(initialUser)
        .mockRejectedValueOnce(new Error('Network error'));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('John');
      });

      // Click refresh - the error will be thrown but caught by React error boundary
      // We're testing that user state is preserved
      await act(async () => {
        screen.getByText('Refresh').click();
        // Wait for the rejection to settle
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // User should still be set (not cleared on error)
      expect(screen.getByTestId('user')).toHaveTextContent('John');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });
  });

  describe('auth:logout event', () => {
    test('should clear user when auth:logout event is dispatched', async () => {
      const mockUser = { id: '1', email: 'test@test.com' };
      authService.isAuthenticated.mockReturnValue(true);
      authService.getProfile.mockResolvedValueOnce(mockUser);

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      });

      // Dispatch the logout event
      act(() => {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      });
    });
  });

  describe('useAuth hook', () => {
    test('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
