// frontend/src/__tests__/pages/LoginPage.test.jsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';
import { AuthProvider } from '../../contexts/AuthContext';
import * as authService from '../../services/authService';

// Mock the authService
vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getProfile: vi.fn(),
    isAuthenticated: vi.fn(() => false),
    getAccessToken: vi.fn(() => null)
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

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.authService.isAuthenticated.mockReturnValue(false);
  });

  describe('Rendering', () => {
    it('renders login form with all elements', () => {
      renderLoginPage();

      expect(screen.getByText('Time Manager')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
      expect(screen.getByText(/mot de passe oublie/i)).toBeInTheDocument();
    });

    it('has a link to forgot password page', () => {
      renderLoginPage();

      const forgotPasswordLink = screen.getByRole('link', { name: /mot de passe oublie/i });
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
    });
  });

  describe('Form Validation', () => {
    it('shows validation error when email is empty', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await user.click(screen.getByRole('button', { name: /se connecter/i }));

      await waitFor(() => {
        expect(screen.getByText('Email requis')).toBeInTheDocument();
      });
    });

    it('shows validation error when password is empty', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /se connecter/i }));

      await waitFor(() => {
        expect(screen.getByText('Mot de passe requis')).toBeInTheDocument();
      });
    });

    it('shows both validation errors when form is empty', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      await user.click(screen.getByRole('button', { name: /se connecter/i }));

      await waitFor(() => {
        expect(screen.getByText('Email requis')).toBeInTheDocument();
        expect(screen.getByText('Mot de passe requis')).toBeInTheDocument();
      });
    });
  });

  describe('Login Flow', () => {
    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      authService.authService.login.mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 100))
      );

      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/mot de passe/i), 'password123');
      await user.click(screen.getByRole('button', { name: /se connecter/i }));

      expect(screen.getByRole('button', { name: /connexion/i })).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('navigates to dashboard on successful login', async () => {
      const user = userEvent.setup();
      authService.authService.login.mockResolvedValue({
        user: { id: '1', email: 'test@example.com' },
        session: { accessToken: 'token', refreshToken: 'refresh' }
      });

      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/mot de passe/i), 'password123');
      await user.click(screen.getByRole('button', { name: /se connecter/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });

    it('displays error message on login failure', async () => {
      const user = userEvent.setup();
      authService.authService.login.mockRejectedValue(new Error('Invalid credentials'));

      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/mot de passe/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /se connecter/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('clears password field on login error', async () => {
      const user = userEvent.setup();
      authService.authService.login.mockRejectedValue(new Error('Invalid credentials'));

      renderLoginPage();

      const passwordInput = screen.getByLabelText(/mot de passe/i);
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /se connecter/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });

      // Password should be cleared
      expect(passwordInput).toHaveValue('');
    });

    it('displays default error message when error has no message', async () => {
      const user = userEvent.setup();
      authService.authService.login.mockRejectedValue(new Error());

      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/mot de passe/i), 'password123');
      await user.click(screen.getByRole('button', { name: /se connecter/i }));

      await waitFor(() => {
        expect(screen.getByText('Echec de la connexion')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('form inputs are properly labeled', () => {
      renderLoginPage();

      expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/mot de passe/i)).toHaveAttribute('type', 'password');
    });

    it('submit button is disabled during loading', async () => {
      const user = userEvent.setup();
      authService.authService.login.mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 100))
      );

      renderLoginPage();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/mot de passe/i), 'password123');
      await user.click(screen.getByRole('button', { name: /se connecter/i }));

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
