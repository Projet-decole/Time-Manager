// frontend/src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';

// Layouts
import AppLayout from './components/common/AppLayout';

// Route guards
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleProtectedRoute from './components/common/RoleProtectedRoute';

// Public pages
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AccessDeniedPage from './pages/AccessDeniedPage';

// Protected pages
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import TimeTrackingPage from './pages/TimeTrackingPage';

// Admin pages
import AdminUsersPage from './pages/AdminUsersPage';
import ProjectsPage from './pages/admin/ProjectsPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import TeamsPage from './pages/admin/TeamsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          {/* Protected routes with layout */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/time-tracking" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/time-tracking" element={<TimeTrackingPage />} />

            {/* Manager only routes */}
            <Route
              path="/admin/users"
              element={
                <RoleProtectedRoute roles={['manager']}>
                  <AdminUsersPage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <RoleProtectedRoute roles={['manager']}>
                  <CategoriesPage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/admin/projects"
              element={
                <RoleProtectedRoute roles={['manager']}>
                  <ProjectsPage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/admin/teams"
              element={
                <RoleProtectedRoute roles={['manager']}>
                  <TeamsPage />
                </RoleProtectedRoute>
              }
            />
          </Route>

          {/* Catch all - redirect to time-tracking (ProtectedRoute will handle auth) */}
          <Route path="*" element={<Navigate to="/time-tracking" replace />} />
        </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
