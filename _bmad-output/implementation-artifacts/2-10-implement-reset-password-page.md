# Story 2.10: Implement Reset Password Page

Status: done

## Story

As a **user who clicked the reset password link in their email**,
I want to set a new password,
So that I can regain access to my account.

**Note:** Cette story complete l'AC #4 de la Story 2.4 qui n'etait pas testable sans cette page.

## Acceptance Criteria

1. **Given** I clicked the reset link in my email
   **When** I arrive on `/reset-password` with Supabase tokens in URL
   **Then** I see a form with "Nouveau mot de passe" and "Confirmer mot de passe" fields

2. **Given** I enter matching passwords (min 8 chars)
   **When** I submit the form
   **Then** my password is updated via Supabase
   **And** I see a success message
   **And** I can click a link to go to login

3. **Given** passwords don't match or are too short
   **When** I try to submit
   **Then** validation errors are shown

4. **Given** the reset token is expired or invalid
   **When** I try to submit
   **Then** an error message is shown
   **And** I can request a new reset link

## Tasks / Subtasks

- [x] Task 1: Create ResetPasswordPage
  - [x] Create `frontend/src/pages/ResetPasswordPage.jsx`
  - [x] Two password fields with confirmation
  - [x] Validation: min 8 chars, must match

- [x] Task 2: Implement Supabase password update
  - [x] Supabase handles token validation automatically
  - [x] Use supabase.auth.updateUser({ password })
  - [x] Handle success and error states

- [x] Task 3: Add route in router
  - [x] Add `/reset-password` route
  - [x] Public route (no auth required)

- [x] Task 4: Update authService
  - [x] Add resetPassword(newPassword) method
  - [x] Initialize Supabase client in frontend if needed

- [x] Task 5: Write tests
  - [x] Test form validation
  - [x] Test success flow
  - [x] Test error handling

## Dev Notes

### Supabase Reset Password Flow

Quand l'utilisateur clique sur le lien email, Supabase:
1. Redirige vers `FRONTEND_URL/reset-password#access_token=xxx&type=recovery`
2. Le SDK Supabase detecte automatiquement le token dans l'URL
3. Une session temporaire est creee pour permettre le changement de password

### ResetPasswordPage Implementation

```jsx
// frontend/src/pages/ResetPasswordPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [hasSession, setHasSession] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  // Check for recovery session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(!!session);
    };
    checkSession();

    // Listen for auth state change (recovery link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (data) => {
    try {
      setError(null);
      setIsLoading(true);

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password
      });

      if (updateError) {
        throw updateError;
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Echec de la mise a jour du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6 space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">Mot de passe modifie</h2>
            <p className="text-gray-600">
              Votre mot de passe a ete mis a jour avec succes.
            </p>
            <Button asChild>
              <Link to="/login">Se connecter</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No valid session/token
  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6 space-y-4">
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold">Lien invalide ou expire</h2>
            <p className="text-gray-600">
              Ce lien de reinitialisation n'est plus valide.
            </p>
            <Button asChild variant="outline">
              <Link to="/forgot-password">Demander un nouveau lien</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl text-center">Nouveau mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <Input
                id="password"
                type="password"
                {...register('password', {
                  required: 'Mot de passe requis',
                  minLength: { value: 8, message: 'Minimum 8 caracteres' }
                })}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword', {
                  required: 'Confirmation requise',
                  validate: value => value === password || 'Les mots de passe ne correspondent pas'
                })}
              />
              {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Mise a jour...' : 'Mettre a jour le mot de passe'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Environment Variables (Frontend)

Add to `frontend/.env.example`:
```
VITE_API_URL=http://localhost:3000/api/v1
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Files to Create/Modify

```
frontend/src/
├── pages/
│   └── ResetPasswordPage.jsx  # NEW
├── .env.example               # UPDATE with Supabase vars
└── App.jsx                    # ADD /reset-password route
```

### Dependencies

```bash
npm install @supabase/supabase-js
```

## What User Can Do After This Story

**Flux complet de reset password maintenant testable !**

**L'utilisateur peut maintenant:**
1. Aller sur `/forgot-password` et entrer son email
2. Recevoir un email avec un lien (de Supabase)
3. Cliquer le lien → arrive sur `/reset-password`
4. Entrer un nouveau mot de passe (min 8 chars)
5. Confirmer le mot de passe
6. Soumettre → succes
7. Aller sur `/login` et se connecter avec le nouveau password

**E2E Test manuel complet:**
1. Aller sur http://localhost:5173/forgot-password
2. Entrer un email existant dans Supabase
3. Verifier email recu (check Supabase dashboard > Authentication > Emails)
4. Cliquer le lien dans l'email
5. Entrer nouveau password "NewPass123!"
6. Confirmer
7. Cliquer "Se connecter"
8. Se connecter avec le nouveau password → succes !

**Cas d'erreur a tester:**
- Passwords qui ne matchent pas → erreur
- Password < 8 chars → erreur
- Lien expire (apres 1h) → page "Lien invalide"

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
N/A

### Completion Notes List
- Implemented ResetPasswordPage.jsx with full form validation (min 8 chars, password matching)
- Created Supabase client module (lib/supabase.js) with graceful fallback when env vars missing
- Added /reset-password route to App.jsx as public route
- Updated .env.example with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY variables
- Installed @supabase/supabase-js package
- Created comprehensive test suite (16 tests) covering all 4 ACs:
  - AC1: Form rendering with valid session
  - AC2: Successful password update with success message and login link
  - AC3: Form validation (password too short, passwords don't match, empty fields)
  - AC4: Invalid/expired token handling with link to request new reset
- All 76 frontend tests pass (no regressions)
- Uses same UI patterns as LoginPage and ForgotPasswordPage (consistency)
- SVG icons defined inline (no external dependencies like lucide-react)

### File List
- frontend/src/pages/ResetPasswordPage.jsx (NEW)
- frontend/src/lib/supabase.js (NEW)
- frontend/src/App.jsx (MODIFIED - added route and import)
- frontend/.env.example (MODIFIED - added Supabase vars)
- frontend/package.json (MODIFIED - added @supabase/supabase-js)
- frontend/src/__tests__/pages/ResetPasswordPage.test.jsx (NEW)
- frontend/.gitignore (MODIFIED - added .env ignore rules)
- frontend/Dockerfile.prod (MODIFIED - added VITE_SUPABASE_* build args)
- .github/workflows/ci-cd.yml (MODIFIED - added VITE_SUPABASE_* build args)
- frontend/src/services/authService.js (MODIFIED - removed dead resetPassword method, added comment)
- frontend/src/__tests__/services/authService.test.js (MODIFIED - removed orphan resetPassword test)

### Change Log
- 2026-01-11: Code review fixes - removed dead authService.resetPassword(), fixed test act() warning, updated File List
- 2026-01-10: Story 2.10 implemented - Reset Password Page with Supabase integration
