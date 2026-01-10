# Story 2.10: Implement Protected Routes

Status: ready-for-dev

## Story

As a **frontend developer**,
I want route protection based on authentication and role,
So that unauthorized access is prevented.

## Acceptance Criteria

1. **Given** a ProtectedRoute component
   **When** an unauthenticated user tries to access a protected route
   **Then** they are redirected to `/login`
   **And** the original URL is preserved for post-login redirect

2. **Given** a RoleProtectedRoute component with `roles={['manager']}`
   **When** an employee tries to access it
   **Then** they are redirected to an "Access Denied" page or dashboard

3. **Given** an authenticated user accesses a protected route
   **When** the component renders
   **Then** the protected content is displayed

4. **Given** the auth state is loading
   **When** accessing any protected route
   **Then** a loading indicator is shown until auth state is resolved

## Tasks / Subtasks

- [ ] Task 1: Create ProtectedRoute component (AC: #1, #3, #4)
  - [ ] Create `frontend/src/components/common/ProtectedRoute.jsx`
  - [ ] Check isAuthenticated from useAuth
  - [ ] Show loading state while isLoading
  - [ ] Redirect to /login if not authenticated
  - [ ] Save intended destination for post-login redirect

- [ ] Task 2: Create RoleProtectedRoute component (AC: #2)
  - [ ] Create `frontend/src/components/common/RoleProtectedRoute.jsx`
  - [ ] Accept roles prop (array of allowed roles)
  - [ ] Check user.role against allowed roles
  - [ ] Redirect to dashboard or AccessDenied if role not allowed

- [ ] Task 3: Create AccessDeniedPage (AC: #2)
  - [ ] Create `frontend/src/pages/AccessDeniedPage.jsx`
  - [ ] Display "Access Denied" message
  - [ ] Link back to dashboard

- [ ] Task 4: Update router configuration (AC: #1-3)
  - [ ] Wrap protected routes with ProtectedRoute
  - [ ] Wrap manager routes with RoleProtectedRoute
  - [ ] Add AccessDenied route

- [ ] Task 5: Implement redirect after login (AC: #1)
  - [ ] Store intended path in location state
  - [ ] Update LoginPage to redirect to intended path

- [ ] Task 6: Write tests (AC: #1-4)
  - [ ] Test unauthenticated redirect
  - [ ] Test role-based redirect
  - [ ] Test authenticated access
  - [ ] Test loading state

## Dev Notes

### Architecture Compliance

**Location:** `frontend/src/components/common/`
**Pattern:** Higher-order components / wrapper components

### ProtectedRoute Implementation

```jsx
// frontend/src/components/common/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
```

### RoleProtectedRoute Implementation

```jsx
// frontend/src/components/common/RoleProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

/**
 * Role hierarchy - manager can access employee routes
 */
const ROLE_HIERARCHY = {
  employee: ['employee'],
  manager: ['manager', 'employee']
};

export const RoleProtectedRoute = ({ children, roles = [] }) => {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <RoleCheck user={user} roles={roles}>
        {children}
      </RoleCheck>
    </ProtectedRoute>
  );
};

const RoleCheck = ({ user, roles, children }) => {
  if (!user) {
    return null;
  }

  const userRoles = ROLE_HIERARCHY[user.role] || [user.role];
  const hasPermission = roles.some(role => userRoles.includes(role));

  if (!hasPermission) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
};

export default RoleProtectedRoute;
```

### AccessDeniedPage Implementation

```jsx
// frontend/src/pages/AccessDeniedPage.jsx
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ShieldX } from 'lucide-react';

export const AccessDeniedPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <ShieldX className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Acces Refuse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Vous n'avez pas les permissions necessaires pour acceder a cette page.
          </p>
          <Button asChild>
            <Link to="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDeniedPage;
```

### Router Configuration

```jsx
// frontend/src/App.jsx or router config
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { RoleProtectedRoute } from './components/common/RoleProtectedRoute';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { TeamsPage } from './pages/TeamsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          {/* Protected routes (any authenticated user) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Manager-only routes */}
          <Route
            path="/admin/teams"
            element={
              <RoleProtectedRoute roles={['manager']}>
                <TeamsPage />
              </RoleProtectedRoute>
            }
          />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### Update LoginPage for Redirect

```jsx
// In LoginPage.jsx - update the onSubmit handler
const location = useLocation();
const from = location.state?.from || '/dashboard';

const onSubmit = async (data) => {
  try {
    setError(null);
    setIsLoading(true);
    await login(data.email, data.password);
    navigate(from, { replace: true }); // Redirect to intended destination
  } catch (err) {
    setError(err.message || 'Login failed');
    resetField('password');
  } finally {
    setIsLoading(false);
  }
};
```

### File Structure

```
frontend/src/
├── components/
│   └── common/
│       ├── ProtectedRoute.jsx      # NEW
│       └── RoleProtectedRoute.jsx  # NEW
├── pages/
│   └── AccessDeniedPage.jsx        # NEW
└── __tests__/
    └── components/
        └── common/
            ├── ProtectedRoute.test.jsx     # NEW
            └── RoleProtectedRoute.test.jsx # NEW
```

### Testing

```jsx
// __tests__/components/common/ProtectedRoute.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../../../components/common/ProtectedRoute';
import * as AuthContext from '../../../contexts/AuthContext';

describe('ProtectedRoute', () => {
  it('redirects to login when not authenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isLoading: false
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('shows content when authenticated', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { role: 'employee' }
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
```

### Dependencies

- Requires Story 2.8 (AuthContext) completed
- React Router v7 (already in stack)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.10]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
