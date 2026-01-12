// frontend/src/__tests__/components/features/dashboard/DashboardKPIs.test.jsx
// Story 6.3: Employee Dashboard KPIs Section - DashboardKPIs Tests

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardKPIs, TimesheetStatusCard } from '../../../../components/features/dashboard/DashboardKPIs';

// Wrapper component to provide router context
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

// Mock dashboard data
const mockDashboardData = {
  summary: {
    hoursThisWeek: 32.5,
    hoursThisMonth: 120,
    weeklyTarget: 35,
    monthlyTarget: 140,
    weeklyProgress: 92.8
  },
  comparison: {
    weekOverWeek: 12.5,
    monthOverMonth: -5.2
  },
  timesheetStatus: {
    current: 'draft',
    validated: 3,
    pending: 1,
    currentWeekStart: '2024-01-15'
  }
};

describe('DashboardKPIs', () => {
  describe('Basic Rendering', () => {
    it('renders 4 KPI cards when data is provided', () => {
      renderWithRouter(<DashboardKPIs data={mockDashboardData} />);

      expect(screen.getByTestId('dashboard-kpis')).toBeInTheDocument();
      // Check for the 3 KPICard + 1 TimesheetStatusCard
      expect(screen.getAllByTestId('kpi-card')).toHaveLength(3);
      expect(screen.getByTestId('timesheet-status-card')).toBeInTheDocument();
    });

    it('displays correct hours this week', () => {
      renderWithRouter(<DashboardKPIs data={mockDashboardData} />);

      expect(screen.getByText('Heures cette semaine')).toBeInTheDocument();
      // Value is formatted with French locale
      expect(screen.getByText(/32,5/)).toBeInTheDocument();
    });

    it('displays correct hours this month', () => {
      renderWithRouter(<DashboardKPIs data={mockDashboardData} />);

      expect(screen.getByText('Heures ce mois')).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
    });

    it('displays weekly progress', () => {
      renderWithRouter(<DashboardKPIs data={mockDashboardData} />);

      expect(screen.getByText('Progression semaine')).toBeInTheDocument();
    });

    it('displays timesheet status', () => {
      renderWithRouter(<DashboardKPIs data={mockDashboardData} />);

      expect(screen.getByText('Feuille de temps')).toBeInTheDocument();
      expect(screen.getByTestId('timesheet-status-badge')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeletons when loading is true', () => {
      renderWithRouter(<DashboardKPIs data={null} loading={true} />);

      expect(screen.getByTestId('dashboard-kpis-loading')).toBeInTheDocument();
      // Should show 4 loading KPI cards
      expect(screen.getAllByTestId('kpi-card-loading')).toHaveLength(4);
    });

    it('does not show data when loading', () => {
      renderWithRouter(<DashboardKPIs data={mockDashboardData} loading={true} />);

      expect(screen.queryByText('Heures cette semaine')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty message when data is null', () => {
      renderWithRouter(<DashboardKPIs data={null} />);

      expect(screen.getByTestId('dashboard-kpis-empty')).toBeInTheDocument();
      expect(screen.getByText('Aucune donnee disponible')).toBeInTheDocument();
    });

    it('shows empty message when data is undefined', () => {
      renderWithRouter(<DashboardKPIs data={undefined} />);

      expect(screen.getByTestId('dashboard-kpis-empty')).toBeInTheDocument();
    });
  });

  describe('Trend Indicators', () => {
    it('shows positive week-over-week trend', () => {
      renderWithRouter(<DashboardKPIs data={mockDashboardData} />);

      // Should find trend indicator with positive percentage
      const trends = screen.getAllByTestId('kpi-trend');
      expect(trends.length).toBeGreaterThan(0);
    });

    it('shows negative month-over-month trend', () => {
      renderWithRouter(<DashboardKPIs data={mockDashboardData} />);

      // The second KPI card (hours this month) has a negative trend
      const trends = screen.getAllByTestId('kpi-trend');
      expect(trends.some(t => t.textContent.includes('5,2%'))).toBe(true);
    });
  });

  describe('Progress Bars', () => {
    it('shows progress bar for hours this week', () => {
      renderWithRouter(<DashboardKPIs data={mockDashboardData} />);

      // Progress bars should be present
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Layout', () => {
    it('has correct grid classes for responsive layout', () => {
      renderWithRouter(<DashboardKPIs data={mockDashboardData} />);

      const grid = screen.getByTestId('dashboard-kpis');
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('sm:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-4');
    });
  });
});

describe('TimesheetStatusCard', () => {
  const mockStatus = {
    current: 'draft',
    validated: 3,
    pending: 1,
    currentWeekStart: '2024-01-15'
  };

  describe('Status Badge', () => {
    it('displays draft status badge', () => {
      renderWithRouter(<TimesheetStatusCard status={{ ...mockStatus, current: 'draft' }} />);

      expect(screen.getByTestId('timesheet-status-badge')).toHaveTextContent('Brouillon');
    });

    it('displays submitted status badge', () => {
      renderWithRouter(<TimesheetStatusCard status={{ ...mockStatus, current: 'submitted' }} />);

      expect(screen.getByTestId('timesheet-status-badge')).toHaveTextContent('Soumis');
    });

    it('displays validated status badge', () => {
      renderWithRouter(<TimesheetStatusCard status={{ ...mockStatus, current: 'validated' }} />);

      expect(screen.getByTestId('timesheet-status-badge')).toHaveTextContent('Valide');
    });

    it('displays rejected status badge', () => {
      renderWithRouter(<TimesheetStatusCard status={{ ...mockStatus, current: 'rejected' }} />);

      expect(screen.getByTestId('timesheet-status-badge')).toHaveTextContent('Rejete');
    });
  });

  describe('Validated Count', () => {
    it('shows singular form for 1 validated', () => {
      renderWithRouter(<TimesheetStatusCard status={{ ...mockStatus, validated: 1 }} />);

      expect(screen.getByText('1 validee')).toBeInTheDocument();
    });

    it('shows plural form for multiple validated', () => {
      renderWithRouter(<TimesheetStatusCard status={{ ...mockStatus, validated: 3 }} />);

      expect(screen.getByText('3 validees')).toBeInTheDocument();
    });
  });

  describe('Pending Warning', () => {
    it('shows pending warning when pending > 0', () => {
      renderWithRouter(<TimesheetStatusCard status={{ ...mockStatus, pending: 2 }} />);

      expect(screen.getByTestId('pending-warning')).toBeInTheDocument();
      expect(screen.getByText('2 en attente de validation')).toBeInTheDocument();
    });

    it('does not show pending warning when pending is 0', () => {
      renderWithRouter(<TimesheetStatusCard status={{ ...mockStatus, pending: 0 }} />);

      expect(screen.queryByTestId('pending-warning')).not.toBeInTheDocument();
    });
  });

  describe('Link to Timesheet', () => {
    it('renders link to timesheet with correct href', () => {
      renderWithRouter(<TimesheetStatusCard status={mockStatus} />);

      const link = screen.getByTestId('timesheet-link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/timesheets?week=2024-01-15');
    });
  });

  describe('Empty State', () => {
    it('handles null status gracefully', () => {
      renderWithRouter(<TimesheetStatusCard status={null} />);

      expect(screen.getByTestId('timesheet-status-card')).toBeInTheDocument();
      expect(screen.getByText('Aucune donnee')).toBeInTheDocument();
    });
  });
});
