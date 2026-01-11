# Story 2.12: Implement Protected Routes & Navigation

Status: done

## Story

As an **application user**,
I want proper navigation and route protection,
So that I can navigate the app easily and unauthorized access is prevented.

## Acceptance Criteria

1. **Given** I am not logged in
   **When** I try to access any protected route (/, /dashboard, /profile, etc.)
   **Then** I am redirected to `/login`
   **And** after login, I am redirected to my original destination

2. **Given** I am logged in
   **When** I view the app header
   **Then** I see navigation with: Time Manager logo, my name, profile link, logout button

3. **Given** I am a manager
   **When** I view the navigation
   **Then** I see additional menu item: "Utilisateurs"

4. **Given** I am an employee
   **When** I try to access manager-only routes
   **Then** I see an "Acces refuse" page

5. **Given** auth state is loading
   **When** I access any route
   **Then** I see a loading indicator until auth state is resolved

## Tasks / Subtasks

- [x] Task 1: Create ProtectedRoute component
  - [x] Create `frontend/src/components/common/ProtectedRoute.jsx`
  - [x] Check isAuthenticated, redirect to /login if not
  - [x] Preserve original destination in state
  - [x] Show loading state

- [x] Task 2: Create RoleProtectedRoute component
  - [x] Create `frontend/src/components/common/RoleProtectedRoute.jsx`
  - [x] Accept `roles` prop
  - [x] Implement role hierarchy (manager has employee access)
  - [x] Redirect to /access-denied if role not allowed

- [x] Task 3: Create AccessDeniedPage
  - [x] Create `frontend/src/pages/AccessDeniedPage.jsx`
  - [x] Display error message
  - [x] Link back to dashboard

- [x] Task 4: Create AppLayout with navigation
  - [x] Create `frontend/src/components/common/AppLayout.jsx`
  - [x] Header with logo, user info, nav links
  - [x] Role-based menu items
  - [x] Logout functionality

- [x] Task 5: Update DashboardPage for layout
  - [x] Update `frontend/src/pages/DashboardPage.jsx`
  - [x] Simple placeholder content
  - [x] Works with AppLayout

- [x] Task 6: Setup complete router
  - [x] Update `frontend/src/App.jsx`
  - [x] Public routes: /login, /forgot-password, /reset-password
  - [x] Protected routes with layout: /, /dashboard, /profile
  - [x] Manager routes: /admin/users

- [x] Task 7: Write tests
  - [x] Test redirect to login
  - [x] Test role-based access
  - [x] Test navigation display

## Dev Notes

### ProtectedRoute

```jsx
// frontend/src/components/common/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
```

### RoleProtectedRoute

```jsx
// frontend/src/components/common/RoleProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';

const ROLE_HIERARCHY = {
  employee: ['employee'],
  manager: ['manager', 'employee']
};

export default function RoleProtectedRoute({ children, roles = [] }) {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <RoleCheck user={user} roles={roles}>
        {children}
      </RoleCheck>
    </ProtectedRoute>
  );
}

function RoleCheck({ user, roles, children }) {
  const userRoles = ROLE_HIERARCHY[user?.role] || [];
  const hasPermission = roles.some(role => userRoles.includes(role));

  if (!hasPermission) {
    return <Navigate to="/access-denied" replace />;
  }
  return children;
}
```

### AppLayout with Navigation

```jsx
// frontend/src/components/common/AppLayout.jsx
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Clock, User, Users, LogOut, ChevronDown } from 'lucide-react';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isManager = user?.role === 'manager';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-lg">
            <Clock className="h-6 w-6 text-blue-600" />
            Time Manager
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
              Tableau de bord
            </Link>

            {isManager && (
              <>
                <Link to="/admin/users" className="text-gray-600 hover:text-gray-900">
                  Utilisateurs
                </Link>
              </>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <span>{user?.firstName}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Mon profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" /> Deconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
```

### Complete Router Setup

```jsx
// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Layouts
import AppLayout from './components/common/AppLayout';

// Route guards
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleProtectedRoute from './components/common/RoleProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import AdminUsersPage from './pages/AdminUsersPage'; // Story 2-13

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          {/* Protected routes with layout */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Manager only routes */}
            <Route path="/admin/users" element={
              <RoleProtectedRoute roles={['manager']}>
                <AdminUsersPage />
              </RoleProtectedRoute>
            } />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### Files to Create

```
frontend/src/
├── components/common/
│   ├── ProtectedRoute.jsx
│   ├── RoleProtectedRoute.jsx
│   └── AppLayout.jsx
├── pages/
│   ├── DashboardPage.jsx       # Placeholder
│   └── AccessDeniedPage.jsx
└── App.jsx                      # UPDATE
```

### Additional shadcn Components

```bash
npx shadcn@latest add dropdown-menu
npm install lucide-react
```

## What User Can Do After This Story

**Navigation complete et protection des routes !**

**L'utilisateur peut maintenant:**
1. Aller sur http://localhost:5173/ (non connecte) → redirection vers /login
2. Se connecter → arriver sur /dashboard
3. Voir le header avec:
   - Logo "Time Manager"
   - Lien "Tableau de bord"
   - Menu utilisateur avec son prenom
4. Cliquer sur son nom → dropdown avec "Mon profil" et "Deconnexion"
5. Aller sur /profile → voir son profil
6. Cliquer "Deconnexion" → retour a /login

**Pour un Manager:**
- Voit en plus "Utilisateurs" dans la nav
- Peut acceder a /admin/users

**Pour un Employee:**
- Ne voit pas "Utilisateurs" dans la nav
- Si il tape /admin/users dans l'URL → page "Acces refuse"

**E2E Test manuel:**
1. En mode deconnecte, aller sur http://localhost:5173/dashboard → redirige vers /login
2. Se connecter en tant qu'employee
3. Verifier que la nav ne montre pas "Utilisateurs"
4. Taper /admin/users dans l'URL → "Acces refuse"
5. Se deconnecter
6. Se connecter en tant que manager
7. Verifier "Utilisateurs" visible
8. Cliquer dessus → page admin (placeholder)

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- 4 ProtectedRoute tests passing
- 4 RoleProtectedRoute tests passing
- 3 AccessDeniedPage tests passing
- 9 AppLayout tests passing
- 119 total frontend tests passing

### Completion Notes List
- Created ProtectedRoute.jsx with auth check, redirect, loading state
- Created RoleProtectedRoute.jsx with role hierarchy (manager > employee)
- Created AccessDeniedPage.jsx with error message and dashboard link
- Created AppLayout.jsx with responsive header, logo, nav links, user dropdown
- Updated DashboardPage.jsx to work with AppLayout (removed duplicate header)
- Updated ProfilePage.jsx to remove redundant auth checks (now handled by ProtectedRoute)
- Updated App.jsx with complete router:
  - Public routes: /login, /forgot-password, /reset-password, /access-denied
  - Protected routes with layout: /, /dashboard, /profile
  - Manager-only route: /admin/users
- Created AdminUsersPage.jsx placeholder for Story 2-13
- Implemented all 5 acceptance criteria

### File List
- frontend/src/components/common/ProtectedRoute.jsx (created)
- frontend/src/components/common/RoleProtectedRoute.jsx (created)
- frontend/src/components/common/AppLayout.jsx (created)
- frontend/src/pages/AccessDeniedPage.jsx (created)
- frontend/src/pages/AdminUsersPage.jsx (created - placeholder)
- frontend/src/pages/DashboardPage.jsx (modified)
- frontend/src/pages/ProfilePage.jsx (modified)
- frontend/src/App.jsx (modified)
- frontend/src/__tests__/components/ProtectedRoute.test.jsx (created)
- frontend/src/__tests__/components/RoleProtectedRoute.test.jsx (created)
- frontend/src/__tests__/components/AppLayout.test.jsx (created)
- frontend/src/__tests__/pages/AccessDeniedPage.test.jsx (created)
- frontend/src/__tests__/pages/ProfilePage.test.jsx (modified)

### Change Log
- 2026-01-11: Code review - Updated AC3 to remove "Equipe" (deferred to Epic 3)
- 2026-01-11: Implemented Story 2.12 - Protected Routes & Navigation with complete layout system
