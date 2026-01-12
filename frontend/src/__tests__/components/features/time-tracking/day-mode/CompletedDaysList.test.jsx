// frontend/src/__tests__/components/features/time-tracking/day-mode/CompletedDaysList.test.jsx
// Story 4.7: Day Mode UI with Timeline - CompletedDaysList Component Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompletedDaysList } from '../../../../../components/features/time-tracking/day-mode/CompletedDaysList';

describe('CompletedDaysList', () => {
  const mockDays = [
    {
      id: 'day-1',
      startTime: '2026-01-11T08:00:00Z',
      endTime: '2026-01-11T17:30:00Z',
      durationMinutes: 570,
      blocks: [
        {
          id: 'block-1',
          project: { id: 'proj-1', code: 'PRJ-001', name: 'Project Alpha' }
        },
        {
          id: 'block-2',
          project: { id: 'proj-2', code: 'PRJ-002', name: 'Project Beta' }
        }
      ]
    },
    {
      id: 'day-2',
      startTime: '2026-01-10T09:00:00Z',
      endTime: '2026-01-10T18:00:00Z',
      durationMinutes: 540,
      blocks: [
        {
          id: 'block-3',
          project: { id: 'proj-1', code: 'PRJ-001', name: 'Project Alpha' }
        }
      ]
    }
  ];

  const defaultProps = {
    days: mockDays,
    onDayClick: vi.fn(),
    loading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders section title', () => {
      render(<CompletedDaysList {...defaultProps} />);

      expect(screen.getByText('Journees recentes')).toBeInTheDocument();
    });

    it('renders all days in the list', () => {
      render(<CompletedDaysList {...defaultProps} />);

      // Should have 2 day cards
      const dayCards = document.querySelectorAll('.cursor-pointer');
      expect(dayCards.length).toBe(2);
    });

    it('applies custom className', () => {
      const { container } = render(
        <CompletedDaysList {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Loading State', () => {
    it('shows skeleton loaders when loading', () => {
      render(<CompletedDaysList {...defaultProps} loading={true} />);

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(3);
    });

    it('does not show days when loading', () => {
      render(<CompletedDaysList {...defaultProps} loading={true} />);

      expect(screen.queryByText('Journees recentes')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no days', () => {
      render(<CompletedDaysList {...defaultProps} days={[]} />);

      expect(screen.getByText('Aucune journee recente')).toBeInTheDocument();
    });

    it('shows calendar icon in empty state', () => {
      render(<CompletedDaysList {...defaultProps} days={[]} />);

      const icon = document.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Day Card Content', () => {
    it('displays formatted date for each day', () => {
      render(<CompletedDaysList {...defaultProps} />);

      // Date format: weekday, day month year (French locale)
      // The exact format depends on locale
      expect(screen.getByText(/11/)).toBeInTheDocument();
      expect(screen.getByText(/10/)).toBeInTheDocument();
    });

    it('displays duration for each day', () => {
      render(<CompletedDaysList {...defaultProps} />);

      // 570 min = 9h 30m
      expect(screen.getByText('9h 30m')).toBeInTheDocument();
      // 540 min = 9h 00m
      expect(screen.getByText('9h 00m')).toBeInTheDocument();
    });

    it('displays block count for each day', () => {
      render(<CompletedDaysList {...defaultProps} />);

      expect(screen.getByText('2 blocs')).toBeInTheDocument();
      expect(screen.getByText('1 bloc')).toBeInTheDocument();
    });

    it('displays project names from blocks', () => {
      render(<CompletedDaysList {...defaultProps} />);

      // First day has PRJ-001 and PRJ-002
      expect(screen.getByText('PRJ-001, PRJ-002')).toBeInTheDocument();
      // Second day has only PRJ-001 (shown as single text)
      expect(screen.getByText('PRJ-001')).toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('calls onDayClick when a day card is clicked', () => {
      render(<CompletedDaysList {...defaultProps} />);

      const dayCards = document.querySelectorAll('.cursor-pointer');
      fireEvent.click(dayCards[0]);

      expect(defaultProps.onDayClick).toHaveBeenCalledWith(mockDays[0]);
    });

    it('calls onDayClick with correct day on second card click', () => {
      render(<CompletedDaysList {...defaultProps} />);

      const dayCards = document.querySelectorAll('.cursor-pointer');
      fireEvent.click(dayCards[1]);

      expect(defaultProps.onDayClick).toHaveBeenCalledWith(mockDays[1]);
    });

    it('does not throw error when onDayClick is not provided', () => {
      render(<CompletedDaysList days={mockDays} loading={false} />);

      const dayCards = document.querySelectorAll('.cursor-pointer');
      expect(() => fireEvent.click(dayCards[0])).not.toThrow();
    });
  });

  describe('Keyboard Accessibility', () => {
    it('day cards have tabIndex when onDayClick is provided', () => {
      render(<CompletedDaysList {...defaultProps} />);

      const dayCards = document.querySelectorAll('[tabindex="0"]');
      expect(dayCards.length).toBe(2);
    });

    it('day cards have button role when onDayClick is provided', () => {
      render(<CompletedDaysList {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(2);
    });

    it('calls onDayClick on Enter key press', () => {
      render(<CompletedDaysList {...defaultProps} />);

      const dayCards = document.querySelectorAll('[role="button"]');
      fireEvent.keyDown(dayCards[0], { key: 'Enter' });

      expect(defaultProps.onDayClick).toHaveBeenCalledWith(mockDays[0]);
    });

    it('does not call onDayClick on other key press', () => {
      render(<CompletedDaysList {...defaultProps} />);

      const dayCards = document.querySelectorAll('[role="button"]');
      fireEvent.keyDown(dayCards[0], { key: 'Space' });

      expect(defaultProps.onDayClick).not.toHaveBeenCalled();
    });
  });

  describe('Project Names Display', () => {
    it('shows "Aucun bloc" when day has no blocks', () => {
      const daysNoBlocks = [
        {
          id: 'day-1',
          startTime: '2026-01-11T08:00:00Z',
          durationMinutes: 480,
          blocks: []
        }
      ];

      render(<CompletedDaysList days={daysNoBlocks} loading={false} />);

      expect(screen.getByText('Aucun bloc')).toBeInTheDocument();
    });

    it('shows block count when blocks have no projects', () => {
      const daysNoProjects = [
        {
          id: 'day-1',
          startTime: '2026-01-11T08:00:00Z',
          durationMinutes: 480,
          blocks: [
            { id: 'block-1', project: null },
            { id: 'block-2', project: null }
          ]
        }
      ];

      render(<CompletedDaysList days={daysNoProjects} loading={false} />);

      expect(screen.getByText('2 bloc(s)')).toBeInTheDocument();
    });

    it('truncates long project list with +N indicator', () => {
      const daysWithManyProjects = [
        {
          id: 'day-1',
          startTime: '2026-01-11T08:00:00Z',
          durationMinutes: 480,
          blocks: [
            { id: 'b1', project: { code: 'PRJ-001' } },
            { id: 'b2', project: { code: 'PRJ-002' } },
            { id: 'b3', project: { code: 'PRJ-003' } },
            { id: 'b4', project: { code: 'PRJ-004' } }
          ]
        }
      ];

      render(<CompletedDaysList days={daysWithManyProjects} loading={false} />);

      // Should show first 2 projects and +2 indicator
      expect(screen.getByText(/\+2/)).toBeInTheDocument();
    });

    it('uses project name when code is not available', () => {
      const daysWithNameOnly = [
        {
          id: 'day-1',
          startTime: '2026-01-11T08:00:00Z',
          durationMinutes: 480,
          blocks: [
            { id: 'block-1', project: { name: 'Project Without Code' } }
          ]
        }
      ];

      render(<CompletedDaysList days={daysWithNameOnly} loading={false} />);

      expect(screen.getByText('Project Without Code')).toBeInTheDocument();
    });
  });

  describe('Duration Formatting', () => {
    it('handles null duration gracefully', () => {
      const daysNullDuration = [
        {
          id: 'day-1',
          startTime: '2026-01-11T08:00:00Z',
          durationMinutes: null,
          blocks: []
        }
      ];

      render(<CompletedDaysList days={daysNullDuration} loading={false} />);

      expect(screen.getByText('--:--')).toBeInTheDocument();
    });

    it('handles zero duration', () => {
      const daysZeroDuration = [
        {
          id: 'day-1',
          startTime: '2026-01-11T08:00:00Z',
          durationMinutes: 0,
          blocks: []
        }
      ];

      render(<CompletedDaysList days={daysZeroDuration} loading={false} />);

      expect(screen.getByText('0h 00m')).toBeInTheDocument();
    });

    it('pads minutes correctly', () => {
      const daysShortMinutes = [
        {
          id: 'day-1',
          startTime: '2026-01-11T08:00:00Z',
          durationMinutes: 65, // 1h 05m
          blocks: []
        }
      ];

      render(<CompletedDaysList days={daysShortMinutes} loading={false} />);

      expect(screen.getByText('1h 05m')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('handles missing startTime gracefully', () => {
      const daysNoStart = [
        {
          id: 'day-1',
          startTime: null,
          durationMinutes: 480,
          blocks: []
        }
      ];

      render(<CompletedDaysList days={daysNoStart} loading={false} />);

      // Should still render without crashing
      expect(screen.getByText('Journees recentes')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to container element', () => {
      const ref = vi.fn();
      render(<CompletedDaysList {...defaultProps} ref={ref} />);

      expect(ref).toHaveBeenCalled();
    });
  });

  describe('Touch Accessibility', () => {
    it('has touch-manipulation class when clickable', () => {
      render(<CompletedDaysList {...defaultProps} />);

      const dayCards = document.querySelectorAll('.touch-manipulation');
      expect(dayCards.length).toBe(2);
    });
  });
});
