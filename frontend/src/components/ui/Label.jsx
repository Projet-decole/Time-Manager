// frontend/src/components/ui/Label.jsx

import { forwardRef } from 'react';

/**
 * Label component for form fields
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.required] - Show required indicator
 */
const Label = forwardRef(({
  className = '',
  required = false,
  children,
  ...props
}, ref) => {
  return (
    <label
      ref={ref}
      className={`text-sm font-medium text-gray-700 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
});

Label.displayName = 'Label';

export { Label };
export default Label;
