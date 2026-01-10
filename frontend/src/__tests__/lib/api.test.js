// frontend/src/__tests__/lib/api.test.js

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import api from '../../lib/api';

describe('API Client', () => {
  let originalFetch;
  let mockLocalStorage;

  beforeEach(() => {
    // Mock fetch
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn();

    // Mock localStorage
    mockLocalStorage = {
      store: {},
      getItem: vi.fn((key) => mockLocalStorage.store[key] || null),
      setItem: vi.fn((key, value) => { mockLocalStorage.store[key] = value; }),
      removeItem: vi.fn((key) => { delete mockLocalStorage.store[key]; }),
      clear: vi.fn(() => { mockLocalStorage.store = {}; })
    };
    Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });

    // Mock window.dispatchEvent
    globalThis.dispatchEvent = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('request', () => {
    test('should make GET request with correct URL', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: { id: 1 } })
      });

      await api.get('/users/me');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/v1/users/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    test('should attach Authorization header when token exists', async () => {
      mockLocalStorage.store.accessToken = 'test-token';

      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: {} })
      });

      await api.get('/users/me');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token'
          })
        })
      );
    });

    test('should NOT attach Authorization header when no token', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: {} })
      });

      await api.get('/auth/login');

      const callArgs = globalThis.fetch.mock.calls[0][1];
      expect(callArgs.headers.Authorization).toBeUndefined();
    });

    test('should dispatch auth:logout event on 401 response', async () => {
      mockLocalStorage.store.accessToken = 'expired-token';
      mockLocalStorage.store.refreshToken = 'refresh-token';

      globalThis.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ success: false, error: { code: 'UNAUTHORIZED' } })
      });

      await expect(api.get('/users/me')).rejects.toThrow();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('accessToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refreshToken');
      expect(globalThis.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth:logout' })
      );
    });

    test('should throw error on non-2xx responses', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          success: false,
          error: { code: 'NOT_FOUND', message: 'User not found' }
        })
      });

      await expect(api.get('/users/999')).rejects.toThrow('User not found');
    });

    test('should throw error when JSON parsing fails', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(api.get('/test')).rejects.toThrow('Invalid JSON response');
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      globalThis.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true, data: {} })
      });
    });

    test('GET should call request without body', async () => {
      await api.get('/test');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.not.objectContaining({ body: expect.anything() })
      );
    });

    test('POST should send JSON body', async () => {
      await api.post('/auth/login', { email: 'test@test.com', password: 'pass' });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@test.com', password: 'pass' })
        })
      );
    });

    test('PATCH should send JSON body', async () => {
      await api.patch('/users/me', { firstName: 'John' });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ firstName: 'John' })
        })
      );
    });

    test('DELETE should use DELETE method', async () => {
      await api.delete('/test/1');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});
