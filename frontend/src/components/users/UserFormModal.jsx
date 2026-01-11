// frontend/src/components/users/UserFormModal.jsx

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select, SelectOption } from '../ui/Select';
import { Alert, AlertDescription } from '../ui/Alert';

/**
 * User form modal for creating and editing users
 * Story 2.14: Manager User Management
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onSubmit - Callback when form is submitted
 * @param {Object} [props.user] - User data for edit mode (null for create mode)
 * @param {boolean} [props.isLoading=false] - Whether form is submitting
 * @param {string|null} [props.error=null] - Error message to display
 */
export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  user = null,
  isLoading = false,
  error = null
}) {
  const isEditMode = !!user;
  const title = isEditMode ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur';

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: 'employee',
      weeklyHoursTarget: 35
    }
  });

  const selectedRole = watch('role');

  // Reset form when modal opens or user changes
  useEffect(() => {
    if (isOpen) {
      if (user) {
        reset({
          email: user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.role || 'employee',
          weeklyHoursTarget: user.weeklyHoursTarget ?? 35
        });
      } else {
        reset({
          email: '',
          firstName: '',
          lastName: '',
          role: 'employee',
          weeklyHoursTarget: 35
        });
      }
    }
  }, [isOpen, user, reset]);

  const handleFormSubmit = (data) => {
    // Convert weeklyHoursTarget to number
    const formData = {
      ...data,
      weeklyHoursTarget: Number(data.weeklyHoursTarget)
    };

    // In edit mode, only send editable fields
    if (isEditMode) {
      onSubmit({
        firstName: formData.firstName,
        lastName: formData.lastName,
        weeklyHoursTarget: formData.weeklyHoursTarget
      });
    } else {
      onSubmit(formData);
    }
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
        {/* Email - only in create mode */}
        {!isEditMode && (
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              error={!!errors.email}
              {...register('email', {
                required: 'Email requis',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email invalide'
                }
              })}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
        )}

        {/* Email - readonly in edit mode */}
        {isEditMode && (
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled className="bg-gray-50" />
            <p className="text-xs text-gray-500">L'email ne peut pas etre modifie</p>
          </div>
        )}

        {/* First Name */}
        <div className="space-y-2">
          <Label htmlFor="firstName">Prenom *</Label>
          <Input
            id="firstName"
            placeholder="Prenom"
            error={!!errors.firstName}
            {...register('firstName', {
              required: 'Prenom requis',
              maxLength: { value: 100, message: 'Maximum 100 caracteres' }
            })}
          />
          {errors.firstName && (
            <p className="text-sm text-red-500">{errors.firstName.message}</p>
          )}
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom *</Label>
          <Input
            id="lastName"
            placeholder="Nom"
            error={!!errors.lastName}
            {...register('lastName', {
              required: 'Nom requis',
              maxLength: { value: 100, message: 'Maximum 100 caracteres' }
            })}
          />
          {errors.lastName && (
            <p className="text-sm text-red-500">{errors.lastName.message}</p>
          )}
        </div>

        {/* Role - only in create mode */}
        {!isEditMode && (
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setValue('role', value)}
            >
              <SelectOption value="employee">Employe</SelectOption>
              <SelectOption value="manager">Manager</SelectOption>
            </Select>
          </div>
        )}

        {/* Role - readonly in edit mode */}
        {isEditMode && (
          <div className="space-y-2">
            <Label>Role</Label>
            <Input
              value={user?.role === 'manager' ? 'Manager' : 'Employe'}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">Le role ne peut pas etre modifie</p>
          </div>
        )}

        {/* Weekly Hours Target */}
        <div className="space-y-2">
          <Label htmlFor="weeklyHoursTarget">Heures cibles par semaine</Label>
          <Input
            id="weeklyHoursTarget"
            type="number"
            min="0"
            max="168"
            error={!!errors.weeklyHoursTarget}
            {...register('weeklyHoursTarget', {
              valueAsNumber: true,
              min: { value: 0, message: 'Minimum 0 heures' },
              max: { value: 168, message: 'Maximum 168 heures' }
            })}
          />
          {errors.weeklyHoursTarget && (
            <p className="text-sm text-red-500">{errors.weeklyHoursTarget.message}</p>
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

export default UserFormModal;
