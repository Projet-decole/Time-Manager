// frontend/src/__tests__/components/charts/KPICard.test.jsx
// Story 6.2: Reusable Chart Components - KPICard Tests

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICard } from '../../../components/charts/KPICard';

// Mock icon component
const MockIcon = (props) => <svg data-testid="mock-icon" {...props} />;

describe('KPICard', () => {
  describe('Basic Rendering', () => {
    it('renders title and value', () => {
      render(<KPICard title="Hours Worked" value={40} />);

      expect(screen.getByText('Hours Worked')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-value')).toHaveTextContent('40');
    });

    it('renders with unit', () => {
      render(<KPICard title="Hours Worked" value={40} unit="h" />);

      expect(screen.getByText('h')).toBeInTheDocument();
    });

    it('renders kpi-card test id', () => {
      render(<KPICard title="Test" value={100} />);

      expect(screen.getByTestId('kpi-card')).toBeInTheDocument();
    });
  });

  describe('Target and Progress', () => {
    it('shows progress bar when target is provided', () => {
      render(<KPICard title="Progress" value={35} target={40} />);

      // Should show target text
      expect(screen.getByText(/\/ 40/)).toBeInTheDocument();
      // Should render progress bar
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows target with unit', () => {
      render(<KPICard title="Hours" value={35} target={40} unit="h" />);

      expect(screen.getByText(/\/ 40/)).toBeInTheDocument();
    });

    it('does not show progress bar when target is null', () => {
      render(<KPICard title="No Target" value={100} target={null} />);

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('Trend Indicator', () => {
    it('shows positive trend (green, up arrow)', () => {
      render(<KPICard title="Growth" value={100} trend={5} />);

      const trend = screen.getByTestId('kpi-trend');
      expect(trend).toBeInTheDocument();
      expect(trend).toHaveTextContent('5%');
      expect(trend).toHaveStyle({ color: '#22C55E' }); // success color
    });

    it('shows negative trend (red, down arrow)', () => {
      render(<KPICard title="Decline" value={100} trend={-3} />);

      const trend = screen.getByTestId('kpi-trend');
      expect(trend).toBeInTheDocument();
      expect(trend).toHaveTextContent('3%');
      expect(trend).toHaveStyle({ color: '#EF4444' }); // danger color
    });

    it('shows neutral trend (gray)', () => {
      render(<KPICard title="Stable" value={100} trend={0} />);

      const trend = screen.getByTestId('kpi-trend');
      expect(trend).toBeInTheDocument();
      expect(trend).toHaveStyle({ color: '#6B7280' }); // neutral color
    });

    it('does not show trend when trend is null', () => {
      render(<KPICard title="No Trend" value={100} trend={null} />);

      expect(screen.queryByTestId('kpi-trend')).not.toBeInTheDocument();
    });
  });

  describe('Icon', () => {
    it('renders icon when provided', () => {
      render(<KPICard title="With Icon" value={100} icon={MockIcon} />);

      expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });

    it('does not render icon when not provided', () => {
      render(<KPICard title="No Icon" value={100} />);

      expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading is true', () => {
      render(<KPICard title="Loading" value={100} loading={true} />);

      expect(screen.getByTestId('kpi-card-loading')).toBeInTheDocument();
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
      expect(screen.queryByTestId('kpi-value')).not.toBeInTheDocument();
    });

    it('shows skeleton animations', () => {
      render(<KPICard title="Loading" value={100} loading={true} />);

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Custom Styles', () => {
    it('applies custom className', () => {
      render(<KPICard title="Custom" value={100} className="custom-class" />);

      const card = screen.getByTestId('kpi-card');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Value Formatting', () => {
    it('formats large numbers with locale', () => {
      render(<KPICard title="Large" value={1234.5} />);

      // French locale uses narrow no-break space (U+202F) as thousands separator
      expect(screen.getByTestId('kpi-value')).toHaveTextContent(/1.*234/);
    });

    it('handles decimal values', () => {
      render(<KPICard title="Decimal" value={7.5} />);

      expect(screen.getByTestId('kpi-value')).toHaveTextContent('7,5');
    });
  });
});
