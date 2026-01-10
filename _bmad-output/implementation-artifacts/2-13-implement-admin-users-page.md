# Story 2.13: Implement Admin Users Page (Manager Only)

Status: ready-for-dev

## Story

As a **manager**,
I want to see a list of all users,
So that I can view my team members and their information.

## Acceptance Criteria

1. **Given** I am logged in as a manager
   **When** I navigate to `/admin/users`
   **Then** I see a table of all users with: Nom, Prenom, Email, Role, Heures cibles

2. **Given** the users list
   **When** there are many users
   **Then** pagination is displayed and functional

3. **Given** I want to filter users
   **When** I select a role filter (Tous, Employee, Manager)
   **Then** the list is filtered accordingly

4. **Given** I am an employee
   **When** I try to access `/admin/users`
   **Then** I see the "Acces refuse" page

## Tasks / Subtasks

- [ ] Task 1: Create AdminUsersPage
  - [ ] Create `frontend/src/pages/AdminUsersPage.jsx`
  - [ ] Fetch users from API with pagination
  - [ ] Display in table format

- [ ] Task 2: Add role filter
  - [ ] Dropdown to filter by role
  - [ ] Update API call with filter

- [ ] Task 3: Implement pagination
  - [ ] Previous/Next buttons
  - [ ] Page info display
  - [ ] Handle page changes

- [ ] Task 4: Add usersService
  - [ ] Create `frontend/src/services/usersService.js`
  - [ ] getAllUsers(page, limit, role) method

- [ ] Task 5: Write tests
  - [ ] Test table renders
  - [ ] Test pagination
  - [ ] Test filtering

## Dev Notes

### usersService

```javascript
// frontend/src/services/usersService.js
import api from '../lib/api';

export const usersService = {
  async getAll({ page = 1, limit = 20, role } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (role) params.append('role', role);

    const response = await api.get(`/users?${params}`);
    return response; // { success, data, meta: { pagination } }
  }
};
```

### AdminUsersPage Implementation

```jsx
// frontend/src/pages/AdminUsersPage.jsx
import { useState, useEffect } from 'react';
import { usersService } from '../services/usersService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [roleFilter, setRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async (page = 1, role = roleFilter) => {
    try {
      setIsLoading(true);
      const response = await usersService.getAll({
        page,
        limit: 20,
        role: role === 'all' ? undefined : role
      });
      setUsers(response.data);
      setPagination(response.meta.pagination);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
    fetchUsers(1, value);
  };

  const handlePageChange = (newPage) => {
    fetchUsers(newPage);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6" />
              <CardTitle>Gestion des utilisateurs</CardTitle>
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrer par role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="employee">Employes</SelectItem>
                <SelectItem value="manager">Managers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prenom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Heures/semaine</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        Aucun utilisateur trouve
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.lastName}</TableCell>
                        <TableCell>{user.firstName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'manager' ? 'default' : 'secondary'}>
                            {user.role === 'manager' ? 'Manager' : 'Employe'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{user.weeklyHoursTarget}h</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Page {pagination.page} sur {pagination.totalPages} ({pagination.total} utilisateurs)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" /> Precedent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Suivant <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
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
│   └── AdminUsersPage.jsx
├── services/
│   └── usersService.js
└── __tests__/pages/
    └── AdminUsersPage.test.jsx
```

### Additional shadcn Components

```bash
npx shadcn@latest add table select
```

## What User Can Do After This Story

**EPIC 2 COMPLETE ! Interface manager fonctionnelle !**

**Un manager peut maintenant:**
1. Se connecter
2. Voir "Utilisateurs" dans la navigation
3. Cliquer dessus → voir la liste des utilisateurs
4. Voir pour chaque utilisateur: Nom, Prenom, Email, Role, Heures cibles
5. Filtrer par role (Tous / Employes / Managers)
6. Naviguer entre les pages si beaucoup d'utilisateurs

**Un employee:**
- Ne voit pas "Utilisateurs" dans la nav
- Si il tape /admin/users → "Acces refuse"

**E2E Test manuel COMPLET pour Epic 2:**

1. **Test Connexion:**
   - Aller sur / → redirige vers /login
   - Entrer mauvais password → erreur
   - Entrer bon password → redirige vers /dashboard

2. **Test Mot de passe oublie:**
   - Cliquer "Mot de passe oublie" → page forgot
   - Entrer email → message succes
   - Recevoir email, cliquer lien → page reset
   - Entrer nouveau password → succes
   - Se connecter avec nouveau password → OK

3. **Test Profil:**
   - Aller sur /profile
   - Verifier infos affichees
   - Modifier prenom → enregistrer → succes
   - Rafraichir → changement persiste

4. **Test Navigation:**
   - Header affiche logo, nom utilisateur
   - Menu dropdown fonctionne
   - Deconnexion retourne a /login

5. **Test Roles (employee):**
   - Se connecter en tant qu'employee
   - Pas de lien "Utilisateurs" visible
   - Taper /admin/users → "Acces refuse"

6. **Test Roles (manager):**
   - Se connecter en tant que manager
   - Lien "Utilisateurs" visible
   - Cliquer → voir liste utilisateurs
   - Filtrer par role → fonctionne
   - Pagination si >20 users

## Epic 2 Completion Summary

Apres cette story, l'utilisateur dispose de:

| Fonctionnalite | Employee | Manager |
|---------------|----------|---------|
| Se connecter | ✅ | ✅ |
| Reset password | ✅ | ✅ |
| Voir/modifier profil | ✅ | ✅ |
| Se deconnecter | ✅ | ✅ |
| Voir liste utilisateurs | ❌ | ✅ |

**Pages disponibles:**
- `/login` - Connexion
- `/forgot-password` - Mot de passe oublie
- `/reset-password` - Reset password (depuis email)
- `/dashboard` - Tableau de bord (placeholder)
- `/profile` - Mon profil
- `/admin/users` - Liste utilisateurs (manager only)
- `/access-denied` - Acces refuse

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
