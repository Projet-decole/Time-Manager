# Story 2.14: Implement Manager User Management

Status: done

## Story

As a **manager**,
I want to manage user accounts (create users and edit their weekly hours target),
So that I can onboard new employees and set appropriate work expectations for my team.

## Acceptance Criteria

1. **Given** I am a manager on `/admin/users`
   **When** I click "Ajouter un utilisateur"
   **Then** I see a modal with: email, prenom, nom, role (employee/manager), heures cibles
   **And** I can submit to create the user

2. **Given** the create user form
   **When** I submit with valid data
   **Then** a new user is created in Supabase Auth
   **And** a profile entry is created in the database
   **And** an email is sent to the user to set their password
   **And** I see a success message

3. **Given** I am a manager viewing the users list
   **When** I click on a user's row or an "edit" button
   **Then** I can edit their weeklyHoursTarget
   **And** I can save the changes

4. **Given** I am an employee on `/profile`
   **When** I view my profile in edit mode
   **Then** the weeklyHoursTarget field is NOT editable (readonly)
   **And** I see a note "Defini par votre manager"

5. **Given** I am a manager on `/profile`
   **When** I view my own profile in edit mode
   **Then** I CAN edit my own weeklyHoursTarget

6. **Given** invalid data in create user form
   **When** I try to submit (empty fields, invalid email, duplicate email)
   **Then** appropriate validation errors are shown

## Tasks / Subtasks

- [x] Task 1: Backend - Create user endpoint
  - [x] Create POST /api/v1/users endpoint
  - [x] Manager-only access (RBAC)
  - [x] Create Supabase Auth user with email
  - [x] Create profile entry in users table
  - [x] Trigger password reset email

- [x] Task 2: Backend - Update user endpoint
  - [x] Create PATCH /api/v1/users/:id endpoint
  - [x] Manager-only access (RBAC)
  - [x] Allow updating weeklyHoursTarget (and optionally firstName, lastName)
  - [x] Validation: hours 0-168

- [x] Task 3: Frontend - Create User Modal
  - [x] Create UserFormModal component (handles both create and edit)
  - [x] Form with email, firstName, lastName, role, weeklyHoursTarget
  - [x] Validation (required fields, email format)
  - [x] Call POST /api/v1/users on submit

- [x] Task 4: Frontend - Edit User Functionality
  - [x] Add edit button on each row in AdminUsersPage
  - [x] Modal for editing weeklyHoursTarget, firstName, lastName
  - [x] Call PATCH /api/v1/users/:id on save

- [x] Task 5: Frontend - Update ProfilePage
  - [x] Make weeklyHoursTarget readonly for employees
  - [x] Show note "Les heures cibles sont definies par votre manager"
  - [x] Keep editable for managers on their own profile

- [x] Task 6: Backend - Update usersService
  - [x] Add createUser() method
  - [x] Add updateUser(id, data) method
  - [x] Use Supabase Admin API for user creation

- [x] Task 7: Write tests
  - [x] Backend: POST /api/v1/users tests (11 tests)
  - [x] Backend: PATCH /api/v1/users/:id tests (9 tests)
  - [x] Frontend: ProfilePage readonly field test

## Dev Notes

### Backend - Create User Endpoint

```javascript
// backend/src/routes/v1/users.routes.js (add to existing)
const { requireRole } = require('../../middleware/rbac.middleware');
const { supabaseAdmin } = require('../../lib/supabase');

// POST /api/v1/users - Create new user (manager only)
router.post('/', authenticate, requireRole(['manager']), async (req, res, next) => {
  try {
    const { email, firstName, lastName, role = 'employee', weeklyHoursTarget = 35 } = req.body;

    // Validate input
    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email, prenom et nom sont requis' }
      });
    }

    if (!['employee', 'manager'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Role invalide' }
      });
    }

    // Create user in Supabase Auth (generates temporary password)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: false, // Will need to verify
      user_metadata: { firstName, lastName, role }
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'Un utilisateur avec cet email existe deja' }
        });
      }
      throw authError;
    }

    // Create profile in users table
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        weekly_hours_target: weeklyHoursTarget
      });

    if (profileError) {
      // Rollback: delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw profileError;
    }

    // Send password reset email so user can set their password
    await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email
    });

    res.status(201).json({
      success: true,
      data: {
        id: authUser.user.id,
        email,
        firstName,
        lastName,
        role,
        weeklyHoursTarget
      }
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/users/:id - Update user (manager only)
router.patch('/:id', authenticate, requireRole(['manager']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { weeklyHoursTarget, firstName, lastName } = req.body;

    // Validate weeklyHoursTarget if provided
    if (weeklyHoursTarget !== undefined) {
      if (weeklyHoursTarget < 0 || weeklyHoursTarget > 168) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Heures cibles doivent etre entre 0 et 168' }
        });
      }
    }

    // Build update object
    const updates = {};
    if (weeklyHoursTarget !== undefined) updates.weekly_hours_target = weeklyHoursTarget;
    if (firstName !== undefined) updates.first_name = firstName;
    if (lastName !== undefined) updates.last_name = lastName;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Aucune donnee a mettre a jour' }
      });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, email, first_name, last_name, role, weekly_hours_target')
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Utilisateur non trouve' }
      });
    }

    res.json({
      success: true,
      data: {
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        role: data.role,
        weeklyHoursTarget: data.weekly_hours_target
      }
    });
  } catch (error) {
    next(error);
  }
});
```

### Frontend - usersService Update

```javascript
// frontend/src/services/usersService.js (add methods)
export const usersService = {
  // ... existing getAll method ...

  async create({ email, firstName, lastName, role = 'employee', weeklyHoursTarget = 35 }) {
    const response = await api.post('/users', {
      email,
      firstName,
      lastName,
      role,
      weeklyHoursTarget
    });
    return response;
  },

  async update(id, { weeklyHoursTarget, firstName, lastName }) {
    const response = await api.patch(`/users/${id}`, {
      weeklyHoursTarget,
      firstName,
      lastName
    });
    return response;
  }
};
```

### Frontend - CreateUserModal Component

```jsx
// frontend/src/components/users/CreateUserModal.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { usersService } from '../../services/usersService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Alert, AlertDescription } from '../ui/Alert';

export default function CreateUserModal({ isOpen, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      role: 'employee',
      weeklyHoursTarget: 35
    }
  });

  const onSubmit = async (data) => {
    try {
      setError(null);
      setIsLoading(true);
      await usersService.create(data);
      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Erreur lors de la creation');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Ajouter un utilisateur</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email', { required: 'Email requis' })}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prenom</Label>
              <Input
                id="firstName"
                {...register('firstName', { required: 'Prenom requis' })}
              />
              {errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                {...register('lastName', { required: 'Nom requis' })}
              />
              {errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select {...register('role')}>
                <option value="employee">Employe</option>
                <option value="manager">Manager</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weeklyHoursTarget">Heures/semaine</Label>
              <Input
                id="weeklyHoursTarget"
                type="number"
                {...register('weeklyHoursTarget', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Minimum 0' },
                  max: { value: 168, message: 'Maximum 168' }
                })}
              />
              {errors.weeklyHoursTarget && <p className="text-sm text-red-500">{errors.weeklyHoursTarget.message}</p>}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creation...' : 'Creer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Frontend - ProfilePage Update

```jsx
// frontend/src/pages/ProfilePage.jsx - Update weeklyHoursTarget field
// In the editable fields section, modify weeklyHoursTarget:

const { user } = useAuth();
const isManager = user?.role === 'manager';

// ...

<div className="space-y-2">
  <Label htmlFor="weeklyHoursTarget">Heures cibles par semaine</Label>
  <Input
    id="weeklyHoursTarget"
    type="number"
    disabled={!isEditing || !isManager}  // <-- Add !isManager condition
    {...register('weeklyHoursTarget', {
      valueAsNumber: true,
      min: { value: 0, message: 'Minimum 0 heures' },
      max: { value: 168, message: 'Maximum 168 heures' }
    })}
    className={!isManager ? 'bg-gray-50' : ''}  // <-- Visual indicator
  />
  {!isManager && (
    <p className="text-xs text-gray-500">Defini par votre manager</p>
  )}
  {errors.weeklyHoursTarget && <p className="text-sm text-red-500">{errors.weeklyHoursTarget.message}</p>}
</div>
```

### Files to Create/Modify

```
backend/src/
├── routes/v1/
│   └── users.routes.js          # ADD POST and PATCH endpoints
└── __tests__/routes/
    └── users.routes.test.js     # ADD tests for new endpoints

frontend/src/
├── components/users/
│   └── CreateUserModal.jsx      # NEW
├── pages/
│   ├── AdminUsersPage.jsx       # MODIFY - add create button, edit functionality
│   └── ProfilePage.jsx          # MODIFY - readonly weeklyHoursTarget for employees
├── services/
│   └── usersService.js          # MODIFY - add create, update methods
└── __tests__/
    ├── components/
    │   └── CreateUserModal.test.jsx  # NEW
    └── pages/
        ├── AdminUsersPage.test.jsx   # MODIFY
        └── ProfilePage.test.jsx      # MODIFY
```

## What User Can Do After This Story

**Changements visibles pour l'utilisateur:**

**Pour un Manager:**
1. Sur `/admin/users`, voir un bouton "Ajouter un utilisateur"
2. Cliquer → modal de creation avec:
   - Email, Prenom, Nom, Role, Heures cibles
3. Creer un nouvel utilisateur → email envoye pour definir son mot de passe
4. Cliquer sur un utilisateur dans la liste → editer ses heures cibles
5. Sur son propre `/profile`, peut toujours editer ses heures cibles

**Pour un Employee:**
1. Sur `/profile`, voit ses heures cibles en lecture seule
2. Voit le message "Defini par votre manager"
3. Ne peut pas modifier ce champ

**Pour tester manuellement:**

1. **Test creation utilisateur (manager):**
   - Se connecter en tant que manager
   - Aller sur `/admin/users`
   - Cliquer "Ajouter un utilisateur"
   - Remplir le formulaire avec un email valide
   - Soumettre → utilisateur cree, email envoye
   - Voir le nouvel utilisateur dans la liste

2. **Test edition heures (manager):**
   - Sur `/admin/users`, cliquer sur un utilisateur
   - Modifier ses heures cibles
   - Enregistrer → changement persiste

3. **Test profil employee:**
   - Se connecter en tant qu'employee
   - Aller sur `/profile`
   - Verifier que "Heures cibles" est grise/non-editable
   - Verifier le message "Defini par votre manager"

**Prerequis pour tester:**
- Compte manager existant
- Compte employee existant
- Supabase configure avec Admin API key

## E2E Testing Notes

**Scenarios de test end-to-end:**

1. Manager cree un nouvel employee → employee recoit email → employee se connecte
2. Manager modifie heures employee → employee voit changement sur son profil
3. Employee essaie de modifier ses heures → impossible

**Commandes de test backend:**

```bash
# Create user (manager auth required)
curl -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer MANAGER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","firstName":"Jean","lastName":"Dupont","role":"employee","weeklyHoursTarget":40}'

# Update user hours (manager auth required)
curl -X PATCH http://localhost:3000/api/v1/users/USER_ID \
  -H "Authorization: Bearer MANAGER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"weeklyHoursTarget":35}'

# Employee tries to update own hours (should fail via profile endpoint now)
# The profile endpoint should be updated to reject weeklyHoursTarget changes for employees
```

**Stories liees pour test complet:**
- Story 2-5 (User Profile Endpoints) - Profile update behavior
- Story 2-7 (Users List Endpoint) - Users list for managers
- Story 2-13 (Admin Users Page) - Base UI for manager user management

## Frontend/Backend Balance

**Type de story:** full-stack

**Backend (cette story):**
- POST /api/v1/users - Create user (manager only)
- PATCH /api/v1/users/:id - Update user (manager only)
- Update profile endpoint to restrict weeklyHoursTarget for employees

**Frontend (cette story):**
- CreateUserModal component
- Edit functionality on AdminUsersPage
- ProfilePage modification for readonly weeklyHoursTarget

**Integration:**
- CreateUserModal calls POST /api/v1/users
- AdminUsersPage edit calls PATCH /api/v1/users/:id
- ProfilePage uses existing profile endpoint with new restrictions

## References

- Story 2-5: User Profile Endpoints (to modify for employee restrictions)
- Story 2-7: Users List Endpoint (provides GET /api/v1/users)
- Story 2-13: Admin Users Page (base UI to extend)
- Supabase Admin API: https://supabase.com/docs/reference/javascript/auth-admin-createuser

---

## Dev Agent Record

### Implementation Summary

**Date:** 2026-01-11
**Agent:** Amelia (Dev Agent)

### Files Created

| File | Description |
|------|-------------|
| `frontend/src/components/ui/Modal.jsx` | Reusable modal component with backdrop, escape key handling |
| `frontend/src/components/users/UserFormModal.jsx` | User form modal for create/edit operations |

### Files Modified

| File | Changes |
|------|---------|
| `backend/validators/users.validator.js` | Added `createUserSchema` and `updateUserSchema` for validation |
| `backend/services/users.service.js` | Added `createUser()` and `updateUser()` methods using supabaseAdmin |
| `backend/controllers/users.controller.js` | Added `create` and `update` controller methods |
| `backend/routes/users.routes.js` | Added POST `/api/v1/users` and PATCH `/api/v1/users/:id` routes |
| `backend/tests/routes/users.routes.test.js` | Added 20 new tests for create/update user endpoints |
| `frontend/src/services/usersService.js` | Added `create()` and `update()` methods |
| `frontend/src/pages/AdminUsersPage.jsx` | Added "Nouvel utilisateur" button, edit button per row, modal integration |
| `frontend/src/pages/ProfilePage.jsx` | Made weeklyHoursTarget readonly for employees |
| `frontend/src/__tests__/pages/ProfilePage.test.jsx` | Updated tests for employee readonly field, added new test |

### Test Results

- **Backend:** 293 tests passing (including 20 new Story 2.14 tests)
- **Frontend:** 144 tests passing (including 1 new Story 2.14 test)

### Key Implementation Decisions

1. **Combined UserFormModal:** Created a single modal component that handles both create and edit modes, reducing code duplication.

2. **Role-based field visibility:** In edit mode, email and role are displayed as readonly fields since they cannot be changed.

3. **Employee weeklyHoursTarget restriction:** The field is disabled for employees with a visual indicator (gray background) and explanatory text.

4. **Supabase Admin API:** Used `supabaseAdmin.auth.admin.createUser()` for user creation with email confirmation auto-enabled.

5. **Rollback on error:** If profile creation fails after auth user creation, the auth user is deleted to maintain consistency.

### Acceptance Criteria Verification

| AC | Status | Notes |
|----|--------|-------|
| AC#1 | PASS | Create user modal accessible from AdminUsersPage |
| AC#2 | PASS | User created in Supabase Auth + profiles table |
| AC#3 | PASS | Edit button on each row, modal for editing |
| AC#4 | PASS | Employee cannot modify weeklyHoursTarget |
| AC#5 | PASS | Manager can edit own weeklyHoursTarget |
| AC#6 | PASS | Validation errors shown for invalid data |
