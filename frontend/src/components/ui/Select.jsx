// frontend/src/components/ui/Select.jsx

import { forwardRef } from 'react';

/**
 * Native select component styled to match the design system
 * Simple alternative to complex dropdown menus
 *
 * @param {Object} props
 * @param {string} [props.placeholder] - Placeholder text for empty state
 * @param {string} [props.value] - Selected value
 * @param {Function} [props.onValueChange] - Callback when value changes
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - Option elements
 */
const Select = forwardRef(({
  className = '',
  value,
  onValueChange,
  placeholder,
  children,
  ...props
}, ref) => {
  const handleChange = (e) => {
    if (onValueChange) {
      onValueChange(e.target.value);
    }
  };

  return (
    <select
      ref={ref}
      value={value}
      onChange={handleChange}
      className={`
        flex h-10 w-full items-center justify-between rounded-md border border-gray-300
        bg-white px-3 py-2 text-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${className}
      `.trim()}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
});

Select.displayName = 'Select';

/**
 * Option component for Select
 */
const SelectOption = forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <option ref={ref} className={className} {...props}>
      {children}
    </option>
  );
});

SelectOption.displayName = 'SelectOption';

export { Select, SelectOption };
export default Select;
