// frontend/src/components/ui/Sheet.jsx
// Story 3.6: Side panel component for team details

import { useEffect, useRef } from 'react';
import { forwardRef } from 'react';

/**
 * Sheet component - A slide-in panel from the right
 * Used for detail views like team details with members/projects
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the sheet is open
 * @param {Function} props.onClose - Callback to close the sheet
 * @param {string} [props.title] - Sheet title
 * @param {string} [props.description] - Sheet description
 * @param {React.ReactNode} props.children - Sheet content
 * @param {string} [props.className] - Additional CSS classes
 */
export function Sheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = ''
}) {
  const sheetRef = useRef(null);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Sheet content */}
      <div
        ref={sheetRef}
        className={`relative z-10 h-full w-full max-w-lg bg-white shadow-xl animate-slide-in-right overflow-hidden flex flex-col ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b shrink-0">
          <div className="flex-1 min-w-0">
            {title && (
              <h2
                id="sheet-title"
                className="text-lg font-semibold text-gray-900 truncate"
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * SheetHeader component
 */
export const SheetHeader = forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`flex flex-col space-y-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

SheetHeader.displayName = 'SheetHeader';

/**
 * SheetTitle component
 */
export const SheetTitle = forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={`text-lg font-semibold text-gray-900 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
});

SheetTitle.displayName = 'SheetTitle';

/**
 * SheetDescription component
 */
export const SheetDescription = forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={`text-sm text-gray-500 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
});

SheetDescription.displayName = 'SheetDescription';

/**
 * SheetContent component - for organizing content sections
 */
export const SheetContent = forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`space-y-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

SheetContent.displayName = 'SheetContent';

/**
 * SheetSection component - for grouping related content
 */
export const SheetSection = forwardRef(({ className = '', title, children, ...props }, ref) => {
  return (
    <div ref={ref} className={`space-y-3 ${className}`} {...props}>
      {title && (
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
      )}
      {children}
    </div>
  );
});

SheetSection.displayName = 'SheetSection';

export default Sheet;
