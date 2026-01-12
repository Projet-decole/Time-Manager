// frontend/src/__tests__/components/features/time-tracking/day-mode/BlockModal.test.jsx
// Story 4.7: Day Mode UI with Timeline - BlockModal Component Tests

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BlockModal } from '../../../../../components/features/time-tracking/day-mode/BlockModal';

describe('BlockModal', () => {
  const mockDayBoundaries = {
    start: new Date('2026-01-12T08:00:00'),
    end: new Date('2026-01-12T18:00:00')
  };

  const mockProjects = [
    { id: 'proj-1', code: 'PRJ-001', name: 'Time Manager' },
    { id: 'proj-2', code: 'PRJ-002', name: 'Other Project' }
  ];

  const mockCategories = [
    { id: 'cat-1', name: 'Development', color: '#3B82F6' },
    { id: 'cat-2', name: 'Meeting', color: '#10B981' }
  ];

  const mockBlock = {
    id: 'block-1',
    startTime: '2026-01-12T09:00:00',
    endTime: '2026-01-12T10:00:00',
    projectId: 'proj-1',
    categoryId: 'cat-1',
    description: 'Working on feature'
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    dayBoundaries: mockDayBoundaries,
    existingBlocks: [],
    projects: mockProjects,
    categories: mockCategories,
    onSave: vi.fn(),
    onDelete: vi.fn()
  };

  describe('Create Mode', () => {
    it('opens with empty form for new block', () => {
      render(<BlockModal {...defaultProps} block={null} />);

      expect(screen.getByText('Nouveau bloc')).toBeInTheDocument();
      expect(screen.getByLabelText(/Heure de debut/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Heure de fin/i)).toBeInTheDocument();
    });

    it('pre-fills start time from defaultStartTime', () => {
      const defaultStartTime = new Date('2026-01-12T14:00:00');
      render(<BlockModal {...defaultProps} block={null} defaultStartTime={defaultStartTime} />);

      const startInput = screen.getByLabelText(/Heure de debut/i);
      expect(startInput.value).toBe('14:00');
    });

    it('has project selector', () => {
      render(<BlockModal {...defaultProps} block={null} />);

      expect(screen.getByLabelText(/Projet/i)).toBeInTheDocument();
    });

    it('has category selector', () => {
      render(<BlockModal {...defaultProps} block={null} />);

      expect(screen.getByLabelText(/Categorie/i)).toBeInTheDocument();
    });

    it('has description field', () => {
      render(<BlockModal {...defaultProps} block={null} />);

      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('opens with pre-filled form for existing block', () => {
      render(<BlockModal {...defaultProps} block={mockBlock} />);

      expect(screen.getByText('Modifier le bloc')).toBeInTheDocument();
    });

    it('shows delete button in edit mode', () => {
      render(<BlockModal {...defaultProps} block={mockBlock} />);

      expect(screen.getByText('Supprimer')).toBeInTheDocument();
    });

    it('does not show delete button in create mode', () => {
      render(<BlockModal {...defaultProps} block={null} />);

      expect(screen.queryByText('Supprimer')).not.toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('shows error when start time is missing', async () => {
      render(<BlockModal {...defaultProps} block={null} />);

      // Clear start time
      const startInput = screen.getByLabelText(/Heure de debut/i);
      fireEvent.change(startInput, { target: { value: '' } });

      // Try to save
      fireEvent.click(screen.getByText('Enregistrer'));

      await waitFor(() => {
        expect(screen.getByText('Heure de debut requise')).toBeInTheDocument();
      });
    });

    it('shows error when end time is missing', async () => {
      render(<BlockModal {...defaultProps} block={null} />);

      // Clear end time
      const endInput = screen.getByLabelText(/Heure de fin/i);
      fireEvent.change(endInput, { target: { value: '' } });

      // Try to save
      fireEvent.click(screen.getByText('Enregistrer'));

      await waitFor(() => {
        expect(screen.getByText('Heure de fin requise')).toBeInTheDocument();
      });
    });

    it('shows error when end time is before start time', async () => {
      render(<BlockModal {...defaultProps} block={null} />);

      const startInput = screen.getByLabelText(/Heure de debut/i);
      const endInput = screen.getByLabelText(/Heure de fin/i);

      fireEvent.change(startInput, { target: { value: '10:00' } });
      fireEvent.change(endInput, { target: { value: '09:00' } });

      fireEvent.click(screen.getByText('Enregistrer'));

      await waitFor(() => {
        expect(screen.getByText('La fin doit etre apres le debut')).toBeInTheDocument();
      });
    });

    it('shows error when block overlaps with existing', async () => {
      const existingBlocks = [
        {
          id: 'block-2',
          startTime: '2026-01-12T09:00:00',
          endTime: '2026-01-12T10:00:00'
        }
      ];

      render(<BlockModal {...defaultProps} block={null} existingBlocks={existingBlocks} />);

      const startInput = screen.getByLabelText(/Heure de debut/i);
      const endInput = screen.getByLabelText(/Heure de fin/i);

      fireEvent.change(startInput, { target: { value: '09:30' } });
      fireEvent.change(endInput, { target: { value: '10:30' } });

      fireEvent.click(screen.getByText('Enregistrer'));

      await waitFor(() => {
        expect(screen.getByText('Ce bloc chevauche un bloc existant')).toBeInTheDocument();
      });
    });
  });

  describe('Save Action', () => {
    it('calls onSave with correct data on valid form', async () => {
      const onSave = vi.fn();
      render(<BlockModal {...defaultProps} block={null} onSave={onSave} />);

      const startInput = screen.getByLabelText(/Heure de debut/i);
      const endInput = screen.getByLabelText(/Heure de fin/i);

      fireEvent.change(startInput, { target: { value: '09:00' } });
      fireEvent.change(endInput, { target: { value: '10:00' } });

      fireEvent.click(screen.getByText('Enregistrer'));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
        const savedData = onSave.mock.calls[0][0];
        expect(savedData.startTime).toBeDefined();
        expect(savedData.endTime).toBeDefined();
      });
    });

    it('includes project and category when selected', async () => {
      const onSave = vi.fn();
      render(<BlockModal {...defaultProps} block={null} onSave={onSave} />);

      const startInput = screen.getByLabelText(/Heure de debut/i);
      const endInput = screen.getByLabelText(/Heure de fin/i);
      const projectSelect = screen.getByLabelText(/Projet/i);
      const categorySelect = screen.getByLabelText(/Categorie/i);

      fireEvent.change(startInput, { target: { value: '09:00' } });
      fireEvent.change(endInput, { target: { value: '10:00' } });
      fireEvent.change(projectSelect, { target: { value: 'proj-1' } });
      fireEvent.change(categorySelect, { target: { value: 'cat-1' } });

      fireEvent.click(screen.getByText('Enregistrer'));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
        const savedData = onSave.mock.calls[0][0];
        expect(savedData.projectId).toBe('proj-1');
        expect(savedData.categoryId).toBe('cat-1');
      });
    });
  });

  describe('Delete Action', () => {
    it('shows confirmation before delete', () => {
      render(<BlockModal {...defaultProps} block={mockBlock} />);

      fireEvent.click(screen.getByText('Supprimer'));

      expect(screen.getByText('Confirmer?')).toBeInTheDocument();
    });

    it('calls onDelete on confirmation', () => {
      const onDelete = vi.fn();
      render(<BlockModal {...defaultProps} block={mockBlock} onDelete={onDelete} />);

      // First click shows confirmation
      fireEvent.click(screen.getByText('Supprimer'));
      // Second click confirms
      const confirmBtn = screen.getAllByText('Supprimer')[0];
      fireEvent.click(confirmBtn);

      expect(onDelete).toHaveBeenCalledWith(mockBlock.id);
    });

    it('can cancel delete confirmation', () => {
      render(<BlockModal {...defaultProps} block={mockBlock} />);

      fireEvent.click(screen.getByText('Supprimer'));
      // Click the first Annuler button (the one in the delete confirmation)
      const cancelButtons = screen.getAllByText('Annuler');
      fireEvent.click(cancelButtons[0]);

      expect(screen.queryByText('Confirmer?')).not.toBeInTheDocument();
    });
  });

  describe('Close Action', () => {
    it('calls onClose when cancel is clicked', () => {
      const onClose = vi.fn();
      render(<BlockModal {...defaultProps} block={null} onClose={onClose} />);

      // Find the cancel button in the footer
      const buttons = screen.getAllByText('Annuler');
      fireEvent.click(buttons[buttons.length - 1]);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Description Character Limit', () => {
    it('shows remaining character count', () => {
      render(<BlockModal {...defaultProps} block={null} />);

      expect(screen.getByText(/500\/500/)).toBeInTheDocument();
    });

    it('updates character count as user types', () => {
      render(<BlockModal {...defaultProps} block={null} />);

      const descriptionInput = screen.getByLabelText(/Description/i);
      fireEvent.change(descriptionInput, { target: { value: 'Test' } });

      expect(screen.getByText(/496\/500/)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('disables form when loading', () => {
      render(<BlockModal {...defaultProps} block={null} isLoading={true} />);

      const startInput = screen.getByLabelText(/Heure de debut/i);
      expect(startInput).toBeDisabled();
    });

    it('shows loading text on save button', () => {
      render(<BlockModal {...defaultProps} block={null} isLoading={true} />);

      expect(screen.getByText('Enregistrement...')).toBeInTheDocument();
    });
  });
});
