// frontend/src/components/features/time-tracking/template-mode/TemplatesList.jsx
// Story 4.10: Implement Template Mode UI - Templates List Component

import { forwardRef } from 'react';
import { TemplateCard } from './TemplateCard';

/**
 * TemplatesList - Grid/List of template cards
 *
 * @param {Object} props
 * @param {Array} props.templates - Array of template objects
 * @param {function} props.onTemplateClick - Click to view details
 * @param {function} props.onApply - Apply template handler
 * @param {function} props.onEdit - Edit template handler
 * @param {function} props.onDelete - Delete template handler
 * @param {string} [props.className] - Additional CSS classes
 */
const TemplatesList = forwardRef(({
  templates = [],
  onTemplateClick,
  onApply,
  onEdit,
  onDelete,
  className = '',
  ...props
}, ref) => {
  if (templates.length === 0) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={`
        grid gap-4
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-2
        ${className}
      `.trim()}
      {...props}
    >
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onClick={onTemplateClick}
          onApply={onApply}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
});

TemplatesList.displayName = 'TemplatesList';

export { TemplatesList };
export default TemplatesList;
