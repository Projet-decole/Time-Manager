// frontend/src/__tests__/components/features/dashboard/DashboardCharts.test.jsx
// Story 6.4: Employee Dashboard Charts - Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardCharts } from '../../../../components/features/dashboard/DashboardCharts';
import { ProjectDrillDown } from '../../../../components/features/dashboard/ProjectDrillDown';

// Note: ResizeObserver and DOM dimension mocks are defined globally in setupTests.js

// Mock the dashboard hooks
vi.mock('../../../../hooks/useDashboard', () => ({
  useDashboardByProject: vi.fn(),
  useDashboardTrend: vi.fn()
}));

// Mock the timeEntriesService
vi.mock('../../../../services/timeEntriesService', () => ({
  timeEntriesService: {
    getAll: vi.fn()
  }
}));

// Import mocked modules
import { useDashboardByProject, useDashboardTrend } from '../../../../hooks/useDashboard';
import { timeEntriesService } from '../../../../services/timeEntriesService';

// Wrapper component to provide router context
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// Mock project data
const mockProjectData = {
  breakdown: [
    { projectId: 'p1', projectName: 'Project Alpha', hours: 20 },
    { projectId: 'p2', projectName: 'Project Beta', hours: 15 },
    { projectId: 'p3', projectName: 'Project Gamma', hours: 10 }
  ],
  totalHours: 45
};

// Mock trend data
const mockTrendData = {
  trend: [
    { date: '2024-01-15', hours: 7.5 },
    { date: '2024-01-16', hours: 8 },
    { date: '2024-01-17', hours: 6.5 },
    { date: '2024-01-18', hours: 7 },
    { date: '2024-01-19', hours: 8.5 }
  ],
  dailyTarget: 7,
  average: 7.5
};

describe('DashboardCharts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    useDashboardByProject.mockReturnValue({
      data: mockProjectData,
      loading: false,
      error: null
    });
    useDashboardTrend.mockReturnValue({
      data: mockTrendData,
      loading: false,
      error: null
    });
  });

  describe('Basic Rendering', () => {
    it('renders the charts container', () => {
      renderWithRouter(<DashboardCharts />);

      expect(screen.getByTestId('dashboard-charts')).toBeInTheDocument();
    });

    it('renders both chart cards', () => {
      renderWithRouter(<DashboardCharts />);

      expect(screen.getByText('Repartition par projet')).toBeInTheDocument();
      expect(screen.getByText('Tendance journaliere')).toBeInTheDocument();
    });

    it('renders period selectors', () => {
      renderWithRouter(<DashboardCharts />);

      const periodSelectors = screen.getAllByTestId('period-selector');
      expect(periodSelectors).toHaveLength(2);
    });

    it('renders donut chart when data is available', () => {
      renderWithRouter(<DashboardCharts />);

      expect(screen.getByTestId('donut-chart')).toBeInTheDocument();
    });

    it('renders line chart when data is available', () => {
      renderWithRouter(<DashboardCharts />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('displays total hours for project chart', () => {
      renderWithRouter(<DashboardCharts />);

      expect(screen.getByTestId('project-total-hours')).toHaveTextContent('Total: 45h');
    });

    it('displays average for trend chart', () => {
      renderWithRouter(<DashboardCharts />);

      expect(screen.getByTestId('trend-average')).toHaveTextContent('Moyenne: 7.5h/jour');
    });
  });

  describe('Loading States', () => {
    it('shows loading state for project chart when loading', () => {
      useDashboardByProject.mockReturnValue({
        data: null,
        loading: true,
        error: null
      });

      renderWithRouter(<DashboardCharts />);

      // Should show skeleton loader for donut chart
      expect(screen.queryByTestId('donut-chart')).not.toBeInTheDocument();
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('shows loading state for trend chart when loading', () => {
      useDashboardTrend.mockReturnValue({
        data: null,
        loading: true,
        error: null
      });

      renderWithRouter(<DashboardCharts />);

      // Should show skeleton loader for line chart
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('shows empty state when no project data', () => {
      useDashboardByProject.mockReturnValue({
        data: { breakdown: [], totalHours: 0 },
        loading: false,
        error: null
      });

      renderWithRouter(<DashboardCharts />);

      expect(screen.getByText('Aucun projet enregistre')).toBeInTheDocument();
    });

    it('shows empty state when no trend data', () => {
      useDashboardTrend.mockReturnValue({
        data: { trend: [], dailyTarget: 7, average: 0 },
        loading: false,
        error: null
      });

      renderWithRouter(<DashboardCharts />);

      expect(screen.getByText('Aucune donnee de tendance')).toBeInTheDocument();
    });

    it('shows empty state when breakdown is null', () => {
      useDashboardByProject.mockReturnValue({
        data: null,
        loading: false,
        error: null
      });

      renderWithRouter(<DashboardCharts />);

      expect(screen.getByText('Aucun projet enregistre')).toBeInTheDocument();
    });
  });

  describe('Period Selectors', () => {
    it('renders week and month options for project chart', () => {
      renderWithRouter(<DashboardCharts />);

      expect(screen.getByTestId('period-option-week')).toBeInTheDocument();
      expect(screen.getByTestId('period-option-month')).toBeInTheDocument();
    });

    it('renders days options for trend chart', () => {
      renderWithRouter(<DashboardCharts />);

      expect(screen.getByTestId('period-option-7')).toBeInTheDocument();
      expect(screen.getByTestId('period-option-30')).toBeInTheDocument();
      expect(screen.getByTestId('period-option-90')).toBeInTheDocument();
    });

    it('calls useDashboardByProject with correct period when changed', async () => {
      renderWithRouter(<DashboardCharts />);

      // Initially called with 'week' (default)
      expect(useDashboardByProject).toHaveBeenCalledWith('week');

      // Click on 'Mois' button
      fireEvent.click(screen.getByTestId('period-option-month'));

      // Should be called with 'month'
      await waitFor(() => {
        expect(useDashboardByProject).toHaveBeenCalledWith('month');
      });
    });

    it('calls useDashboardTrend with correct days when changed', async () => {
      renderWithRouter(<DashboardCharts />);

      // Initially called with 30 (default)
      expect(useDashboardTrend).toHaveBeenCalledWith(30);

      // Click on '7j' button
      fireEvent.click(screen.getByTestId('period-option-7'));

      // Should be called with 7
      await waitFor(() => {
        expect(useDashboardTrend).toHaveBeenCalledWith(7);
      });
    });

    it('updates active state on period selector buttons', async () => {
      renderWithRouter(<DashboardCharts />);

      const weekButton = screen.getByTestId('period-option-week');
      const monthButton = screen.getByTestId('period-option-month');

      // Initially week is selected (has active styling)
      expect(weekButton).toHaveClass('bg-white');

      // Click month
      fireEvent.click(monthButton);

      await waitFor(() => {
        expect(monthButton).toHaveClass('bg-white');
      });
    });
  });

  describe('Responsive Layout', () => {
    it('has correct grid classes for responsive layout', () => {
      renderWithRouter(<DashboardCharts />);

      const grid = screen.getByTestId('dashboard-charts');
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('lg:grid-cols-2');
    });
  });
});

describe('ProjectDrillDown', () => {
  const mockProject = {
    projectId: 'p1',
    name: 'Project Alpha',
    value: 20
  };

  const mockEntries = [
    {
      id: 'e1',
      projectId: 'p1',
      description: 'Working on feature A',
      startTime: '2024-01-15T09:00:00Z',
      durationMinutes: 120
    },
    {
      id: 'e2',
      projectId: 'p1',
      description: 'Code review',
      startTime: '2024-01-16T10:00:00Z',
      durationMinutes: 60
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    timeEntriesService.getAll.mockResolvedValue({
      success: true,
      data: mockEntries
    });
  });

  describe('Basic Rendering', () => {
    it('renders the drill-down panel', async () => {
      renderWithRouter(
        <ProjectDrillDown
          project={mockProject}
          period="week"
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('project-drilldown-content')).toBeInTheDocument();
      });
    });

    it('displays project name in title', async () => {
      renderWithRouter(
        <ProjectDrillDown
          project={mockProject}
          period="week"
          onClose={() => {}}
        />
      );

      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });

    it('displays project hours', async () => {
      renderWithRouter(
        <ProjectDrillDown
          project={mockProject}
          period="week"
          onClose={() => {}}
        />
      );

      // Look for the hours in the summary section
      expect(screen.getByText('20h')).toBeInTheDocument();
    });

    it('displays correct period label for week', async () => {
      renderWithRouter(
        <ProjectDrillDown
          project={mockProject}
          period="week"
          onClose={() => {}}
        />
      );

      // There are multiple elements with "cette semaine", so use getAllByText
      const elements = screen.getAllByText(/cette semaine/);
      expect(elements.length).toBeGreaterThan(0);
    });

    it('displays correct period label for month', async () => {
      renderWithRouter(
        <ProjectDrillDown
          project={mockProject}
          period="month"
          onClose={() => {}}
        />
      );

      // There are multiple elements with "ce mois", so use getAllByText
      const elements = screen.getAllByText(/ce mois/);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton while fetching entries', async () => {
      // Delay the response
      timeEntriesService.getAll.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: mockEntries }), 100))
      );

      renderWithRouter(
        <ProjectDrillDown
          project={mockProject}
          period="week"
          onClose={() => {}}
        />
      );

      // Should show loading initially
      expect(screen.getByTestId('drilldown-loading')).toBeInTheDocument();

      // Wait for entries to load
      await waitFor(() => {
        expect(screen.queryByTestId('drilldown-loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('Entries Display', () => {
    it('displays entries after loading', async () => {
      renderWithRouter(
        <ProjectDrillDown
          project={mockProject}
          period="week"
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('drilldown-entries')).toBeInTheDocument();
      });

      const entries = screen.getAllByTestId('drilldown-entry');
      expect(entries).toHaveLength(2);
    });

    it('displays entry descriptions', async () => {
      renderWithRouter(
        <ProjectDrillDown
          project={mockProject}
          period="week"
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Working on feature A')).toBeInTheDocument();
        expect(screen.getByText('Code review')).toBeInTheDocument();
      });
    });

    it('displays formatted duration', async () => {
      renderWithRouter(
        <ProjectDrillDown
          project={mockProject}
          period="week"
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('2h')).toBeInTheDocument();
        expect(screen.getByText('1h')).toBeInTheDocument();
      });
    });

    it('shows empty state when no entries', async () => {
      timeEntriesService.getAll.mockResolvedValue({
        success: true,
        data: []
      });

      renderWithRouter(
        <ProjectDrillDown
          project={mockProject}
          period="week"
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('drilldown-empty')).toBeInTheDocument();
        expect(screen.getByText('Aucune entree trouvee pour ce projet')).toBeInTheDocument();
      });
    });

    it('shows error state when fetch fails', async () => {
      timeEntriesService.getAll.mockRejectedValue(new Error('Network error'));

      renderWithRouter(
        <ProjectDrillDown
          project={mockProject}
          period="week"
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('drilldown-error')).toBeInTheDocument();
      });
    });
  });

  describe('History Link', () => {
    it('renders link to full history', async () => {
      renderWithRouter(
        <ProjectDrillDown
          project={mockProject}
          period="week"
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        const link = screen.getByTestId('view-history-link');
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/time-tracking?projectId=p1');
      });
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', async () => {
      const onClose = vi.fn();

      renderWithRouter(
        <ProjectDrillDown
          project={mockProject}
          period="week"
          onClose={onClose}
        />
      );

      // Find and click the close button (X button in Sheet header)
      const closeButton = screen.getByLabelText('Fermer');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Data Filtering', () => {
    it('filters entries by projectId', async () => {
      const mixedEntries = [
        { id: 'e1', projectId: 'p1', description: 'Entry for P1', startTime: '2024-01-15T09:00:00Z', durationMinutes: 60 },
        { id: 'e2', projectId: 'p2', description: 'Entry for P2', startTime: '2024-01-15T10:00:00Z', durationMinutes: 60 },
        { id: 'e3', projectId: 'p1', description: 'Another P1', startTime: '2024-01-15T11:00:00Z', durationMinutes: 60 }
      ];

      timeEntriesService.getAll.mockResolvedValue({
        success: true,
        data: mixedEntries
      });

      renderWithRouter(
        <ProjectDrillDown
          project={mockProject}
          period="week"
          onClose={() => {}}
        />
      );

      await waitFor(() => {
        const entries = screen.getAllByTestId('drilldown-entry');
        // Should only show 2 entries (for p1)
        expect(entries).toHaveLength(2);
        expect(screen.getByText('Entry for P1')).toBeInTheDocument();
        expect(screen.getByText('Another P1')).toBeInTheDocument();
        expect(screen.queryByText('Entry for P2')).not.toBeInTheDocument();
      });
    });
  });
});
