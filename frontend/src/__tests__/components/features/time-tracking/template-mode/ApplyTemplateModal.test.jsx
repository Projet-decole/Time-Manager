// frontend/src/__tests__/components/features/time-tracking/template-mode/ApplyTemplateModal.test.jsx
// Story 4.10: Implement Template Mode UI - ApplyTemplateModal Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApplyTemplateModal } from '../../../../../components/features/time-tracking/template-mode/ApplyTemplateModal';

describe('ApplyTemplateModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    template: {
      id: 'template-1',
      name: 'Morning Development',
      description: 'Standard morning routine',
      entries: [
        { id: 'e1', startTime: '09:00', endTime: '12:00' },
        { id: 'e2', startTime: '13:00', endTime: '17:00' }
      ]
    },
    onApply: vi.fn(),
    isLoading: false,
    error: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders template preview', () => {
    render(<ApplyTemplateModal {...defaultProps} />);

    expect(screen.getByText('Morning Development')).toBeInTheDocument();
    expect(screen.getByText('Standard morning routine')).toBeInTheDocument();
    expect(screen.getByText('2 blocs')).toBeInTheDocument();
  });

  it('renders "Apply Today" button', () => {
    render(<ApplyTemplateModal {...defaultProps} />);

    expect(screen.getByText(/Appliquer aujourd'hui/i)).toBeInTheDocument();
  });

  it('calls onApply with today\'s date when Apply Today is clicked', () => {
    render(<ApplyTemplateModal {...defaultProps} />);

    const applyTodayButton = screen.getByText(/Appliquer aujourd'hui/i);
    fireEvent.click(applyTodayButton);

    expect(defaultProps.onApply).toHaveBeenCalled();
    const calledDate = defaultProps.onApply.mock.calls[0][0];
    expect(calledDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
  });

  it('renders date picker for custom date', () => {
    render(<ApplyTemplateModal {...defaultProps} />);

    expect(screen.getByText(/Ou choisir une autre date/i)).toBeInTheDocument();
    const dateInput = document.querySelector('input[type="date"]');
    expect(dateInput).toBeInTheDocument();
  });

  it('calls onApply with selected date when Apply button is clicked', () => {
    render(<ApplyTemplateModal {...defaultProps} />);

    const dateInput = document.querySelector('input[type="date"]');
    fireEvent.change(dateInput, { target: { value: '2026-01-20' } });

    const applyButtons = screen.getAllByText('Appliquer');
    // Click the one next to date input (not the "Appliquer aujourd'hui")
    const customDateApplyButton = applyButtons.find(btn =>
      !btn.textContent.includes('aujourd')
    );
    fireEvent.click(customDateApplyButton);

    expect(defaultProps.onApply).toHaveBeenCalledWith('2026-01-20');
  });

  it('disables Apply button for custom date when no date selected', () => {
    render(<ApplyTemplateModal {...defaultProps} />);

    const applyButtons = screen.getAllByRole('button', { name: 'Appliquer' });
    // Find the button that's NOT the "Appliquer aujourd'hui"
    const customDateApplyButton = applyButtons.find(btn =>
      btn.textContent === 'Appliquer'
    );

    expect(customDateApplyButton).toBeDisabled();
  });

  it('shows error message when error prop is set', () => {
    const props = {
      ...defaultProps,
      error: 'Cette date contient deja des entrees'
    };

    render(<ApplyTemplateModal {...props} />);

    expect(screen.getByText('Cette date contient deja des entrees')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    const props = {
      ...defaultProps,
      isLoading: true
    };

    render(<ApplyTemplateModal {...props} />);

    expect(screen.getByText(/Application en cours/i)).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(<ApplyTemplateModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /Annuler/i });
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('does not render when template is null', () => {
    const props = {
      ...defaultProps,
      template: null
    };

    const { container } = render(<ApplyTemplateModal {...props} />);

    expect(container.firstChild).toBeNull();
  });

  it('does not render when open is false', () => {
    const props = {
      ...defaultProps,
      open: false
    };

    render(<ApplyTemplateModal {...props} />);

    expect(screen.queryByText('Morning Development')).not.toBeInTheDocument();
  });
});
