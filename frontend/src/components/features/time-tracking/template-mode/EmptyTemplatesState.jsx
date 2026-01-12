// frontend/src/components/features/time-tracking/template-mode/EmptyTemplatesState.jsx
// Story 4.10: Implement Template Mode UI - Empty State Component

import { forwardRef } from 'react';
import { Button } from '../../../ui/Button';

/**
 * EmptyTemplatesState - Empty state illustration when no templates exist
 *
 * Design specs (from UX):
 * - Clear illustration
 * - Helpful message explaining templates
 * - CTA to create first template
 *
 * @param {Object} props
 * @param {function} props.onCreateTemplate - Handler for create template button
 * @param {string} [props.className] - Additional CSS classes
 */
const EmptyTemplatesState = forwardRef(({
  onCreateTemplate,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`text-center py-12 ${className}`.trim()}
      {...props}
    >
      {/* Template Icon */}
      <div className="mx-auto h-24 w-24 text-gray-300 mb-6">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>

      {/* Title */}
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Aucun template
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">
        Creez votre premier template pour gagner du temps sur vos journees recurrentes.
      </p>

      {/* CTA Button */}
      <Button
        onClick={onCreateTemplate}
        className="min-w-[200px] h-12 text-base font-semibold"
      >
        <span className="flex items-center gap-2">
          <PlusIcon />
          Nouveau Template
        </span>
      </Button>
    </div>
  );
});

EmptyTemplatesState.displayName = 'EmptyTemplatesState';

/**
 * Plus icon for create button
 */
function PlusIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

export { EmptyTemplatesState };
export default EmptyTemplatesState;
