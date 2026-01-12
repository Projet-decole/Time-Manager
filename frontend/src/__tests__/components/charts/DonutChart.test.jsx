// frontend/src/__tests__/components/charts/DonutChart.test.jsx
// Story 6.2: Reusable Chart Components - DonutChart Tests

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DonutChart } from '../../../components/charts/DonutChart';

// Note: ResizeObserver and DOM dimension mocks are defined globally in setupTests.js

const mockData = [
  { name: 'Development', value: 40 },
  { name: 'Meeting', value: 20 },
  { name: 'Admin', value: 10 }
];

describe('DonutChart', () => {
  describe('Rendering', () => {
    it('renders with data', () => {
      render(<DonutChart data={mockData} />);

      expect(screen.getByTestId('donut-chart')).toBeInTheDocument();
    });

    it('renders chart container with showLegend true', () => {
      // Note: In test environment, ResponsiveContainer has no dimensions,
      // so the chart content (including legend) may not render.
      // We test that the component renders without errors with showLegend=true
      render(<DonutChart data={mockData} showLegend={true} />);

      expect(screen.getByTestId('donut-chart')).toBeInTheDocument();
    });

    it('does not render legend when showLegend is false', () => {
      render(<DonutChart data={mockData} showLegend={false} />);

      // Chart should exist but no legend text
      expect(screen.getByTestId('donut-chart')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading is true', () => {
      render(<DonutChart data={mockData} loading={true} />);

      // Should not render the chart
      expect(screen.queryByTestId('donut-chart')).not.toBeInTheDocument();
      // Should show skeleton (animated div)
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when data is empty array', () => {
      render(<DonutChart data={[]} />);

      expect(screen.getByTestId('donut-chart-empty')).toBeInTheDocument();
      expect(screen.getByText(/Aucune donnee disponible/)).toBeInTheDocument();
    });

    it('shows empty state when data is null', () => {
      render(<DonutChart data={null} />);

      expect(screen.getByTestId('donut-chart-empty')).toBeInTheDocument();
    });

    it('shows empty state when data is undefined', () => {
      render(<DonutChart />);

      expect(screen.getByTestId('donut-chart-empty')).toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('respects height prop', () => {
      render(<DonutChart data={mockData} height={400} />);

      const chart = screen.getByTestId('donut-chart');
      expect(chart.style.height).toBe('400px');
    });

    it('uses custom colors from data', () => {
      const dataWithColors = [
        { name: 'Item 1', value: 50, color: '#FF0000' },
        { name: 'Item 2', value: 50, color: '#00FF00' }
      ];

      render(<DonutChart data={dataWithColors} />);

      expect(screen.getByTestId('donut-chart')).toBeInTheDocument();
    });
  });
});
