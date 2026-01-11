// frontend/src/components/features/projects/ProjectForm.jsx
// Story 3.7: Admin Management UI - Projects

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Alert, AlertDescription } from '../../ui/Alert';

/**
 * Project form modal for creating and editing projects
 * Story 3.7: Admin Management UI - Projects
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onSubmit - Callback when form is submitted
 * @param {Object} [props.project] - Project data for edit mode (null for create mode)
 * @param {boolean} [props.isLoading=false] - Whether form is submitting
 * @param {string|null} [props.error=null] - Error message to display
 * @param {string} [props.nextCode] - Preview of next auto-generated code (for create mode)
 */
export function ProjectForm({
  isOpen,
  onClose,
  onSubmit,
  project = null,
  isLoading = false,
  error = null,
  nextCode = null
}) {
  const isEditMode = !!project;
  const title = isEditMode ? 'Modifier le projet' : 'Nouveau projet';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      description: '',
      budgetHours: ''
    }
  });

  // Reset form when modal opens or project changes
  useEffect(() => {
    if (isOpen) {
      if (project) {
        reset({
          name: project.name || '',
          description: project.description || '',
          budgetHours: project.budgetHours ?? ''
        });
      } else {
        reset({
          name: '',
          description: '',
          budgetHours: ''
        });
      }
    }
  }, [isOpen, project, reset]);

  const handleFormSubmit = (data) => {
    const formData = {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      budgetHours: data.budgetHours === '' ? null : Number(data.budgetHours)
    };

    onSubmit(formData);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      {error && (
        <Alert variant="error" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Code - show preview for create, readonly for edit */}
        {isEditMode ? (
          <div className="space-y-2">
            <Label>Code</Label>
            <Input
              value={project?.code || ''}
              disabled
              className="bg-gray-50 font-mono"
            />
            <p className="text-xs text-gray-500">Le code ne peut pas etre modifie</p>
          </div>
        ) : nextCode && (
          <div className="space-y-2">
            <Label>Code</Label>
            <div className="px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-mono">
              Sera assigne: {nextCode}
            </div>
          </div>
        )}

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Nom du projet *</Label>
          <Input
            id="name"
            placeholder="Ex: Time Manager"
            error={!!errors.name}
            {...register('name', {
              required: 'Nom requis',
              minLength: { value: 2, message: 'Minimum 2 caracteres' },
              maxLength: { value: 100, message: 'Maximum 100 caracteres' }
            })}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            placeholder="Description du projet (optionnel)"
            {...register('description', {
              maxLength: { value: 500, message: 'Maximum 500 caracteres' }
            })}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Budget Hours */}
        <div className="space-y-2">
          <Label htmlFor="budgetHours">Budget heures</Label>
          <Input
            id="budgetHours"
            type="number"
            min="0"
            step="0.5"
            placeholder="Ex: 500 (optionnel)"
            error={!!errors.budgetHours}
            {...register('budgetHours', {
              min: { value: 0, message: 'Minimum 0 heures' },
              max: { value: 100000, message: 'Maximum 100000 heures' }
            })}
          />
          <p className="text-xs text-gray-500">
            Laissez vide si pas de budget defini
          </p>
          {errors.budgetHours && (
            <p className="text-sm text-red-500">{errors.budgetHours.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Enregistrement...' : isEditMode ? 'Modifier' : 'Creer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ProjectForm;
