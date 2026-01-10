# Story 2.8: Setup Frontend Auth Infrastructure

Status: done

## Story

As a **frontend developer**,
I want authentication state management and API utilities,
So that all frontend components can interact with the auth system.

## Acceptance Criteria

1. **Given** the React frontend
   **When** AuthContext is implemented
   **Then** it provides: `user`, `isAuthenticated`, `isLoading`, `login()`, `logout()`, `refreshUser()`

2. **Given** the API client utility
   **When** a request is made
   **Then** Authorization header is automatically attached if token exists
   **And** 401 responses trigger automatic logout

3. **Given** the authService
   **When** `login()` succeeds
   **Then** tokens are stored in localStorage
   **And** user state is updated in context

4. **Given** app initialization
   **When** a token exists in localStorage
   **Then** user session is automatically restored

## Tasks / Subtasks

- [x] Task 1: Create API client utility
  - [x] Create `frontend/src/lib/api.js`
  - [x] Configure base URL from VITE_API_URL
  - [x] Auto-attach Authorization header
  - [x] Handle 401 responses (dispatch logout event)

- [x] Task 2: Create auth service
  - [x] Create `frontend/src/services/authService.js`
  - [x] Implement login, logout, forgotPassword, resetPassword
  - [x] Implement getProfile, updateProfile
  - [x] Manage token storage

- [x] Task 3: Create AuthContext
  - [x] Create `frontend/src/contexts/AuthContext.jsx`
  - [x] Implement AuthProvider with state management
  - [x] Auto-restore session on mount
  - [x] Listen for forced logout events

- [x] Task 4: Setup environment
  - [x] Create `frontend/.env.example` with VITE_API_URL

- [x] Task 5: Write tests
  - [x] Test AuthContext state management (10 tests)
  - [x] Test session restoration
  - [x] Test API client (10 tests)
  - [x] Test authService (15 tests)

## Dev Notes

### API Client

```javascript
// frontend/src/lib/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const api = {
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

    const data = await response.json();

    if (response.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    if (!response.ok) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data;
  },
  get: (url) => api.request(url),
  post: (url, body) => api.request(url, { method: 'POST', body: JSON.stringify(body) }),
  patch: (url, body) => api.request(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url) => api.request(url, { method: 'DELETE' })
};

export default api;
```

### Auth Service

```javascript
// frontend/src/services/authService.js
import api from '../lib/api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    if (response.success) {
      localStorage.setItem('accessToken', response.data.session.accessToken);
      localStorage.setItem('refreshToken', response.data.session.refreshToken);
    }
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  async getProfile() {
    const response = await api.get('/users/me');
    return response.data;
  },

  async updateProfile(data) {
    const response = await api.patch('/users/me', data);
    return response.data;
  },

  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  isAuthenticated: () => !!localStorage.getItem('accessToken')
};
```

### AuthContext

```jsx
// frontend/src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      if (authService.isAuthenticated()) {
        try {
          const profile = await authService.getProfile();
          setUser(profile);
        } catch {
          localStorage.removeItem('accessToken');
        }
      }
      setIsLoading(false);
    };
    restore();
  }, []);

  // Listen for forced logout
  useEffect(() => {
    const handleLogout = () => setUser(null);
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
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
};
```

### Files to Create

```
frontend/src/
├── lib/
│   └── api.js
├── services/
│   └── authService.js
├── contexts/
│   └── AuthContext.jsx
├── .env.example
└── __tests__/
    └── contexts/AuthContext.test.jsx
```

### E2E Testing Notes

Cette story pose les fondations. Test E2E complet après Story 2-9 (Login Page).

**Test unitaire:**
- Mocker les appels API
- Vérifier que le state change correctement
- Vérifier la restauration de session

## What User Can Do After This Story

**Infrastructure seulement** - Pas de changement visible pour l'utilisateur final.

**Pour le développeur:**
- AuthProvider est disponible pour wrapper l'application
- useAuth() hook fonctionnel dans tous les composants
- API client prêt avec auto-auth
- authService prêt pour login/logout/profile

**L'interface utilisateur visible commence à la Story 2-9.**

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
N/A - Clean implementation

### Completion Notes List
- Created API client with auto-auth headers and 401 handling
- Created authService with full auth lifecycle (login, logout, profile, password reset)
- Created AuthContext with session restoration and forced logout event handling
- logout() silently ignores API errors but always clears local tokens
- 38 total frontend tests pass (10 API + 15 authService + 11 AuthContext + 2 App)
- Used Vitest with React Testing Library

### File List
- `frontend/src/lib/api.js` (created)
- `frontend/src/services/authService.js` (created)
- `frontend/src/contexts/AuthContext.jsx` (created)
- `frontend/src/hooks/useAuth.js` (created)
- `frontend/.env.example` (created)
- `frontend/src/__tests__/lib/api.test.js` (created)
- `frontend/src/__tests__/services/authService.test.js` (created)
- `frontend/src/__tests__/contexts/AuthContext.test.jsx` (created)

### Change Log
- 2026-01-10: Implemented frontend auth infrastructure with full test coverage
- 2026-01-10: Code review fixes applied (see Senior Developer Review below)

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.5 (Dev Agent)
**Date:** 2026-01-10
**Outcome:** ✅ APPROVED

### Findings Resolved

| Severity | Issue | Resolution |
|----------|-------|------------|
| LOW | L1: getAccessToken() undocumented | Added JSDoc explaining WebSocket use case |
| LOW | L2: refreshUser() error propagation | Errors propagate to caller, +1 test for user state preservation |
| LOW | L3: Untracked files | All files staged in git |
| ESLint | global not defined | Replaced `global` with `globalThis` (ES2020 standard) |
| ESLint | react-refresh/only-export-components | Moved useAuth to separate hooks/useAuth.js file |

### Post-Review Test Results
```
Tests:       38 passed
Files:       4 test suites
ESLint:      0 errors, 0 warnings
```

### Files Modified During Review
- `frontend/src/services/authService.js` - enhanced getAccessToken() docs
- `frontend/src/contexts/AuthContext.jsx` - removed useAuth (moved to hooks)
- `frontend/src/hooks/useAuth.js` - new file for useAuth hook
- `frontend/src/__tests__/*.js` - replaced global with globalThis
