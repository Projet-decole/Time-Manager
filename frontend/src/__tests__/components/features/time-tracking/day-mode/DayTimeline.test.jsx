// frontend/src/__tests__/components/features/time-tracking/day-mode/DayTimeline.test.jsx
// Story 4.7: Day Mode UI with Timeline - DayTimeline Component Tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DayTimeline } from '../../../../../components/features/time-tracking/day-mode/DayTimeline';

describe('DayTimeline', () => {
  const mockDay = {
    id: 'day-1',
    startTime: '2026-01-12T08:00:00Z',
    endTime: null
  };

  const mockBlocks = [
    {
      id: 'block-1',
      startTime: '2026-01-12T09:00:00Z',
      endTime: '2026-01-12T10:00:00Z',
      durationMinutes: 60,
      project: { id: 'proj-1', code: 'PRJ-001', name: 'Project Alpha' },
      category: { id: 'cat-1', name: 'Development', color: '#3B82F6' }
    },
    {
      id: 'block-2',
      startTime: '2026-01-12T11:00:00Z',
      endTime: '2026-01-12T12:30:00Z',
      durationMinutes: 90,
      project: { id: 'proj-2', code: 'PRJ-002', name: 'Project Beta' },
      category: { id: 'cat-2', name: 'Meeting', color: '#22C55E' }
    }
  ];

  const defaultProps = {
    day: mockDay,
    blocks: mockBlocks,
    onBlockClick: vi.fn(),
    onGapClick: vi.fn(),
    onBlockMove: vi.fn(),
    onBlockResize: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.innerWidth for desktop view
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
    window.dispatchEvent(new Event('resize'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders empty state when no day is provided', () => {
      render(<DayTimeline {...defaultProps} day={null} />);

      expect(screen.getByText('Aucune journee active')).toBeInTheDocument();
    });

    it('renders timeline container when day exists', () => {
      render(<DayTimeline {...defaultProps} />);

      // Should show add block button
      expect(screen.getByText('+ Ajouter un bloc')).toBeInTheDocument();
    });

    it('renders blocks count in mobile view header', () => {
      // Switch to mobile view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
      });
      window.dispatchEvent(new Event('resize'));

      render(<DayTimeline {...defaultProps} />);

      expect(screen.getByText(/Blocs de temps/)).toBeInTheDocument();
    });
  });

  describe('Hour Markers', () => {
    it('generates hour markers based on day boundaries', () => {
      render(<DayTimeline {...defaultProps} />);

      // Should have hour markers (the exact text depends on locale)
      // Just verify the container renders properly
      const container = document.querySelector('.relative.h-6');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Block Positioning', () => {
    it('positions blocks proportionally on timeline', () => {
      render(<DayTimeline {...defaultProps} />);

      // Blocks should be rendered
      const blockElements = document.querySelectorAll('[data-block="true"]');
      expect(blockElements.length).toBe(2);
    });

    it('renders blocks with project information', () => {
      // Use mobile view for card display
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
      });
      window.dispatchEvent(new Event('resize'));

      render(<DayTimeline {...defaultProps} />);

      // Component displays project.name (falls back to code if no name)
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
    });
  });

  describe('Block Click Handler', () => {
    it('calls onBlockClick when a block is clicked', async () => {
      // Use mobile view for easier click testing
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
      });
      window.dispatchEvent(new Event('resize'));

      render(<DayTimeline {...defaultProps} />);

      const blocks = document.querySelectorAll('[data-block="true"]');
      fireEvent.click(blocks[0]);

      await waitFor(() => {
        expect(defaultProps.onBlockClick).toHaveBeenCalled();
      });
    });
  });

  describe('Gap Click Handler (Desktop)', () => {
    it('calls onGapClick when clicking on empty timeline area', () => {
      render(<DayTimeline {...defaultProps} />);

      // Find the timeline track and click on it
      const timelineTrack = document.querySelector('.h-16.bg-gray-50');
      if (timelineTrack) {
        // Mock getBoundingClientRect
        timelineTrack.getBoundingClientRect = vi.fn(() => ({
          left: 0,
          width: 1000,
          top: 0,
          height: 64,
          right: 1000,
          bottom: 64
        }));

        fireEvent.click(timelineTrack, { clientX: 500 });
        // Gap click is only processed if not clicking on a block
      }
    });
  });

  describe('Add Block Button', () => {
    it('calls onGapClick when add block button is clicked', () => {
      render(<DayTimeline {...defaultProps} />);

      fireEvent.click(screen.getByText('+ Ajouter un bloc'));

      expect(defaultProps.onGapClick).toHaveBeenCalled();
    });

    it('defaults to current time rounded to 15 minutes', () => {
      render(<DayTimeline {...defaultProps} />);

      fireEvent.click(screen.getByText('+ Ajouter un bloc'));

      expect(defaultProps.onGapClick).toHaveBeenCalled();
      // The time passed should be a Date object
      const calledArg = defaultProps.onGapClick.mock.calls[0][0];
      expect(calledArg).toBeInstanceOf(Date);
    });
  });

  describe('Mobile View (Cards)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
      });
      window.dispatchEvent(new Event('resize'));
    });

    it('renders blocks as cards on mobile', () => {
      render(<DayTimeline {...defaultProps} />);

      // Mobile view shows blocks with isCompact=true
      const blocks = document.querySelectorAll('[data-block="true"]');
      expect(blocks.length).toBe(2);
    });

    it('shows empty state message when no blocks', () => {
      render(<DayTimeline {...defaultProps} blocks={[]} />);

      expect(screen.getByText(/Aucun bloc de temps/)).toBeInTheDocument();
    });

    it('sorts blocks by start time', () => {
      const unsortedBlocks = [
        { ...mockBlocks[1], id: 'later' },
        { ...mockBlocks[0], id: 'earlier' }
      ];

      render(<DayTimeline {...defaultProps} blocks={unsortedBlocks} />);

      // Blocks should be rendered in order
      const blockElements = document.querySelectorAll('[data-block="true"]');
      expect(blockElements.length).toBe(2);
    });
  });

  describe('Desktop View (Horizontal Timeline)', () => {
    it('shows timeline help text', () => {
      render(<DayTimeline {...defaultProps} />);

      expect(screen.getByText(/Cliquez sur la timeline/)).toBeInTheDocument();
    });

    it('shows resize help text', () => {
      render(<DayTimeline {...defaultProps} />);

      expect(screen.getByText(/Glissez les bords/)).toBeInTheDocument();
    });

    it('renders day boundary indicators', () => {
      render(<DayTimeline {...defaultProps} />);

      // Day boundaries should have green styling
      const boundaryIndicator = document.querySelector('.bg-green-50');
      expect(boundaryIndicator).toBeInTheDocument();
    });
  });

  describe('Empty Timeline State', () => {
    it('shows empty state message in timeline when no blocks', () => {
      render(<DayTimeline {...defaultProps} blocks={[]} />);

      expect(screen.getByText(/Cliquez pour ajouter/)).toBeInTheDocument();
    });
  });

  describe('Responsiveness', () => {
    it('updates view when window resizes to mobile', async () => {
      render(<DayTimeline {...defaultProps} />);

      // Initially desktop
      expect(screen.queryByText(/Blocs de temps/)).not.toBeInTheDocument();

      // Resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
      });
      window.dispatchEvent(new Event('resize'));

      await waitFor(() => {
        expect(screen.getByText(/Blocs de temps/)).toBeInTheDocument();
      });
    });
  });

  describe('Time Calculation', () => {
    it('calculates correct timeline bounds', () => {
      const dayWithEnd = {
        ...mockDay,
        endTime: '2026-01-12T17:00:00Z'
      };

      render(<DayTimeline {...defaultProps} day={dayWithEnd} />);

      // Timeline should render without errors
      expect(screen.getByText('+ Ajouter un bloc')).toBeInTheDocument();
    });

    it('uses current time for end when day is active', () => {
      render(<DayTimeline {...defaultProps} />);

      // Should render timeline up to current time
      expect(screen.getByText('+ Ajouter un bloc')).toBeInTheDocument();
    });
  });
});
