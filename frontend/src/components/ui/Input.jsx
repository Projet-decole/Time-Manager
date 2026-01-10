// frontend/src/components/ui/Input.jsx

import { forwardRef } from 'react';

/**
 * Input component with error state support
 * @param {Object} props
 * @param {string} [props.type='text'] - Input type
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.error] - Show error state
 */
const Input = forwardRef(({
  className = '',
  type = 'text',
  error = false,
  ...props
}, ref) => {
  const baseStyles = 'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

  const errorStyles = error
    ? 'border-red-500 focus-visible:ring-red-500'
    : 'border-gray-300 focus-visible:ring-blue-500';

  return (
    <input
      type={type}
      className={`${baseStyles} ${errorStyles} ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
export default Input;
