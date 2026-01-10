// frontend/src/components/ui/Alert.jsx

import { forwardRef } from 'react';

/**
 * Alert component for displaying messages
 * @param {Object} props
 * @param {string} [props.variant='default'] - 'default' | 'success' | 'error' | 'warning'
 * @param {string} [props.className] - Additional CSS classes
 */
const Alert = forwardRef(({
  className = '',
  variant = 'default',
  children,
  ...props
}, ref) => {
  const baseStyles = 'relative w-full rounded-lg border p-4';

  const variants = {
    default: 'bg-gray-50 border-gray-200 text-gray-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };

  return (
    <div
      ref={ref}
      role="alert"
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

Alert.displayName = 'Alert';

/**
 * Alert title
 */
const AlertTitle = forwardRef(({
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <h5
      ref={ref}
      className={`mb-1 font-medium leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h5>
  );
});

AlertTitle.displayName = 'AlertTitle';

/**
 * Alert description
 */
const AlertDescription = forwardRef(({
  className = '',
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`text-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
