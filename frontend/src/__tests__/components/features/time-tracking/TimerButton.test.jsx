// frontend/src/__tests__/components/features/time-tracking/TimerButton.test.jsx
// Story 4.4: Simple Mode UI - TimerButton Component Tests

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimerButton } from '../../../../components/features/time-tracking/TimerButton';

describe('TimerButton', () => {
  describe('Idle State (Not Running)', () => {
    it('renders with DEMARRER text when not running', () => {
      render(<TimerButton isRunning={false} onClick={() => {}} />);

      expect(screen.getByText('DEMARRER')).toBeInTheDocument();
    });

    it('has green styling when idle', () => {
      render(<TimerButton isRunning={false} onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-green-500');
    });

    it('has correct aria-label for start action', () => {
      render(<TimerButton isRunning={false} onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Demarrer le timer');
    });
  });

  describe('Running State', () => {
    it('renders with TERMINER text when running', () => {
      render(<TimerButton isRunning={true} onClick={() => {}} />);

      expect(screen.getByText('TERMINER')).toBeInTheDocument();
    });

    it('has red styling when running', () => {
      render(<TimerButton isRunning={true} onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-500');
    });

    it('has correct aria-label for stop action', () => {
      render(<TimerButton isRunning={true} onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Arreter le timer');
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(<TimerButton isRunning={false} isLoading={true} onClick={() => {}} />);

      // Check for spinner (svg with animate-spin class)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('is disabled when loading', () => {
      render(<TimerButton isRunning={false} isLoading={true} onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('has gray styling when loading', () => {
      render(<TimerButton isRunning={false} isLoading={true} onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-gray-400');
    });

    it('does not show DEMARRER or TERMINER text when loading', () => {
      render(<TimerButton isRunning={false} isLoading={true} onClick={() => {}} />);

      expect(screen.queryByText('DEMARRER')).not.toBeInTheDocument();
      expect(screen.queryByText('TERMINER')).not.toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('calls onClick when clicked in idle state', () => {
      const handleClick = vi.fn();
      render(<TimerButton isRunning={false} onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls onClick when clicked in running state', () => {
      const handleClick = vi.fn();
      render(<TimerButton isRunning={true} onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when loading', () => {
      const handleClick = vi.fn();
      render(<TimerButton isRunning={false} isLoading={true} onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Size and Touch Target', () => {
    it('has minimum height of 80px for XXL button', () => {
      render(<TimerButton isRunning={false} onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('min-h-[80px]');
    });

    it('has h-20 for 80px height', () => {
      render(<TimerButton isRunning={false} onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-20');
    });
  });

  describe('Custom Class Names', () => {
    it('accepts additional className prop', () => {
      render(<TimerButton isRunning={false} onClick={() => {}} className="custom-class" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });
});
