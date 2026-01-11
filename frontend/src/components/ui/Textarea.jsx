// frontend/src/components/ui/Textarea.jsx
// Story 3.6: Textarea component for team description

import { forwardRef } from 'react';

/**
 * Textarea component with error state support
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.error] - Show error state
 */
const Textarea = forwardRef(({
  className = '',
  error = false,
  ...props
}, ref) => {
  const baseStyles = 'flex min-h-[80px] w-full rounded-md border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none';

  const errorStyles = error
    ? 'border-red-500 focus-visible:ring-red-500'
    : 'border-gray-300 focus-visible:ring-blue-500';

  return (
    <textarea
      className={`${baseStyles} ${errorStyles} ${className}`}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export { Textarea };
export default Textarea;
