// frontend/src/pages/ProfilePage.jsx

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';

/**
 * Profile page for viewing and editing user profile information
 * Authentication is handled by ProtectedRoute at layout level
 * Story 2.14: Employees cannot modify weeklyHoursTarget (readonly field)
 */
export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      weeklyHoursTarget: user?.weeklyHoursTarget || 35
    }
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        weeklyHoursTarget: user.weeklyHoursTarget || 35
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    try {
      setMessage(null);
      setIsLoading(true);
      await authService.updateProfile(data);
      await refreshUser();
      setMessage({ type: 'success', text: 'Profil mis a jour avec succes' });
      setIsEditing(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la mise a jour' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      weeklyHoursTarget: user?.weeklyHoursTarget || 35
    });
    setIsEditing(false);
    setMessage(null);
  };

  const getRoleDisplay = (role) => {
    return role === 'manager' ? 'Manager' : 'Employe';
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                <svg
                  className="h-6 w-6 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <CardTitle>Mon Profil</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
            <Badge variant={user?.role === 'manager' ? 'default' : 'secondary'}>
              {getRoleDisplay(user?.role)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {message && (
            <Alert variant={message.type === 'success' ? 'success' : 'error'} className="mb-4">
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Read-only fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500">L&apos;email ne peut pas etre modifie</p>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={getRoleDisplay(user?.role)} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500">Le role est attribue par un administrateur</p>
              </div>
            </div>

            {/* Editable fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prenom</Label>
                <Input
                  id="firstName"
                  disabled={!isEditing}
                  error={!!errors.firstName}
                  {...register('firstName', { required: 'Prenom requis' })}
                />
                {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  disabled={!isEditing}
                  error={!!errors.lastName}
                  {...register('lastName', { required: 'Nom requis' })}
                />
                {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Story 2.14: weeklyHoursTarget - readonly for employees, editable only by managers */}
            <div className="space-y-2">
              <Label htmlFor="weeklyHoursTarget">Heures cibles par semaine</Label>
              <Input
                id="weeklyHoursTarget"
                type="number"
                disabled={!isEditing || user?.role === 'employee'}
                className={user?.role === 'employee' ? 'bg-gray-50' : ''}
                error={!!errors.weeklyHoursTarget}
                {...register('weeklyHoursTarget', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Minimum 0 heures' },
                  max: { value: 168, message: 'Maximum 168 heures (24h x 7j)' }
                })}
              />
              {user?.role === 'employee' && (
                <p className="text-xs text-gray-500">
                  Les heures cibles sont definies par votre manager
                </p>
              )}
              {errors.weeklyHoursTarget && <p className="text-sm text-red-500">{errors.weeklyHoursTarget.message}</p>}
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              {isEditing ? (
                <>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => setIsEditing(true)}>
                  Modifier
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
