// frontend/src/__tests__/components/features/categories/ColorPicker.test.jsx
// Story 3.8: Admin Management UI - Categories

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorPicker, isValidHexColor } from '../../../../components/features/categories/ColorPicker';

describe('ColorPicker', () => {
  describe('isValidHexColor', () => {
    it('validates correct hex colors', () => {
      expect(isValidHexColor('#3B82F6')).toBe(true);
      expect(isValidHexColor('#000000')).toBe(true);
      expect(isValidHexColor('#FFFFFF')).toBe(true);
      expect(isValidHexColor('#aabbcc')).toBe(true);
    });

    it('rejects invalid hex colors', () => {
      expect(isValidHexColor('#3B82F')).toBe(false); // Too short
      expect(isValidHexColor('#3B82F67')).toBe(false); // Too long
      expect(isValidHexColor('3B82F6')).toBe(false); // Missing #
      expect(isValidHexColor('#GGGGGG')).toBe(false); // Invalid characters
      expect(isValidHexColor('')).toBe(false); // Empty
      expect(isValidHexColor(null)).toBe(false); // Null
    });
  });

  describe('Component Rendering', () => {
    it('renders color palette', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="#3B82F6" onChange={onChange} />);

      expect(screen.getByText(/palette de couleurs/i)).toBeInTheDocument();
    });

    it('renders hex input field', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="#3B82F6" onChange={onChange} />);

      expect(screen.getByPlaceholderText(/#3B82F6/i)).toBeInTheDocument();
    });

    it('renders color preview', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="#3B82F6" onChange={onChange} />);

      expect(screen.getByText(/apercu/i)).toBeInTheDocument();
    });

    it('shows 10 color palette buttons', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="#3B82F6" onChange={onChange} />);

      // 10 predefined colors in palette
      const colorButtons = screen.getAllByRole('button');
      expect(colorButtons.length).toBe(10);
    });
  });

  describe('Interactions', () => {
    it('calls onChange when palette color clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ColorPicker value="#3B82F6" onChange={onChange} />);

      const greenButton = screen.getByTitle('Green');
      await user.click(greenButton);

      expect(onChange).toHaveBeenCalledWith('#10B981');
    });

    it('calls onChange when valid hex entered in input', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ColorPicker value="" onChange={onChange} />);

      const input = screen.getByPlaceholderText(/#3B82F6/i);
      await user.clear(input);
      await user.type(input, '#FF0000');

      expect(onChange).toHaveBeenCalledWith('#FF0000');
    });

    it('does not call onChange for invalid hex input', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ColorPicker value="" onChange={onChange} />);

      const input = screen.getByPlaceholderText(/#3B82F6/i);
      await user.clear(input);
      await user.type(input, '#ZZZ');

      // Should not be called with invalid value
      expect(onChange).not.toHaveBeenCalledWith('#ZZZ');
    });

    it('auto-adds # prefix to hex input', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ColorPicker value="" onChange={onChange} />);

      const input = screen.getByPlaceholderText(/#3B82F6/i);
      await user.clear(input);
      await user.type(input, 'FF0000');

      // Input should have # prefix
      expect(input).toHaveValue('#FF0000');
    });
  });

  describe('Error State', () => {
    it('displays error message when provided', () => {
      const onChange = vi.fn();
      render(<ColorPicker value="#3B82F6" onChange={onChange} error="Invalid color" />);

      expect(screen.getByText('Invalid color')).toBeInTheDocument();
    });
  });
});
