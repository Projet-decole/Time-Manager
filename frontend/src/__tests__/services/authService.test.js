// frontend/src/__tests__/services/authService.test.js

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { authService } from '../../services/authService';
import api from '../../lib/api';

// Mock the api module
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn()
  }
}));

describe('AuthService', () => {
  let mockLocalStorage;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage
    mockLocalStorage = {
      store: {},
      getItem: vi.fn((key) => mockLocalStorage.store[key] || null),
      setItem: vi.fn((key, value) => { mockLocalStorage.store[key] = value; }),
      removeItem: vi.fn((key) => { delete mockLocalStorage.store[key]; }),
      clear: vi.fn(() => { mockLocalStorage.store = {}; })
    };
    Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('login', () => {
    test('should call API with email and password', async () => {
      api.post.mockResolvedValueOnce({
        success: true,
        data: {
          user: { id: '1', email: 'test@test.com' },
          session: { accessToken: 'access', refreshToken: 'refresh' }
        }
      });

      await authService.login('test@test.com', 'password123');

      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'password123'
      });
    });

    test('should store tokens in localStorage on success', async () => {
      api.post.mockResolvedValueOnce({
        success: true,
        data: {
          user: { id: '1', email: 'test@test.com' },
          session: { accessToken: 'my-access-token', refreshToken: 'my-refresh-token' }
        }
      });

      await authService.login('test@test.com', 'password123');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('accessToken', 'my-access-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refreshToken', 'my-refresh-token');
    });

    test('should return user data on success', async () => {
      const mockData = {
        user: { id: '1', email: 'test@test.com', firstName: 'John' },
        session: { accessToken: 'access', refreshToken: 'refresh' }
      };

      api.post.mockResolvedValueOnce({ success: true, data: mockData });

      const result = await authService.login('test@test.com', 'password123');

      expect(result).toEqual(mockData);
    });

    test('should throw error on login failure', async () => {
      api.post.mockRejectedValueOnce(new Error('Invalid credentials'));

      await expect(authService.login('test@test.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    test('should call logout API', async () => {
      api.post.mockResolvedValueOnce({ success: true });

      await authService.logout();

      expect(api.post).toHaveBeenCalledWith('/auth/logout');
    });

    test('should remove tokens from localStorage', async () => {
      mockLocalStorage.store.accessToken = 'token';
      mockLocalStorage.store.refreshToken = 'refresh';

      api.post.mockResolvedValueOnce({ success: true });

      await authService.logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });

    test('should remove tokens even if API call fails', async () => {
      mockLocalStorage.store.accessToken = 'token';

      api.post.mockRejectedValueOnce(new Error('Network error'));

      await authService.logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('getProfile', () => {
    test('should call API and return profile data', async () => {
      const mockProfile = { id: '1', email: 'test@test.com', firstName: 'John' };
      api.get.mockResolvedValueOnce({ success: true, data: mockProfile });

      const result = await authService.getProfile();

      expect(api.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateProfile', () => {
    test('should call API with update data', async () => {
      const updateData = { firstName: 'Jane', lastName: 'Doe' };
      const updatedProfile = { id: '1', ...updateData };
      api.patch.mockResolvedValueOnce({ success: true, data: updatedProfile });

      const result = await authService.updateProfile(updateData);

      expect(api.patch).toHaveBeenCalledWith('/users/me', updateData);
      expect(result).toEqual(updatedProfile);
    });
  });

  describe('forgotPassword', () => {
    test('should call API with email', async () => {
      api.post.mockResolvedValueOnce({ success: true, data: { message: 'Email sent' } });

      await authService.forgotPassword('test@test.com');

      expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'test@test.com' });
    });
  });

  describe('resetPassword', () => {
    test('should call API with token and new password', async () => {
      api.post.mockResolvedValueOnce({ success: true, data: { message: 'Password reset' } });

      await authService.resetPassword('reset-token', 'newPassword123');

      expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'reset-token',
        password: 'newPassword123'
      });
    });
  });

  describe('isAuthenticated', () => {
    test('should return true when accessToken exists', () => {
      mockLocalStorage.store.accessToken = 'some-token';

      expect(authService.isAuthenticated()).toBe(true);
    });

    test('should return false when no accessToken', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getAccessToken', () => {
    test('should return the access token', () => {
      mockLocalStorage.store.accessToken = 'my-token';

      expect(authService.getAccessToken()).toBe('my-token');
    });

    test('should return null when no token', () => {
      expect(authService.getAccessToken()).toBeNull();
    });
  });
});
