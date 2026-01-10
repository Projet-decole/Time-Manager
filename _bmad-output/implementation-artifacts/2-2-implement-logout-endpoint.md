# Story 2.2: Implement Logout Endpoint

Status: ready-for-dev

## Story

As an **authenticated user**,
I want to log out from the application,
So that my session is invalidated and secure.

## Acceptance Criteria

1. **Given** a user is logged in with valid session
   **When** POST `/api/v1/auth/logout` is called
   **Then** Supabase Auth session is invalidated
   **And** response is `{ success: true, data: { message: "Logged out successfully" } }`

2. **Given** the user tries to use the old token after logout
   **When** any protected endpoint is called
   **Then** response is 401 Unauthorized

3. **Given** logout is called without authentication
   **When** request has no Authorization header
   **Then** response is 401 Unauthorized (must be logged in to log out)

## Tasks / Subtasks

- [ ] Task 1: Add logout route (AC: #1, #3)
  - [ ] Add POST `/logout` route to `backend/routes/auth.routes.js`
  - [ ] Apply authenticate middleware to logout route

- [ ] Task 2: Implement logout in auth service (AC: #1)
  - [ ] Add `logout(accessToken)` method to `backend/services/auth.service.js`
  - [ ] Use supabase.auth.signOut() to invalidate session
  - [ ] Handle errors appropriately

- [ ] Task 3: Add logout controller (AC: #1)
  - [ ] Add logout handler to `backend/controllers/auth.controller.js`
  - [ ] Extract token from request
  - [ ] Call authService.logout()
  - [ ] Return success response

- [ ] Task 4: Write tests (AC: #1-3)
  - [ ] Add logout tests to `backend/tests/routes/auth.routes.test.js`
  - [ ] Test successful logout returns 200
  - [ ] Test logout without auth returns 401
  - [ ] Add service tests for logout

## Dev Notes

### Architecture Compliance

**Endpoint:** `POST /api/v1/auth/logout`
**Auth Required:** Yes (authenticate middleware)

### Supabase Logout

```javascript
const { supabase } = require('../utils/supabase');

const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new AppError('Logout failed', 500, 'LOGOUT_FAILED');
  }
  return { message: 'Logged out successfully' };
};
```

### Route Definition

```javascript
// routes/auth.routes.js
const { authenticate } = require('../middleware/auth.middleware');

router.post('/logout', authenticate, authController.logout);
```

### Response Format

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### Dependencies

- Requires Story 2.1 (login endpoint) completed
- Requires Story 2.3 (auth middleware) for protection - can use placeholder

### Files to Modify

```
backend/
├── routes/auth.routes.js          # ADD logout route
├── controllers/auth.controller.js  # ADD logout handler
├── services/auth.service.js        # ADD logout method
└── tests/routes/auth.routes.test.js # ADD logout tests
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2]
- [Source: backend/middleware/auth.middleware.js - Placeholder exists]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
