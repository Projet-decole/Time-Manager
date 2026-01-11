# Architecture Technique - Time Manager

> **Version** : 2.0 | **Date** : 2026-01-11 | **Epic** : 2 (Authentication & Authorization)

## Vue d'ensemble

Time Manager est une application web de gestion du temps construite avec une architecture **multi-part monorepo**. Elle permet aux employes de pointer leurs heures et aux managers de superviser leurs equipes.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    React 19 SPA                          │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │    │
│  │  │  Pages   │ │Components│ │ Services │ │  Contexts │  │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │    │
│  │         ↓           ↓           ↓            ↓          │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │              API Client (fetch)                   │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                    HTTPS/REST API                               │
│                              ↓                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         SERVEUR                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Express 5 API                          │    │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐  │    │
│  │  │  Routes  │→│Controllers│→│ Services │→│   Utils  │  │    │
│  │  └──────────┘ └───────────┘ └──────────┘ └──────────┘  │    │
│  │         ↑                                               │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │ Middleware: Auth → RBAC → Validation → Error     │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                    Supabase SDK                                  │
│                              ↓                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       BASE DE DONNEES                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Supabase (PostgreSQL)                   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │
│  │  │ profiles │ │  teams   │ │ projects │ │time_entry│   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │     Row Level Security (RLS) Policies           │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Stack Technique

### Frontend (React 19 SPA)

| Technologie | Version | Role |
|------------|---------|------|
| React | 19.1.1 | Framework UI |
| Vite | 7.1.7 | Build tool + dev server |
| React Router | 7.6.3 | Navigation SPA |
| React Hook Form | 7.56.4 | Gestion des formulaires |
| TailwindCSS | 4.1.10 | Styling utilitaire |
| Supabase JS | 2.50.0 | Auth directe (reset password) |
| Vitest | 3.2.3 | Tests unitaires |

### Backend (Express 5 API)

| Technologie | Version | Role |
|------------|---------|------|
| Node.js | 20 LTS | Runtime JavaScript |
| Express | 5.1.0 | Framework HTTP |
| Supabase JS | 2.50.0 | Client PostgreSQL + Auth |
| Zod | 3.25.42 | Validation schemas |
| Jest | 30.0.2 | Tests unitaires |
| Supertest | 7.1.0 | Tests integration HTTP |

### Infrastructure

| Technologie | Role |
|------------|------|
| Supabase | BaaS - PostgreSQL + Auth + RLS |
| Docker | Conteneurisation |
| Docker Compose | Orchestration multi-conteneurs |
| GitHub Actions | CI/CD Pipeline |
| Nginx | Reverse proxy (production) |

## Structure du Projet

```
Time-Manager/
├── package.json                 # Workspace racine (npm workspaces)
├── backend/                     # API Express
│   ├── server.js               # Point d'entree HTTP
│   ├── app.js                  # Configuration Express
│   ├── routes/                 # Definition des endpoints
│   │   ├── index.js           # Routeur principal
│   │   ├── auth.routes.js     # /api/v1/auth/*
│   │   ├── users.routes.js    # /api/v1/users/*
│   │   └── health.routes.js   # /health, /ready
│   ├── controllers/            # Logique requete/reponse
│   │   ├── auth.controller.js
│   │   ├── users.controller.js
│   │   └── health.controller.js
│   ├── services/               # Business logic
│   │   ├── auth.service.js    # Authentification Supabase
│   │   ├── users.service.js   # CRUD utilisateurs
│   │   └── health.service.js  # Health checks
│   ├── middleware/             # Middleware Express
│   │   ├── auth.middleware.js # JWT validation
│   │   ├── rbac.middleware.js # Role-based access
│   │   └── error.middleware.js# Error handling global
│   ├── validators/             # Schemas Zod
│   │   ├── auth.validator.js  # Login, forgot-password
│   │   └── users.validator.js # Profile, create user
│   └── utils/                  # Utilitaires
│       ├── supabase.js        # Clients Supabase
│       ├── response.js        # Response helpers
│       ├── pagination.js      # Pagination helpers
│       └── transformers.js    # snake_case <-> camelCase
│
├── frontend/                    # React SPA
│   └── src/
│       ├── main.jsx           # Point d'entree React
│       ├── App.jsx            # Routes + providers
│       ├── pages/             # Pages de l'application
│       │   ├── LoginPage.jsx
│       │   ├── ForgotPasswordPage.jsx
│       │   ├── ResetPasswordPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── ProfilePage.jsx
│       │   ├── AdminUsersPage.jsx
│       │   └── AccessDeniedPage.jsx
│       ├── components/        # Composants React
│       │   ├── ui/           # Composants UI reutilisables
│       │   ├── common/       # Layout, ProtectedRoute
│       │   └── users/        # UserFormModal
│       ├── contexts/          # React Context
│       │   └── AuthContext.jsx
│       ├── hooks/             # Custom hooks
│       │   └── useAuth.js
│       ├── services/          # Services API
│       │   ├── authService.js
│       │   └── usersService.js
│       └── lib/               # Configuration
│           ├── api.js        # Client API fetch
│           └── supabase.js   # Client Supabase
│
├── supabase/
│   └── migrations/             # Migrations SQL
│       ├── 20260110105727_create_core_database_schema.sql
│       ├── 20260110111412_create_time_tracking_tables.sql
│       └── 20260110113501_rls_policies.sql
│
└── docs/                       # Documentation technique
```

## Patterns Architecturaux

### Backend : Architecture en Couches (Layered)

```
Route → Controller → Service → Supabase
          ↓             ↓
      Validator     Transformer
```

1. **Routes** : Definition des endpoints, association middleware
2. **Controllers** : Extraction des donnees de la requete, appel service, formatage reponse
3. **Services** : Logique metier, interactions base de donnees
4. **Utils** : Fonctions helpers partagees

### Frontend : Component-Based Architecture

```
App (Router + AuthProvider)
    └── Pages
        └── Components (UI + Business)
            └── Hooks + Services
```

- **Contexts** : Etat global (AuthContext pour l'utilisateur)
- **Hooks** : Logique reutilisable (useAuth)
- **Services** : Abstraction des appels API
- **Components UI** : Composants presentationnels (Button, Card, Input...)

## Flux d'Authentification

### Login Flow

```
1. User → LoginPage (email/password)
2. LoginPage → authService.login()
3. authService → POST /api/v1/auth/login
4. Backend → Supabase Auth (signInWithPassword)
5. Backend → Fetch profile from profiles table
6. Backend → Return { user, session }
7. authService → Store tokens in localStorage
8. AuthContext → Update user state
9. Navigate → /dashboard
```

### Protected Route Flow

```
1. User → /admin/users
2. ProtectedRoute → Check isAuthenticated
3. RoleProtectedRoute → Check user.role
4. If OK → Render AdminUsersPage
5. If not authenticated → Redirect /login
6. If wrong role → Redirect /access-denied
```

### Token Refresh / Logout Flow

```
1. API call → 401 Unauthorized
2. API client → dispatch 'auth:logout' event
3. AuthContext → Listen event → setUser(null)
4. ProtectedRoute → isAuthenticated = false
5. Redirect → /login
```

## Securite

### Middleware Chain

```
authenticate → rbac → validate → controller
```

1. **authenticate** : Valide JWT via Supabase, attache `req.user`
2. **rbac** : Verifie le role (employee, manager) avec hierarchie
3. **validate** : Valide le body contre schema Zod
4. **error handler** : Capture toutes les erreurs, formatage standard

### Role Hierarchy

```javascript
const ROLE_HIERARCHY = {
  employee: ['employee'],
  manager: ['manager', 'employee']  // Manager herite des permissions employee
};
```

### Row Level Security (RLS)

Les politiques RLS dans Supabase garantissent l'isolation des donnees :

- **profiles** : Lecture propre profil + managers lisent tous
- **time_entries** : CRUD propres entrees, managers lisent tout
- **timesheets** : Propres feuilles + managers pour validation
- **teams/projects/categories** : Lecture tous, mutation managers only

## API REST

### Conventions

- **Base URL** : `/api/v1`
- **Format** : JSON (camelCase)
- **Auth** : Bearer token dans header `Authorization`

### Endpoints Implementes (Epic 2)

| Methode | Endpoint | Auth | Role | Description |
|---------|----------|------|------|-------------|
| POST | /auth/login | Non | - | Connexion utilisateur |
| POST | /auth/logout | Oui | - | Deconnexion |
| POST | /auth/forgot-password | Non | - | Demande reset password |
| GET | /users/me | Oui | - | Profil utilisateur courant |
| PATCH | /users/me | Oui | - | Mise a jour profil |
| GET | /users | Oui | manager | Liste utilisateurs paginee |
| POST | /users | Oui | manager | Creer utilisateur |
| PATCH | /users/:id | Oui | manager | Modifier utilisateur |
| GET | /health | Non | - | Liveness probe |
| GET | /ready | Non | - | Readiness probe |

### Format Reponse Standard

**Succes** :
```json
{
  "success": true,
  "data": { ... }
}
```

**Succes pagine** :
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Erreur** :
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

## Base de Donnees

### Schema (10 tables)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  profiles   │     │    teams    │     │  projects   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │←┐   │ id (PK)     │     │ id (PK)     │
│ email       │ │   │ name        │     │ code        │
│ first_name  │ │   │ description │     │ name        │
│ last_name   │ │   └──────┬──────┘     │ budget_hours│
│ role        │ │          │            │ status      │
│ weekly_hrs  │ │   ┌──────┴──────┐     └──────┬──────┘
└─────────────┘ │   │team_members │            │
                │   ├─────────────┤     ┌──────┴──────┐
                │   │ team_id(FK) │     │team_projects│
                └───┤ user_id(FK) │     ├─────────────┤
                    └─────────────┘     │ team_id(FK) │
                                        │project_id(FK)│
                                        └─────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│time_entries │     │ timesheets  │     │  templates  │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │     │ id (PK)     │
│ user_id(FK) │     │ user_id(FK) │     │ user_id(FK) │
│ project_id  │     │ week_start  │     │ name        │
│ category_id │     │ status      │     │ config(JSON)│
│ start_time  │     │ total_hours │     └─────────────┘
│ end_time    │     └─────────────┘
│ duration    │                         ┌─────────────┐
└─────────────┘     ┌─────────────┐     │ audit_logs  │
                    │ categories  │     ├─────────────┤
                    ├─────────────┤     │ id (PK)     │
                    │ id (PK)     │     │ user_id     │
                    │ name        │     │ action      │
                    │ color       │     │ table_name  │
                    │ is_active   │     │ old_values  │
                    └─────────────┘     │ new_values  │
                                        └─────────────┘
```

### Index Optimisation

- `idx_time_entries_user_start` : Requetes par utilisateur + periode
- `idx_timesheets_user_week` : Lookup feuilles de temps
- `idx_team_members_user_id` : Appartenance equipes

## DevOps

### Environnements Docker

**Developpement** (`docker-compose.dev.yml`) :
- Hot-reload active (nodemon + Vite HMR)
- Volumes montes pour code source
- Ports exposes : 3000 (backend), 5173 (frontend)

**Production** (`docker-compose.prod.yml`) :
- Images optimisees multi-stage
- Nginx pour le frontend
- Healthchecks configures

### CI/CD Pipeline (GitHub Actions)

```
Push/PR → Tests (parallel) → Build Docker → Push Docker Hub
              ↓
    ┌─────────┼─────────┐
    ↓         ↓         ↓
test-backend test-front lint-front
    └─────────┼─────────┘
              ↓
    ┌─────────┼─────────┐
    ↓                   ↓
build-backend     build-frontend
    └─────────┬─────────┘
              ↓
         Push to Docker Hub
```

### Git Hooks (Husky)

- **pre-commit** : Lint + tests rapides sur fichiers modifies
- **pre-push** : Tests complets avant push

## Performances

### Optimisations Backend

- Pagination par defaut (20 items, max 100)
- Index PostgreSQL sur colonnes frequemment filtrees
- Connection pooling Supabase

### Optimisations Frontend

- Code splitting avec React Router lazy loading (a venir)
- TailwindCSS purge des classes inutilisees
- Build Vite optimise (tree-shaking)

## Prochaines Etapes

### Epic 3 : Teams & Projects
- CRUD equipes et projets
- Assignation membres
- Gestion categories

### Epic 4 : Time Entries
- Saisie des temps
- Templates
- Mode simple/journee

### Epic 5 : Timesheets
- Feuilles de temps hebdomadaires
- Workflow validation
- Commentaires manager

### Epic 6 : Dashboard & KPIs
- Tableau de bord
- Metriques productivite
- Export rapports
