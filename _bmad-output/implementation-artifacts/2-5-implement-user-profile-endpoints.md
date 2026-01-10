# Story 2.5: Implement User Profile Endpoints

Status: done

## Story

As an **authenticated user**,
I want API endpoints to view and update my profile,
So that the frontend can display and modify my personal information.

## Acceptance Criteria

1. **Given** an authenticated user
   **When** GET `/api/v1/users/me` is called
   **Then** response includes `{ success: true, data: { id, email, firstName, lastName, role, weeklyHoursTarget, createdAt } }`

2. **Given** an authenticated user
   **When** PATCH `/api/v1/users/me` is called with `{ firstName, lastName, weeklyHoursTarget }`
   **Then** the profile is updated in database
   **And** response includes updated profile data
   **And** email and role cannot be changed via this endpoint

3. **Given** invalid data (empty firstName, weeklyHoursTarget > 168)
   **When** PATCH is called
   **Then** response is 400 with validation error details

4. **Given** unauthenticated request
   **When** any profile endpoint is called
   **Then** response is 401 Unauthorized

## Tasks / Subtasks

- [x] Task 1: Create users routes (AC: #1, #2, #4)
  - [x] Create `backend/routes/users.routes.js`
  - [x] Add GET `/me` route with authenticate middleware
  - [x] Add PATCH `/me` route with authenticate middleware
  - [x] Register in `backend/routes/index.js` under `/api/v1/users`

- [x] Task 2: Create users validator (AC: #3)
  - [x] Create `backend/validators/users.validator.js`
  - [x] Define updateProfileSchema (firstName, lastName, weeklyHoursTarget)
  - [x] Validate weeklyHoursTarget is 0-168

- [x] Task 3: Create users service (AC: #1, #2)
  - [x] Create `backend/services/users.service.js`
  - [x] Implement `getProfile(userId)`
  - [x] Implement `updateProfile(userId, data)` - filter allowed fields only

- [x] Task 4: Create users controller (AC: #1-4)
  - [x] Create `backend/controllers/users.controller.js`
  - [x] Implement getMe and updateMe handlers

- [x] Task 5: Write tests (AC: #1-4)
  - [x] Create route and service tests
  - [x] Test all acceptance criteria

## Dev Notes

### Service Implementation

```javascript
// services/users.service.js
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
  // Whitelist allowed fields - NEVER allow email or role changes
  const allowed = ['firstName', 'lastName', 'weeklyHoursTarget'];
  const filtered = Object.fromEntries(
    Object.entries(updateData).filter(([k]) => allowed.includes(k))
  );

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...camelToSnake(filtered), updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new AppError('Update failed', 500, 'UPDATE_FAILED');
  return snakeToCamel(data);
};
```

### Files to Create

```
backend/
├── routes/users.routes.js
├── controllers/users.controller.js
├── services/users.service.js
├── validators/users.validator.js
└── tests/
    ├── routes/users.routes.test.js
    └── services/users.service.test.js
```

### E2E Testing Notes

Cette story est backend-only. Le test E2E complet sera possible après Story 2-11 (Profile Page).

**Test manuel API:**
```bash
# Get profile
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/users/me

# Update profile
curl -X PATCH -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe"}' \
  http://localhost:3000/api/v1/users/me
```

## What User Can Do After This Story

**Backend API seulement** - Pas de changement visible pour l'utilisateur final.

**Pour le développeur/testeur:**
- Tester les endpoints via Postman/curl
- Vérifier que GET /users/me retourne le profil
- Vérifier que PATCH /users/me modifie le nom/prénom/heures cibles
- Vérifier que email et role ne peuvent pas être modifiés

**Prérequis pour tester:** Avoir un token JWT valide (via login)

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- All 225 tests passing (0 regressions)
- 100% coverage on new files

### Completion Notes List
- ✅ Task 1: Created users.routes.js with GET /me and PATCH /me endpoints, both protected by authenticate middleware
- ✅ Task 2: Created users.validator.js with Zod schema for updateProfile (firstName, lastName, weeklyHoursTarget 0-168)
- ✅ Task 3: Created users.service.js with getProfile and updateProfile functions, whitelist filtering for security
- ✅ Task 4: Created users.controller.js with getMe and updateMe handlers following project patterns
- ✅ Task 5: Created comprehensive tests (25 new tests) covering all acceptance criteria:
  - AC #1: GET /me returns profile with correct camelCase fields
  - AC #2: PATCH /me updates allowed fields only (firstName, lastName, weeklyHoursTarget)
  - AC #2: email and role changes are explicitly blocked
  - AC #3: Validation errors for empty firstName, weeklyHoursTarget > 168, < 0, non-numeric
  - AC #4: 401 Unauthorized for unauthenticated requests

### File List
- backend/routes/users.routes.js (created)
- backend/routes/index.js (modified - added users routes)
- backend/controllers/users.controller.js (created)
- backend/services/users.service.js (created, modified - added error logging)
- backend/validators/users.validator.js (created, modified - added max length, uses shared validate)
- backend/validators/auth.validator.js (modified - uses shared validate)
- backend/utils/validation.js (created - shared validation middleware)
- backend/tests/routes/users.routes.test.js (created, modified - added edge case tests)
- backend/tests/services/users.service.test.js (created)
- backend/tests/utils/validation.test.js (created - shared validation tests)

## Senior Developer Review (AI)

**Reviewer:** Amelia (Dev Agent) | **Date:** 2026-01-10 | **Model:** Claude Opus 4.5

### Review Outcome: ✅ APPROVED (after fixes)

### Issues Found & Fixed

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| H1 | HIGH | Missing max length validation on firstName/lastName | ✅ Fixed |
| M1 | MEDIUM | Code duplication of validate() middleware | ✅ Fixed |
| M2 | MEDIUM | Database errors not logged in updateProfile | ✅ Fixed |
| M3 | MEDIUM | Missing edge case tests | ✅ Fixed |
| L1 | LOW | Response includes updatedAt (not in AC) | Accepted |
| L2 | LOW | Test count documentation inaccurate | Corrected |

### Fixes Applied

1. **H1:** Added `.max(100)` validation on firstName/lastName in `users.validator.js`
2. **M1:** Extracted `validate()` to new `utils/validation.js`, updated both validators to import it
3. **M2:** Added `console.error('[USERS] Update profile failed:')` logging in `users.service.js`
4. **M3:** Added 4 new edge case tests (max length, empty body, boundary 100 chars)

### Final Test Results

- **Tests:** 235 passed (was 225, +10 new)
- **Coverage:** 99.66%
- **All ACs verified:** ✓

### Files Modified During Review

- `backend/validators/users.validator.js` (added max length)
- `backend/validators/auth.validator.js` (use shared validate)
- `backend/utils/validation.js` (created - shared middleware)
- `backend/services/users.service.js` (added error logging)
- `backend/tests/routes/users.routes.test.js` (added 4 edge case tests)
- `backend/tests/utils/validation.test.js` (created - 6 tests)

## Change Log
- 2026-01-10: Implemented user profile endpoints (GET/PATCH /api/v1/users/me) with full test coverage
- 2026-01-10: Code review fixes - added max length validation, extracted shared validate(), added logging, added edge case tests
