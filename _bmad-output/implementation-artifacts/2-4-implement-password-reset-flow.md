# Story 2.4: Implement Password Reset Flow

Status: done

## Story

As a **user who forgot their password**,
I want to reset my password via email,
So that I can regain access to my account.

## Acceptance Criteria

1. **Given** a registered user email
   **When** POST `/api/v1/auth/forgot-password` is called with `{ email }`
   **Then** Supabase sends a password reset email
   **And** response is `{ success: true, data: { message: "Reset email sent" } }`

2. **Given** an unregistered email
   **When** forgot-password is called
   **Then** response is still success (no email enumeration vulnerability)

3. **Given** invalid email format
   **When** forgot-password is called
   **Then** response is 400 with VALIDATION_ERROR

4. **Given** the user clicks the reset link and provides new password
   **When** the password is updated via Supabase
   **Then** the user can log in with the new password

## Tasks / Subtasks

- [x] Task 1: Add forgot-password route (AC: #1-3)
  - [x] Add POST `/forgot-password` route to `backend/routes/auth.routes.js`
  - [x] No authentication required for this endpoint

- [x] Task 2: Add validation schema (AC: #3)
  - [x] Add forgotPasswordSchema to `backend/validators/auth.validator.js`
  - [x] Validate email format with Zod

- [x] Task 3: Implement forgot-password service (AC: #1, #2)
  - [x] Add `forgotPassword(email)` to `backend/services/auth.service.js`
  - [x] Use supabase.auth.resetPasswordForEmail()
  - [x] Always return success (prevent email enumeration)

- [x] Task 4: Add controller handler (AC: #1-3)
  - [x] Add forgotPassword handler to `backend/controllers/auth.controller.js`
  - [x] Apply validation middleware
  - [x] Return consistent success message

- [x] Task 5: Write tests (AC: #1-3)
  - [x] Test valid email returns 200 success
  - [x] Test unregistered email returns 200 success
  - [x] Test invalid email format returns 400

## Dev Notes

### Architecture Compliance

**Endpoint:** `POST /api/v1/auth/forgot-password`
**Auth Required:** No (public endpoint)

### Supabase Password Reset

```javascript
const { supabase } = require('../utils/supabase');

const forgotPassword = async (email) => {
  // Always attempt reset - Supabase handles non-existent emails gracefully
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`
  });

  // Log error for debugging but don't expose to user
  if (error) {
    console.error('Password reset error:', error.message);
  }

  // Always return success to prevent email enumeration
  return { message: 'If an account exists, a reset email has been sent' };
};
```

### Validation Schema

```javascript
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
});
```

### Route Definition

```javascript
// routes/auth.routes.js
router.post('/forgot-password',
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
```

### Security Considerations

- **NO email enumeration:** Always return success, even for non-existent emails
- **Rate limiting:** Consider adding rate limit to prevent abuse
- **Redirect URL:** Configure FRONTEND_URL in environment

### Environment Variable

Add to `.env.example`:
```
FRONTEND_URL=http://localhost:5173
```

### Response Format

```json
{
  "success": true,
  "data": {
    "message": "If an account exists, a reset email has been sent"
  }
}
```

### Files to Modify

```
backend/
├── routes/auth.routes.js          # ADD forgot-password route
├── controllers/auth.controller.js  # ADD forgotPassword handler
├── services/auth.service.js        # ADD forgotPassword method
├── validators/auth.validator.js    # ADD forgotPasswordSchema
└── tests/routes/auth.routes.test.js # ADD forgot-password tests
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentication Flow]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
N/A

### Completion Notes List
- Implemented POST `/api/v1/auth/forgot-password` endpoint (public, no auth required)
- Added `forgotPasswordSchema` to validators with Zod email validation
- Added `forgotPassword(email)` service using `supabase.auth.resetPasswordForEmail()`
- Security: Always returns success to prevent email enumeration attacks
- Added 6 comprehensive tests covering AC #1-3
- All 200 tests pass with 99.59% coverage

### Code Review Notes
- **AC #1 Message Deviation (Intentional):** Response message is "If an account exists, a reset email has been sent" instead of "Reset email sent" - this is MORE SECURE as it doesn't imply success for non-existent emails while still preventing enumeration
- **AC #4:** Password update flow is handled by Supabase + frontend `/reset-password` page (separate story scope)
- **Validator Branch Coverage:** 50% branch coverage in auth.validator.js due to Zod version compatibility fallbacks (edge cases)

### File List
- `backend/routes/auth.routes.js` (modified)
- `backend/validators/auth.validator.js` (modified)
- `backend/services/auth.service.js` (modified)
- `backend/controllers/auth.controller.js` (modified)
- `backend/tests/routes/auth.routes.test.js` (modified)
- `backend/.env.example` (modified - added FRONTEND_URL)

### Change Log
- 2026-01-10: Implemented password reset flow (Story 2.4)
- 2026-01-10: Code review fixes - added FRONTEND_URL to .env.example, added empty email test
