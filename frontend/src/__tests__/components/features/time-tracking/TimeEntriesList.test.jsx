// frontend/src/__tests__/components/features/time-tracking/TimeEntriesList.test.jsx
// Story 4.4: Simple Mode UI - TimeEntriesList Component Tests

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimeEntriesList } from '../../../../components/features/time-tracking/TimeEntriesList';

const mockGroupedEntries = [
  {
    date: '2026-01-12',
    label: "Aujourd'hui",
    isToday: true,
    entries: [
      {
        id: '1',
        startTime: '2026-01-12T14:00:00Z',
        endTime: '2026-01-12T16:00:00Z',
        durationMinutes: 120,
        project: { id: 'p1', name: 'Project A', code: 'PRJ-A' },
        category: { id: 'c1', name: 'Development', color: '#3B82F6' }
      },
      {
        id: '2',
        startTime: '2026-01-12T10:00:00Z',
        endTime: '2026-01-12T12:00:00Z',
        durationMinutes: 120,
        project: null,
        category: null
      }
    ]
  },
  {
    date: '2026-01-11',
    label: 'Hier',
    isToday: false,
    entries: [
      {
        id: '3',
        startTime: '2026-01-11T09:00:00Z',
        endTime: '2026-01-11T11:00:00Z',
        durationMinutes: 120,
        project: { id: 'p2', name: 'Project B', code: 'PRJ-B' },
        category: { id: 'c2', name: 'Meeting', color: '#10B981' }
      }
    ]
  }
];

describe('TimeEntriesList', () => {
  describe('Loading State', () => {
    it('shows loading skeleton when loading', () => {
      const { container } = render(<TimeEntriesList loading={true} />);

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('does not show entries when loading', () => {
      render(<TimeEntriesList loading={true} groupedEntries={mockGroupedEntries} />);

      expect(screen.queryByText("Aujourd'hui")).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error message when error prop is set', () => {
      render(<TimeEntriesList error="Network error" />);

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('shows error icon', () => {
      const { container } = render(<TimeEntriesList error="Error" />);

      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no entries', () => {
      render(<TimeEntriesList groupedEntries={[]} />);

      expect(screen.getByText('Aucune entree de temps')).toBeInTheDocument();
    });

    it('shows helpful message in empty state', () => {
      render(<TimeEntriesList groupedEntries={[]} />);

      expect(
        screen.getByText(/commencez a suivre votre temps/i)
      ).toBeInTheDocument();
    });
  });

  describe('Grouped Entries Display', () => {
    it('renders date headers for each group', () => {
      render(<TimeEntriesList groupedEntries={mockGroupedEntries} />);

      expect(screen.getByText("Aujourd'hui")).toBeInTheDocument();
      expect(screen.getByText('Hier')).toBeInTheDocument();
    });

    it('shows entry count for each group', () => {
      render(<TimeEntriesList groupedEntries={mockGroupedEntries} />);

      // "2 entrees" for today (plural)
      expect(screen.getByText('2 entrees')).toBeInTheDocument();
      // "1 entree" for yesterday (singular)
      expect(screen.getByText('1 entree')).toBeInTheDocument();
    });

    it('renders all entries', () => {
      render(<TimeEntriesList groupedEntries={mockGroupedEntries} />);

      // Check for project codes
      expect(screen.getByText('PRJ-A')).toBeInTheDocument();
      expect(screen.getByText('PRJ-B')).toBeInTheDocument();
    });

    it('highlights today group with different color', () => {
      render(<TimeEntriesList groupedEntries={mockGroupedEntries} />);

      const todayHeader = screen.getByText("Aujourd'hui");
      expect(todayHeader).toHaveClass('text-blue-600');
    });

    it('non-today groups have gray color', () => {
      render(<TimeEntriesList groupedEntries={mockGroupedEntries} />);

      const yesterdayHeader = screen.getByText('Hier');
      expect(yesterdayHeader).toHaveClass('text-gray-500');
    });
  });

  describe('Entry Cards', () => {
    it('displays project information', () => {
      render(<TimeEntriesList groupedEntries={mockGroupedEntries} />);

      expect(screen.getByText('PRJ-A')).toBeInTheDocument();
    });

    it('displays category badge', () => {
      render(<TimeEntriesList groupedEntries={mockGroupedEntries} />);

      expect(screen.getByText('Development')).toBeInTheDocument();
      expect(screen.getByText('Meeting')).toBeInTheDocument();
    });

    it('handles entries without project', () => {
      render(<TimeEntriesList groupedEntries={mockGroupedEntries} />);

      // Entry ID 2 has no project
      expect(screen.getByText('Sans projet')).toBeInTheDocument();
    });
  });

  describe('Custom Class Names', () => {
    it('accepts additional className prop', () => {
      const { container } = render(
        <TimeEntriesList groupedEntries={[]} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
