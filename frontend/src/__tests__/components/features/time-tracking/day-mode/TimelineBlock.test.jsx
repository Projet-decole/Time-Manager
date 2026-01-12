// frontend/src/__tests__/components/features/time-tracking/day-mode/TimelineBlock.test.jsx
// Story 4.7: Day Mode UI with Timeline - TimelineBlock Component Tests

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimelineBlock } from '../../../../../components/features/time-tracking/day-mode/TimelineBlock';

describe('TimelineBlock', () => {
  // Use local time to avoid timezone issues in tests
  const now = new Date();
  const startTime = new Date(now);
  startTime.setHours(9, 0, 0, 0);
  const endTime = new Date(now);
  endTime.setHours(10, 30, 0, 0);

  const mockBlock = {
    id: 'block-1',
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    durationMinutes: 90,
    projectId: 'proj-1',
    categoryId: 'cat-1',
    description: 'Working on feature',
    project: {
      id: 'proj-1',
      code: 'PRJ-001',
      name: 'Time Manager'
    },
    category: {
      id: 'cat-1',
      name: 'Development',
      color: '#3B82F6'
    }
  };

  describe('Compact Mode (Mobile Cards)', () => {
    it('renders as a card with time range', () => {
      render(<TimelineBlock block={mockBlock} isCompact={true} />);

      // Time range should be visible (using local formatted times)
      expect(screen.getByText(/09:00/)).toBeInTheDocument();
      expect(screen.getByText(/10:30/)).toBeInTheDocument();
    });

    it('displays duration', () => {
      render(<TimelineBlock block={mockBlock} isCompact={true} />);

      // Duration (1h30m)
      expect(screen.getByText(/1h30m/)).toBeInTheDocument();
    });

    it('displays project name', () => {
      render(<TimelineBlock block={mockBlock} isCompact={true} />);

      expect(screen.getByText('Time Manager')).toBeInTheDocument();
    });

    it('displays category badge', () => {
      render(<TimelineBlock block={mockBlock} isCompact={true} />);

      expect(screen.getByText('Development')).toBeInTheDocument();
    });

    it('handles click for edit', () => {
      const handleClick = vi.fn();
      render(<TimelineBlock block={mockBlock} isCompact={true} onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledWith(mockBlock);
    });

    it('displays description when present', () => {
      render(<TimelineBlock block={mockBlock} isCompact={true} />);

      expect(screen.getByText('Working on feature')).toBeInTheDocument();
    });

    it('handles block without project', () => {
      const blockNoProject = { ...mockBlock, project: null };
      render(<TimelineBlock block={blockNoProject} isCompact={true} />);

      expect(screen.getByText('Sans projet')).toBeInTheDocument();
    });

    it('handles block without category', () => {
      const blockNoCategory = { ...mockBlock, category: null };
      render(<TimelineBlock block={blockNoCategory} isCompact={true} />);

      // Should not render category badge
      expect(screen.queryByText('Development')).not.toBeInTheDocument();
    });
  });

  describe('Desktop Timeline Mode', () => {
    it('renders as positioned block on timeline', () => {
      render(
        <TimelineBlock
          block={mockBlock}
          position={25}
          width={15}
          isCompact={false}
        />
      );

      const blockElement = document.querySelector('[style*="left: 25%"]');
      expect(blockElement).toBeInTheDocument();
    });

    it('has correct width based on duration', () => {
      render(
        <TimelineBlock
          block={mockBlock}
          position={25}
          width={15}
          isCompact={false}
        />
      );

      const blockElement = document.querySelector('[style*="width: 15%"]');
      expect(blockElement).toBeInTheDocument();
    });

    it('uses category color for border', () => {
      render(
        <TimelineBlock
          block={mockBlock}
          position={25}
          width={15}
          isCompact={false}
        />
      );

      const blockElement = document.querySelector('[style*="border-color"]');
      expect(blockElement).toHaveStyle({ borderColor: '#3B82F6' });
    });

    it('displays project name in desktop mode', () => {
      render(
        <TimelineBlock
          block={mockBlock}
          position={25}
          width={15}
          isCompact={false}
        />
      );

      expect(screen.getByText('Time Manager')).toBeInTheDocument();
    });

    it('handles click for edit in desktop mode', () => {
      const handleClick = vi.fn();
      render(
        <TimelineBlock
          block={mockBlock}
          position={25}
          width={15}
          isCompact={false}
          onClick={handleClick}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledWith(mockBlock);
    });
  });

  describe('Resize Handles (Desktop)', () => {
    it('shows resize handles on hover when resizable', () => {
      render(
        <TimelineBlock
          block={mockBlock}
          position={25}
          width={15}
          isCompact={false}
          isResizable={true}
        />
      );

      // Resize handles should be present (visible on hover via CSS)
      const resizeHandles = document.querySelectorAll('.cursor-ew-resize');
      expect(resizeHandles.length).toBe(2); // Left and right handles
    });

    it('does not show resize handles when not resizable', () => {
      render(
        <TimelineBlock
          block={mockBlock}
          position={25}
          width={15}
          isCompact={false}
          isResizable={false}
        />
      );

      const resizeHandles = document.querySelectorAll('.cursor-ew-resize');
      expect(resizeHandles.length).toBe(0);
    });
  });

  describe('Keyboard Navigation', () => {
    it('is keyboard accessible with tabIndex', () => {
      render(<TimelineBlock block={mockBlock} isCompact={true} onClick={() => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    it('handles Enter key for activation', () => {
      const handleClick = vi.fn();
      render(<TimelineBlock block={mockBlock} isCompact={true} onClick={handleClick} />);

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Duration Formatting', () => {
    it('formats short durations correctly', () => {
      const shortBlock = { ...mockBlock, durationMinutes: 30 };
      render(<TimelineBlock block={shortBlock} isCompact={true} />);

      expect(screen.getByText(/30m/)).toBeInTheDocument();
    });

    it('formats hour-only durations correctly', () => {
      const hourBlock = { ...mockBlock, durationMinutes: 60 };
      render(<TimelineBlock block={hourBlock} isCompact={true} />);

      expect(screen.getByText(/1h(?!\d)/)).toBeInTheDocument();
    });

    it('formats combined hours and minutes correctly', () => {
      const combinedBlock = { ...mockBlock, durationMinutes: 150 };
      render(<TimelineBlock block={combinedBlock} isCompact={true} />);

      expect(screen.getByText(/2h30m/)).toBeInTheDocument();
    });
  });
});
