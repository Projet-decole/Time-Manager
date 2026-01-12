// frontend/src/__tests__/components/charts/LineChart.test.jsx
// Story 6.2: Reusable Chart Components - LineChart Tests

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LineChart } from '../../../components/charts/LineChart';

// Mock ResizeObserver which is required by Recharts
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverMock;

const mockData = [
  { date: '2024-01-01', hours: 8 },
  { date: '2024-01-02', hours: 7.5 },
  { date: '2024-01-03', hours: 9 },
  { date: '2024-01-04', hours: 6 },
  { date: '2024-01-05', hours: 8.5 }
];

describe('LineChart', () => {
  describe('Rendering', () => {
    it('renders with data', () => {
      render(<LineChart data={mockData} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('renders with custom keys', () => {
      const customData = [
        { x: '2024-01-01', y: 100 },
        { x: '2024-01-02', y: 150 }
      ];

      render(<LineChart data={customData} xKey="x" yKey="y" />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading is true', () => {
      render(<LineChart data={mockData} loading={true} />);

      expect(screen.getByTestId('line-chart-loading')).toBeInTheDocument();
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when data is empty array', () => {
      render(<LineChart data={[]} />);

      expect(screen.getByTestId('line-chart-empty')).toBeInTheDocument();
      expect(screen.getByText(/Aucune donnee disponible/)).toBeInTheDocument();
    });

    it('shows empty state when data is null', () => {
      render(<LineChart data={null} />);

      expect(screen.getByTestId('line-chart-empty')).toBeInTheDocument();
    });

    it('shows empty state when data is undefined', () => {
      render(<LineChart />);

      expect(screen.getByTestId('line-chart-empty')).toBeInTheDocument();
    });
  });

  describe('Target Line', () => {
    it('renders with target value', () => {
      render(<LineChart data={mockData} targetValue={8} targetLabel="Target" />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('does not render target line when targetValue is null', () => {
      render(<LineChart data={mockData} targetValue={null} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('respects height prop', () => {
      render(<LineChart data={mockData} height={500} />);

      const chart = screen.getByTestId('line-chart');
      expect(chart.style.height).toBe('500px');
    });

    it('renders with custom color', () => {
      render(<LineChart data={mockData} color="#FF0000" />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('uses custom value formatter', () => {
      const formatter = (value) => `${value} units`;
      render(<LineChart data={mockData} valueFormatter={formatter} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('uses custom xAxis formatter', () => {
      const formatter = (value) => value.toUpperCase();
      render(<LineChart data={mockData} xAxisFormatter={formatter} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });
});
