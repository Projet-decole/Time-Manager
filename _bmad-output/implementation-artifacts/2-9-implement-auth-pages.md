# Story 2.9: Implement Auth Pages (Login + Forgot Password)

Status: done

## Story

As a **user**,
I want login and forgot password pages,
So that I can access my account or recover it if I forget my password.

## Acceptance Criteria

1. **Given** the login page `/login`
   **When** I visit the page
   **Then** I see email input, password input, "Se connecter" button
   **And** I see a "Mot de passe oublie ?" link

2. **Given** valid credentials
   **When** I submit the login form
   **Then** I am redirected to `/dashboard`
   **And** loading state is shown during submission

3. **Given** invalid credentials
   **When** I submit the login form
   **Then** an error message is displayed
   **And** password field is cleared

4. **Given** the forgot password page `/forgot-password`
   **When** I submit my email
   **Then** I see a success message "Si un compte existe, un email a ete envoye"
   **And** I can return to login page

5. **Given** empty form fields
   **When** I try to submit
   **Then** validation errors are shown

## Tasks / Subtasks

- [x] Task 1: Setup React Router
  - [x] Install react-router-dom if needed
  - [x] Create basic router in `frontend/src/App.jsx`
  - [x] Add /login and /forgot-password routes

- [x] Task 2: Create UI components (Tailwind-based)
  - [x] Create Button, Input, Label, Card, Alert components
  - [x] Export from components/ui/index.js

- [x] Task 3: Create LoginPage
  - [x] Create `frontend/src/pages/LoginPage.jsx`
  - [x] Form with react-hook-form validation
  - [x] Connect to useAuth().login()
  - [x] Handle errors and loading state
  - [x] Link to forgot password

- [x] Task 4: Create ForgotPasswordPage
  - [x] Create `frontend/src/pages/ForgotPasswordPage.jsx`
  - [x] Email input with validation
  - [x] Call authService.forgotPassword()
  - [x] Show success message
  - [x] Link back to login

- [x] Task 5: Write tests
  - [x] Test form renders correctly (12 LoginPage + 10 ForgotPasswordPage)
  - [x] Test validation errors
  - [x] Test successful login redirect
  - [x] Test forgot password flow

## Dev Notes

### LoginPage Implementation

```jsx
// frontend/src/pages/LoginPage.jsx
// NOTE: Uses relative imports, not @/ path aliases
import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Alert, AlertDescription } from '../components/ui/Alert';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const from = location.state?.from || '/dashboard';

  const { register, handleSubmit, formState: { errors }, resetField } = useForm();

  const onSubmit = async (data) => {
    try {
      setError(null);
      setIsLoading(true);
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Echec de la connexion');
      resetField('password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Time Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email', { required: 'Email requis' })}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                {...register('password', { required: 'Mot de passe requis' })}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>

            <div className="text-center">
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Mot de passe oublie ?
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### ForgotPasswordPage Implementation

```jsx
// frontend/src/pages/ForgotPasswordPage.jsx
// NOTE: Uses relative imports, not @/ path aliases
// NOTE: Custom CheckCircleIcon SVG instead of lucide-react dependency
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Alert, AlertDescription } from '../components/ui/Alert';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      await authService.forgotPassword(data.email);
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6 space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">Email envoye</h2>
            <p className="text-gray-600">
              Si un compte existe avec cet email, vous recevrez un lien de reinitialisation.
            </p>
            <Button asChild variant="outline">
              <Link to="/login">Retour a la connexion</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl text-center">Mot de passe oublie</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-gray-600">
              Entrez votre email pour recevoir un lien de reinitialisation.
            </p>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email', { required: 'Email requis' })}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Envoi...' : 'Envoyer le lien'}
            </Button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-blue-600 hover:underline">
                Retour a la connexion
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Files to Create

```
frontend/src/
├── pages/
│   ├── LoginPage.jsx
│   └── ForgotPasswordPage.jsx
└── __tests__/pages/
    ├── LoginPage.test.jsx
    └── ForgotPasswordPage.test.jsx
```

### Dependencies to Install

```bash
npm install react-router-dom react-hook-form
npx shadcn@latest add button input label card alert
```

## What User Can Do After This Story

**PREMIERE INTERFACE VISIBLE !**

**L'utilisateur peut maintenant:**
1. Aller sur `http://localhost:5173/login`
2. Voir la page de connexion avec:
   - Champ email
   - Champ mot de passe
   - Bouton "Se connecter"
   - Lien "Mot de passe oublie ?"
3. Tenter de se connecter:
   - Credentials valides → redirection (vers page vide pour l'instant)
   - Credentials invalides → message d'erreur
4. Cliquer sur "Mot de passe oublie ?"
5. Entrer son email → message de confirmation

**E2E Test manuel:**
1. Lancer le backend: `cd backend && npm run dev`
2. Lancer le frontend: `cd frontend && npm run dev`
3. Aller sur http://localhost:5173/login
4. Essayer de se connecter avec un mauvais password → erreur
5. Se connecter avec bon password → redirection
6. Cliquer "Mot de passe oublie" → entrer email → confirmation

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
N/A - Clean implementation

### Completion Notes List
- Created Tailwind-based UI components (Button, Input, Label, Card, Alert) instead of shadcn/ui CLI (avoids interactive setup)
- Configured Tailwind CSS v4 with @tailwindcss/vite plugin
- LoginPage with react-hook-form validation, error handling, loading state
- ForgotPasswordPage with success state and CheckCircle SVG icon
- DashboardPage placeholder for post-login redirect
- React Router DOM setup with /login, /forgot-password, /dashboard routes
- Root path "/" redirects to /login
- 22 new tests (12 LoginPage + 10 ForgotPasswordPage)
- Total frontend tests: 60 passing

### File List
- `frontend/src/components/ui/Button.jsx` (created)
- `frontend/src/components/ui/Input.jsx` (created)
- `frontend/src/components/ui/Label.jsx` (created)
- `frontend/src/components/ui/Card.jsx` (created)
- `frontend/src/components/ui/Alert.jsx` (created)
- `frontend/src/components/ui/index.js` (created)
- `frontend/src/pages/LoginPage.jsx` (created)
- `frontend/src/pages/ForgotPasswordPage.jsx` (created)
- `frontend/src/pages/DashboardPage.jsx` (created)
- `frontend/src/pages/index.js` (created)
- `frontend/src/App.jsx` (modified - React Router setup)
- `frontend/src/__tests__/pages/LoginPage.test.jsx` (created)
- `frontend/src/__tests__/pages/ForgotPasswordPage.test.jsx` (created)
- `frontend/src/__tests__/App.test.jsx` (modified)

### Change Log
- 2026-01-10: Implemented auth pages with full test coverage
- 2026-01-10: Code review fixes applied (see Senior Developer Review below)

## Senior Developer Review (AI)

**Review Date:** 2026-01-10
**Reviewer:** Claude Opus 4.5 (Code Review Agent)
**Outcome:** ✅ APPROVED (with fixes applied)

### Issues Found and Fixed

| Severity | Issue | Resolution |
|----------|-------|------------|
| HIGH | ForgotPasswordPage silently swallowed API errors | Added catch block with error state and Alert display |
| MEDIUM | DashboardPage not exported in pages/index.js | Added export to index.js |
| MEDIUM | Button asChild implementation incomplete | Rewrote using cloneElement for proper prop merging |
| MEDIUM | Dev Notes showed @/ imports but code uses relative | Updated Dev Notes to match actual implementation |

### Acceptance Criteria Validation

- [x] AC1: Login page renders with email, password, button, forgot link
- [x] AC2: Valid credentials redirect to /dashboard with loading state
- [x] AC3: Invalid credentials show error and clear password
- [x] AC4: Forgot password shows success message
- [x] AC5: Empty form validation errors shown

### Test Coverage

- 60 tests passing (22 new tests for this story)
- All ACs covered by tests

### Notes for Future Stories

- `/dashboard` route is unprotected - will be addressed in Story 2.12
- Email format validation uses browser native only (type="email")
