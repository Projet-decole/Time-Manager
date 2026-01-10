# Story 2.11: Implement Profile Page

Status: ready-for-dev

## Story

As an **authenticated user**,
I want to view and edit my profile information,
So that I can keep my personal details up to date.

## Acceptance Criteria

1. **Given** I am logged in
   **When** I navigate to `/profile`
   **Then** I see my profile information: nom, prenom, email (readonly), role (readonly), heures cibles

2. **Given** I am on the profile page
   **When** I click "Modifier"
   **Then** the form becomes editable (except email and role)

3. **Given** I modify my first name, last name, or weekly hours
   **When** I click "Enregistrer"
   **Then** my profile is updated via API
   **And** I see a success message
   **And** the AuthContext user is refreshed

4. **Given** invalid data (empty name, hours > 168)
   **When** I try to save
   **Then** validation errors are shown

5. **Given** I am not logged in
   **When** I try to access `/profile`
   **Then** I am redirected to `/login`

## Tasks / Subtasks

- [ ] Task 1: Create ProfilePage component
  - [ ] Create `frontend/src/pages/ProfilePage.jsx`
  - [ ] Display profile info in card format
  - [ ] View mode and edit mode toggle

- [ ] Task 2: Implement edit functionality
  - [ ] Form with react-hook-form
  - [ ] Validation: name required, hours 0-168
  - [ ] Call authService.updateProfile()
  - [ ] Call refreshUser() after success

- [ ] Task 3: Add profile route
  - [ ] Add `/profile` to router
  - [ ] Protected route (requires auth)

- [ ] Task 4: Add navigation to profile
  - [ ] Add profile link to app header/nav
  - [ ] User avatar/name with dropdown optional

- [ ] Task 5: Write tests
  - [ ] Test profile display
  - [ ] Test edit flow
  - [ ] Test validation

## Dev Notes

### ProfilePage Implementation

```jsx
// frontend/src/pages/ProfilePage.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Pencil, Save, X, User } from 'lucide-react';

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

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <CardTitle>Mon Profil</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
            <Badge variant={user?.role === 'manager' ? 'default' : 'secondary'}>
              {user?.role === 'manager' ? 'Manager' : 'Employe'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {message && (
            <Alert variant={message.type === 'success' ? 'default' : 'destructive'} className="mb-4">
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Read-only fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500">L'email ne peut pas etre modifie</p>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={user?.role === 'manager' ? 'Manager' : 'Employe'} disabled className="bg-gray-50" />
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
                  {...register('firstName', { required: 'Prenom requis' })}
                />
                {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  disabled={!isEditing}
                  {...register('lastName', { required: 'Nom requis' })}
                />
                {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weeklyHoursTarget">Heures cibles par semaine</Label>
              <Input
                id="weeklyHoursTarget"
                type="number"
                disabled={!isEditing}
                {...register('weeklyHoursTarget', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Minimum 0 heures' },
                  max: { value: 168, message: 'Maximum 168 heures (24h x 7j)' }
                })}
              />
              {errors.weeklyHoursTarget && <p className="text-sm text-red-500">{errors.weeklyHoursTarget.message}</p>}
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              {isEditing ? (
                <>
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" /> Annuler
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" /> Modifier
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Files to Create

```
frontend/src/
├── pages/
│   └── ProfilePage.jsx
└── __tests__/pages/
    └── ProfilePage.test.jsx
```

### Additional shadcn Components

```bash
npx shadcn@latest add badge
```

## What User Can Do After This Story

**Page profil complete !**

**L'utilisateur peut maintenant:**
1. Se connecter sur `/login`
2. Aller sur `/profile`
3. Voir ses informations:
   - Email (non modifiable)
   - Role (non modifiable)
   - Prenom, Nom
   - Heures cibles par semaine
4. Cliquer "Modifier"
5. Changer son prenom, nom, heures cibles
6. Cliquer "Enregistrer"
7. Voir le message de succes
8. Les changements sont persistes en base

**E2E Test manuel:**
1. Se connecter
2. Aller sur http://localhost:5173/profile
3. Verifier que les infos sont correctes
4. Cliquer "Modifier"
5. Changer le prenom en "Test"
6. Cliquer "Enregistrer" → succes
7. Rafraichir la page → le prenom est toujours "Test"
8. Essayer de mettre weeklyHoursTarget a 200 → erreur validation

**Cas d'erreur a tester:**
- Nom vide → erreur
- Heures > 168 → erreur
- Non connecte → redirection login

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
