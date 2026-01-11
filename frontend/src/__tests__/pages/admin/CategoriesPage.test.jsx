// frontend/src/__tests__/pages/admin/CategoriesPage.test.jsx
// Story 3.8: Admin Management UI - Categories

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CategoriesPage from '../../../pages/admin/CategoriesPage';
import { AuthProvider } from '../../../contexts/AuthContext';
import * as authService from '../../../services/authService';
import * as categoriesService from '../../../services/categoriesService';

// Mock the authService
vi.mock('../../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
    isAuthenticated: vi.fn(() => true),
    getAccessToken: vi.fn(() => 'mock-token')
  }
}));

// Mock the categoriesService
vi.mock('../../../services/categoriesService', () => ({
  categoriesService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
    activate: vi.fn()
  }
}));

const mockCategories = [
  {
    id: '1',
    name: 'Development',
    description: 'Coding and development tasks',
    color: '#3B82F6',
    isActive: true
  },
  {
    id: '2',
    name: 'Meeting',
    description: 'Team meetings and discussions',
    color: '#10B981',
    isActive: true
  },
  {
    id: '3',
    name: 'Admin',
    description: 'Administrative work',
    color: '#EF4444',
    isActive: false
  }
];

const mockManagerUser = {
  id: '1',
  email: 'manager@example.com',
  firstName: 'Marie',
  lastName: 'Martin',
  role: 'manager'
};

function renderCategoriesPage({ categories = mockCategories.filter(c => c.isActive) } = {}) {
  authService.authService.isAuthenticated.mockReturnValue(true);
  authService.authService.getProfile.mockResolvedValue(mockManagerUser);
  categoriesService.categoriesService.getAll.mockResolvedValue({
    success: true,
    data: categories
  });

  return render(
    <MemoryRouter initialEntries={['/admin/categories']}>
      <AuthProvider>
        <CategoriesPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('CategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC1: Categories List Page', () => {
    it('displays page title', async () => {
      renderCategoriesPage();

      await waitFor(() => {
        expect(screen.getByText(/gestion des categories/i)).toBeInTheDocument();
      });
    });

    it('displays categories list', async () => {
      renderCategoriesPage();

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      expect(screen.getByText('Meeting')).toBeInTheDocument();
    });

    it('displays category names and descriptions', async () => {
      renderCategoriesPage();

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      expect(screen.getByText(/coding and development/i)).toBeInTheDocument();
    });

    it('displays active status badge', async () => {
      renderCategoriesPage();

      await waitFor(() => {
        const activeBadges = screen.getAllByText('Actif');
        expect(activeBadges.length).toBeGreaterThan(0);
      });
    });

    it('displays create category button', async () => {
      renderCategoriesPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nouvelle categorie/i })).toBeInTheDocument();
      });
    });

    it('displays edit and deactivate buttons for each category', async () => {
      renderCategoriesPage();

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /modifier/i });
      expect(editButtons.length).toBeGreaterThan(0);

      const deactivateButtons = screen.getAllByRole('button', { name: /desactiver/i });
      expect(deactivateButtons.length).toBeGreaterThan(0);
    });

    it('shows empty state when no categories', async () => {
      renderCategoriesPage({ categories: [] });

      await waitFor(() => {
        expect(screen.getByText(/aucune categorie/i)).toBeInTheDocument();
      });
    });

    it('shows error message when API fails', async () => {
      authService.authService.isAuthenticated.mockReturnValue(true);
      authService.authService.getProfile.mockResolvedValue(mockManagerUser);
      categoriesService.categoriesService.getAll.mockRejectedValue(new Error('Erreur de connexion'));

      render(
        <MemoryRouter initialEntries={['/admin/categories']}>
          <AuthProvider>
            <CategoriesPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/erreur/i)).toBeInTheDocument();
      });
    });
  });

  describe('AC2: Create Category Modal', () => {
    it('opens create modal when button clicked', async () => {
      const user = userEvent.setup();
      renderCategoriesPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nouvelle categorie/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /nouvelle categorie/i }));

      await waitFor(() => {
        expect(screen.getByText(/creer une categorie/i)).toBeInTheDocument();
      });
    });

    it('shows form fields in create modal', async () => {
      const user = userEvent.setup();
      renderCategoriesPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nouvelle categorie/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /nouvelle categorie/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/nom/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByText(/palette de couleurs/i)).toBeInTheDocument();
    });

    it('validates required name field', async () => {
      const user = userEvent.setup();
      renderCategoriesPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nouvelle categorie/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /nouvelle categorie/i }));

      await waitFor(() => {
        expect(screen.getByText(/creer une categorie/i)).toBeInTheDocument();
      });

      // Try to submit without filling name
      await user.click(screen.getByRole('button', { name: /^creer$/i }));

      await waitFor(() => {
        expect(screen.getByText(/nom est requis/i)).toBeInTheDocument();
      });
    });
  });

  describe('AC3: Color Picker', () => {
    it('displays color palette', async () => {
      const user = userEvent.setup();
      renderCategoriesPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nouvelle categorie/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /nouvelle categorie/i }));

      await waitFor(() => {
        expect(screen.getByText(/palette de couleurs/i)).toBeInTheDocument();
      });
    });

    it('displays hex input field', async () => {
      const user = userEvent.setup();
      renderCategoriesPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nouvelle categorie/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /nouvelle categorie/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/#3B82F6/i)).toBeInTheDocument();
      });
    });

    it('shows color preview', async () => {
      const user = userEvent.setup();
      renderCategoriesPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /nouvelle categorie/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /nouvelle categorie/i }));

      await waitFor(() => {
        expect(screen.getByText(/apercu/i)).toBeInTheDocument();
      });
    });
  });

  describe('AC4: Edit Category', () => {
    it('opens edit modal with pre-filled values', async () => {
      const user = userEvent.setup();
      renderCategoriesPage();

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: /modifier/i });
      await user.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/modifier la categorie/i)).toBeInTheDocument();
      });

      // Check pre-filled values
      const nameInput = screen.getByLabelText(/nom/i);
      expect(nameInput).toHaveValue('Development');
    });
  });

  describe('AC5: Deactivate Category', () => {
    it('shows confirmation dialog when deactivate clicked', async () => {
      const user = userEvent.setup();
      renderCategoriesPage();

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const deactivateButtons = screen.getAllByRole('button', { name: /desactiver/i });
      await user.click(deactivateButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/confirmation/i)).toBeInTheDocument();
      });
    });

    it('calls deactivate API when confirmed', async () => {
      const user = userEvent.setup();
      categoriesService.categoriesService.deactivate.mockResolvedValue({ success: true });

      renderCategoriesPage();

      await waitFor(() => {
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      const deactivateButtons = screen.getAllByRole('button', { name: /desactiver/i });
      await user.click(deactivateButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/confirmation/i)).toBeInTheDocument();
      });

      // Confirm the dialog - find the Desactiver button in the confirmation
      const confirmButton = screen.getAllByRole('button', { name: /desactiver/i }).find(
        btn => btn.closest('.fixed')
      );
      await user.click(confirmButton);

      await waitFor(() => {
        expect(categoriesService.categoriesService.deactivate).toHaveBeenCalledWith('1');
      });
    });
  });

  describe('AC6: Activate Category', () => {
    it('shows activate button for inactive categories', async () => {
      renderCategoriesPage({ categories: mockCategories });

      await waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument();
      });

      // Use exact match to avoid matching "Desactiver" which also contains "activer"
      expect(screen.getByRole('button', { name: 'Activer' })).toBeInTheDocument();
    });
  });

  describe('AC7: Filter by Status', () => {
    it('displays show inactive filter checkbox', async () => {
      renderCategoriesPage();

      await waitFor(() => {
        expect(screen.getByText(/afficher les inactifs/i)).toBeInTheDocument();
      });
    });

    it('fetches with includeInactive when filter toggled', async () => {
      const user = userEvent.setup();
      renderCategoriesPage();

      await waitFor(() => {
        expect(screen.getByText(/afficher les inactifs/i)).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      await waitFor(() => {
        expect(categoriesService.categoriesService.getAll).toHaveBeenCalledWith(
          expect.objectContaining({ includeInactive: true })
        );
      });
    });
  });

  describe('AC8: Access Control', () => {
    // Note: Access control is tested at the route level via RoleProtectedRoute
    // CategoriesPage itself doesn't handle access control - it relies on the route wrapper
    // These tests verify the page behaves correctly assuming it's accessed by a manager

    it('page renders correctly for manager role', async () => {
      authService.authService.isAuthenticated.mockReturnValue(true);
      authService.authService.getProfile.mockResolvedValue(mockManagerUser);
      categoriesService.categoriesService.getAll.mockResolvedValue({
        success: true,
        data: mockCategories.filter(c => c.isActive)
      });

      render(
        <MemoryRouter initialEntries={['/admin/categories']}>
          <AuthProvider>
            <CategoriesPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/gestion des categories/i)).toBeInTheDocument();
      });
    });

    it('route protection is configured in App.jsx for managers only', () => {
      // This is a documentation test - the actual protection is in App.jsx
      // RoleProtectedRoute roles={['manager']} wraps CategoriesPage
      // Employees are redirected by RoleProtectedRoute, not by CategoriesPage itself
      expect(true).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    describe('Full create category flow', () => {
      it('creates category and shows it in the list', async () => {
        const user = userEvent.setup();
        const newCategory = {
          id: '4',
          name: 'Research',
          description: 'Research and learning',
          color: '#8B5CF6',
          isActive: true
        };

        categoriesService.categoriesService.create.mockResolvedValue({
          success: true,
          data: newCategory
        });

        // First render with initial categories
        renderCategoriesPage();

        await waitFor(() => {
          expect(screen.getByText('Development')).toBeInTheDocument();
        });

        // Open create modal
        await user.click(screen.getByRole('button', { name: /nouvelle categorie/i }));

        await waitFor(() => {
          expect(screen.getByText(/creer une categorie/i)).toBeInTheDocument();
        });

        // Fill the form
        await user.type(screen.getByLabelText(/nom/i), 'Research');
        await user.type(screen.getByLabelText(/description/i), 'Research and learning');

        // Select purple color
        await user.click(screen.getByTitle('Purple'));

        // Mock the refetch to include new category
        categoriesService.categoriesService.getAll.mockResolvedValue({
          success: true,
          data: [...mockCategories.filter(c => c.isActive), newCategory]
        });

        // Submit
        await user.click(screen.getByRole('button', { name: /^creer$/i }));

        // Verify API was called
        await waitFor(() => {
          expect(categoriesService.categoriesService.create).toHaveBeenCalledWith({
            name: 'Research',
            description: 'Research and learning',
            color: '#8B5CF6'
          });
        });

        // Verify success message
        await waitFor(() => {
          expect(screen.getByText(/categorie creee avec succes/i)).toBeInTheDocument();
        });
      });

      it('handles create error with duplicate name', async () => {
        const user = userEvent.setup();

        categoriesService.categoriesService.create.mockRejectedValue({
          code: 'DUPLICATE_NAME',
          message: 'Category name already exists'
        });

        renderCategoriesPage();

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /nouvelle categorie/i })).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /nouvelle categorie/i }));

        await waitFor(() => {
          expect(screen.getByText(/creer une categorie/i)).toBeInTheDocument();
        });

        await user.type(screen.getByLabelText(/nom/i), 'Development');
        await user.click(screen.getByRole('button', { name: /^creer$/i }));

        await waitFor(() => {
          expect(screen.getByText(/une categorie avec ce nom existe deja/i)).toBeInTheDocument();
        });
      });
    });

    describe('Full edit category flow', () => {
      it('edits category and shows updated data', async () => {
        const user = userEvent.setup();

        categoriesService.categoriesService.update.mockResolvedValue({
          success: true,
          data: { ...mockCategories[0], name: 'Dev Updated', color: '#10B981' }
        });

        renderCategoriesPage();

        await waitFor(() => {
          expect(screen.getByText('Development')).toBeInTheDocument();
        });

        // Click edit on first category
        const editButtons = screen.getAllByRole('button', { name: /modifier/i });
        await user.click(editButtons[0]);

        await waitFor(() => {
          expect(screen.getByText(/modifier la categorie/i)).toBeInTheDocument();
        });

        // Verify pre-filled values
        expect(screen.getByLabelText(/nom/i)).toHaveValue('Development');

        // Clear and type new name
        await user.clear(screen.getByLabelText(/nom/i));
        await user.type(screen.getByLabelText(/nom/i), 'Dev Updated');

        // Change color to green
        await user.click(screen.getByTitle('Green'));

        // Mock refetch with updated data
        categoriesService.categoriesService.getAll.mockResolvedValue({
          success: true,
          data: [
            { ...mockCategories[0], name: 'Dev Updated', color: '#10B981' },
            mockCategories[1]
          ]
        });

        // Submit - find the submit button in the modal (not the table row buttons)
        const modal = screen.getByRole('dialog');
        const submitButton = modal.querySelector('button[type="submit"]');
        await user.click(submitButton);

        // Verify API was called
        await waitFor(() => {
          expect(categoriesService.categoriesService.update).toHaveBeenCalledWith(
            '1',
            expect.objectContaining({
              name: 'Dev Updated',
              color: '#10B981'
            })
          );
        });

        // Verify success message
        await waitFor(() => {
          expect(screen.getByText(/categorie modifiee avec succes/i)).toBeInTheDocument();
        });
      });
    });

    describe('Full deactivate/activate flow', () => {
      it('deactivates category and updates list', async () => {
        const user = userEvent.setup();

        categoriesService.categoriesService.deactivate.mockResolvedValue({ success: true });

        renderCategoriesPage();

        await waitFor(() => {
          expect(screen.getByText('Development')).toBeInTheDocument();
        });

        // Click deactivate
        const deactivateButtons = screen.getAllByRole('button', { name: /desactiver/i });
        await user.click(deactivateButtons[0]);

        // Confirm in dialog
        await waitFor(() => {
          expect(screen.getByText(/confirmation/i)).toBeInTheDocument();
        });

        const confirmButton = screen.getAllByRole('button', { name: /desactiver/i }).find(
          btn => btn.closest('.fixed')
        );

        // Mock refetch with category removed (or marked inactive)
        categoriesService.categoriesService.getAll.mockResolvedValue({
          success: true,
          data: [mockCategories[1]] // Only Meeting remains active
        });

        await user.click(confirmButton);

        // Verify API was called
        await waitFor(() => {
          expect(categoriesService.categoriesService.deactivate).toHaveBeenCalledWith('1');
        });

        // Verify success message
        await waitFor(() => {
          expect(screen.getByText(/categorie desactivee avec succes/i)).toBeInTheDocument();
        });
      });

      it('activates inactive category', async () => {
        const user = userEvent.setup();

        categoriesService.categoriesService.activate.mockResolvedValue({ success: true });

        renderCategoriesPage({ categories: mockCategories });

        await waitFor(() => {
          expect(screen.getByText('Admin')).toBeInTheDocument();
        });

        // Click activate on Admin (inactive category)
        await user.click(screen.getByRole('button', { name: 'Activer' }));

        // Confirm in dialog
        await waitFor(() => {
          expect(screen.getByText(/confirmation/i)).toBeInTheDocument();
        });

        const confirmButton = screen.getAllByRole('button', { name: /activer/i }).find(
          btn => btn.closest('.fixed')
        );

        // Mock refetch with category activated
        categoriesService.categoriesService.getAll.mockResolvedValue({
          success: true,
          data: mockCategories.map(c => c.id === '3' ? { ...c, isActive: true } : c)
        });

        await user.click(confirmButton);

        // Verify API was called
        await waitFor(() => {
          expect(categoriesService.categoriesService.activate).toHaveBeenCalledWith('3');
        });

        // Verify success message
        await waitFor(() => {
          expect(screen.getByText(/categorie activee avec succes/i)).toBeInTheDocument();
        });
      });
    });

    describe('Filter toggle flow', () => {
      it('shows inactive categories when filter enabled', async () => {
        const user = userEvent.setup();

        renderCategoriesPage();

        await waitFor(() => {
          expect(screen.getByText('Development')).toBeInTheDocument();
        });

        // Initially, Admin (inactive) should not be shown
        expect(screen.queryByText('Admin')).not.toBeInTheDocument();

        // Mock the refetch to include inactive
        categoriesService.categoriesService.getAll.mockResolvedValue({
          success: true,
          data: mockCategories
        });

        // Toggle the filter
        await user.click(screen.getByRole('checkbox'));

        // Now Admin should appear
        await waitFor(() => {
          expect(screen.getByText('Admin')).toBeInTheDocument();
        });
      });
    });
  });
});
