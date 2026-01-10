# Story 2.3: Implement Authentication Middleware

Status: ready-for-dev

## Story

As a **developer**,
I want authentication middleware that validates JWT tokens,
So that protected routes are secured.

## Acceptance Criteria

1. **Given** a request with valid Bearer token in Authorization header
   **When** the auth middleware processes the request
   **Then** `req.user` is populated with user data from Supabase
   **And** `req.user` includes id, email, and role
   **And** the request proceeds to the next handler

2. **Given** a request without Authorization header
   **When** the auth middleware processes the request
   **Then** response is `{ success: false, error: { code: "UNAUTHORIZED", message: "..." } }` with 401 status

3. **Given** a request with expired or invalid token
   **When** the auth middleware processes the request
   **Then** response is 401 with appropriate error message

4. **Given** a request with malformed Authorization header (not "Bearer <token>")
   **When** the auth middleware processes the request
   **Then** response is 401 with "Invalid authorization format"

## Tasks / Subtasks

- [ ] Task 1: Implement authenticate middleware (AC: #1-4)
  - [ ] Update `backend/middleware/auth.middleware.js`
  - [ ] Extract Bearer token from Authorization header
  - [ ] Validate token with supabase.auth.getUser(token)
  - [ ] Fetch user profile from profiles table
  - [ ] Attach user object to req.user
  - [ ] Handle all error cases with AppError

- [ ] Task 2: Create middleware tests (AC: #1-4)
  - [ ] Create `backend/tests/middleware/auth.middleware.test.js`
  - [ ] Test valid token populates req.user
  - [ ] Test missing header returns 401
  - [ ] Test invalid token returns 401
  - [ ] Test malformed header returns 401
  - [ ] Test expired token returns 401

- [ ] Task 3: Apply to protected routes (AC: #1)
  - [ ] Update logout route to use real authenticate middleware
  - [ ] Document middleware usage pattern

## Dev Notes

### Architecture Compliance

**Location:** `backend/middleware/auth.middleware.js`
**Pattern:** Express middleware with async handling

### Implementation

```javascript
// backend/middleware/auth.middleware.js
const { supabase } = require('../utils/supabase');
const AppError = require('../utils/AppError');
const { snakeToCamel } = require('../utils/transformers');

const authenticate = async (req, res, next) => {
  try {
    // Extract token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AppError('Authorization header required', 401, 'UNAUTHORIZED');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new AppError('Invalid authorization format', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.replace('Bearer ', '');

    // Validate with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AppError('Invalid or expired token', 401, 'UNAUTHORIZED');
    }

    // Fetch profile for role
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, role, weekly_hours_target')
      .eq('id', user.id)
      .single();

    // Attach to request
    req.user = {
      id: user.id,
      email: user.email,
      ...snakeToCamel(profile || {})
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate };
```

### req.user Object Shape

```javascript
req.user = {
  id: "uuid",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  role: "employee", // or "manager"
  weeklyHoursTarget: 35
}
```

### Error Responses

| Scenario | Status | Code |
|----------|--------|------|
| No auth header | 401 | UNAUTHORIZED |
| Invalid format | 401 | UNAUTHORIZED |
| Invalid token | 401 | UNAUTHORIZED |
| Expired token | 401 | UNAUTHORIZED |

### Files to Modify

```
backend/
├── middleware/auth.middleware.js      # REPLACE placeholder
└── tests/middleware/auth.middleware.test.js # NEW
```

### Test Mocking

```javascript
// Mock supabase.auth.getUser
jest.mock('../utils/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}));
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3]
- [Source: backend/middleware/auth.middleware.js - Current placeholder]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
