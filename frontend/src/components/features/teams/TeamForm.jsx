// frontend/src/components/features/teams/TeamForm.jsx
// Story 3.6: Team form modal for create/edit

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Textarea } from '../../ui/Textarea';
import { Alert, AlertDescription } from '../../ui/Alert';

/**
 * TeamForm modal component for creating and editing teams
 * Story 3.6: AC2 - Create Team Modal, AC3 - Edit Team
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onSubmit - Callback when form is submitted
 * @param {Object} [props.team] - Team data for edit mode (null for create mode)
 * @param {boolean} [props.isLoading=false] - Whether form is submitting
 * @param {string|null} [props.error=null] - Error message to display
 */
export function TeamForm({
  isOpen,
  onClose,
  onSubmit,
  team = null,
  isLoading = false,
  error = null
}) {
  const isEditMode = !!team;
  const title = isEditMode ? 'Modifier l\'equipe' : 'Nouvelle equipe';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      description: ''
    }
  });

  // Reset form when modal opens or team changes
  useEffect(() => {
    if (isOpen) {
      if (team) {
        reset({
          name: team.name || '',
          description: team.description || ''
        });
      } else {
        reset({
          name: '',
          description: ''
        });
      }
    }
  }, [isOpen, team, reset]);

  const handleFormSubmit = (data) => {
    onSubmit({
      name: data.name.trim(),
      description: data.description?.trim() || ''
    });
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
        {/* Team Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Nom de l'equipe *</Label>
          <Input
            id="name"
            placeholder="Ex: Equipe Marketing"
            error={!!errors.name}
            {...register('name', {
              required: 'Le nom est requis',
              minLength: { value: 2, message: 'Minimum 2 caracteres' },
              maxLength: { value: 100, message: 'Maximum 100 caracteres' }
            })}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Team Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Description de l'equipe (optionnel)"
            rows={3}
            {...register('description', {
              maxLength: { value: 500, message: 'Maximum 500 caracteres' }
            })}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? 'Enregistrement...'
              : isEditMode
                ? 'Enregistrer'
                : 'Creer'
            }
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default TeamForm;
