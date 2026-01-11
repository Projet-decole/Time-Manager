// frontend/src/components/features/categories/ColorPicker.jsx
// Story 3.8: Admin Management UI - Categories

import { useState } from 'react';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { ColorChip } from './ColorChip';

/**
 * Predefined color palette for categories
 * Based on Story 3.8 specification
 */
const CATEGORY_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Gray', value: '#6B7280' }
];

/**
 * Validate hex color format
 * @param {string} color - Color value to validate
 * @returns {boolean} True if valid hex color
 */
// eslint-disable-next-line react-refresh/only-export-components
export function isValidHexColor(color) {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Color picker component with palette and custom hex input
 * @param {Object} props
 * @param {string} props.value - Current color value
 * @param {function} props.onChange - Callback when color changes
 * @param {string} [props.error] - Error message to display
 */
export function ColorPicker({ value, onChange, error }) {
  const [customHex, setCustomHex] = useState(value || '');

  /**
   * Handle palette color selection
   */
  const handlePaletteSelect = (color) => {
    setCustomHex(color);
    onChange(color);
  };

  /**
   * Handle custom hex input change
   */
  const handleHexInputChange = (e) => {
    let inputValue = e.target.value;

    // Auto-add # if not present
    if (inputValue && !inputValue.startsWith('#')) {
      inputValue = '#' + inputValue;
    }

    // Uppercase hex letters
    inputValue = inputValue.toUpperCase();

    setCustomHex(inputValue);

    // Only call onChange if valid hex color
    if (isValidHexColor(inputValue)) {
      onChange(inputValue);
    }
  };

  const isSelected = (color) => value?.toUpperCase() === color.toUpperCase();

  return (
    <div className="space-y-4">
      {/* Color Palette */}
      <div>
        <Label className="mb-2 block">Palette de couleurs</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => handlePaletteSelect(color.value)}
              className={`
                w-8 h-8 rounded-full border-2 transition-all
                hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                ${isSelected(color.value) ? 'border-gray-900 ring-2 ring-offset-1 ring-gray-400' : 'border-gray-300'}
              `}
              style={{ backgroundColor: color.value }}
              title={color.name}
              aria-label={`Selectionner ${color.name}`}
            />
          ))}
        </div>
      </div>

      {/* Custom Hex Input */}
      <div>
        <Label htmlFor="hex-input" className="mb-2 block">
          Couleur personnalisee (hex)
        </Label>
        <div className="flex items-center gap-3">
          <Input
            id="hex-input"
            type="text"
            value={customHex}
            onChange={handleHexInputChange}
            placeholder="#3B82F6"
            maxLength={7}
            className="w-32"
            error={!!error}
          />
          {/* Preview */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Apercu:</span>
            <ColorChip
              color={isValidHexColor(value) ? value : '#CCCCCC'}
              size="lg"
            />
          </div>
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}

export default ColorPicker;
