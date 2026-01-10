# Story 2.5: Implement User Profile Endpoints

Status: ready-for-dev

## Story

As an **authenticated user**,
I want to view and update my profile,
So that my personal information is accurate.

## Acceptance Criteria

1. **Given** an authenticated user
   **When** GET `/api/v1/users/me` is called
   **Then** response includes `{ success: true, data: { id, email, firstName, lastName, role, weeklyHoursTarget } }`

2. **Given** an authenticated user
   **When** PATCH `/api/v1/users/me` is called with `{ firstName, lastName, weeklyHoursTarget }`
   **Then** the profile is updated in database
   **And** response includes updated profile data
   **And** email and role cannot be changed via this endpoint

3. **Given** invalid data (empty firstName)
   **When** PATCH is called
   **Then** response is 400 with validation error details

4. **Given** unauthenticated request
   **When** any profile endpoint is called
   **Then** response is 401 Unauthorized

## Tasks / Subtasks

- [ ] Task 1: Create users routes (AC: #1, #2, #4)
  - [ ] Create `backend/routes/users.routes.js`
  - [ ] Add GET `/me` route with authenticate middleware
  - [ ] Add PATCH `/me` route with authenticate middleware
  - [ ] Register in `backend/routes/index.js` under `/api/v1/users`

- [ ] Task 2: Create users validator (AC: #3)
  - [ ] Create `backend/validators/users.validator.js`
  - [ ] Define updateProfileSchema (firstName, lastName, weeklyHoursTarget optional)
  - [ ] Ensure email and role not in schema (cannot be updated)

- [ ] Task 3: Create users service (AC: #1, #2)
  - [ ] Create `backend/services/users.service.js`
  - [ ] Implement `getProfile(userId)` - fetch from profiles table
  - [ ] Implement `updateProfile(userId, data)` - update profiles table
  - [ ] Transform responses to camelCase

- [ ] Task 4: Create users controller (AC: #1-3)
  - [ ] Create `backend/controllers/users.controller.js`
  - [ ] Implement getMe handler (use req.user.id)
  - [ ] Implement updateMe handler with validation

- [ ] Task 5: Write tests (AC: #1-4)
  - [ ] Create `backend/tests/routes/users.routes.test.js`
  - [ ] Test GET /me returns profile
  - [ ] Test PATCH /me updates allowed fields
  - [ ] Test PATCH /me ignores email/role
  - [ ] Test validation errors
  - [ ] Test 401 without auth

## Dev Notes

### Architecture Compliance

**Endpoints:**
- `GET /api/v1/users/me` - Get own profile
- `PATCH /api/v1/users/me` - Update own profile

**Both require authentication**

### Service Implementation

```javascript
// services/users.service.js
const { supabase } = require('../utils/supabase');
const AppError = require('../utils/AppError');
const { snakeToCamel, camelToSnake } = require('../utils/transformers');

const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role, weekly_hours_target, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new AppError('Profile not found', 404, 'NOT_FOUND');
  }

  return snakeToCamel(data);
};

const updateProfile = async (userId, updateData) => {
  // Only allow specific fields
  const allowedFields = ['firstName', 'lastName', 'weeklyHoursTarget'];
  const filtered = {};
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      filtered[field] = updateData[field];
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...camelToSnake(filtered),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new AppError('Update failed', 500, 'UPDATE_FAILED');
  }

  return snakeToCamel(data);
};

module.exports = { getProfile, updateProfile };
```

### Validation Schema

```javascript
// validators/users.validator.js
const { z } = require('zod');

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name required').optional(),
  lastName: z.string().min(1, 'Last name required').optional(),
  weeklyHoursTarget: z.number().int().min(0).max(168).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided'
});

module.exports = { updateProfileSchema };
```

### Controller Implementation

```javascript
// controllers/users.controller.js
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');
const usersService = require('../services/users.service');

const getMe = asyncHandler(async (req, res) => {
  const profile = await usersService.getProfile(req.user.id);
  return successResponse(res, profile);
});

const updateMe = asyncHandler(async (req, res) => {
  const profile = await usersService.updateProfile(req.user.id, req.body);
  return successResponse(res, profile);
});

module.exports = { getMe, updateMe };
```

### Response Format

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "employee",
    "weeklyHoursTarget": 35,
    "createdAt": "2026-01-10T10:00:00Z",
    "updatedAt": "2026-01-10T10:00:00Z"
  }
}
```

### Files to Create

```
backend/
├── routes/users.routes.js          # NEW
├── controllers/users.controller.js  # NEW
├── services/users.service.js        # NEW
├── validators/users.validator.js    # NEW
└── tests/
    ├── routes/users.routes.test.js  # NEW
    └── services/users.service.test.js # NEW
```

### Update Existing

```
backend/routes/index.js            # Add users routes
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
