// frontend/src/__tests__/pages/ProfilePage.test.jsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProfilePage from '../../pages/ProfilePage';
import { AuthProvider } from '../../contexts/AuthContext';
import * as authService from '../../services/authService';

// Mock the authService
vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    isAuthenticated: vi.fn(() => true),
    getAccessToken: vi.fn(() => 'mock-token')
  }
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const mockUser = {
  id: '123',
  email: 'test@example.com',
  firstName: 'Jean',
  lastName: 'Dupont',
  role: 'employee',
  weeklyHoursTarget: 35
};

const mockManagerUser = {
  id: '456',
  email: 'manager@example.com',
  firstName: 'Marie',
  lastName: 'Martin',
  role: 'manager',
  weeklyHoursTarget: 40
};

function renderProfilePage(initialUser = mockUser) {
  // Setup authService to return the user on getProfile
  authService.authService.isAuthenticated.mockReturnValue(true);
  authService.authService.getProfile.mockResolvedValue(initialUser);

  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <AuthProvider>
        <ProfilePage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Note: AC5 (redirect to login when not authenticated) is now handled by ProtectedRoute
  // at the layout level, not by ProfilePage itself. See ProtectedRoute.test.jsx

  describe('Rendering - AC1: Profile Display', () => {
    it('renders profile card with user information', async () => {
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      expect(screen.getByText('test@example.com')).toBeInTheDocument();

      // Wait for form values to be populated by react-hook-form reset()
      await waitFor(() => {
        expect(screen.getByDisplayValue('Jean')).toBeInTheDocument();
      });
      expect(screen.getByDisplayValue('Dupont')).toBeInTheDocument();
      expect(screen.getByDisplayValue('35')).toBeInTheDocument();
    });

    it('displays email as readonly', async () => {
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      // Email should be displayed but disabled
      const emailInputs = screen.getAllByDisplayValue('test@example.com');
      expect(emailInputs.length).toBeGreaterThan(0);
      expect(emailInputs[0]).toBeDisabled();
    });

    it('displays role as readonly for employee', async () => {
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue('Employe')).toBeDisabled();
    });

    it('displays role as readonly for manager', async () => {
      renderProfilePage(mockManagerUser);

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue('Manager')).toBeDisabled();
    });

    it('displays role badge for employee', async () => {
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      expect(screen.getByText('Employe')).toBeInTheDocument();
    });

    it('displays role badge for manager', async () => {
      renderProfilePage(mockManagerUser);

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      expect(screen.getByText('Manager')).toBeInTheDocument();
    });
  });

  describe('Edit Mode Toggle - AC2', () => {
    it('shows Modifier button in view mode', async () => {
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument();
    });

    it('switches to edit mode when Modifier is clicked', async () => {
      const user = userEvent.setup();
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /modifier/i }));

      // Should now show Enregistrer and Annuler buttons
      expect(screen.getByRole('button', { name: /enregistrer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
    });

    it('enables editable fields in edit mode', async () => {
      const user = userEvent.setup();
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      // Fields should be disabled initially
      expect(screen.getByLabelText(/prenom/i)).toBeDisabled();
      expect(screen.getByLabelText(/^nom$/i)).toBeDisabled();

      await user.click(screen.getByRole('button', { name: /modifier/i }));

      // Fields should be enabled in edit mode
      expect(screen.getByLabelText(/prenom/i)).not.toBeDisabled();
      expect(screen.getByLabelText(/^nom$/i)).not.toBeDisabled();
    });

    it('keeps email and role disabled in edit mode', async () => {
      const user = userEvent.setup();
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /modifier/i }));

      // Email and role should still be disabled
      const emailInputs = screen.getAllByDisplayValue('test@example.com');
      expect(emailInputs[0]).toBeDisabled();
      expect(screen.getByDisplayValue('Employe')).toBeDisabled();
    });
  });

  describe('Profile Update - AC3', () => {
    it('updates profile on save', async () => {
      const user = userEvent.setup();
      authService.authService.updateProfile.mockResolvedValue({
        ...mockUser,
        firstName: 'Pierre'
      });
      authService.authService.getProfile.mockResolvedValue({
        ...mockUser,
        firstName: 'Pierre'
      });

      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /modifier/i }));

      const firstNameInput = screen.getByLabelText(/prenom/i);
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Pierre');

      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(authService.authService.updateProfile).toHaveBeenCalledWith(
          expect.objectContaining({ firstName: 'Pierre' })
        );
      });
    });

    it('shows success message after successful update', async () => {
      const user = userEvent.setup();
      authService.authService.updateProfile.mockResolvedValue(mockUser);

      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /modifier/i }));
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(screen.getByText(/profil mis a jour avec succes/i)).toBeInTheDocument();
      });
    });

    it('refreshes user context after successful update', async () => {
      const user = userEvent.setup();
      authService.authService.updateProfile.mockResolvedValue(mockUser);

      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /modifier/i }));
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        // getProfile should be called again to refresh user data
        expect(authService.authService.getProfile).toHaveBeenCalledTimes(2);
      });
    });

    it('returns to view mode after successful save', async () => {
      const user = userEvent.setup();
      authService.authService.updateProfile.mockResolvedValue(mockUser);

      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /modifier/i }));
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument();
      });
    });

    it('shows error message on update failure', async () => {
      const user = userEvent.setup();
      authService.authService.updateProfile.mockRejectedValue(
        new Error('Erreur serveur')
      );

      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /modifier/i }));
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(screen.getByText('Erreur serveur')).toBeInTheDocument();
      });
    });
  });

  describe('Validation - AC4', () => {
    it('shows error when first name is empty', async () => {
      const user = userEvent.setup();
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /modifier/i }));

      const firstNameInput = screen.getByLabelText(/prenom/i);
      await user.clear(firstNameInput);
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(screen.getByText('Prenom requis')).toBeInTheDocument();
      });
    });

    it('shows error when last name is empty', async () => {
      const user = userEvent.setup();
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /modifier/i }));

      const lastNameInput = screen.getByLabelText(/^nom$/i);
      await user.clear(lastNameInput);
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(screen.getByText('Nom requis')).toBeInTheDocument();
      });
    });

    // Story 2.14: weeklyHoursTarget is readonly for employees, only managers can edit
    // So we use mockManagerUser for these validation tests
    it('shows error when weekly hours exceed 168', async () => {
      const user = userEvent.setup();
      renderProfilePage(mockManagerUser);

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /modifier/i }));

      const hoursInput = screen.getByLabelText(/heures cibles/i);
      await user.clear(hoursInput);
      await user.type(hoursInput, '200');
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(screen.getByText(/maximum 168 heures/i)).toBeInTheDocument();
      });
    });

    // Story 2.14: weeklyHoursTarget is readonly for employees, only managers can edit
    it('shows error when weekly hours are negative', async () => {
      const user = userEvent.setup();
      renderProfilePage(mockManagerUser);

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /modifier/i }));

      const hoursInput = screen.getByLabelText(/heures cibles/i);
      await user.clear(hoursInput);
      await user.type(hoursInput, '-5');
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(screen.getByText(/minimum 0 heures/i)).toBeInTheDocument();
      });
    });

    // Story 2.14: Employee cannot modify weekly hours target
    it('disables weekly hours target for employees', async () => {
      renderProfilePage(mockUser); // mockUser is an employee

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      const hoursInput = screen.getByLabelText(/heures cibles/i);
      expect(hoursInput).toBeDisabled();
      expect(screen.getByText(/definies par votre manager/i)).toBeInTheDocument();
    });
  });

  describe('Cancel Edit', () => {
    it('resets form values when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /modifier/i }));

      const firstNameInput = screen.getByLabelText(/prenom/i);
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'NouveauNom');

      await user.click(screen.getByRole('button', { name: /annuler/i }));

      await waitFor(() => {
        expect(screen.getByDisplayValue('Jean')).toBeInTheDocument();
      });
    });

    it('returns to view mode when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /modifier/i }));
      await user.click(screen.getByRole('button', { name: /annuler/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading state during profile update', async () => {
      const user = userEvent.setup();
      authService.authService.updateProfile.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /modifier/i }));
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      expect(screen.getByRole('button', { name: /enregistrement/i })).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('form inputs are properly labeled', async () => {
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/prenom/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^nom$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/heures cibles/i)).toBeInTheDocument();
    });

    it('hours input has number type', async () => {
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/heures cibles/i)).toHaveAttribute('type', 'number');
    });
  });
});
