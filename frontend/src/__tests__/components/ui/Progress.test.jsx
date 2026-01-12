// frontend/src/__tests__/components/ui/Progress.test.jsx
// Story 6.2: Reusable Chart Components - Progress UI Tests

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from '../../../components/ui/Progress';

describe('Progress', () => {
  describe('Basic Rendering', () => {
    it('renders correctly', () => {
      render(<Progress value={50} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('has default value of 0', () => {
      render(<Progress />);

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    });
  });

  describe('Accessibility', () => {
    it('has progressbar role', () => {
      render(<Progress value={50} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('has aria-valuenow', () => {
      render(<Progress value={75} />);

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
    });

    it('has aria-valuemin', () => {
      render(<Progress value={50} />);

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0');
    });

    it('has aria-valuemax', () => {
      render(<Progress value={50} />);

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
    });
  });

  describe('Value Clamping', () => {
    it('clamps value at 0', () => {
      render(<Progress value={-10} />);

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    });

    it('clamps value at 100', () => {
      render(<Progress value={150} />);

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('Visual Width', () => {
    it('sets correct width for 0%', () => {
      render(<Progress value={0} />);

      const indicator = screen.getByRole('progressbar').querySelector('div');
      expect(indicator.style.width).toBe('0%');
    });

    it('sets correct width for 50%', () => {
      render(<Progress value={50} />);

      const indicator = screen.getByRole('progressbar').querySelector('div');
      expect(indicator.style.width).toBe('50%');
    });

    it('sets correct width for 100%', () => {
      render(<Progress value={100} />);

      const indicator = screen.getByRole('progressbar').querySelector('div');
      expect(indicator.style.width).toBe('100%');
    });
  });

  describe('Custom Color', () => {
    it('uses default color when indicatorColor not provided', () => {
      render(<Progress value={50} />);

      const indicator = screen.getByRole('progressbar').querySelector('div');
      expect(indicator.style.backgroundColor).toBe('rgb(59, 130, 246)'); // #3B82F6 converted
    });

    it('uses custom indicatorColor', () => {
      render(<Progress value={50} indicatorColor="#FF0000" />);

      const indicator = screen.getByRole('progressbar').querySelector('div');
      expect(indicator.style.backgroundColor).toBe('rgb(255, 0, 0)');
    });
  });

  describe('Custom Styles', () => {
    it('accepts custom className', () => {
      render(<Progress value={50} className="custom-class" />);

      expect(screen.getByRole('progressbar')).toHaveClass('custom-class');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref', () => {
      const ref = { current: null };
      render(<Progress ref={ref} value={50} />);

      expect(ref.current).toBe(screen.getByRole('progressbar'));
    });
  });
});
