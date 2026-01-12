// frontend/src/__tests__/components/charts/ProgressBar.test.jsx
// Story 6.2: Reusable Chart Components - ProgressBar Tests

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../../../components/charts/ProgressBar';
import { CHART_COLORS } from '../../../components/charts/chartUtils';

// Helper to convert hex to rgb for comparison
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
};

describe('ProgressBar', () => {
  describe('Basic Rendering', () => {
    it('renders with value and max', () => {
      render(<ProgressBar value={50} max={100} />);

      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
      expect(screen.getByTestId('progress-bar-fill')).toBeInTheDocument();
    });

    it('renders percentage text by default', () => {
      render(<ProgressBar value={50} max={100} />);

      expect(screen.getByTestId('progress-bar-percentage')).toHaveTextContent('50%');
    });

    it('renders label when provided', () => {
      render(<ProgressBar value={50} max={100} label="Progress" />);

      expect(screen.getByTestId('progress-bar-label')).toHaveTextContent('Progress');
    });

    it('hides percentage when showPercentage is false', () => {
      render(<ProgressBar value={50} max={100} showPercentage={false} />);

      expect(screen.queryByTestId('progress-bar-percentage')).not.toBeInTheDocument();
    });
  });

  describe('Progress Calculation', () => {
    it('calculates 0% correctly', () => {
      render(<ProgressBar value={0} max={100} />);

      expect(screen.getByTestId('progress-bar-percentage')).toHaveTextContent('0%');
      expect(screen.getByTestId('progress-bar-fill').style.width).toBe('0%');
    });

    it('calculates 50% correctly', () => {
      render(<ProgressBar value={50} max={100} />);

      expect(screen.getByTestId('progress-bar-percentage')).toHaveTextContent('50%');
      expect(screen.getByTestId('progress-bar-fill').style.width).toBe('50%');
    });

    it('calculates 100% correctly', () => {
      render(<ProgressBar value={100} max={100} />);

      expect(screen.getByTestId('progress-bar-percentage')).toHaveTextContent('100%');
      expect(screen.getByTestId('progress-bar-fill').style.width).toBe('100%');
    });

    it('clamps at 100% when value exceeds max', () => {
      render(<ProgressBar value={150} max={100} />);

      expect(screen.getByTestId('progress-bar-percentage')).toHaveTextContent('150%');
      expect(screen.getByTestId('progress-bar-fill').style.width).toBe('100%');
    });

    it('handles zero max gracefully', () => {
      render(<ProgressBar value={50} max={0} />);

      expect(screen.getByTestId('progress-bar-percentage')).toHaveTextContent('0%');
      expect(screen.getByTestId('progress-bar-fill').style.width).toBe('0%');
    });
  });

  describe('Color Coding', () => {
    it('shows green color for >= 80%', () => {
      render(<ProgressBar value={80} max={100} />);

      expect(screen.getByTestId('progress-bar-fill').style.backgroundColor).toBe(
        hexToRgb(CHART_COLORS.success)
      );
    });

    it('shows green color for 100%', () => {
      render(<ProgressBar value={100} max={100} />);

      expect(screen.getByTestId('progress-bar-fill').style.backgroundColor).toBe(
        hexToRgb(CHART_COLORS.success)
      );
    });

    it('shows yellow color for 50-79%', () => {
      render(<ProgressBar value={50} max={100} />);

      expect(screen.getByTestId('progress-bar-fill').style.backgroundColor).toBe(
        hexToRgb(CHART_COLORS.warning)
      );
    });

    it('shows yellow color for 79%', () => {
      render(<ProgressBar value={79} max={100} />);

      expect(screen.getByTestId('progress-bar-fill').style.backgroundColor).toBe(
        hexToRgb(CHART_COLORS.warning)
      );
    });

    it('shows red color for < 50%', () => {
      render(<ProgressBar value={49} max={100} />);

      expect(screen.getByTestId('progress-bar-fill').style.backgroundColor).toBe(
        hexToRgb(CHART_COLORS.danger)
      );
    });

    it('shows red color for 0%', () => {
      render(<ProgressBar value={0} max={100} />);

      expect(screen.getByTestId('progress-bar-fill').style.backgroundColor).toBe(
        hexToRgb(CHART_COLORS.danger)
      );
    });
  });

  describe('Accessibility', () => {
    it('has progressbar role', () => {
      render(<ProgressBar value={50} max={100} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('has aria-valuenow attribute', () => {
      render(<ProgressBar value={50} max={100} />);

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    });

    it('has aria-valuemin attribute', () => {
      render(<ProgressBar value={50} max={100} />);

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0');
    });

    it('has aria-valuemax attribute', () => {
      render(<ProgressBar value={50} max={100} />);

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
    });
  });

  describe('Custom Styles', () => {
    it('applies custom height class', () => {
      render(<ProgressBar value={50} max={100} height="h-4" />);

      const container = screen.getByTestId('progress-bar');
      const barContainer = container.querySelector('.h-4');
      expect(barContainer).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<ProgressBar value={50} max={100} className="custom-class" />);

      expect(screen.getByTestId('progress-bar')).toHaveClass('custom-class');
    });
  });

  describe('Label and Percentage Display', () => {
    it('shows both label and percentage', () => {
      render(<ProgressBar value={50} max={100} label="Goal Progress" showPercentage={true} />);

      expect(screen.getByTestId('progress-bar-label')).toHaveTextContent('Goal Progress');
      expect(screen.getByTestId('progress-bar-percentage')).toHaveTextContent('50%');
    });

    it('shows only label without percentage', () => {
      render(<ProgressBar value={50} max={100} label="Goal Progress" showPercentage={false} />);

      expect(screen.getByTestId('progress-bar-label')).toHaveTextContent('Goal Progress');
      expect(screen.queryByTestId('progress-bar-percentage')).not.toBeInTheDocument();
    });

    it('hides header when no label and no percentage', () => {
      render(<ProgressBar value={50} max={100} label={null} showPercentage={false} />);

      expect(screen.queryByTestId('progress-bar-label')).not.toBeInTheDocument();
      expect(screen.queryByTestId('progress-bar-percentage')).not.toBeInTheDocument();
    });
  });
});
