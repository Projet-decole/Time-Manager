// frontend/src/__tests__/components/features/categories/ColorChip.test.jsx
// Story 3.8: Admin Management UI - Categories

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ColorChip } from '../../../../components/features/categories/ColorChip';

describe('ColorChip', () => {
  it('renders with correct color', () => {
    render(<ColorChip color="#3B82F6" />);

    const chip = screen.getByTitle('#3B82F6');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveStyle({ backgroundColor: '#3B82F6' });
  });

  it('renders with default medium size', () => {
    render(<ColorChip color="#3B82F6" />);

    const chip = screen.getByTitle('#3B82F6');
    expect(chip).toHaveClass('w-6', 'h-6');
  });

  it('renders with small size when specified', () => {
    render(<ColorChip color="#3B82F6" size="sm" />);

    const chip = screen.getByTitle('#3B82F6');
    expect(chip).toHaveClass('w-4', 'h-4');
  });

  it('renders with large size when specified', () => {
    render(<ColorChip color="#3B82F6" size="lg" />);

    const chip = screen.getByTitle('#3B82F6');
    expect(chip).toHaveClass('w-8', 'h-8');
  });

  it('applies custom className', () => {
    render(<ColorChip color="#3B82F6" className="custom-class" />);

    const chip = screen.getByTitle('#3B82F6');
    expect(chip).toHaveClass('custom-class');
  });

  it('has accessible aria-label', () => {
    render(<ColorChip color="#3B82F6" />);

    const chip = screen.getByLabelText('Couleur #3B82F6');
    expect(chip).toBeInTheDocument();
  });
});
