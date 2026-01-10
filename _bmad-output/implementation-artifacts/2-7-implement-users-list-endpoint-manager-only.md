# Story 2.7: Implement Users List Endpoint (Manager Only)

Status: ready-for-dev

## Story

As a **manager**,
I want to view all users in the system,
So that I can manage team assignments and view employee data.

## Acceptance Criteria

1. **Given** an authenticated manager
   **When** GET `/api/v1/users` is called
   **Then** response includes list of all users with their profiles
   **And** supports pagination via `?page=1&limit=20`
   **And** supports filtering by role via `?role=employee`
   **And** response format is `{ success: true, data: [...], meta: { pagination: {...} } }`

2. **Given** an authenticated employee
   **When** GET `/api/v1/users` is called
   **Then** response is 403 Forbidden

3. **Given** pagination parameters
   **When** `?page=2&limit=10` is provided
   **Then** response includes correct page of results
   **And** meta.pagination includes page, limit, total, totalPages

## Tasks / Subtasks

- [ ] Task 1: Add users list route (AC: #1, #2)
  - [ ] Add GET `/` route to `backend/routes/users.routes.js`
  - [ ] Apply authenticate middleware
  - [ ] Apply rbac('manager') middleware

- [ ] Task 2: Add query validator (AC: #1, #3)
  - [ ] Add getUsersQuerySchema to `backend/validators/users.validator.js`
  - [ ] Validate page, limit, role parameters

- [ ] Task 3: Implement list service (AC: #1, #3)
  - [ ] Add `getAllUsers(filters, pagination)` to `backend/services/users.service.js`
  - [ ] Query profiles table with filters
  - [ ] Apply pagination
  - [ ] Return data and pagination meta

- [ ] Task 4: Add list controller (AC: #1)
  - [ ] Add getAll handler to `backend/controllers/users.controller.js`
  - [ ] Use paginatedResponse helper

- [ ] Task 5: Write tests (AC: #1-3)
  - [ ] Test manager gets user list
  - [ ] Test employee gets 403
  - [ ] Test pagination works correctly
  - [ ] Test role filter works

## Dev Notes

### Architecture Compliance

**Endpoint:** `GET /api/v1/users`
**Auth Required:** Yes
**Role Required:** Manager only

### Route Definition

```javascript
// routes/users.routes.js
const { authenticate } = require('../middleware/auth.middleware');
const { rbac } = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { getUsersQuerySchema } = require('../validators/users.validator');

router.get('/',
  authenticate,
  rbac('manager'),
  validate(getUsersQuerySchema, 'query'),
  usersController.getAll
);
```

### Query Validation

```javascript
// validators/users.validator.js
const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['employee', 'manager']).optional()
});
```

### Service Implementation

```javascript
// services/users.service.js
const getAllUsers = async (filters = {}, pagination = {}) => {
  const { page = 1, limit = 20 } = pagination;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role, weekly_hours_target, created_at', { count: 'exact' });

  // Apply role filter
  if (filters.role) {
    query = query.eq('role', filters.role);
  }

  // Apply pagination
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new AppError('Failed to fetch users', 500, 'DATABASE_ERROR');
  }

  return {
    data: data.map(snakeToCamel),
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  };
};
```

### Controller Implementation

```javascript
// controllers/users.controller.js
const getAll = asyncHandler(async (req, res) => {
  const { page, limit, role } = req.query;
  const result = await usersService.getAllUsers(
    { role },
    { page, limit }
  );
  return paginatedResponse(res, result.data, result.pagination);
});
```

### Response Format

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "employee",
      "weeklyHoursTarget": 35,
      "createdAt": "2026-01-10T10:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

### Files to Modify

```
backend/
├── routes/users.routes.js          # ADD getAll route
├── controllers/users.controller.js  # ADD getAll handler
├── services/users.service.js        # ADD getAllUsers method
├── validators/users.validator.js    # ADD query schema
└── tests/routes/users.routes.test.js # ADD list tests
```

### Dependencies

- Requires Story 2.3 (auth middleware) completed
- Requires Story 2.6 (RBAC middleware) completed

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.7]
- [Source: backend/utils/pagination.js - Existing pagination helper]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
