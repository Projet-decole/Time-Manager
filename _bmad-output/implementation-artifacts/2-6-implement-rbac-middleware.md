# Story 2.6: Implement RBAC Middleware

Status: ready-for-dev

## Story

As a **developer**,
I want role-based access control middleware,
So that routes can restrict access by user role.

## Acceptance Criteria

1. **Given** a middleware factory `rbac(...allowedRoles)`
   **When** applied to a route with `rbac('manager')`
   **Then** only users with role 'manager' can access

2. **Given** a user with role 'employee' accessing manager-only route
   **When** the RBAC middleware processes the request
   **Then** response is `{ success: false, error: { code: "FORBIDDEN", message: "..." } }` with 403 status

3. **Given** role inheritance is configured (manager inherits employee permissions)
   **When** a manager accesses an employee-only route
   **Then** access is granted (FR7: Manager inherits Employee permissions)

4. **Given** RBAC middleware is applied after authenticate middleware
   **When** req.user is not populated
   **Then** middleware throws appropriate error

## Tasks / Subtasks

- [ ] Task 1: Implement RBAC middleware (AC: #1-4)
  - [ ] Update `backend/middleware/rbac.middleware.js`
  - [ ] Create rbac factory function that accepts allowed roles
  - [ ] Implement role inheritance (manager includes employee)
  - [ ] Check req.user.role against allowed roles
  - [ ] Throw 403 FORBIDDEN if role not allowed

- [ ] Task 2: Define role hierarchy (AC: #3)
  - [ ] Create role constants and hierarchy configuration
  - [ ] Manager inherits all employee permissions
  - [ ] Document role hierarchy

- [ ] Task 3: Write tests (AC: #1-4)
  - [ ] Create `backend/tests/middleware/rbac.middleware.test.js`
  - [ ] Test manager-only route blocks employee
  - [ ] Test manager-only route allows manager
  - [ ] Test employee-only route allows both
  - [ ] Test missing req.user returns error

## Dev Notes

### Architecture Compliance

**Location:** `backend/middleware/rbac.middleware.js`
**Pattern:** Middleware factory function

### Implementation

```javascript
// backend/middleware/rbac.middleware.js
const AppError = require('../utils/AppError');

/**
 * Role hierarchy - higher roles inherit lower role permissions
 * Manager includes all Employee permissions (FR7)
 */
const ROLE_HIERARCHY = {
  employee: ['employee'],
  manager: ['manager', 'employee']
};

/**
 * RBAC middleware factory
 * @param {...string} allowedRoles - Roles allowed to access the route
 * @returns {Function} Express middleware
 */
const rbac = (...allowedRoles) => {
  return (req, res, next) => {
    // Ensure authenticate middleware ran first
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const userRole = req.user.role;

    if (!userRole) {
      return next(new AppError('User role not found', 403, 'FORBIDDEN'));
    }

    // Get all roles this user has (including inherited)
    const userRoles = ROLE_HIERARCHY[userRole] || [userRole];

    // Check if any of the user's roles match allowed roles
    const hasPermission = allowedRoles.some(role => userRoles.includes(role));

    if (!hasPermission) {
      return next(new AppError(
        'Insufficient permissions to access this resource',
        403,
        'FORBIDDEN'
      ));
    }

    next();
  };
};

module.exports = { rbac, ROLE_HIERARCHY };
```

### Usage Pattern

```javascript
// routes/teams.routes.js
const { authenticate } = require('../middleware/auth.middleware');
const { rbac } = require('../middleware/rbac.middleware');

// Manager only
router.post('/teams', authenticate, rbac('manager'), teamsController.create);

// Employee and Manager (explicit)
router.get('/teams', authenticate, rbac('employee', 'manager'), teamsController.getAll);

// Employee (manager inherits)
router.get('/my-profile', authenticate, rbac('employee'), usersController.getMe);
```

### Role Hierarchy (FR7)

| Role | Inherits | Can Access |
|------|----------|------------|
| employee | - | Employee routes |
| manager | employee | Manager + Employee routes |

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions to access this resource"
  }
}
```

### Files to Modify

```
backend/
├── middleware/rbac.middleware.js      # REPLACE placeholder
└── tests/middleware/rbac.middleware.test.js # NEW
```

### Current Placeholder

```javascript
// Current placeholder to replace:
const rbac = (...roles) => (req, res, next) => {
  // TODO: Implement role-based access control
  next();
};
```

### Test Examples

```javascript
describe('rbac middleware', () => {
  it('should allow manager to access manager-only route', () => {
    const middleware = rbac('manager');
    const req = { user: { role: 'manager' } };
    const next = jest.fn();

    middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should block employee from manager-only route', () => {
    const middleware = rbac('manager');
    const req = { user: { role: 'employee' } };
    const next = jest.fn();

    middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it('should allow manager to access employee route (inheritance)', () => {
    const middleware = rbac('employee');
    const req = { user: { role: 'manager' } };
    const next = jest.fn();

    middleware(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });
});
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.6]
- [Source: _bmad-output/planning-artifacts/architecture.md#RBAC Rules]
- [Source: backend/middleware/rbac.middleware.js - Current placeholder]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
