# Story 2.8: Setup Frontend Auth Context and Service

Status: ready-for-dev

## Story

As a **frontend developer**,
I want auth state management and API service,
So that the UI can handle authentication flows.

## Acceptance Criteria

1. **Given** the React frontend
   **When** AuthContext is implemented
   **Then** it provides:
   - `user` state (null or user object)
   - `isAuthenticated` boolean
   - `isLoading` boolean
   - `login(email, password)` function
   - `logout()` function
   - `refreshUser()` function

2. **Given** authService.js
   **When** implemented
   **Then** it provides:
   - `login(email, password)` → API call
   - `logout()` → API call
   - `forgotPassword(email)` → API call
   - `getProfile()` → API call
   - `updateProfile(data)` → API call

3. **Given** successful login
   **When** tokens are received
   **Then** tokens are stored securely and attached to all API requests

4. **Given** app initialization
   **When** tokens exist in storage
   **Then** user state is restored automatically

## Tasks / Subtasks

- [ ] Task 1: Create API client utility (AC: #3)
  - [ ] Create `frontend/src/lib/api.js`
  - [ ] Configure base URL from environment
  - [ ] Add interceptor to attach Authorization header
  - [ ] Handle 401 responses (clear tokens, redirect)

- [ ] Task 2: Create auth service (AC: #2)
  - [ ] Create `frontend/src/services/authService.js`
  - [ ] Implement login, logout, forgotPassword functions
  - [ ] Implement getProfile, updateProfile functions
  - [ ] Handle token storage (localStorage)

- [ ] Task 3: Create AuthContext (AC: #1, #4)
  - [ ] Create `frontend/src/contexts/AuthContext.jsx`
  - [ ] Implement AuthProvider component
  - [ ] Manage user, isAuthenticated, isLoading state
  - [ ] Implement login, logout, refreshUser methods
  - [ ] Restore session on mount

- [ ] Task 4: Create useAuth hook (AC: #1)
  - [ ] Create `frontend/src/hooks/useAuth.js`
  - [ ] Export context consumer hook

- [ ] Task 5: Write tests (AC: #1-4)
  - [ ] Create `frontend/src/__tests__/contexts/AuthContext.test.jsx`
  - [ ] Test login updates user state
  - [ ] Test logout clears state
  - [ ] Test session restore on mount

## Dev Notes

### Architecture Compliance

**Module System:** ESM (`import`/`export`)
**Framework:** React 19.1.1
**Pattern:** Context API + custom hooks

### API Client

```javascript
// frontend/src/lib/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const getAuthToken = () => localStorage.getItem('accessToken');

const api = {
  async request(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle 401 - clear tokens and let app handle redirect
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.dispatchEvent(new Event('auth:logout'));
      }
      throw new Error(data.error?.message || 'Request failed');
    }

    return data;
  },

  get: (endpoint) => api.request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => api.request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint, body) => api.request(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => api.request(endpoint, { method: 'DELETE' })
};

export default api;
```

### Auth Service

```javascript
// frontend/src/services/authService.js
import api from '../lib/api';

const TOKEN_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });

    if (response.success) {
      localStorage.setItem(TOKEN_KEY, response.data.session.accessToken);
      localStorage.setItem(REFRESH_KEY, response.data.session.refreshToken);
    }

    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
    }
  },

  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/users/me');
    return response.data;
  },

  async updateProfile(data) {
    const response = await api.patch('/users/me', data);
    return response.data;
  },

  getStoredToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated() {
    return !!this.getStoredToken();
  }
};
```

### Auth Context

```jsx
// frontend/src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      if (authService.isAuthenticated()) {
        try {
          const profile = await authService.getProfile();
          setUser(profile);
        } catch (error) {
          // Token invalid, clear it
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  // Listen for forced logout
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const profile = await authService.getProfile();
    setUser(profile);
    return profile;
  }, []);

  const value = {
    user,
    isAuthenticated,
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
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Integration in App

```jsx
// frontend/src/App.jsx
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      {/* Routes and components */}
    </AuthProvider>
  );
}
```

### Environment Variable

Add to `frontend/.env.example`:
```
VITE_API_URL=http://localhost:3000/api/v1
```

### Files to Create

```
frontend/src/
├── lib/
│   └── api.js                    # NEW
├── services/
│   └── authService.js            # NEW
├── contexts/
│   └── AuthContext.jsx           # NEW
├── hooks/
│   └── useAuth.js                # NEW (optional, re-export from context)
└── __tests__/
    ├── services/authService.test.js  # NEW
    └── contexts/AuthContext.test.jsx # NEW
```

### File Naming Convention

- Services: `camelCase.js` (authService.js)
- Contexts: `PascalCaseContext.jsx` (AuthContext.jsx)
- Hooks: `useCamelCase.js` (useAuth.js)

### Testing with Vitest

```javascript
// __tests__/contexts/AuthContext.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

vi.mock('../../services/authService', () => ({
  authService: {
    isAuthenticated: vi.fn(() => false),
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn()
  }
}));

const TestComponent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="loading">{isLoading ? 'loading' : 'ready'}</span>
    </div>
  );
};

describe('AuthContext', () => {
  it('provides auth state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('ready');
    });
    expect(screen.getByTestId('auth')).toHaveTextContent('no');
  });
});
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.8]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/project-context.md#Frontend (ESM)]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
