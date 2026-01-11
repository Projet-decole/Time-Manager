// frontend/src/components/features/categories/CategoryForm.jsx
// Story 3.8: Admin Management UI - Categories

import { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Button } from '../../ui/Button';
import { Alert, AlertDescription } from '../../ui/Alert';
import { ColorPicker, isValidHexColor } from './ColorPicker';

/**
 * Default color for new categories
 */
const DEFAULT_COLOR = '#3B82F6';

/**
 * Category form modal for creating and editing categories
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {function} props.onClose - Callback when modal closes
 * @param {function} props.onSubmit - Callback when form is submitted
 * @param {Object} [props.category] - Category to edit (null for create)
 * @param {boolean} [props.isLoading=false] - Loading state
 * @param {string} [props.error] - Error message
 */
export function CategoryForm({
  isOpen,
  onClose,
  onSubmit,
  category = null,
  isLoading = false,
  error = null
}) {
  const isEditing = !!category;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: DEFAULT_COLOR
  });

  // Validation state
  const [validationErrors, setValidationErrors] = useState({});

  // Reset form when modal opens/closes or category changes
  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData({
          name: category.name || '',
          description: category.description || '',
          color: category.color || DEFAULT_COLOR
        });
      } else {
        setFormData({
          name: '',
          description: '',
          color: DEFAULT_COLOR
        });
      }
      setValidationErrors({});
    }
  }, [isOpen, category]);

  /**
   * Handle input change
   */
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  /**
   * Validate form data
   * @returns {boolean} True if valid
   */
  const validateForm = () => {
    const errors = {};

    // Name is required
    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis';
    } else if (formData.name.length > 100) {
      errors.name = 'Le nom ne peut pas depasser 100 caracteres';
    }

    // Description is optional but has max length
    if (formData.description && formData.description.length > 500) {
      errors.description = 'La description ne peut pas depasser 500 caracteres';
    }

    // Color is required and must be valid hex
    if (!formData.color) {
      errors.color = 'La couleur est requise';
    } else if (!isValidHexColor(formData.color)) {
      errors.color = 'Format de couleur invalide (utilisez #RRGGBB)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      color: formData.color.toUpperCase()
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Modifier la categorie' : 'Creer une categorie'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* API Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Name field */}
        <div>
          <Label htmlFor="category-name" required>
            Nom
          </Label>
          <Input
            id="category-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Ex: Development"
            error={!!validationErrors.name}
            disabled={isLoading}
            className="mt-1"
          />
          {validationErrors.name && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
          )}
        </div>

        {/* Description field */}
        <div>
          <Label htmlFor="category-description">
            Description
          </Label>
          <textarea
            id="category-description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Description de la categorie (optionnel)"
            disabled={isLoading}
            rows={3}
            className={`
              mt-1 flex w-full rounded-md border bg-white px-3 py-2 text-sm
              placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
              ${validationErrors.description ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-300 focus-visible:ring-blue-500'}
            `}
          />
          {validationErrors.description && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
          )}
        </div>

        {/* Color picker */}
        <div>
          <ColorPicker
            value={formData.color}
            onChange={(color) => handleChange('color', color)}
            error={validationErrors.color}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Enregistrement...' : (isEditing ? 'Modifier' : 'Creer')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CategoryForm;
