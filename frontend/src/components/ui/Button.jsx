// frontend/src/components/ui/Button.jsx

import { forwardRef, cloneElement, isValidElement, Children } from 'react';

/**
 * Button component with variant support
 * @param {Object} props
 * @param {string} [props.variant='default'] - 'default' | 'outline' | 'destructive' | 'ghost'
 * @param {string} [props.size='default'] - 'default' | 'sm' | 'lg'
 * @param {boolean} [props.disabled] - Disable the button
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.asChild] - Render as child element (for Link wrapping)
 */
const Button = forwardRef(({
  className = '',
  variant = 'default',
  size = 'default',
  disabled = false,
  asChild = false,
  children,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
    ghost: 'hover:bg-gray-100 text-gray-700 focus-visible:ring-gray-500'
  };

  const sizes = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-12 px-6 text-base'
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  // If asChild, clone the child element and merge our props/styles
  if (asChild) {
    const child = Children.only(children);
    if (isValidElement(child)) {
      const childClassName = child.props.className || '';
      return cloneElement(child, {
        ref,
        className: `${classes} ${childClassName}`.trim(),
        ...props
      });
    }
  }

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export { Button };
export default Button;
