# Story 2.9: Implement Login Page UI

Status: ready-for-dev

## Story

As a **user**,
I want a login page to enter my credentials,
So that I can access the application.

## Acceptance Criteria

1. **Given** the login page is displayed
   **When** I view the page
   **Then** I see email input, password input, and login button
   **And** I see a "Forgot password?" link

2. **Given** I enter valid credentials and click login
   **When** authentication succeeds
   **Then** I am redirected to the dashboard
   **And** loading state is shown during API call

3. **Given** I enter invalid credentials
   **When** authentication fails
   **Then** an error message is displayed
   **And** password field is cleared

4. **Given** I click "Forgot password?"
   **When** navigated
   **Then** I see the forgot password form

5. **Given** empty form submission
   **When** login is clicked
   **Then** validation errors are shown for required fields

## Tasks / Subtasks

- [ ] Task 1: Create LoginPage component (AC: #1)
  - [ ] Create `frontend/src/pages/LoginPage.jsx`
  - [ ] Add email input with label
  - [ ] Add password input with label
  - [ ] Add "Log In" button
  - [ ] Add "Forgot password?" link

- [ ] Task 2: Implement form handling (AC: #2, #3, #5)
  - [ ] Use React Hook Form for form state
  - [ ] Add validation (email required, password required)
  - [ ] Handle form submission
  - [ ] Show loading state on button
  - [ ] Display error messages

- [ ] Task 3: Connect to AuthContext (AC: #2, #3)
  - [ ] Use useAuth hook
  - [ ] Call login function on submit
  - [ ] Handle success (redirect)
  - [ ] Handle error (show message)

- [ ] Task 4: Add routing (AC: #2, #4)
  - [ ] Add login route to router
  - [ ] Redirect to dashboard on success
  - [ ] Link to forgot password page

- [ ] Task 5: Style with Tailwind/shadcn (AC: #1)
  - [ ] Center form on page
  - [ ] Use Card component for container
  - [ ] Use Input and Button from shadcn/ui
  - [ ] Mobile responsive layout

- [ ] Task 6: Write tests (AC: #1-5)
  - [ ] Create `frontend/src/__tests__/pages/LoginPage.test.jsx`
  - [ ] Test form renders
  - [ ] Test validation errors
  - [ ] Test successful login redirect
  - [ ] Test error display

## Dev Notes

### Architecture Compliance

**Location:** `frontend/src/pages/LoginPage.jsx`
**Module System:** ESM
**Styling:** Tailwind CSS + shadcn/ui

### Component Implementation

```jsx
// frontend/src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    resetField
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setError(null);
      setIsLoading(true);
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
      resetField('password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Time Manager
          </CardTitle>
          <CardDescription className="text-center">
            Connectez-vous a votre compte
          </CardDescription>
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
                placeholder="vous@exemple.com"
                {...register('email', {
                  required: 'Email requis',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email invalide'
                  }
                })}
                aria-invalid={errors.email ? 'true' : 'false'}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                {...register('password', {
                  required: 'Mot de passe requis'
                })}
                aria-invalid={errors.password ? 'true' : 'false'}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>

            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Mot de passe oublie ?
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
```

### Router Setup

```jsx
// In router configuration
import { LoginPage } from './pages/LoginPage';

const routes = [
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />
  },
  // ... other routes
];
```

### Required shadcn/ui Components

Ensure these components are installed:
- Button
- Input
- Label
- Card (CardContent, CardHeader, CardTitle, CardDescription)
- Alert (AlertDescription)

Install with: `npx shadcn-ui@latest add button input label card alert`

### File Structure

```
frontend/src/
├── pages/
│   └── LoginPage.jsx             # NEW
├── components/
│   └── ui/                       # shadcn/ui components
│       ├── button.jsx
│       ├── input.jsx
│       ├── label.jsx
│       ├── card.jsx
│       └── alert.jsx
└── __tests__/
    └── pages/
        └── LoginPage.test.jsx    # NEW
```

### Testing

```jsx
// __tests__/pages/LoginPage.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { LoginPage } from '../../pages/LoginPage';

const renderLoginPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('LoginPage', () => {
  it('renders login form', () => {
    renderLoginPage();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty submission', async () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText(/email requis/i)).toBeInTheDocument();
    });
  });
});
```

### UX Requirements (from PRD)

- Mobile-first design (FR90)
- Touch-friendly buttons >44px (FR91)
- Minimal friction - no unnecessary confirmations (FR93)

### Accessibility

- Labels associated with inputs
- Error messages with aria-invalid
- Keyboard navigation support
- Sufficient color contrast

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.9]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
