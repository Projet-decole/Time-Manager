// frontend/src/__tests__/components/charts/BarChart.test.jsx
// Story 6.2: Reusable Chart Components - BarChart Tests

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BarChart } from '../../../components/charts/BarChart';
import { CHART_COLORS } from '../../../components/charts/chartUtils';

// Mock ResizeObserver which is required by Recharts
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock;

const mockData = [
  { name: 'Project A', value: 40 },
  { name: 'Project B', value: 30 },
  { name: 'Project C', value: 20 }
];

describe('BarChart', () => {
  describe('Rendering', () => {
    it('renders with data (vertical)', () => {
      render(<BarChart data={mockData} />);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('renders with horizontal orientation', () => {
      render(<BarChart data={mockData} orientation="horizontal" />);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('renders with custom keys', () => {
      const customData = [
        { label: 'Item 1', amount: 100 },
        { label: 'Item 2', amount: 200 }
      ];

      render(<BarChart data={customData} nameKey="label" valueKey="amount" />);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading is true', () => {
      render(<BarChart data={mockData} loading={true} />);

      expect(screen.getByTestId('bar-chart-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('bar-chart')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when data is empty array', () => {
      render(<BarChart data={[]} />);

      expect(screen.getByTestId('bar-chart-empty')).toBeInTheDocument();
      expect(screen.getByText(/Aucune donnee disponible/)).toBeInTheDocument();
    });

    it('shows empty state when data is null', () => {
      render(<BarChart data={null} />);

      expect(screen.getByTestId('bar-chart-empty')).toBeInTheDocument();
    });

    it('shows empty state when data is undefined', () => {
      render(<BarChart />);

      expect(screen.getByTestId('bar-chart-empty')).toBeInTheDocument();
    });
  });

  describe('Threshold Colors', () => {
    it('applies threshold colors correctly', () => {
      const dataWithThresholds = [
        { name: 'Safe', value: 30 },    // should be green (< warning)
        { name: 'Warning', value: 45 }, // should be yellow (>= warning, < danger)
        { name: 'Danger', value: 55 }   // should be red (>= danger)
      ];

      render(
        <BarChart
          data={dataWithThresholds}
          thresholds={{ warning: 40, danger: 50 }}
        />
      );

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('uses default color when no thresholds provided', () => {
      render(<BarChart data={mockData} color={CHART_COLORS.primary} />);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('respects height prop', () => {
      render(<BarChart data={mockData} height={400} />);

      const chart = screen.getByTestId('bar-chart');
      expect(chart.style.height).toBe('400px');
    });

    it('uses custom color', () => {
      render(<BarChart data={mockData} color="#FF0000" />);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('uses colors from data', () => {
      const dataWithColors = [
        { name: 'A', value: 10, color: '#FF0000' },
        { name: 'B', value: 20, color: '#00FF00' }
      ];

      render(<BarChart data={dataWithColors} />);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('uses custom value formatter', () => {
      const formatter = (value) => `${value} items`;
      render(<BarChart data={mockData} valueFormatter={formatter} />);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });
});
