// frontend/src/__tests__/components/features/categories/CategoryForm.test.jsx
// Story 3.8: Admin Management UI - Categories

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryForm } from '../../../../components/features/categories/CategoryForm';

const mockCategory = {
  id: '1',
  name: 'Development',
  description: 'Coding and development tasks',
  color: '#3B82F6',
  isActive: true
};

describe('CategoryForm', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    category: null,
    isLoading: false,
    error: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Modal Rendering', () => {
    it('renders nothing when isOpen is false', () => {
      render(<CategoryForm {...defaultProps} isOpen={false} />);

      expect(screen.queryByText(/categorie/i)).not.toBeInTheDocument();
    });

    it('renders modal when isOpen is true', () => {
      render(<CategoryForm {...defaultProps} />);

      expect(screen.getByText(/creer une categorie/i)).toBeInTheDocument();
    });

    it('displays create title when no category provided', () => {
      render(<CategoryForm {...defaultProps} />);

      expect(screen.getByText(/creer une categorie/i)).toBeInTheDocument();
    });

    it('displays edit title when category provided', () => {
      render(<CategoryForm {...defaultProps} category={mockCategory} />);

      expect(screen.getByText(/modifier la categorie/i)).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('renders name input field', () => {
      render(<CategoryForm {...defaultProps} />);

      expect(screen.getByLabelText(/nom/i)).toBeInTheDocument();
    });

    it('renders description textarea', () => {
      render(<CategoryForm {...defaultProps} />);

      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('renders color picker', () => {
      render(<CategoryForm {...defaultProps} />);

      expect(screen.getByText(/palette de couleurs/i)).toBeInTheDocument();
    });

    it('renders submit and cancel buttons', () => {
      render(<CategoryForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: /creer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
    });
  });

  describe('Edit Mode Pre-fill', () => {
    it('pre-fills name field with category name', () => {
      render(<CategoryForm {...defaultProps} category={mockCategory} />);

      expect(screen.getByLabelText(/nom/i)).toHaveValue('Development');
    });

    it('pre-fills description field with category description', () => {
      render(<CategoryForm {...defaultProps} category={mockCategory} />);

      expect(screen.getByLabelText(/description/i)).toHaveValue('Coding and development tasks');
    });

    it('displays Modifier button in edit mode', () => {
      render(<CategoryForm {...defaultProps} category={mockCategory} />);

      expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows error when name is empty on submit', async () => {
      const user = userEvent.setup();
      render(<CategoryForm {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /creer/i }));

      await waitFor(() => {
        expect(screen.getByText(/nom est requis/i)).toBeInTheDocument();
      });
    });

    it('shows error when name exceeds 100 characters', async () => {
      const user = userEvent.setup();
      render(<CategoryForm {...defaultProps} />);

      const longName = 'a'.repeat(101);
      await user.type(screen.getByLabelText(/nom/i), longName);
      await user.click(screen.getByRole('button', { name: /creer/i }));

      await waitFor(() => {
        expect(screen.getByText(/100 caracteres/i)).toBeInTheDocument();
      });
    });

    it('shows error when description exceeds 500 characters', async () => {
      const user = userEvent.setup();
      render(<CategoryForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/nom/i), 'Test');
      const longDesc = 'a'.repeat(501);
      await user.type(screen.getByLabelText(/description/i), longDesc);
      await user.click(screen.getByRole('button', { name: /creer/i }));

      await waitFor(() => {
        expect(screen.getByText(/500 caracteres/i)).toBeInTheDocument();
      });
    });

    it('clears validation error when field is modified', async () => {
      const user = userEvent.setup();
      render(<CategoryForm {...defaultProps} />);

      // Trigger validation error
      await user.click(screen.getByRole('button', { name: /creer/i }));
      await waitFor(() => {
        expect(screen.getByText(/nom est requis/i)).toBeInTheDocument();
      });

      // Type in field to clear error
      await user.type(screen.getByLabelText(/nom/i), 'Test');

      await waitFor(() => {
        expect(screen.queryByText(/nom est requis/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with form data when valid', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<CategoryForm {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/nom/i), 'New Category');
      await user.type(screen.getByLabelText(/description/i), 'A description');
      await user.click(screen.getByRole('button', { name: /creer/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          name: 'New Category',
          description: 'A description',
          color: '#3B82F6' // Default color
        });
      });
    });

    it('trims whitespace from name and description', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<CategoryForm {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/nom/i), '  Test Category  ');
      await user.click(screen.getByRole('button', { name: /creer/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Category'
          })
        );
      });
    });

    it('converts color to uppercase', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<CategoryForm {...defaultProps} onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/nom/i), 'Test');
      // Click on green color in palette
      await user.click(screen.getByTitle('Green'));
      await user.click(screen.getByRole('button', { name: /creer/i }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            color: '#10B981'
          })
        );
      });
    });

    it('does not submit when form is invalid', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<CategoryForm {...defaultProps} onSubmit={onSubmit} />);

      await user.click(screen.getByRole('button', { name: /creer/i }));

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('disables form fields when loading', () => {
      render(<CategoryForm {...defaultProps} isLoading={true} />);

      expect(screen.getByLabelText(/nom/i)).toBeDisabled();
      expect(screen.getByLabelText(/description/i)).toBeDisabled();
    });

    it('disables buttons when loading', () => {
      render(<CategoryForm {...defaultProps} isLoading={true} />);

      expect(screen.getByRole('button', { name: /enregistrement/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /annuler/i })).toBeDisabled();
    });

    it('shows loading text on submit button', () => {
      render(<CategoryForm {...defaultProps} isLoading={true} />);

      expect(screen.getByText(/enregistrement/i)).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('displays API error message', () => {
      render(<CategoryForm {...defaultProps} error="Une categorie avec ce nom existe deja" />);

      expect(screen.getByText(/une categorie avec ce nom existe deja/i)).toBeInTheDocument();
    });
  });

  describe('Modal Actions', () => {
    it('calls onClose when cancel button clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<CategoryForm {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /annuler/i }));

      expect(onClose).toHaveBeenCalled();
    });

    it('resets form when modal reopens', async () => {
      const { rerender } = render(<CategoryForm {...defaultProps} />);

      // Close modal
      rerender(<CategoryForm {...defaultProps} isOpen={false} />);

      // Reopen modal
      rerender(<CategoryForm {...defaultProps} isOpen={true} />);

      expect(screen.getByLabelText(/nom/i)).toHaveValue('');
    });
  });
});
