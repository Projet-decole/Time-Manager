// frontend/src/__tests__/pages/ResetPasswordPage.test.jsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ResetPasswordPage from '../../pages/ResetPasswordPage';
import * as supabaseModule from '../../lib/supabase';

// Mock the supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      updateUser: vi.fn()
    }
  }
}));

function renderResetPasswordPage() {
  return render(
    <MemoryRouter initialEntries={['/reset-password']}>
      <ResetPasswordPage />
    </MemoryRouter>
  );
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC1: Form rendering with valid session', () => {
    beforeEach(() => {
      // Mock valid recovery session
      supabaseModule.supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: '123' } } }
      });
    });

    it('renders password form with both password fields', async () => {
      renderResetPasswordPage();

      await waitFor(() => {
        // Use getByRole for heading to be more specific
        expect(screen.getByRole('heading', { name: /nouveau mot de passe/i })).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/nouveau mot de passe$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirmer le mot de passe/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mettre a jour/i })).toBeInTheDocument();
    });

    it('password inputs have type password', async () => {
      renderResetPasswordPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/nouveau mot de passe$/i)).toHaveAttribute('type', 'password');
      });

      expect(screen.getByLabelText(/confirmer le mot de passe/i)).toHaveAttribute('type', 'password');
    });
  });

  describe('AC3: Form Validation', () => {
    beforeEach(() => {
      supabaseModule.supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: '123' } } }
      });
    });

    it('shows validation error when password is too short', async () => {
      const user = userEvent.setup();
      renderResetPasswordPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/nouveau mot de passe$/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/nouveau mot de passe$/i), 'short');
      await user.type(screen.getByLabelText(/confirmer le mot de passe/i), 'short');
      await user.click(screen.getByRole('button', { name: /mettre a jour/i }));

      await waitFor(() => {
        expect(screen.getByText(/minimum 8 caracteres/i)).toBeInTheDocument();
      });
    });

    it('shows validation error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderResetPasswordPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/nouveau mot de passe$/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/nouveau mot de passe$/i), 'password123');
      await user.type(screen.getByLabelText(/confirmer le mot de passe/i), 'different123');
      await user.click(screen.getByRole('button', { name: /mettre a jour/i }));

      await waitFor(() => {
        expect(screen.getByText(/les mots de passe ne correspondent pas/i)).toBeInTheDocument();
      });
    });

    it('shows validation error when password field is empty', async () => {
      const user = userEvent.setup();
      renderResetPasswordPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /mettre a jour/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /mettre a jour/i }));

      await waitFor(() => {
        expect(screen.getByText(/mot de passe requis/i)).toBeInTheDocument();
      });
    });

    it('shows validation error when confirm password is empty', async () => {
      const user = userEvent.setup();
      renderResetPasswordPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/nouveau mot de passe$/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/nouveau mot de passe$/i), 'password123');
      await user.click(screen.getByRole('button', { name: /mettre a jour/i }));

      await waitFor(() => {
        expect(screen.getByText(/confirmation requise/i)).toBeInTheDocument();
      });
    });
  });

  describe('AC2: Successful password update', () => {
    beforeEach(() => {
      supabaseModule.supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: '123' } } }
      });
      supabaseModule.supabase.auth.updateUser.mockResolvedValue({ error: null });
    });

    it('shows loading state during submission', async () => {
      supabaseModule.supabase.auth.updateUser.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      );

      const user = userEvent.setup();
      renderResetPasswordPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/nouveau mot de passe$/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/nouveau mot de passe$/i), 'newpassword123');
      await user.type(screen.getByLabelText(/confirmer le mot de passe/i), 'newpassword123');
      await user.click(screen.getByRole('button', { name: /mettre a jour/i }));

      expect(screen.getByRole('button', { name: /mise a jour/i })).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows success message after password update', async () => {
      const user = userEvent.setup();
      renderResetPasswordPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/nouveau mot de passe$/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/nouveau mot de passe$/i), 'newpassword123');
      await user.type(screen.getByLabelText(/confirmer le mot de passe/i), 'newpassword123');
      await user.click(screen.getByRole('button', { name: /mettre a jour/i }));

      await waitFor(() => {
        expect(screen.getByText(/mot de passe modifie/i)).toBeInTheDocument();
      });
    });

    it('shows link to login after successful password update', async () => {
      const user = userEvent.setup();
      renderResetPasswordPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/nouveau mot de passe$/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/nouveau mot de passe$/i), 'newpassword123');
      await user.type(screen.getByLabelText(/confirmer le mot de passe/i), 'newpassword123');
      await user.click(screen.getByRole('button', { name: /mettre a jour/i }));

      await waitFor(() => {
        expect(screen.getByText(/mot de passe modifie/i)).toBeInTheDocument();
      });

      const loginLink = screen.getByRole('link', { name: /se connecter/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('calls supabase updateUser with new password', async () => {
      const user = userEvent.setup();
      renderResetPasswordPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/nouveau mot de passe$/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/nouveau mot de passe$/i), 'newpassword123');
      await user.type(screen.getByLabelText(/confirmer le mot de passe/i), 'newpassword123');
      await user.click(screen.getByRole('button', { name: /mettre a jour/i }));

      await waitFor(() => {
        expect(supabaseModule.supabase.auth.updateUser).toHaveBeenCalledWith({
          password: 'newpassword123'
        });
      });
    });
  });

  describe('AC4: Invalid/expired token handling', () => {
    it('shows invalid link message when no session exists', async () => {
      supabaseModule.supabase.auth.getSession.mockResolvedValue({
        data: { session: null }
      });

      renderResetPasswordPage();

      await waitFor(() => {
        expect(screen.getByText(/lien invalide ou expire/i)).toBeInTheDocument();
      });
    });

    it('shows link to request new reset when token is invalid', async () => {
      supabaseModule.supabase.auth.getSession.mockResolvedValue({
        data: { session: null }
      });

      renderResetPasswordPage();

      await waitFor(() => {
        expect(screen.getByText(/lien invalide ou expire/i)).toBeInTheDocument();
      });

      const newLinkButton = screen.getByRole('link', { name: /demander un nouveau lien/i });
      expect(newLinkButton).toHaveAttribute('href', '/forgot-password');
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      supabaseModule.supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: '123' } } }
      });
    });

    it('displays error message when password update fails', async () => {
      supabaseModule.supabase.auth.updateUser.mockResolvedValue({
        error: { message: 'Password is too weak' }
      });

      const user = userEvent.setup();
      renderResetPasswordPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/nouveau mot de passe$/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/nouveau mot de passe$/i), 'newpassword123');
      await user.type(screen.getByLabelText(/confirmer le mot de passe/i), 'newpassword123');
      await user.click(screen.getByRole('button', { name: /mettre a jour/i }));

      await waitFor(() => {
        expect(screen.getByText('Password is too weak')).toBeInTheDocument();
      });
    });
  });

  describe('PASSWORD_RECOVERY event handling', () => {
    it('sets hasSession when PASSWORD_RECOVERY event is received', async () => {
      let authCallback;
      supabaseModule.supabase.auth.getSession.mockResolvedValue({
        data: { session: null }
      });
      supabaseModule.supabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      });

      renderResetPasswordPage();

      // Initially shows invalid link
      await waitFor(() => {
        expect(screen.getByText(/lien invalide ou expire/i)).toBeInTheDocument();
      });

      // Simulate PASSWORD_RECOVERY event - wrap in act() to handle state updates
      await act(async () => {
        authCallback('PASSWORD_RECOVERY', { user: { id: '123' } });
      });

      // Now should show the form
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /nouveau mot de passe/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      supabaseModule.supabase.auth.getSession.mockResolvedValue({
        data: { session: { user: { id: '123' } } }
      });
    });

    it('form inputs are properly labeled', async () => {
      renderResetPasswordPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/nouveau mot de passe$/i)).toHaveAttribute('type', 'password');
      });

      expect(screen.getByLabelText(/confirmer le mot de passe/i)).toHaveAttribute('type', 'password');
    });

    it('submit button is disabled during loading', async () => {
      supabaseModule.supabase.auth.updateUser.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      );

      const user = userEvent.setup();
      renderResetPasswordPage();

      await waitFor(() => {
        expect(screen.getByLabelText(/nouveau mot de passe$/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/nouveau mot de passe$/i), 'newpassword123');
      await user.type(screen.getByLabelText(/confirmer le mot de passe/i), 'newpassword123');
      await user.click(screen.getByRole('button', { name: /mettre a jour/i }));

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
