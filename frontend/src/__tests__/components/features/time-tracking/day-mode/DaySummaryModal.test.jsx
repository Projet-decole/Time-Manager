// frontend/src/__tests__/components/features/time-tracking/day-mode/DaySummaryModal.test.jsx
// Story 4.7: Day Mode UI with Timeline - DaySummaryModal Component Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DaySummaryModal } from '../../../../../components/features/time-tracking/day-mode/DaySummaryModal';

describe('DaySummaryModal', () => {
  const mockSummary = {
    id: 'day-1',
    startTime: '2026-01-12T08:00:00Z',
    endTime: '2026-01-12T17:30:00Z',
    durationMinutes: 570,
    blocks: [
      {
        id: 'block-1',
        startTime: '2026-01-12T08:00:00Z',
        endTime: '2026-01-12T12:00:00Z',
        durationMinutes: 240,
        projectId: 'proj-1',
        categoryId: 'cat-1',
        project: { id: 'proj-1', name: 'Project Alpha', color: '#3B82F6' },
        category: { id: 'cat-1', name: 'Development', color: '#3B82F6' }
      },
      {
        id: 'block-2',
        startTime: '2026-01-12T13:00:00Z',
        endTime: '2026-01-12T17:00:00Z',
        durationMinutes: 240,
        projectId: 'proj-2',
        categoryId: 'cat-2',
        project: { id: 'proj-2', name: 'Project Beta', color: '#22C55E' },
        category: { id: 'cat-2', name: 'Meeting', color: '#22C55E' }
      }
    ],
    meta: {
      dayId: 'day-1',
      totalBlocksMinutes: 480,
      unallocatedMinutes: 90
    }
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    summary: mockSummary,
    onSaveAsTemplate: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('returns null when summary is null', () => {
      const { container } = render(
        <DaySummaryModal {...defaultProps} summary={null} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders modal with title when open', () => {
      render(<DaySummaryModal {...defaultProps} />);

      expect(screen.getByText('Journee terminee')).toBeInTheDocument();
    });

    it('displays success checkmark icon', () => {
      render(<DaySummaryModal {...defaultProps} />);

      // Should have a green checkmark icon
      const checkIcon = document.querySelector('.text-green-600');
      expect(checkIcon).toBeInTheDocument();
    });
  });

  describe('Time Range Display', () => {
    it('displays start and end times', () => {
      render(<DaySummaryModal {...defaultProps} />);

      // Time format depends on locale, just check for presence
      const timeText = screen.getByText(/-/);
      expect(timeText).toBeInTheDocument();
    });
  });

  describe('Statistics Display', () => {
    it('displays total duration', () => {
      render(<DaySummaryModal {...defaultProps} />);

      expect(screen.getByText('Duree totale')).toBeInTheDocument();
      // 570 minutes = 9h 30m
      expect(screen.getByText('9h 30m')).toBeInTheDocument();
    });

    it('displays allocated time', () => {
      render(<DaySummaryModal {...defaultProps} />);

      expect(screen.getByText('Temps alloue')).toBeInTheDocument();
      // 480 minutes = 8h 00m
      expect(screen.getByText('8h 00m')).toBeInTheDocument();
    });

    it('displays unallocated time', () => {
      render(<DaySummaryModal {...defaultProps} />);

      expect(screen.getByText('Non alloue')).toBeInTheDocument();
      // 90 minutes = 1h 30m
      expect(screen.getByText('1h 30m')).toBeInTheDocument();
    });

    it('displays allocation percentage', () => {
      render(<DaySummaryModal {...defaultProps} />);

      expect(screen.getByText('Repartition du temps')).toBeInTheDocument();
      // 480/570 = ~84%
      expect(screen.getByText('84%')).toBeInTheDocument();
    });

    it('renders progress bar with correct width', () => {
      render(<DaySummaryModal {...defaultProps} />);

      const progressBar = document.querySelector('.bg-green-500.rounded-full');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar.style.width).toBe('84%');
    });
  });

  describe('Project Breakdown', () => {
    it('displays project breakdown section', () => {
      render(<DaySummaryModal {...defaultProps} />);

      expect(screen.getByText('Par projet')).toBeInTheDocument();
    });

    it('lists projects with their durations', () => {
      render(<DaySummaryModal {...defaultProps} />);

      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
    });

    it('shows "Aucun projet" when no projects', () => {
      const summaryNoProjects = {
        ...mockSummary,
        blocks: []
      };

      render(<DaySummaryModal {...defaultProps} summary={summaryNoProjects} />);

      expect(screen.getByText('Aucun projet')).toBeInTheDocument();
    });
  });

  describe('Category Breakdown', () => {
    it('displays category breakdown section', () => {
      render(<DaySummaryModal {...defaultProps} />);

      expect(screen.getByText('Par categorie')).toBeInTheDocument();
    });

    it('lists categories with color indicators', () => {
      render(<DaySummaryModal {...defaultProps} />);

      expect(screen.getByText('Development')).toBeInTheDocument();
      expect(screen.getByText('Meeting')).toBeInTheDocument();

      // Color indicators
      const colorDots = document.querySelectorAll('.w-2.h-2.rounded-full');
      expect(colorDots.length).toBeGreaterThan(0);
    });

    it('shows "Aucune categorie" when no categories', () => {
      const summaryNoCategories = {
        ...mockSummary,
        blocks: []
      };

      render(<DaySummaryModal {...defaultProps} summary={summaryNoCategories} />);

      expect(screen.getByText('Aucune categorie')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('renders close button', () => {
      render(<DaySummaryModal {...defaultProps} />);

      expect(screen.getByText('Fermer')).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      render(<DaySummaryModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Fermer'));

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('renders save as template button when onSaveAsTemplate is provided', () => {
      render(<DaySummaryModal {...defaultProps} />);

      expect(screen.getByText('Enregistrer comme template')).toBeInTheDocument();
    });

    it('calls onSaveAsTemplate with summary when template button is clicked', () => {
      render(<DaySummaryModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Enregistrer comme template'));

      expect(defaultProps.onSaveAsTemplate).toHaveBeenCalledWith(mockSummary);
    });

    it('does not render template button when onSaveAsTemplate is not provided', () => {
      render(<DaySummaryModal {...defaultProps} onSaveAsTemplate={undefined} />);

      expect(screen.queryByText('Enregistrer comme template')).not.toBeInTheDocument();
    });

    it('does not render template button when no blocks', () => {
      const summaryNoBlocks = { ...mockSummary, blocks: [] };

      render(<DaySummaryModal {...defaultProps} summary={summaryNoBlocks} />);

      expect(screen.queryByText('Enregistrer comme template')).not.toBeInTheDocument();
    });
  });

  describe('Duration Formatting', () => {
    it('formats durations correctly with hours and minutes', () => {
      render(<DaySummaryModal {...defaultProps} />);

      // 4h 00m appears for both projects (2) and both categories (2) = 4 total
      const fourHourDurations = screen.getAllByText('4h 00m');
      expect(fourHourDurations.length).toBe(4);
    });

    it('handles null duration gracefully', () => {
      const summaryNullDuration = {
        ...mockSummary,
        durationMinutes: null
      };

      render(<DaySummaryModal {...defaultProps} summary={summaryNullDuration} />);

      // Falls back to 0, so shows "0h 00m"
      expect(screen.getByText('0h 00m')).toBeInTheDocument();
    });

    it('handles zero duration', () => {
      const summaryZeroDuration = {
        ...mockSummary,
        durationMinutes: 0,
        meta: { totalBlocksMinutes: 0, unallocatedMinutes: 0 }
      };

      render(<DaySummaryModal {...defaultProps} summary={summaryZeroDuration} />);

      expect(screen.getByText('0h 00m')).toBeInTheDocument();
    });
  });

  describe('Time Formatting', () => {
    it('handles missing startTime gracefully', () => {
      const summaryNoStart = {
        ...mockSummary,
        startTime: null
      };

      render(<DaySummaryModal {...defaultProps} summary={summaryNoStart} />);

      // Should render modal without crashing even with missing startTime
      expect(screen.getByText('Journee terminee')).toBeInTheDocument();
      // The time display will contain the placeholder
      expect(screen.getByText(/--:--/)).toBeInTheDocument();
    });

    it('handles missing endTime gracefully', () => {
      const summaryNoEnd = {
        ...mockSummary,
        endTime: null
      };

      render(<DaySummaryModal {...defaultProps} summary={summaryNoEnd} />);

      // Should still render
      expect(screen.getByText('Journee terminee')).toBeInTheDocument();
    });
  });

  describe('Blocks without Project/Category', () => {
    it('groups blocks without project as "Sans projet"', () => {
      const summaryWithNoProject = {
        ...mockSummary,
        blocks: [
          {
            id: 'block-1',
            durationMinutes: 60,
            projectId: null,
            categoryId: 'cat-1',
            project: null,
            category: { id: 'cat-1', name: 'Development', color: '#3B82F6' }
          }
        ]
      };

      render(<DaySummaryModal {...defaultProps} summary={summaryWithNoProject} />);

      expect(screen.getByText('Sans projet')).toBeInTheDocument();
    });

    it('groups blocks without category as "Sans categorie"', () => {
      const summaryWithNoCategory = {
        ...mockSummary,
        blocks: [
          {
            id: 'block-1',
            durationMinutes: 60,
            projectId: 'proj-1',
            categoryId: null,
            project: { id: 'proj-1', name: 'Project Alpha' },
            category: null
          }
        ]
      };

      render(<DaySummaryModal {...defaultProps} summary={summaryWithNoCategory} />);

      expect(screen.getByText('Sans categorie')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('sorts projects by duration descending', () => {
      const summaryDifferentDurations = {
        ...mockSummary,
        blocks: [
          {
            id: 'block-1',
            durationMinutes: 60,
            projectId: 'proj-small',
            project: { id: 'proj-small', name: 'Small Project' }
          },
          {
            id: 'block-2',
            durationMinutes: 240,
            projectId: 'proj-big',
            project: { id: 'proj-big', name: 'Big Project' }
          }
        ]
      };

      render(<DaySummaryModal {...defaultProps} summary={summaryDifferentDurations} />);

      // Big Project should appear before Small Project (sorted by duration desc)
      const projectNames = screen.getAllByText(/Project/);
      expect(projectNames[0]).toHaveTextContent('Big Project');
    });
  });
});
