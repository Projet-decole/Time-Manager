// frontend/src/__tests__/components/features/time-tracking/TimerDisplay.test.jsx
// Story 4.4: Simple Mode UI - TimerDisplay Component Tests

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimerDisplay } from '../../../../components/features/time-tracking/TimerDisplay';

describe('TimerDisplay', () => {
  describe('Time Formatting', () => {
    it('renders formatted time correctly', () => {
      render(<TimerDisplay time="01:23:45" />);

      expect(screen.getByText('01')).toBeInTheDocument();
      expect(screen.getByText('23')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('renders default 00:00:00 when no time provided', () => {
      render(<TimerDisplay />);

      expect(screen.getAllByText('00').length).toBe(3);
    });

    it('displays colons between time parts', () => {
      render(<TimerDisplay time="01:23:45" />);

      const colons = screen.getAllByText(':');
      expect(colons.length).toBe(2);
    });
  });

  describe('Running State Styling', () => {
    it('has different color when not running', () => {
      const { container } = render(<TimerDisplay time="00:00:00" isRunning={false} />);

      const display = container.firstChild;
      expect(display).toHaveClass('text-gray-400');
    });

    it('has different color when running', () => {
      const { container } = render(<TimerDisplay time="01:00:00" isRunning={true} />);

      const display = container.firstChild;
      expect(display).toHaveClass('text-gray-900');
    });

    it('has pulse animation when running', () => {
      const { container } = render(<TimerDisplay time="01:00:00" isRunning={true} />);

      const display = container.firstChild;
      expect(display).toHaveClass('animate-pulse-subtle');
    });

    it('has no pulse animation when not running', () => {
      const { container } = render(<TimerDisplay time="00:00:00" isRunning={false} />);

      const display = container.firstChild;
      expect(display).not.toHaveClass('animate-pulse-subtle');
    });
  });

  describe('Accessibility', () => {
    it('has role timer', () => {
      render(<TimerDisplay time="01:23:45" />);

      const timer = screen.getByRole('timer');
      expect(timer).toBeInTheDocument();
    });

    it('has aria-live polite', () => {
      render(<TimerDisplay time="01:23:45" />);

      const timer = screen.getByRole('timer');
      expect(timer).toHaveAttribute('aria-live', 'polite');
    });

    it('has descriptive aria-label', () => {
      render(<TimerDisplay time="01:23:45" />);

      const timer = screen.getByRole('timer');
      expect(timer).toHaveAttribute(
        'aria-label',
        'Temps ecoule: 01 heures, 23 minutes, 45 secondes'
      );
    });
  });

  describe('Font Size', () => {
    it('has large font size classes', () => {
      const { container } = render(<TimerDisplay time="01:23:45" />);

      const display = container.firstChild;
      expect(display).toHaveClass('text-5xl');
    });

    it('has monospace font for consistent digit width', () => {
      const { container } = render(<TimerDisplay time="01:23:45" />);

      const display = container.firstChild;
      expect(display).toHaveClass('font-mono');
    });

    it('has tabular-nums for consistent number spacing', () => {
      const { container } = render(<TimerDisplay time="01:23:45" />);

      const display = container.firstChild;
      expect(display).toHaveClass('tabular-nums');
    });
  });

  describe('Custom Class Names', () => {
    it('accepts additional className prop', () => {
      const { container } = render(
        <TimerDisplay time="01:23:45" className="custom-class" />
      );

      const display = container.firstChild;
      expect(display).toHaveClass('custom-class');
    });
  });
});
