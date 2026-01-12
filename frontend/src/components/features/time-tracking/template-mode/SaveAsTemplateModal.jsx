// frontend/src/components/features/time-tracking/template-mode/SaveAsTemplateModal.jsx
// Story 4.10: Implement Template Mode UI - Save Day as Template Modal Component

import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';
import { Label } from '../../../ui/Label';
import { Input } from '../../../ui/Input';
import { Textarea } from '../../../ui/Textarea';

/**
 * SaveAsTemplateModal - Save a completed day as a template
 *
 * @param {Object} props
 * @param {boolean} props.open - Modal visibility
 * @param {function} props.onClose - Close handler
 * @param {Object} props.day - Day entry to save as template
 * @param {function} props.onSave - Save handler (receives { name, description })
 * @param {boolean} [props.isLoading=false] - Loading state
 */
export function SaveAsTemplateModal({
  open,
  onClose,
  day,
  onSave,
  isLoading = false
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  const maxNameLength = 100;
  const maxDescriptionLength = 500;

  // Get blocks count from day
  const blocksCount = day?.blocks?.length || 0;

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      // Generate default name based on date
      const dateStr = day?.startTime
        ? new Date(day.startTime).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short'
          })
        : '';
      setName(`Template du ${dateStr}`);
      setDescription('');
      setErrors({});
    }
  }, [open, day]);

  // Validate form
  const validate = useCallback(() => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Le nom est requis';
    } else if (name.length > maxNameLength) {
      newErrors.name = `Maximum ${maxNameLength} caracteres`;
    }

    if (description.length > maxDescriptionLength) {
      newErrors.description = `Maximum ${maxDescriptionLength} caracteres`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, description]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!validate()) return;

    const data = {
      name: name.trim()
    };

    if (description.trim()) {
      data.description = description.trim();
    }

    onSave(data);
  }, [validate, name, description, onSave]);

  // Handle name change
  const handleNameChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxNameLength) {
      setName(value);
    }
  };

  // Handle description change
  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    if (value.length <= maxDescriptionLength) {
      setDescription(value);
    }
  };

  const nameRemaining = maxNameLength - name.length;
  const descriptionRemaining = maxDescriptionLength - description.length;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Enregistrer comme template"
      size="md"
    >
      <div className="space-y-4">
        {/* Info about the day */}
        <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
          <p>
            Cette journee contient <strong>{blocksCount} bloc{blocksCount !== 1 ? 's' : ''}</strong>.
            Les horaires seront convertis en format relatif (HH:MM).
          </p>
        </div>

        {/* Name field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="template-name" className="text-sm font-medium text-gray-700">
              Nom du template *
            </Label>
            <span
              className={`text-xs ${nameRemaining < 20 ? 'text-orange-500' : 'text-gray-400'}`}
            >
              {nameRemaining}/{maxNameLength}
            </span>
          </div>
          <Input
            id="template-name"
            value={name}
            onChange={handleNameChange}
            placeholder="Ex: Journee standard de developpement"
            className={errors.name ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name}</p>
          )}
        </div>

        {/* Description field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="template-description" className="text-sm font-medium text-gray-700">
              Description
              <span className="ml-1 text-gray-400 text-xs font-normal">(optionnel)</span>
            </Label>
            <span
              className={`text-xs ${descriptionRemaining < 50 ? 'text-orange-500' : 'text-gray-400'}`}
            >
              {descriptionRemaining}/{maxDescriptionLength}
            </span>
          </div>
          <Textarea
            id="template-description"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Decrivez ce template..."
            className="w-full min-h-[80px]"
            disabled={isLoading}
          />
          {errors.description && (
            <p className="text-xs text-red-500">{errors.description}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner />
                Enregistrement...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <TemplateIcon />
                Creer le template
              </span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Icons
function TemplateIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default SaveAsTemplateModal;
