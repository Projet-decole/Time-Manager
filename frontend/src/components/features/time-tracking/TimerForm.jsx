// frontend/src/components/features/time-tracking/TimerForm.jsx
// Story 4.4: Simple Mode UI - Timer Form Component

import { forwardRef } from 'react';
import { Select, SelectOption } from '../../ui/Select';
import { Textarea } from '../../ui/Textarea';
import { Label } from '../../ui/Label';

/**
 * TimerForm - Form with project/category/description selectors
 *
 * All fields are optional and can be modified while timer is running
 *
 * @param {Object} props
 * @param {string} [props.projectId] - Selected project ID
 * @param {function} props.onProjectChange - Project change handler
 * @param {Array} props.projects - List of available projects
 * @param {string} [props.categoryId] - Selected category ID
 * @param {function} props.onCategoryChange - Category change handler
 * @param {Array} props.categories - List of available categories
 * @param {string} [props.description] - Description text
 * @param {function} props.onDescriptionChange - Description change handler
 * @param {boolean} [props.disabled=false] - Disable all fields
 * @param {string} [props.className] - Additional CSS classes
 */
const TimerForm = forwardRef(({
  projectId = '',
  onProjectChange,
  projects = [],
  categoryId = '',
  onCategoryChange,
  categories = [],
  description = '',
  onDescriptionChange,
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const maxDescriptionLength = 500;
  const remainingChars = maxDescriptionLength - description.length;

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxDescriptionLength) {
      onDescriptionChange(value);
    }
  };

  return (
    <div
      ref={ref}
      className={`space-y-4 ${className}`.trim()}
      {...props}
    >
      {/* Project Selector */}
      <div className="space-y-2">
        <Label htmlFor="project-select" className="text-sm font-medium text-gray-700">
          Projet
          <span className="ml-1 text-gray-400 text-xs font-normal">(optionnel)</span>
        </Label>
        <Select
          id="project-select"
          value={projectId}
          onValueChange={onProjectChange}
          placeholder="Selectionner un projet..."
          disabled={disabled}
          className="w-full"
        >
          <SelectOption value="">Aucun projet</SelectOption>
          {projects.map((project) => (
            <SelectOption key={project.id} value={project.id}>
              {project.code ? `${project.code} - ${project.name}` : project.name}
            </SelectOption>
          ))}
        </Select>
      </div>

      {/* Category Selector */}
      <div className="space-y-2">
        <Label htmlFor="category-select" className="text-sm font-medium text-gray-700">
          Categorie
          <span className="ml-1 text-gray-400 text-xs font-normal">(optionnel)</span>
        </Label>
        <Select
          id="category-select"
          value={categoryId}
          onValueChange={onCategoryChange}
          placeholder="Selectionner une categorie..."
          disabled={disabled}
          className="w-full"
        >
          <SelectOption value="">Aucune categorie</SelectOption>
          {categories.map((category) => (
            <SelectOption
              key={category.id}
              value={category.id}
              style={{
                borderLeft: `4px solid ${category.color}`,
                paddingLeft: '8px'
              }}
            >
              {category.name}
            </SelectOption>
          ))}
        </Select>
      </div>

      {/* Description Textarea */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="description-input" className="text-sm font-medium text-gray-700">
            Description
            <span className="ml-1 text-gray-400 text-xs font-normal">(optionnel)</span>
          </Label>
          <span
            className={`text-xs ${remainingChars < 50 ? 'text-orange-500' : 'text-gray-400'}`}
          >
            {remainingChars}/{maxDescriptionLength}
          </span>
        </div>
        <Textarea
          id="description-input"
          value={description}
          onChange={handleDescriptionChange}
          placeholder="Ajouter une description..."
          disabled={disabled}
          className="w-full min-h-[80px]"
          maxLength={maxDescriptionLength}
        />
      </div>
    </div>
  );
});

TimerForm.displayName = 'TimerForm';

export { TimerForm };
export default TimerForm;
