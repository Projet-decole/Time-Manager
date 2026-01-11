// frontend/src/__tests__/components/RoleProtectedRoute.test.jsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RoleProtectedRoute from '../../components/common/RoleProtectedRoute';
import { AuthProvider } from '../../contexts/AuthContext';
import * as authService from '../../services/authService';

// Mock the authService
vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
    isAuthenticated: vi.fn(() => true),
    getAccessToken: vi.fn(() => 'mock-token')
  }
}));

const ManagerContent = () => <div>Manager Content</div>;
const AccessDeniedPage = () => <div>Access Denied</div>;

function renderWithRole(userRole, requiredRoles = ['manager']) {
  authService.authService.isAuthenticated.mockReturnValue(true);
  authService.authService.getProfile.mockResolvedValue({
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: userRole
  });

  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AuthProvider>
        <Routes>
          <Route path="/access-denied" element={<AccessDeniedPage />} />
          <Route
            path="/admin"
            element={
              <RoleProtectedRoute roles={requiredRoles}>
                <ManagerContent />
              </RoleProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('RoleProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC3: Manager access to manager routes', () => {
    it('allows manager to access manager-only routes', async () => {
      renderWithRole('manager', ['manager']);

      await waitFor(() => {
        expect(screen.getByText('Manager Content')).toBeInTheDocument();
      });
    });
  });

  describe('AC4: Employee denied access to manager routes', () => {
    it('redirects employee to access-denied for manager-only routes', async () => {
      renderWithRole('employee', ['manager']);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });
  });

  describe('Role hierarchy', () => {
    it('manager has access to employee routes due to hierarchy', async () => {
      authService.authService.isAuthenticated.mockReturnValue(true);
      authService.authService.getProfile.mockResolvedValue({
        id: '1',
        email: 'manager@example.com',
        firstName: 'Manager',
        lastName: 'User',
        role: 'manager'
      });

      render(
        <MemoryRouter initialEntries={['/employee-area']}>
          <AuthProvider>
            <Routes>
              <Route path="/access-denied" element={<AccessDeniedPage />} />
              <Route
                path="/employee-area"
                element={
                  <RoleProtectedRoute roles={['employee']}>
                    <div>Employee Area</div>
                  </RoleProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Employee Area')).toBeInTheDocument();
      });
    });

    it('employee can access employee-only routes', async () => {
      authService.authService.isAuthenticated.mockReturnValue(true);
      authService.authService.getProfile.mockResolvedValue({
        id: '1',
        email: 'employee@example.com',
        firstName: 'Employee',
        lastName: 'User',
        role: 'employee'
      });

      render(
        <MemoryRouter initialEntries={['/employee-area']}>
          <AuthProvider>
            <Routes>
              <Route path="/access-denied" element={<AccessDeniedPage />} />
              <Route
                path="/employee-area"
                element={
                  <RoleProtectedRoute roles={['employee']}>
                    <div>Employee Area</div>
                  </RoleProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Employee Area')).toBeInTheDocument();
      });
    });
  });
});
