# Story 2.3: Implement Authentication Middleware

Status: done

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

- [x] Task 1: Implement authenticate middleware (AC: #1-4)
  - [x] Update `backend/middleware/auth.middleware.js`
  - [x] Extract Bearer token from Authorization header
  - [x] Validate token with supabase.auth.getUser(token)
  - [x] Fetch user profile from profiles table
  - [x] Attach user object to req.user
  - [x] Handle all error cases with AppError

- [x] Task 2: Create middleware tests (AC: #1-4)
  - [x] Create `backend/tests/middleware/auth.middleware.test.js`
  - [x] Test valid token populates req.user
  - [x] Test missing header returns 401
  - [x] Test invalid token returns 401
  - [x] Test malformed header returns 401
  - [x] Test expired token returns 401

- [x] Task 3: Apply to protected routes (AC: #1)
  - [x] Update logout route to use real authenticate middleware
  - [x] Document middleware usage pattern

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

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- RED phase: Tests written first, all 17 middleware tests failing with placeholder implementation
- GREEN phase: Implemented real Supabase authentication, all 17 tests passing
- Full regression suite: 193/193 tests passing, 99.57% coverage

### Completion Notes List

- Implemented `authenticate` middleware with Supabase token validation (`supabase.auth.getUser(token)`)
- Middleware fetches user profile from `profiles` table to include role in `req.user`
- Transforms snake_case profile fields to camelCase using existing `snakeToCamel` utility
- Supports RFC 7235 case-insensitive Bearer scheme (Bearer, bearer, BEARER, etc.)
- All error cases handled with AppError and passed to Express error middleware via `next(error)`
- Updated auth.routes.test.js to mock `supabase.auth.getUser` for logout endpoint tests
- req.user shape: `{ id, email, firstName, lastName, role, weeklyHoursTarget }`

### File List

- `backend/middleware/auth.middleware.js` - MODIFIED: Replaced placeholder with real Supabase authentication + profile error logging
- `backend/tests/middleware/auth.middleware.test.js` - MODIFIED: 18 comprehensive tests for all ACs (added profile error test)
- `backend/tests/routes/auth.routes.test.js` - MODIFIED: Added getUser mock for auth middleware

### Change Log

| Date | Change |
|------|--------|
| 2026-01-10 | Implemented authentication middleware with Supabase token validation (Story 2.3) |
| 2026-01-10 | Code Review: Fixed silent profile error handling (M1), added test for profile query failure (M2) |

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.5
**Date:** 2026-01-10
**Outcome:** ✅ APPROVED (after fixes)

### Issues Found & Fixed

| ID | Severity | Description | Resolution |
|----|----------|-------------|------------|
| M1 | MEDIUM | Profile fetch errors silently ignored | Added `console.warn` logging |
| M2 | MEDIUM | No test for profile query network failure | Added test case (18 tests now) |
| M3 | MEDIUM | Double sequential DB calls (latency) | Noted for future optimization |

### Notes for Future Optimization

- Consider caching user profiles in-memory for frequently accessed users
- Rate limiting on auth middleware could prevent brute force attacks

### Verification

- All 50 auth tests passing
- auth.middleware.js: 100% coverage
