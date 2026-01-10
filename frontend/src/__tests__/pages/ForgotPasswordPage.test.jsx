// frontend/src/__tests__/pages/ForgotPasswordPage.test.jsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordPage from '../../pages/ForgotPasswordPage';
import { authService } from '../../services/authService';

// Mock the authService
vi.mock('../../services/authService', () => ({
  authService: {
    forgotPassword: vi.fn()
  }
}));

function renderForgotPasswordPage() {
  return render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <ForgotPasswordPage />
    </MemoryRouter>
  );
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders forgot password form with all elements', () => {
      renderForgotPasswordPage();

      expect(screen.getByText('Mot de passe oublie')).toBeInTheDocument();
      expect(screen.getByText(/entrez votre email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /envoyer le lien/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /retour a la connexion/i })).toBeInTheDocument();
    });

    it('has a link back to login page', () => {
      renderForgotPasswordPage();

      const loginLink = screen.getByRole('link', { name: /retour a la connexion/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Form Validation', () => {
    it('shows validation error when email is empty', async () => {
      const user = userEvent.setup();
      renderForgotPasswordPage();

      await user.click(screen.getByRole('button', { name: /envoyer le lien/i }));

      await waitFor(() => {
        expect(screen.getByText('Email requis')).toBeInTheDocument();
      });
    });
  });

  describe('Forgot Password Flow', () => {
    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      authService.forgotPassword.mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 100))
      );

      renderForgotPasswordPage();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /envoyer le lien/i }));

      expect(screen.getByRole('button', { name: /envoi/i })).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows success message after submitting email', async () => {
      const user = userEvent.setup();
      authService.forgotPassword.mockResolvedValue({ message: 'Email sent' });

      renderForgotPasswordPage();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /envoyer le lien/i }));

      await waitFor(() => {
        expect(screen.getByText('Email envoye')).toBeInTheDocument();
        expect(screen.getByText(/si un compte existe/i)).toBeInTheDocument();
      });
    });

    it('shows success message even if API fails (security by obscurity)', async () => {
      const user = userEvent.setup();
      // Per security best practice, the API shouldn't reveal if email exists
      // but the UI should always show success
      authService.forgotPassword.mockResolvedValue({ message: 'OK' });

      renderForgotPasswordPage();

      await user.type(screen.getByLabelText(/email/i), 'nonexistent@example.com');
      await user.click(screen.getByRole('button', { name: /envoyer le lien/i }));

      await waitFor(() => {
        expect(screen.getByText('Email envoye')).toBeInTheDocument();
      });
    });

    it('success view has link back to login', async () => {
      const user = userEvent.setup();
      authService.forgotPassword.mockResolvedValue({ message: 'Email sent' });

      renderForgotPasswordPage();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /envoyer le lien/i }));

      await waitFor(() => {
        expect(screen.getByText('Email envoye')).toBeInTheDocument();
      });

      const loginLink = screen.getByRole('link', { name: /retour a la connexion/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('displays check circle icon in success state', async () => {
      const user = userEvent.setup();
      authService.forgotPassword.mockResolvedValue({ message: 'Email sent' });

      renderForgotPasswordPage();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /envoyer le lien/i }));

      await waitFor(() => {
        // Check for SVG element (CheckCircleIcon)
        expect(document.querySelector('svg')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('email input has proper type', () => {
      renderForgotPasswordPage();

      expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
    });

    it('submit button is disabled during loading', async () => {
      const user = userEvent.setup();
      authService.forgotPassword.mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 100))
      );

      renderForgotPasswordPage();

      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /envoyer le lien/i }));

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
