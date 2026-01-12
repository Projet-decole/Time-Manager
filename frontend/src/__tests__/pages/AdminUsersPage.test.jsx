// frontend/src/__tests__/pages/AdminUsersPage.test.jsx

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminUsersPage from '../../pages/AdminUsersPage';
import { AuthProvider } from '../../contexts/AuthContext';
import * as authService from '../../services/authService';
import * as usersService from '../../services/usersService';

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

// Mock the usersService
vi.mock('../../services/usersService', () => ({
  usersService: {
    getAll: vi.fn()
  }
}));

const mockUsers = [
  {
    id: '1',
    email: 'jean.dupont@example.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'employee',
    weeklyHoursTarget: 35
  },
  {
    id: '2',
    email: 'marie.martin@example.com',
    firstName: 'Marie',
    lastName: 'Martin',
    role: 'manager',
    weeklyHoursTarget: 40
  }
];

const mockPaginatedResponse = {
  success: true,
  data: mockUsers,
  meta: {
    pagination: {
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1
    }
  }
};

const mockManagerUser = {
  id: '2',
  email: 'manager@example.com',
  firstName: 'Marie',
  lastName: 'Martin',
  role: 'manager'
};

function renderAdminUsersPage({ usersResponse = mockPaginatedResponse } = {}) {
  authService.authService.isAuthenticated.mockReturnValue(true);
  authService.authService.getProfile.mockResolvedValue(mockManagerUser);
  usersService.usersService.getAll.mockResolvedValue(usersResponse);

  return render(
    <MemoryRouter initialEntries={['/admin/users']}>
      <AuthProvider>
        <AdminUsersPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
  });

  describe('AC1: Display users table', () => {
    it('displays page title', async () => {
      renderAdminUsersPage();

      await waitFor(() => {
        expect(screen.getByText(/gestion des utilisateurs/i)).toBeInTheDocument();
      });
    });

    it('displays table headers', async () => {
      renderAdminUsersPage();

      await waitFor(() => {
        expect(screen.getByText('Nom')).toBeInTheDocument();
      });

      expect(screen.getByText('Prenom')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText(/heures/i)).toBeInTheDocument();
    });

    it('displays user data in table', async () => {
      renderAdminUsersPage();

      await waitFor(() => {
        expect(screen.getByText('Dupont')).toBeInTheDocument();
      });

      expect(screen.getByText('Jean')).toBeInTheDocument();
      expect(screen.getByText('jean.dupont@example.com')).toBeInTheDocument();
      expect(screen.getByText('35h')).toBeInTheDocument();

      expect(screen.getByText('Martin')).toBeInTheDocument();
      expect(screen.getByText('Marie')).toBeInTheDocument();
      expect(screen.getByText('marie.martin@example.com')).toBeInTheDocument();
      expect(screen.getByText('40h')).toBeInTheDocument();
    });

    it('displays role badges', async () => {
      renderAdminUsersPage();

      await waitFor(() => {
        // Look for badges specifically (spans with role badge styling)
        const employeBadges = screen.getAllByText('Employe');
        // One in select option, one as badge
        expect(employeBadges.length).toBeGreaterThanOrEqual(1);
      });

      const managerBadges = screen.getAllByText('Manager');
      // One in select option, one as badge
      expect(managerBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('shows loading state initially', () => {
      // Use a deferred promise that we control
      let resolvePromise;
      const pendingPromise = new Promise((resolve) => { resolvePromise = resolve; });

      authService.authService.isAuthenticated.mockReturnValue(true);
      authService.authService.getProfile.mockResolvedValue(mockManagerUser);
      usersService.usersService.getAll.mockImplementation(() => pendingPromise);

      const { unmount } = render(
        <MemoryRouter initialEntries={['/admin/users']}>
          <AuthProvider>
            <AdminUsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      // Should not show users yet
      expect(screen.queryByText('Dupont')).not.toBeInTheDocument();

      // Clean up: resolve the promise and unmount
      resolvePromise({ success: true, data: [], meta: { pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } } });
      unmount();
    });

    it('shows empty state when no users', async () => {
      renderAdminUsersPage({
        usersResponse: {
          success: true,
          data: [],
          meta: { pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }
        }
      });

      await waitFor(() => {
        expect(screen.getByText(/aucun utilisateur/i)).toBeInTheDocument();
      });
    });

    it('shows error message when API fails', async () => {
      authService.authService.isAuthenticated.mockReturnValue(true);
      authService.authService.getProfile.mockResolvedValue(mockManagerUser);
      usersService.usersService.getAll.mockRejectedValue(new Error('Network error'));

      render(
        <MemoryRouter initialEntries={['/admin/users']}>
          <AuthProvider>
            <AdminUsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/erreur lors du chargement/i)).toBeInTheDocument();
      });
    });

    it('shows error message when API returns unsuccessful response', async () => {
      renderAdminUsersPage({
        usersResponse: {
          success: false,
          error: { message: 'Unauthorized' }
        }
      });

      await waitFor(() => {
        expect(screen.getByText(/erreur lors du chargement/i)).toBeInTheDocument();
      });
    });
  });

  describe('AC2: Pagination', () => {
    const multiPageResponse = {
      success: true,
      data: mockUsers,
      meta: {
        pagination: { page: 1, limit: 20, total: 45, totalPages: 3 }
      }
    };

    it('displays pagination info when multiple pages', async () => {
      renderAdminUsersPage({ usersResponse: multiPageResponse });

      await waitFor(() => {
        expect(screen.getByText(/page 1 sur 3/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/45 utilisateurs/i)).toBeInTheDocument();
    });

    it('shows previous and next buttons', async () => {
      renderAdminUsersPage({ usersResponse: multiPageResponse });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /precedent/i })).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /suivant/i })).toBeInTheDocument();
    });

    it('disables previous button on first page', async () => {
      renderAdminUsersPage({ usersResponse: multiPageResponse });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /precedent/i })).toBeDisabled();
      });
    });

    it('disables next button on last page', async () => {
      renderAdminUsersPage({
        usersResponse: {
          success: true,
          data: mockUsers,
          meta: {
            pagination: { page: 3, limit: 20, total: 45, totalPages: 3 }
          }
        }
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /suivant/i })).toBeDisabled();
      });
    });

    it('fetches next page when next button clicked', async () => {
      const user = userEvent.setup();
      renderAdminUsersPage({ usersResponse: multiPageResponse });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /suivant/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /suivant/i }));

      await waitFor(() => {
        expect(usersService.usersService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );
      });
    });

    it('does not show pagination for single page', async () => {
      renderAdminUsersPage();

      await waitFor(() => {
        expect(screen.getByText('Dupont')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /precedent/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /suivant/i })).not.toBeInTheDocument();
    });
  });

  describe('AC3: Role filtering', () => {
    it('displays role filter dropdown', async () => {
      renderAdminUsersPage();

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('shows all filter options', async () => {
      renderAdminUsersPage();

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
      });

      // Check options exist in the select
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThanOrEqual(3);
    });

    it('filters by employee role when selected', async () => {
      const user = userEvent.setup();
      renderAdminUsersPage();

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'employee');

      await waitFor(() => {
        expect(usersService.usersService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({ role: 'employee' })
        );
      });
    });

    it('filters by manager role when selected', async () => {
      const user = userEvent.setup();
      renderAdminUsersPage();

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'manager');

      await waitFor(() => {
        expect(usersService.usersService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({ role: 'manager' })
        );
      });
    });

    it('shows all users when "all" filter selected', async () => {
      const user = userEvent.setup();

      // Start with a filter applied
      usersService.usersService.getAll.mockResolvedValue(mockPaginatedResponse);

      renderAdminUsersPage();

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // Select employee first
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'employee');

      // Then select all
      await user.selectOptions(select, 'all');

      await waitFor(() => {
        // The last call should not have role filter
        const lastCall = usersService.usersService.getAll.mock.calls.slice(-1)[0][0];
        expect(lastCall.role).toBeUndefined();
      });
    });

    it('resets to page 1 when filter changes', async () => {
      const user = userEvent.setup();

      usersService.usersService.getAll.mockResolvedValue({
        success: true,
        data: mockUsers,
        meta: {
          pagination: { page: 2, limit: 20, total: 45, totalPages: 3 }
        }
      });

      renderAdminUsersPage();

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'employee');

      await waitFor(() => {
        expect(usersService.usersService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({ page: 1 })
        );
      });
    });
  });
});
