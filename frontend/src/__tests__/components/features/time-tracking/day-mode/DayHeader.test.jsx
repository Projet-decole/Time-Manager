// frontend/src/__tests__/components/features/time-tracking/day-mode/DayHeader.test.jsx
// Story 4.7: Day Mode UI with Timeline - DayHeader Component Tests

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DayHeader } from '../../../../../components/features/time-tracking/day-mode/DayHeader';

describe('DayHeader', () => {
  const mockDay = {
    id: 'day-1',
    startTime: '2026-01-12T08:00:00Z',
    endTime: null
  };

  const mockStats = {
    totalMinutes: 300,
    allocatedMinutes: 240,
    unallocatedMinutes: 60,
    allocationPercentage: 80
  };

  describe('Rendering', () => {
    it('returns null when no day is provided', () => {
      const { container } = render(<DayHeader day={null} stats={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders the date header', () => {
      render(<DayHeader day={mockDay} stats={mockStats} />);

      // Should contain "Journee du" text
      expect(screen.getByText(/Journee du/i)).toBeInTheDocument();
    });

    it('displays start time', () => {
      render(<DayHeader day={mockDay} stats={mockStats} />);

      expect(screen.getByText('Debut')).toBeInTheDocument();
    });

    it('displays total duration', () => {
      render(<DayHeader day={mockDay} stats={mockStats} />);

      expect(screen.getByText('Duree')).toBeInTheDocument();
      expect(screen.getByText('5h 00m')).toBeInTheDocument(); // 300 minutes
    });

    it('displays allocated time', () => {
      render(<DayHeader day={mockDay} stats={mockStats} />);

      expect(screen.getByText('Alloue')).toBeInTheDocument();
      expect(screen.getByText('4h 00m')).toBeInTheDocument(); // 240 minutes
    });

    it('displays allocation percentage', () => {
      render(<DayHeader day={mockDay} stats={mockStats} />);

      expect(screen.getByText('Repartition')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('renders progress bar with correct width', () => {
      render(<DayHeader day={mockDay} stats={mockStats} />);

      const progressBar = document.querySelector('.bg-green-500');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: '80%' });
    });

    it('handles 0% allocation', () => {
      const zeroStats = { ...mockStats, allocationPercentage: 0 };
      render(<DayHeader day={mockDay} stats={zeroStats} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles 100% allocation', () => {
      const fullStats = { ...mockStats, allocationPercentage: 100 };
      render(<DayHeader day={mockDay} stats={fullStats} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Missing Stats', () => {
    it('shows placeholder when stats are null', () => {
      render(<DayHeader day={mockDay} stats={null} />);

      // Should show --:-- placeholders
      const placeholders = screen.getAllByText('--:--');
      expect(placeholders.length).toBeGreaterThan(0);
    });
  });

  describe('Styling', () => {
    it('has white background and rounded corners', () => {
      render(<DayHeader day={mockDay} stats={mockStats} />);

      const header = document.querySelector('.bg-white');
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('rounded-xl');
    });

    it('accepts additional className', () => {
      render(<DayHeader day={mockDay} stats={mockStats} className="custom-class" />);

      const header = document.querySelector('.custom-class');
      expect(header).toBeInTheDocument();
    });
  });
});
