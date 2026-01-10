# Story 2.1: Implement Supabase Auth Integration

Status: done

## Story

As an **employee or manager**,
I want to log in with my email and password,
So that I can access the application securely.

## Acceptance Criteria

1. **Given** a user with valid credentials exists in Supabase Auth
   **When** POST `/api/v1/auth/login` is called with `{ email, password }`
   **Then** Supabase Auth validates credentials
   **And** response includes `{ success: true, data: { user, session } }`
   **And** session contains access_token and refresh_token
   **And** profile data is fetched and included in response

2. **Given** invalid credentials are provided
   **When** login is attempted
   **Then** response is `{ success: false, error: { code: "INVALID_CREDENTIALS", message: "..." } }` with 401 status

3. **Given** missing email or password in request body
   **When** login is attempted
   **Then** response is 400 with VALIDATION_ERROR code and field-level details

4. **Given** successful authentication
   **When** response is returned
   **Then** user object includes: id, email, role (from profiles table)
   **And** session object includes: access_token, refresh_token, expires_at

## Tasks / Subtasks

- [x] Task 1: Create auth routes file (AC: #1-4)
  - [x] Create `backend/routes/auth.routes.js`
  - [x] Define POST `/login` route
  - [x] Register routes in `backend/routes/index.js` under `/api/v1/auth`

- [x] Task 2: Create auth validator (AC: #3)
  - [x] Create `backend/validators/auth.validator.js`
  - [x] Define loginSchema with Zod: email (email format), password (min 1 char)
  - [x] Export schemas for route validation

- [x] Task 3: Create auth service (AC: #1, #2, #4)
  - [x] Create `backend/services/auth.service.js`
  - [x] Implement `login(email, password)` using supabase.auth.signInWithPassword()
  - [x] Fetch profile from profiles table after successful auth
  - [x] Transform response to camelCase
  - [x] Throw AppError for auth failures

- [x] Task 4: Create auth controller (AC: #1-4)
  - [x] Create `backend/controllers/auth.controller.js`
  - [x] Implement login handler using asyncHandler
  - [x] Use successResponse helper for formatted response
  - [x] Include user + session + profile in response

- [x] Task 5: Write tests (AC: #1-4)
  - [x] Create `backend/tests/routes/auth.routes.test.js`
  - [x] Test successful login returns 200 with user/session
  - [x] Test invalid credentials returns 401
  - [x] Test missing email returns 400 validation error
  - [x] Test missing password returns 400 validation error
  - [x] Create `backend/tests/services/auth.service.test.js`
  - [x] Mock supabase.auth.signInWithPassword
  - [x] Test service returns transformed data
  - [x] Test service throws AppError on failure

## Dev Notes

### Architecture Compliance

**Backend Pattern (Layered Architecture):**
```
routes/auth.routes.js → controllers/auth.controller.js → services/auth.service.js → supabase SDK
```

**Module System:** CommonJS ONLY (`require`/`module.exports`)

**Response Format:** Use existing `utils/response.js`:
```javascript
const { successResponse } = require('../utils/response');
// Returns: { success: true, data: {...} }
```

**Error Handling:** Use existing `utils/AppError.js`:
```javascript
const AppError = require('../utils/AppError');
throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
```

### Supabase Auth Integration

**Use existing client:** `utils/supabase.js` already exports `supabase` and `supabaseAdmin`

**Login with Supabase:**
```javascript
const { supabase } = require('../utils/supabase');

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});
// data.user = { id, email, ... }
// data.session = { access_token, refresh_token, expires_at, ... }
```

**Fetch Profile:** After login, get role from profiles table:
```javascript
const { data: profile } = await supabase
  .from('profiles')
  .select('first_name, last_name, role, weekly_hours_target')
  .eq('id', user.id)
  .single();
```

### Expected Response Format

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "employee",
      "weeklyHoursTarget": 35
    },
    "session": {
      "accessToken": "jwt...",
      "refreshToken": "token...",
      "expiresAt": 1736512800
    }
  }
}
```

### Validation Schema (Zod)

```javascript
const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});
```

### File Naming Conventions

- Routes: `auth.routes.js` (kebab-case.routes.js)
- Controllers: `auth.controller.js`
- Services: `auth.service.js`
- Validators: `auth.validator.js`
- Tests: `auth.routes.test.js`, `auth.service.test.js`

### Data Transformation

**DB (snake_case) → API (camelCase):**
Use existing `utils/transformers.js`:
```javascript
const { snakeToCamel } = require('../utils/transformers');
const transformedProfile = snakeToCamel(profile);
// first_name → firstName, weekly_hours_target → weeklyHoursTarget
```

### Project Structure Notes

Files to create:
```
backend/
├── routes/auth.routes.js          # NEW
├── controllers/auth.controller.js  # NEW
├── services/auth.service.js        # NEW
├── validators/auth.validator.js    # NEW
└── tests/
    ├── routes/auth.routes.test.js  # NEW
    └── services/auth.service.test.js # NEW
```

Update existing:
```
backend/routes/index.js            # Add auth routes
```

### Existing Patterns to Follow

**Route registration pattern** (from `routes/index.js`):
```javascript
const authRoutes = require('./auth.routes');
router.use('/auth', authRoutes);
```

**Controller pattern** (from `controllers/health.controller.js`):
```javascript
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return successResponse(res, result);
});

module.exports = { login };
```

**Test pattern** (from `tests/routes/health.routes.test.js`):
```javascript
const request = require('supertest');
const app = require('../../app');

describe('POST /api/v1/auth/login', () => {
  it('should return 200 with user and session on valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.session).toBeDefined();
  });
});
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication & Security]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1]
- [Source: _bmad-output/project-context.md#Critical Implementation Rules]
- [Source: backend/utils/supabase.js - Existing Supabase client]
- [Source: backend/utils/response.js - Response helpers]
- [Source: backend/utils/AppError.js - Error class]
- [Source: backend/utils/transformers.js - Data transformation]

### Security Considerations

- Never log passwords or tokens
- Use Supabase Auth - DO NOT implement custom JWT
- Validate all inputs with Zod before processing
- Return generic error message for invalid credentials (prevent user enumeration)

### Testing Notes

- Mock `supabase.auth.signInWithPassword` in tests
- Mock `supabase.from('profiles').select()` in tests
- Use existing `tests/setup.js` for test configuration
- Target: 100% coverage for new code

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Fixed Zod v4 compatibility: `.issues` instead of `.errors` for validation errors

### Completion Notes List

- Implemented POST `/api/v1/auth/login` endpoint with Supabase Auth integration
- Created Zod validation middleware with proper error formatting
- Service fetches profile from profiles table after successful auth
- Response includes camelCase transformed user and session data
- All 4 acceptance criteria covered with comprehensive tests
- 163 tests passing, 99.5% coverage (after code review additions)

### File List

**Created:**
- `backend/routes/auth.routes.js`
- `backend/controllers/auth.controller.js`
- `backend/services/auth.service.js`
- `backend/validators/auth.validator.js`
- `backend/tests/routes/auth.routes.test.js`
- `backend/tests/services/auth.service.test.js`
- `backend/scripts/seed-test-user.js` (test user seeding utility)
- `docs/TESTING.md` (testing documentation)

**Modified:**
- `backend/routes/index.js` (added auth routes registration)
- `backend/package.json` (added zod dependency)
- `package-lock.json` (dependency lock file updated)

### Change Log

- 2026-01-10: Implemented Story 2.1 - Supabase Auth Integration (login endpoint)
- 2026-01-10: Code Review completed - All issues fixed

## Senior Developer Review (AI)

**Reviewer:** Amelia (Dev Agent)
**Date:** 2026-01-10
**Status:** ✅ APPROVED

### Review Summary

| Category | Status |
|----------|--------|
| Acceptance Criteria | 4/4 Validated ✅ |
| Tasks Completion | 5/5 Verified ✅ |
| Test Coverage | 99.5% ✅ |
| Architecture Compliance | Passed ✅ |
| Security | Passed ✅ |

### Issues Found & Resolved

| ID | Severity | Issue | Resolution |
|----|----------|-------|------------|
| H1 | HIGH | File List incomplete (3 files missing) | Fixed - Added missing files to File List |
| M1 | MEDIUM | No rate limiting on login | Noted for future story (out of scope) |
| M2 | MEDIUM | Validator branch coverage 50% | Added edge case tests |
| L1 | LOW | console.warn instead of logger | Noted for future improvement |
| L2 | LOW | No test for malformed JSON | Added test |
| L3 | LOW | No test for empty password | Added test |

### Future Recommendations

1. **Rate Limiting:** Add `express-rate-limit` to protect login endpoint from brute-force attacks (recommended for Epic Auth Security)
2. **Structured Logging:** Replace `console.warn` with winston/pino for production logging

### Verification

```
Tests: 163 passed
Coverage: 99.5%
All ACs: Implemented and tested
```
