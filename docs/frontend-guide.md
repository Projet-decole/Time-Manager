# Guide Frontend - Time Manager

> **Version** : 1.0 | **Date** : 2026-01-11 | **Stack** : React 19 + Vite 7 + TailwindCSS

## Structure du Frontend

```
frontend/src/
├── main.jsx                    # Point d'entree React
├── App.jsx                     # Router + AuthProvider
├── index.css                   # Styles globaux + Tailwind
│
├── pages/                      # Pages de l'application
│   ├── LoginPage.jsx          # Connexion
│   ├── ForgotPasswordPage.jsx # Mot de passe oublie
│   ├── ResetPasswordPage.jsx  # Reinitialisation mot de passe
│   ├── DashboardPage.jsx      # Tableau de bord (placeholder)
│   ├── ProfilePage.jsx        # Profil utilisateur
│   ├── AdminUsersPage.jsx     # Gestion utilisateurs (manager)
│   └── AccessDeniedPage.jsx   # Acces refuse
│
├── components/
│   ├── ui/                    # Composants UI reutilisables
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Label.jsx
│   │   ├── Card.jsx
│   │   ├── Alert.jsx
│   │   ├── Badge.jsx
│   │   ├── Table.jsx
│   │   ├── Select.jsx
│   │   ├── Modal.jsx
│   │   └── index.js          # Exports centralises
│   │
│   ├── common/                # Composants structurels
│   │   ├── AppLayout.jsx     # Layout principal + navigation
│   │   ├── ProtectedRoute.jsx# Route protegee par auth
│   │   └── RoleProtectedRoute.jsx # Route protegee par role
│   │
│   └── users/                 # Composants metier
│       └── UserFormModal.jsx # Modal creation/edition user
│
├── contexts/
│   └── AuthContext.jsx        # Context d'authentification
│
├── hooks/
│   └── useAuth.js             # Hook pour acceder au AuthContext
│
├── services/
│   ├── authService.js         # Operations d'authentification
│   └── usersService.js        # Operations sur les utilisateurs
│
└── lib/
    ├── api.js                 # Client API fetch
    └── supabase.js            # Client Supabase direct
```

## Composants UI

### Button

```jsx
import { Button } from '../components/ui/Button';

// Variantes
<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>

// Tailles
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>

// Etats
<Button disabled>Disabled</Button>
<Button disabled>{isLoading ? 'Chargement...' : 'Envoyer'}</Button>
```

### Input

```jsx
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="email@example.com"
    error={!!errors.email}
    {...register('email', { required: 'Email requis' })}
  />
  {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
</div>
```

### Card

```jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';

<Card>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
    <CardDescription>Description optionnelle</CardDescription>
  </CardHeader>
  <CardContent>
    Contenu principal
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Alert

```jsx
import { Alert, AlertDescription } from '../components/ui/Alert';

// Erreur
<Alert variant="error">
  <AlertDescription>Message d'erreur</AlertDescription>
</Alert>

// Succes
<Alert variant="success">
  <AlertDescription>Operation reussie</AlertDescription>
</Alert>
```

### Table

```jsx
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/Table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nom</TableHead>
      <TableHead>Email</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map(user => (
      <TableRow key={user.id}>
        <TableCell>{user.lastName}</TableCell>
        <TableCell>{user.email}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Modal

```jsx
import { Modal } from '../components/ui/Modal';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Titre du modal"
>
  <form onSubmit={handleSubmit}>
    {/* Contenu du formulaire */}
  </form>
</Modal>
```

---

## Authentification

### AuthContext

Le context fournit l'etat d'authentification a toute l'application.

```jsx
// App.jsx
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ... */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### useAuth Hook

```jsx
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, isLoading, login, logout, refreshUser } = useAuth();

  // Proprietes
  // - user: Object | null - Utilisateur connecte
  // - isAuthenticated: boolean - Connecte ou non
  // - isLoading: boolean - Verification session en cours

  // Methodes
  // - login(email, password) - Connexion
  // - logout() - Deconnexion
  // - refreshUser() - Recharger profil depuis serveur
}
```

### Routes Protegees

```jsx
// Route protegee par authentification
<Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
  <Route path="/dashboard" element={<DashboardPage />} />
</Route>

// Route protegee par role
<Route
  path="/admin/users"
  element={
    <RoleProtectedRoute roles={['manager']}>
      <AdminUsersPage />
    </RoleProtectedRoute>
  }
/>
```

### Hierarchie des Roles

```javascript
const ROLE_HIERARCHY = {
  employee: ['employee'],
  manager: ['manager', 'employee']  // Manager herite employee
};
```

---

## Services API

### authService

```javascript
import { authService } from '../services/authService';

// Login
const { user, session } = await authService.login(email, password);

// Logout
await authService.logout();

// Profil
const profile = await authService.getProfile();

// Mise a jour profil
const updated = await authService.updateProfile({ firstName, lastName });

// Mot de passe oublie
await authService.forgotPassword(email);

// Verification authentification locale
const isAuth = authService.isAuthenticated();
```

### usersService

```javascript
import { usersService } from '../services/usersService';

// Liste paginee (manager only)
const { data, meta } = await usersService.getAll({
  page: 1,
  limit: 20,
  role: 'employee'  // optionnel
});

// Creer utilisateur (manager only)
await usersService.create({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'employee',
  weeklyHoursTarget: 35
});

// Modifier utilisateur (manager only)
await usersService.update(userId, {
  firstName: 'John',
  lastName: 'Smith',
  weeklyHoursTarget: 40
});
```

### API Client

Le client API gere automatiquement :
- Ajout du token `Authorization`
- Logout automatique sur 401
- Parsing JSON

```javascript
import api from '../lib/api';

// GET
const response = await api.get('/users/me');

// POST
const response = await api.post('/auth/login', { email, password });

// PATCH
const response = await api.patch('/users/me', { firstName: 'John' });

// DELETE
const response = await api.delete('/resource/123');
```

---

## Formulaires

### React Hook Form

```jsx
import { useForm } from 'react-hook-form';

function MyForm() {
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    try {
      await authService.login(data.email, data.password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('email', {
          required: 'Email requis',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Email invalide'
          }
        })}
      />
      {errors.email && <span>{errors.email.message}</span>}

      <Input
        type="password"
        {...register('password', {
          required: 'Mot de passe requis',
          minLength: { value: 8, message: 'Minimum 8 caracteres' }
        })}
      />

      <Button type="submit">Envoyer</Button>
    </form>
  );
}
```

---

## Patterns Courants

### Page avec Chargement

```jsx
function MyPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await api.get('/endpoint');
        setData(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="animate-spin">...</div>;
  }

  if (error) {
    return <Alert variant="error"><AlertDescription>{error}</AlertDescription></Alert>;
  }

  return <div>{/* Render data */}</div>;
}
```

### Modal CRUD

```jsx
function CrudPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data) => {
    if (editingItem) {
      await service.update(editingItem.id, data);
    } else {
      await service.create(data);
    }
    setIsModalOpen(false);
    refreshList();
  };

  return (
    <>
      <Button onClick={handleCreate}>Nouveau</Button>
      <List items={items} onEdit={handleEdit} />
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        item={editingItem}
      />
    </>
  );
}
```

### Pagination

```jsx
function PaginatedList() {
  const [pagination, setPagination] = useState({
    page: 1, limit: 20, total: 0, totalPages: 0
  });

  const fetchData = async (page) => {
    const response = await service.getAll({ page, limit: pagination.limit });
    setData(response.data);
    setPagination(response.meta.pagination);
  };

  return (
    <>
      <List items={data} />
      <div className="flex gap-2">
        <Button
          onClick={() => fetchData(pagination.page - 1)}
          disabled={pagination.page <= 1}
        >
          Precedent
        </Button>
        <span>Page {pagination.page} / {pagination.totalPages}</span>
        <Button
          onClick={() => fetchData(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
        >
          Suivant
        </Button>
      </div>
    </>
  );
}
```

---

## Tests

### Configuration Vitest

```javascript
// vite.config.js
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js'
  }
});
```

### Exemple de Test

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

describe('LoginPage', () => {
  it('displays error on invalid credentials', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong' }
    });
    fireEvent.click(screen.getByRole('button', { name: /connexion/i }));

    expect(await screen.findByText(/echec/i)).toBeInTheDocument();
  });
});
```

---

## Conventions

### Nommage

- **Fichiers** : PascalCase pour composants (`LoginPage.jsx`), camelCase pour utils (`authService.js`)
- **Composants** : PascalCase (`<LoginPage />`)
- **Hooks** : camelCase avec prefix `use` (`useAuth`)
- **Constantes** : SCREAMING_SNAKE_CASE (`ROLE_HIERARCHY`)

### Structure Composant

```jsx
// 1. Imports
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

// 2. Types/Constants (si applicable)
const ROLES = ['employee', 'manager'];

// 3. Composants helpers (si petits et specifiques)
function RoleBadge({ role }) { /* ... */ }

// 4. Composant principal (export default)
export default function MyPage() {
  // 4a. Hooks
  const { user } = useAuth();
  const [state, setState] = useState(null);

  // 4b. Effects
  useEffect(() => { /* ... */ }, []);

  // 4c. Handlers
  const handleSubmit = async (data) => { /* ... */ };

  // 4d. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Styling avec Tailwind

```jsx
// Classes utilitaires directes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">

// Classes conditionnelles
<button className={`px-4 py-2 ${isActive ? 'bg-blue-600' : 'bg-gray-200'}`}>

// Classes dynamiques
const colorClasses = {
  employee: 'bg-blue-100 text-blue-800',
  manager: 'bg-purple-100 text-purple-800'
};
<span className={colorClasses[role]}>
```
