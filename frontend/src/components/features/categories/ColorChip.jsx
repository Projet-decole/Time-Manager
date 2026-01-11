// frontend/src/components/features/categories/ColorChip.jsx
// Story 3.8: Admin Management UI - Categories

/**
 * Color chip component for displaying a color preview
 * Used in category lists and forms
 * @param {Object} props
 * @param {string} props.color - Hex color value (e.g., #3B82F6)
 * @param {string} [props.size='md'] - Size variant: 'sm' | 'md' | 'lg'
 * @param {string} [props.className] - Additional CSS classes
 */
export function ColorChip({ color, size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <span
      className={`inline-block rounded-full border border-gray-300 ${sizeClass} ${className}`}
      style={{ backgroundColor: color }}
      title={color}
      aria-label={`Couleur ${color}`}
    />
  );
}

export default ColorChip;
