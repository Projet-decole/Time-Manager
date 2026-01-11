// frontend/src/__tests__/components/AppLayout.test.jsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AppLayout from '../../components/common/AppLayout';
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

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const employeeUser = {
  id: '1',
  email: 'employee@example.com',
  firstName: 'Jean',
  lastName: 'Dupont',
  role: 'employee'
};

const managerUser = {
  id: '2',
  email: 'manager@example.com',
  firstName: 'Marie',
  lastName: 'Martin',
  role: 'manager'
};

function renderAppLayout(user = employeeUser) {
  authService.authService.isAuthenticated.mockReturnValue(true);
  authService.authService.getProfile.mockResolvedValue(user);

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthProvider>
        <Routes>
          <Route path="/*" element={<AppLayout />}>
            <Route path="dashboard" element={<div>Dashboard Content</div>} />
            <Route path="profile" element={<div>Profile Content</div>} />
            <Route path="admin/users" element={<div>Admin Users Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC2: Header elements for authenticated user', () => {
    it('displays Time Manager logo', async () => {
      renderAppLayout();

      await waitFor(() => {
        expect(screen.getByText('Time Manager')).toBeInTheDocument();
      });
    });

    it('displays user first name', async () => {
      renderAppLayout();

      await waitFor(() => {
        expect(screen.getByText('Jean')).toBeInTheDocument();
      });
    });

    it('has a link to dashboard', async () => {
      renderAppLayout();

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /tableau de bord/i })).toBeInTheDocument();
      });
    });

    it('has a link to profile', async () => {
      const user = userEvent.setup();
      renderAppLayout();

      await waitFor(() => {
        expect(screen.getByText('Jean')).toBeInTheDocument();
      });

      // Click on user menu to open dropdown
      await user.click(screen.getByText('Jean'));

      await waitFor(() => {
        expect(screen.getByText(/mon profil/i)).toBeInTheDocument();
      });
    });

    it('has a logout button', async () => {
      const user = userEvent.setup();
      renderAppLayout();

      await waitFor(() => {
        expect(screen.getByText('Jean')).toBeInTheDocument();
      });

      // Click on user menu to open dropdown
      await user.click(screen.getByText('Jean'));

      await waitFor(() => {
        expect(screen.getByText(/deconnexion/i)).toBeInTheDocument();
      });
    });
  });

  describe('AC3: Manager navigation items', () => {
    it('shows Utilisateurs link for manager', async () => {
      renderAppLayout(managerUser);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /utilisateurs/i })).toBeInTheDocument();
      });
    });

    it('does not show Utilisateurs link for employee', async () => {
      renderAppLayout(employeeUser);

      await waitFor(() => {
        expect(screen.getByText('Jean')).toBeInTheDocument();
      });

      expect(screen.queryByRole('link', { name: /utilisateurs/i })).not.toBeInTheDocument();
    });
  });

  describe('Logout functionality', () => {
    it('calls logout and navigates to /login on logout click', async () => {
      const user = userEvent.setup();
      renderAppLayout();

      await waitFor(() => {
        expect(screen.getByText('Jean')).toBeInTheDocument();
      });

      // Open user menu
      await user.click(screen.getByText('Jean'));

      // Click logout
      await user.click(screen.getByText(/deconnexion/i));

      await waitFor(() => {
        expect(authService.authService.logout).toHaveBeenCalled();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Renders outlet content', () => {
    it('renders child route content', async () => {
      renderAppLayout();

      await waitFor(() => {
        expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
      });
    });
  });
});
