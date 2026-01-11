// frontend/src/__tests__/components/features/teams/TeamForm.test.jsx
// Story 3.6: Admin Management UI - Teams

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TeamForm } from '../../../../components/features/teams/TeamForm';

describe('TeamForm', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    team: null,
    isLoading: false,
    error: null
  };

  describe('Create mode', () => {
    it('renders create modal with empty form', () => {
      render(<TeamForm {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /nouvelle equipe/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/nom de l'equipe/i)).toHaveValue('');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
    });

    it('shows Creer button in create mode', () => {
      render(<TeamForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /creer/i })).toBeInTheDocument();
    });

    it('validates required name field', async () => {
      const user = userEvent.setup();
      render(<TeamForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /creer/i }));

      await waitFor(() => {
        expect(screen.getByText(/nom.*requis/i)).toBeInTheDocument();
      });
    });

    it('validates minimum name length', async () => {
      const user = userEvent.setup();
      render(<TeamForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/nom de l'equipe/i), 'A');
      await user.click(screen.getByRole('button', { name: /creer/i }));

      await waitFor(() => {
        expect(screen.getByText(/minimum 2 caracteres/i)).toBeInTheDocument();
      });
    });

    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      render(<TeamForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/nom de l'equipe/i), 'New Team');
      await user.type(screen.getByLabelText(/description/i), 'Team description');
      await user.click(screen.getByRole('button', { name: /creer/i }));

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith({
          name: 'New Team',
          description: 'Team description'
        });
      });
    });

    it('trims whitespace from values', async () => {
      const user = userEvent.setup();
      render(<TeamForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/nom de l'equipe/i), '  Team Name  ');
      await user.type(screen.getByLabelText(/description/i), '  Description  ');
      await user.click(screen.getByRole('button', { name: /creer/i }));

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith({
          name: 'Team Name',
          description: 'Description'
        });
      });
    });
  });

  describe('Edit mode', () => {
    const mockTeam = {
      id: '1',
      name: 'Existing Team',
      description: 'Existing description'
    };

    it('renders edit modal with pre-filled data', () => {
      render(<TeamForm {...defaultProps} team={mockTeam} />);

      expect(screen.getByRole('heading', { name: /modifier l'equipe/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/nom de l'equipe/i)).toHaveValue('Existing Team');
      expect(screen.getByLabelText(/description/i)).toHaveValue('Existing description');
    });

    it('shows Enregistrer button in edit mode', () => {
      render(<TeamForm {...defaultProps} team={mockTeam} />);

      expect(screen.getByRole('button', { name: /enregistrer/i })).toBeInTheDocument();
    });

    it('submits updated data', async () => {
      const user = userEvent.setup();
      render(<TeamForm {...defaultProps} team={mockTeam} />);

      const nameInput = screen.getByLabelText(/nom de l'equipe/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Team');
      await user.click(screen.getByRole('button', { name: /enregistrer/i }));

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith({
          name: 'Updated Team',
          description: 'Existing description'
        });
      });
    });
  });

  describe('Modal behavior', () => {
    it('calls onClose when clicking Cancel', async () => {
      const user = userEvent.setup();
      render(<TeamForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /annuler/i }));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('displays error message when error prop is set', () => {
      render(<TeamForm {...defaultProps} error="Une erreur est survenue" />);

      expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();
    });

    it('shows loading state when isLoading is true', () => {
      render(<TeamForm {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: /enregistrement/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /enregistrement/i })).toBeDisabled();
    });

    it('does not render when isOpen is false', () => {
      render(<TeamForm {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('heading', { name: /nouvelle equipe/i })).not.toBeInTheDocument();
    });

    it('resets form when modal closes and reopens', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<TeamForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/nom de l'equipe/i), 'Test');

      rerender(<TeamForm {...defaultProps} isOpen={false} />);
      rerender(<TeamForm {...defaultProps} isOpen={true} />);

      expect(screen.getByLabelText(/nom de l'equipe/i)).toHaveValue('');
    });
  });

  describe('Description field', () => {
    it('allows empty description', async () => {
      const user = userEvent.setup();
      render(<TeamForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/nom de l'equipe/i), 'Team Name');
      await user.click(screen.getByRole('button', { name: /creer/i }));

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith({
          name: 'Team Name',
          description: ''
        });
      });
    });

    it('validates max description length', async () => {
      const user = userEvent.setup();
      render(<TeamForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/nom de l'equipe/i), 'Team');
      await user.type(screen.getByLabelText(/description/i), 'A'.repeat(501));
      await user.click(screen.getByRole('button', { name: /creer/i }));

      await waitFor(() => {
        expect(screen.getByText(/maximum 500 caracteres/i)).toBeInTheDocument();
      });
    });
  });
});
