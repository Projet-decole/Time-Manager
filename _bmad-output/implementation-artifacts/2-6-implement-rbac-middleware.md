# Story 2.6: Implement RBAC Middleware

Status: ready-for-dev

## Story

As a **developer**,
I want role-based access control middleware,
So that routes can restrict access by user role.

## Acceptance Criteria

1. **Given** a route protected with `rbac('manager')`
   **When** a manager accesses it
   **Then** access is granted

2. **Given** a route protected with `rbac('manager')`
   **When** an employee accesses it
   **Then** response is 403 Forbidden with `{ success: false, error: { code: "FORBIDDEN" } }`

3. **Given** role inheritance (manager includes employee permissions)
   **When** a manager accesses a route with `rbac('employee')`
   **Then** access is granted (FR7: Manager inherits Employee permissions)

4. **Given** RBAC middleware without prior authentication
   **When** req.user is not populated
   **Then** response is 401 Unauthorized

## Tasks / Subtasks

- [ ] Task 1: Implement RBAC middleware (AC: #1-4)
  - [ ] Update `backend/middleware/rbac.middleware.js`
  - [ ] Create rbac(...allowedRoles) factory function
  - [ ] Implement role hierarchy (manager includes employee)
  - [ ] Return 403 if role not allowed

- [ ] Task 2: Write comprehensive tests (AC: #1-4)
  - [ ] Create `backend/tests/middleware/rbac.middleware.test.js`
  - [ ] Test all role combinations

## Dev Notes

### Implementation

```javascript
// middleware/rbac.middleware.js
const AppError = require('../utils/AppError');

const ROLE_HIERARCHY = {
  employee: ['employee'],
  manager: ['manager', 'employee']  // Manager can do everything employee can
};

const rbac = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  }

  const userRoles = ROLE_HIERARCHY[req.user.role] || [req.user.role];
  const hasPermission = allowedRoles.some(role => userRoles.includes(role));

  if (!hasPermission) {
    return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
  }
  next();
};

module.exports = { rbac, ROLE_HIERARCHY };
```

### Usage Pattern

```javascript
// Manager only
router.post('/teams', authenticate, rbac('manager'), controller.create);

// Employee (manager can also access due to inheritance)
router.get('/my-entries', authenticate, rbac('employee'), controller.getMyEntries);
```

### E2E Testing Notes

**Test manuel:**
1. Créer 2 utilisateurs dans Supabase: un employee, un manager
2. Se connecter en tant qu'employee, tenter d'accéder à une route manager-only → 403
3. Se connecter en tant que manager, accéder à la même route → 200

## What User Can Do After This Story

**Backend infrastructure seulement** - Pas de changement visible pour l'utilisateur final.

**Impact technique:**
- Les routes peuvent maintenant être protégées par rôle
- Les managers peuvent accéder aux routes employee
- Les employees ne peuvent pas accéder aux routes manager-only
- Préparation pour les fonctionnalités manager (users list, validation timesheets, etc.)

## Dev Agent Record

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
