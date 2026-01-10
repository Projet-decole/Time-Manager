# Story 2.4: Implement Password Reset Flow

Status: ready-for-dev

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

- [ ] Task 1: Add forgot-password route (AC: #1-3)
  - [ ] Add POST `/forgot-password` route to `backend/routes/auth.routes.js`
  - [ ] No authentication required for this endpoint

- [ ] Task 2: Add validation schema (AC: #3)
  - [ ] Add forgotPasswordSchema to `backend/validators/auth.validator.js`
  - [ ] Validate email format with Zod

- [ ] Task 3: Implement forgot-password service (AC: #1, #2)
  - [ ] Add `forgotPassword(email)` to `backend/services/auth.service.js`
  - [ ] Use supabase.auth.resetPasswordForEmail()
  - [ ] Always return success (prevent email enumeration)

- [ ] Task 4: Add controller handler (AC: #1-3)
  - [ ] Add forgotPassword handler to `backend/controllers/auth.controller.js`
  - [ ] Apply validation middleware
  - [ ] Return consistent success message

- [ ] Task 5: Write tests (AC: #1-3)
  - [ ] Test valid email returns 200 success
  - [ ] Test unregistered email returns 200 success
  - [ ] Test invalid email format returns 400

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

### Debug Log References

### Completion Notes List

### File List
