// frontend/src/components/ui/Badge.jsx

import { forwardRef } from 'react';

/**
 * Badge component for displaying status or role labels
 * @param {Object} props
 * @param {string} [props.variant='default'] - 'default' | 'secondary' | 'destructive' | 'outline'
 * @param {string} [props.className] - Additional CSS classes
 */
const Badge = forwardRef(({
  className = '',
  variant = 'default',
  children,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors';

  const variants = {
    default: 'bg-blue-600 text-white',
    secondary: 'bg-gray-100 text-gray-800',
    destructive: 'bg-red-600 text-white',
    outline: 'border border-gray-300 text-gray-700'
  };

  const classes = `${baseStyles} ${variants[variant]} ${className}`;

  return (
    <span
      ref={ref}
      className={classes}
      {...props}
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export { Badge };
export default Badge;
