// frontend/src/__tests__/components/ui/Skeleton.test.jsx
// Story 6.2: Reusable Chart Components - Skeleton UI Tests

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton } from '../../../components/ui/Skeleton';

describe('Skeleton', () => {
  it('renders correctly', () => {
    render(<Skeleton data-testid="skeleton" />);

    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('has animation class', () => {
    render(<Skeleton data-testid="skeleton" />);

    expect(screen.getByTestId('skeleton')).toHaveClass('animate-pulse');
  });

  it('has rounded style', () => {
    render(<Skeleton data-testid="skeleton" />);

    expect(screen.getByTestId('skeleton')).toHaveClass('rounded-md');
  });

  it('has background color', () => {
    render(<Skeleton data-testid="skeleton" />);

    expect(screen.getByTestId('skeleton')).toHaveClass('bg-gray-200');
  });

  it('accepts custom className', () => {
    render(<Skeleton data-testid="skeleton" className="w-32 h-8" />);

    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('w-32');
    expect(skeleton).toHaveClass('h-8');
  });

  it('accepts custom style', () => {
    render(<Skeleton data-testid="skeleton" style={{ width: '100px', height: '50px' }} />);

    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton.style.width).toBe('100px');
    expect(skeleton.style.height).toBe('50px');
  });

  it('forwards ref', () => {
    const ref = { current: null };
    render(<Skeleton ref={ref} data-testid="skeleton" />);

    expect(ref.current).toBe(screen.getByTestId('skeleton'));
  });
});
