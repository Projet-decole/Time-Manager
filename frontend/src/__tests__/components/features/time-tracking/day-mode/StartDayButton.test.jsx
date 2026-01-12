// frontend/src/__tests__/components/features/time-tracking/day-mode/StartDayButton.test.jsx
// Story 4.7: Day Mode UI with Timeline - StartDayButton Component Tests

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StartDayButton } from '../../../../../components/features/time-tracking/day-mode/StartDayButton';

describe('StartDayButton', () => {
  describe('Default State', () => {
    it('renders with DEMARRER LA JOURNEE text', () => {
      render(<StartDayButton onClick={() => {}} />);

      expect(screen.getByText('DEMARRER LA JOURNEE')).toBeInTheDocument();
    });

    it('has green styling when idle', () => {
      render(<StartDayButton onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-green-500');
    });

    it('has correct aria-label', () => {
      render(<StartDayButton onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Demarrer la journee');
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(<StartDayButton isLoading={true} onClick={() => {}} />);

      // Check for spinner (svg with animate-spin class)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('is disabled when loading', () => {
      render(<StartDayButton isLoading={true} onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('has gray styling when loading', () => {
      render(<StartDayButton isLoading={true} onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-400');
    });

    it('does not show button text when loading', () => {
      render(<StartDayButton isLoading={true} onClick={() => {}} />);

      expect(screen.queryByText('DEMARRER LA JOURNEE')).not.toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<StartDayButton onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when loading', () => {
      const handleClick = vi.fn();
      render(<StartDayButton isLoading={true} onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Size and Touch Target', () => {
    it('has minimum height of 80px for XXL button', () => {
      render(<StartDayButton onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-h-[80px]');
    });

    it('has h-20 for 80px height', () => {
      render(<StartDayButton onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-20');
    });

    it('has touch-manipulation class for mobile optimization', () => {
      render(<StartDayButton onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('touch-manipulation');
    });
  });

  describe('Custom Class Names', () => {
    it('accepts additional className prop', () => {
      render(<StartDayButton onClick={() => {}} className="custom-class" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });
});
