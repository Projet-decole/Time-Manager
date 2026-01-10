---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
status: complete
completedAt: '2026-01-10'
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/planning-artifacts/product-brief-Time-Manager-2026-01-09.md'
  - 'docs/source-tree-analysis.md'
  - 'docs/project-overview.md'
workflowType: 'architecture'
project_name: 'Time Manager'
user_name: 'Lunos'
date: '2026-01-10'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (95 FRs):**

| Domaine | FRs | Description |
|---------|-----|-------------|
| Authentication & User Management | FR1-FR5 | JWT login, logout, refresh, password reset, profile |
| Authorization & Permissions | FR6-FR13 | RBAC 2 rôles avec héritage, vérification backend |
| Time Tracking - Mode Simple | FR14-FR18 | Start/Stop 1-clic, sélection projet/catégorie |
| Time Tracking - Mode Journée | FR19-FR23 | Démarrer/Arrêter journée, timeline découpage |
| Time Tracking - Mode Template | FR24-FR30 | Création, application, gestion templates |
| Timesheet Workflow | FR31-FR39 | États (Brouillon/Soumis/Validé/Rejeté), validation manager |
| Team Management | FR40-FR45 | CRUD équipes, assignation membres/projets |
| Project & Category Management | FR46-FR52 | CRUD projets avec code auto, catégories avec couleur |
| Dashboard Employee | FR53-FR58 | KPIs personnels, donut projets, tendance 30j |
| Dashboard Manager/Team | FR59-FR66 | KPIs équipe, alertes visuelles, comparaison employés |
| Dashboard Project | FR67-FR74 | Budget, projections, alertes risque |
| Audit Trail | FR75-FR81 | Historique complet invisible, conformité |
| Data Visualization | FR82-FR89 | 7 types graphiques, interactivité |
| Mobile & Responsive | FR90-FR95 | Mobile-first employés, desktop managers |

**Non-Functional Requirements (57 NFRs):**

| Catégorie | NFRs Clés | Cibles |
|-----------|-----------|--------|
| **Performance** | NFR1-NFR7 | API <200ms, Dashboards <500ms, FCP <1.5s, TTI <3s |
| **Security** | NFR8-NFR17 | HTTPS, JWT 1h expiry, bcrypt cost≥12, rate limiting 100/min |
| **Scalability** | NFR18-NFR22 | 10x growth, indexes DB, caching, Docker <200MB |
| **Accessibility** | NFR23-NFR26 | WCAG AA, contraste 4.5:1, keyboard nav |
| **Testing** | NFR32-NFR38 | Backend >80%, Frontend >60%, CI/CD <10min |
| **Operations** | NFR39-NFR45 | Docker 4 images, health checks, GitHub Actions |

**Scale & Complexity:**

- **Primary domain:** Full-Stack Web Application (SPA + REST API)
- **Complexity level:** Medium-High
- **Estimated architectural components:**
  - Backend: ~15-20 modules (routes, controllers, services, models)
  - Frontend: ~30-40 composants React
  - Database: ~8-12 tables principales

### Technical Constraints & Dependencies

**Projet Brownfield - Infrastructure Existante:**
- Runtime: Node.js 20 (Alpine)
- Backend: Express 5.1.0 + Supabase SDK 2.58.0
- Frontend: React 19.1.1 + Vite 7.1.7
- Testing: Jest 30 (backend) + Vitest 3 (frontend)
- DevOps: Docker (4 images) + GitHub Actions CI/CD
- Package Manager: npm workspaces (monorepo)

**Contraintes Académiques:**
- Test coverage backend >80% obligatoire
- Documentation complète requise
- CI/CD pipeline automatisé

**Contraintes UX:**
- Design System: shadcn/ui + Tailwind CSS
- Mobile-first pour employés (pointage <10s)
- Desktop-first pour managers (dashboards)
- "Zéro Friction" comme principe directeur

### Cross-Cutting Concerns Identified

1. **Authentication & Session Management**
   - JWT tokens dans toutes les requêtes API
   - Refresh token flow transparent
   - Logout avec invalidation

2. **Authorization (RBAC)**
   - Vérification permissions sur TOUTES les routes backend
   - UI contextuelle selon rôle (mais sécurité = backend)
   - Héritage permissions: Manager = Employee++

3. **Audit Trail**
   - Logging automatique toutes modifications
   - Invisible utilisateurs, accessible audit
   - Données: qui, quand, quoi, anciennes/nouvelles valeurs

4. **Error Handling**
   - Messages utilisateur clairs (frontend)
   - Logs structurés avec stack trace (backend)
   - Transactions atomiques (ACID)

5. **Performance Optimization**
   - Caching données peu changeantes
   - Lazy loading dashboards/graphiques
   - Code splitting frontend
   - Indexes base de données

6. **Input Validation**
   - Validation backend obligatoire (sécurité)
   - Validation frontend (UX)
   - Protection SQL injection, XSS, CSRF

## Starter Template Evaluation

### Primary Technology Domain

**Projet Brownfield** - Infrastructure Full-Stack existante à étendre

Ce projet n'utilise pas de starter template car l'infrastructure est déjà en place.
Les fondations techniques sont établies et documentées ci-dessous.

### Existing Infrastructure (Brownfield)

**Backend Stack:**
- Runtime: Node.js 20.x (Alpine)
- Framework: Express 5.1.0
- Database: Supabase (PostgreSQL BaaS)
- Testing: Jest 30 + Supertest 7

**Frontend Stack:**
- Framework: React 19.1.1
- Build Tool: Vite 7.1.7
- Testing: Vitest 3 + Testing Library 16

**DevOps:**
- Containerization: Docker (4 images: dev/prod × backend/frontend)
- CI/CD: GitHub Actions
- Git Hooks: Husky + lint-staged

### Technology Decisions

**Authentication & Authorization:**
- **Solution:** Supabase Auth (natif)
- **Rationale:**
  - JWT généré et validé automatiquement par Supabase
  - Refresh token flow géré par le SDK
  - Password reset via magic link inclus
  - Row Level Security (RLS) pour permissions DB
  - Moins de code custom à maintenir
- **RBAC:** Rôle stocké dans `user_metadata` ou table `profiles`

**Frontend Libraries:**

| Domaine | Choix | Justification |
|---------|-------|---------------|
| Design System | shadcn/ui + Tailwind CSS | Minimaliste, accessible (Radix UI), personnalisable |
| Charts | Recharts | React-natif, 7 types requis supportés |
| Forms | React Hook Form | Performance, validation intégrée |
| HTTP Client | fetch natif | Suffisant pour REST, pas de dépendance |
| Routing | React Router v7 | Standard React, mature |
| State Management | Context API + useReducer | Suffisant pour scope MVP, pas de surcharge |

**Backend Libraries:**

| Domaine | Choix | Justification |
|---------|-------|---------------|
| Validation | Zod | TypeScript-first, léger, composable |
| Rate Limiting | express-rate-limit | Simple, configurable (100 req/min) |
| Security Headers | Helmet.js | Best practices OWASP |
| CORS | cors (existant) | Déjà configuré |

**Backend Architecture Pattern:**

```
backend/
├── server.js           # HTTP server entry
├── app.js              # Express config
├── routes/             # HTTP layer (endpoints)
│   ├── auth.routes.js
│   ├── users.routes.js
│   ├── teams.routes.js
│   ├── projects.routes.js
│   ├── categories.routes.js
│   ├── timeEntries.routes.js
│   ├── timesheets.routes.js
│   └── dashboards.routes.js
├── controllers/        # Request handling
├── services/           # Business logic
├── middleware/         # Auth, validation, error handling
│   ├── auth.middleware.js      # Supabase auth verification
│   ├── rbac.middleware.js      # Role-based access control
│   └── validate.middleware.js  # Zod schema validation
├── utils/              # Helpers
└── tests/              # Jest test suites
```

**Note:** Pas de couche `models/` séparée car Supabase SDK sert de Data Access Layer.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- ✅ Database Schema - 10 tables définies
- ✅ API Structure - 40+ endpoints RESTful
- ✅ Authentication - Supabase Auth
- ✅ Response Format - Standard JSON avec codes d'erreur

**Important Decisions (Shape Architecture):**
- ✅ Backend Pattern - Layered (routes/controllers/services)
- ✅ Validation - Zod schemas
- ✅ State Management - Context API + useReducer

**Deferred Decisions (Post-MVP):**
- WebSocket pour temps réel (notifications)
- Caching Redis (si performance insuffisante)
- GraphQL (si besoins complexes de query)

### Data Architecture

#### Database Schema (Supabase PostgreSQL)

**Core Tables:**

| Table | Description | Relations |
|-------|-------------|-----------|
| `profiles` | Utilisateurs (extends auth.users) | → teams, time_entries, timesheets |
| `teams` | Équipes | → team_members, team_projects |
| `team_members` | Junction users↔teams | profiles ← → teams |
| `projects` | Projets avec budget | → team_projects, time_entries |
| `team_projects` | Junction teams↔projects | teams ← → projects |
| `categories` | Catégories de temps | → time_entries |
| `time_entries` | Pointages individuels | → profiles, projects, categories |
| `timesheets` | Feuilles hebdomadaires | → profiles (user, validator) |
| `templates` | Templates de pointage | → profiles |
| `audit_logs` | Historique modifications | → profiles |

**Key Design Decisions:**

1. **profiles vs auth.users**: Table séparée pour données métier, liée à Supabase Auth
2. **Junction tables**: `team_members` et `team_projects` pour relations N:N
3. **timesheets**: Une par semaine par utilisateur (UNIQUE constraint)
4. **templates.config**: JSONB pour flexibilité des templates
5. **audit_logs**: Table dédiée, jamais supprimée

**Database Schema SQL:**

```sql
-- ==========================================
-- CORE TABLES
-- ==========================================

-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'manager')),
  weekly_hours_target INTEGER DEFAULT 35,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members (junction table)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  budget_hours INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Projects (junction table)
CREATE TABLE team_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, project_id)
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- TIME TRACKING TABLES
-- ==========================================

-- Time Entries
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  category_id UUID REFERENCES categories(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  description TEXT,
  entry_mode TEXT CHECK (entry_mode IN ('simple', 'day', 'template')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timesheets
CREATE TABLE timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'validated', 'rejected')),
  validated_by UUID REFERENCES profiles(id),
  validated_at TIMESTAMPTZ,
  rejection_reason TEXT,
  total_hours DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- AUDIT TRAIL
-- ==========================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_start_time ON time_entries(start_time);
CREATE INDEX idx_timesheets_user_week ON timesheets(user_id, week_start);
CREATE INDEX idx_audit_logs_record ON audit_logs(table_name, record_id);
```

**Row Level Security (RLS) Example:**

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Managers can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Time entries policies
CREATE POLICY "Users can CRUD own entries"
  ON time_entries FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all entries"
  ON time_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );
```

### Authentication & Security

**Authentication Flow:**

```
┌──────────┐    ┌──────────┐    ┌─────────────────┐
│ Frontend │───>│ Backend  │───>│  Supabase Auth  │
│          │<───│          │<───│                 │
└──────────┘    └──────────┘    └─────────────────┘
     │                                   │
     └───── Direct auth possible ────────┘
```

**Security Layers:**

| Layer | Implementation |
|-------|----------------|
| Transport | HTTPS (production) |
| Authentication | Supabase Auth (JWT) |
| Authorization | RLS + RBAC middleware |
| Input Validation | Zod schemas (all endpoints) |
| Rate Limiting | express-rate-limit (100 req/min) |
| Security Headers | Helmet.js |
| Audit | audit_logs table |

**RBAC Rules:**

| Action | Employee | Manager |
|--------|----------|---------|
| Own time entries CRUD | ✅ | ✅ |
| Own timesheet submit | ✅ | ✅ |
| View own dashboard | ✅ | ✅ |
| View team data | ❌ | ✅ |
| Validate timesheets | ❌ | ✅ (not own) |
| CRUD teams/projects/categories | ❌ | ✅ |

### API & Communication Patterns

**Base URL:** `/api/v1`

**Endpoint Summary:**

| Category | Count | Description |
|----------|-------|-------------|
| Auth | 5 | Login, logout, refresh, reset, me |
| Users | 4 | List, get, update, stats |
| Teams | 7 | CRUD + members management |
| Projects | 6 | CRUD + stats |
| Categories | 4 | CRUD |
| Time Entries | 7 | CRUD + start/stop |
| Timesheets | 6 | Get, submit, validate, reject, reopen |
| Templates | 5 | CRUD + apply |
| Dashboards | 3 | Employee, team, project |

**Response Format:**

```javascript
// Success
{ success: true, data: {...}, meta: { pagination } }

// Error
{ success: false, error: { code, message, details } }
```

**Error Codes:**

| HTTP | Code | Usage |
|------|------|-------|
| 400 | VALIDATION_ERROR | Invalid input |
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | State conflict |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |

### Frontend Architecture

**Component Structure:**

```
frontend/src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── common/          # Shared (Layout, Nav, etc.)
│   ├── time-tracking/   # Pointage components
│   ├── dashboards/      # Dashboard components
│   └── admin/           # Manager-only components
├── pages/               # Route pages
├── hooks/               # Custom hooks
├── contexts/            # React contexts (Auth, Theme)
├── services/            # API client functions
├── lib/                 # Utilities
└── types/               # TypeScript-like JSDoc types
```

**State Management:**

| Scope | Solution |
|-------|----------|
| Auth State | AuthContext (Supabase session) |
| UI State | Local useState |
| Server State | Custom hooks + fetch |
| Form State | React Hook Form |

### Infrastructure & Deployment

**Environments:**

| Environment | Backend | Frontend | Database |
|-------------|---------|----------|----------|
| Development | localhost:3000 | localhost:5173 | Supabase (dev) |
| Production | Docker container | Nginx container | Supabase (prod) |

**CI/CD Pipeline:** Push → Tests → Build Docker → Push Registry

### Decision Impact Analysis

**Implementation Sequence:**

1. Database schema (Supabase migrations)
2. Auth middleware (Supabase integration)
3. Core API routes (CRUD operations)
4. Frontend auth flow
5. Time tracking features
6. Dashboards
7. Polish & testing

**Cross-Component Dependencies:**

- All API routes depend on auth middleware
- Dashboards depend on time_entries data
- Timesheets depend on time_entries aggregation
- Templates create time_entries when applied

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 5 catégories où les agents AI pourraient faire des choix différents

### Naming Patterns

**Database Naming Conventions:**

| Élément | Convention | Exemple |
|---------|------------|---------|
| Tables | snake_case, pluriel | `time_entries`, `audit_logs` |
| Colonnes | snake_case | `user_id`, `created_at` |
| Foreign Keys | `{table_singulier}_id` | `project_id`, `category_id` |
| Indexes | `idx_{table}_{columns}` | `idx_time_entries_user_id` |
| Constraints | `{table}_{type}_{columns}` | `timesheets_unique_user_week` |

**API Naming Conventions:**

| Élément | Convention | Exemple |
|---------|------------|---------|
| Base URL | Versioned | `/api/v1` |
| Resources | kebab-case, pluriel | `/time-entries`, `/audit-logs` |
| Actions | POST verbe | `POST /time-entries/start` |
| Query params | snake_case | `?user_id=123&week_start=2026-01-06` |
| Route params | camelCase | `/users/:userId` |

**Code Naming Conventions:**

| Élément | Convention | Exemple |
|---------|------------|---------|
| Fichiers composants | PascalCase.jsx | `TimeEntryCard.jsx` |
| Fichiers utilitaires | camelCase.js | `formatDate.js` |
| Fichiers routes | kebab-case.routes.js | `time-entries.routes.js` |
| Composants React | PascalCase | `TimeEntryCard` |
| Fonctions | camelCase | `getTimeEntries()` |
| Variables | camelCase | `currentUser` |
| Constantes | SCREAMING_SNAKE_CASE | `API_BASE_URL` |
| Hooks | usePascalCase | `useTimeEntries` |
| Contexts | PascalCaseContext | `AuthContext` |

### Structure Patterns

**Backend Organization:**

```
backend/
├── server.js                 # HTTP server entry
├── app.js                    # Express config
├── routes/                   # Route definitions ONLY
│   ├── index.js              # Route aggregator
│   ├── auth.routes.js
│   ├── users.routes.js
│   ├── teams.routes.js
│   ├── projects.routes.js
│   ├── categories.routes.js
│   ├── time-entries.routes.js
│   ├── timesheets.routes.js
│   ├── templates.routes.js
│   └── dashboards.routes.js
├── controllers/              # Request/Response handling
│   └── {resource}.controller.js
├── services/                 # Business logic
│   └── {resource}.service.js
├── middleware/
│   ├── auth.middleware.js
│   ├── rbac.middleware.js
│   ├── validate.middleware.js
│   └── error.middleware.js
├── validators/               # Zod schemas
│   └── {resource}.validator.js
├── utils/
│   └── {utility}.js
└── tests/                    # Mirror source structure
    ├── routes/
    ├── controllers/
    └── services/
```

**Frontend Organization:**

```
frontend/src/
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   ├── common/               # Layout, Nav, Footer, etc.
│   └── features/
│       ├── auth/             # Login, Register
│       ├── time-tracking/    # TimeEntry, Timer, Timeline
│       ├── timesheets/       # Timesheet, Validation
│       ├── dashboards/       # Charts, KPIs
│       ├── teams/            # Team management
│       ├── projects/         # Project management
│       └── templates/        # Template management
├── pages/                    # Route pages
├── hooks/                    # Custom hooks
├── contexts/                 # AuthContext, ThemeContext
├── services/                 # API client functions
├── lib/                      # Utilities (cn, formatters)
└── __tests__/                # Test files (co-location OK)
```

### Format Patterns

**API Response Formats:**

```javascript
// Success with data
{
  "success": true,
  "data": { /* single object or array */ },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}

// Success with empty list (ALWAYS array, never null)
{
  "success": true,
  "data": [],
  "meta": { "pagination": { "total": 0 } }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

**Data Exchange Formats:**

| Data Type | Format | Example |
|-----------|--------|---------|
| Dates (API) | ISO 8601 | `"2026-01-10T14:30:00Z"` |
| Dates (DB) | TIMESTAMPTZ | `2026-01-10 14:30:00+00` |
| UUIDs | Standard format | `"550e8400-e29b-41d4-a716-446655440000"` |
| Booleans | true/false | `"active": true` |
| Null | explicit null | `"description": null` |
| Money/Hours | Decimal | `"total_hours": 35.50` |

**JSON Field Transformation:**
- Database: snake_case (`user_id`, `created_at`)
- API Response: camelCase (`userId`, `createdAt`)
- Transformation in controllers

### Process Patterns

**Error Handling (Backend):**

```javascript
// Custom error class
class AppError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// Usage in services
throw new AppError('Timesheet already submitted', 409, 'CONFLICT');

// Global error middleware
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) console.error('[ERROR]', err);

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message,
      details: err.details
    }
  });
};
```

**Error Handling (Frontend):**

```javascript
// Pattern: error state in components
const [state, setState] = useState({
  data: null,
  loading: false,
  error: null
});

// Pattern: try-catch-finally
const fetchData = async () => {
  try {
    setState(s => ({ ...s, loading: true, error: null }));
    const data = await api.get('/resource');
    setState(s => ({ ...s, data, loading: false }));
  } catch (err) {
    setState(s => ({ ...s, error: err.message, loading: false }));
  }
};
```

**Loading States:**
- Use `loading` boolean in component state
- Show skeleton/spinner during load
- Disable form buttons while submitting
- Pattern: `{ data, loading, error }` tuple

### Enforcement Guidelines

**All AI Agents MUST:**

1. Follow naming conventions exactly as specified
2. Place files in correct directories per structure patterns
3. Use standard API response format for all endpoints
4. Transform snake_case (DB) ↔ camelCase (API) in controllers
5. Use AppError class for all backend errors
6. Include proper error handling in all async operations

**Pattern Verification:**
- ESLint rules for naming conventions
- PR review checklist includes pattern compliance
- Tests verify API response format

### Pattern Examples

**Good Examples:**

```javascript
// ✅ Correct file: routes/time-entries.routes.js
router.get('/time-entries', timeEntriesController.getAll);

// ✅ Correct response
res.json({ success: true, data: entries, meta: { pagination } });

// ✅ Correct naming
const getUserTimeEntries = async (userId) => { /* ... */ };
```

**Anti-Patterns:**

```javascript
// ❌ Wrong: singular endpoint
router.get('/time-entry', ...);

// ❌ Wrong: inconsistent response
res.json(entries); // Missing wrapper

// ❌ Wrong: snake_case in JS
const user_time_entries = await getEntries(); // Should be camelCase
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
Time-Manager/
├── README.md
├── package.json                    # Root workspace config
├── package-lock.json
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .gitignore
├── .github/
│   └── workflows/
│       ├── ci-cd.yml
│       └── mirror-to-school.yml
├── .husky/
│   ├── pre-commit
│   └── pre-push
│
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── app.js
│   ├── .env.example
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   │
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── teams.routes.js
│   │   ├── projects.routes.js
│   │   ├── categories.routes.js
│   │   ├── time-entries.routes.js
│   │   ├── timesheets.routes.js
│   │   ├── templates.routes.js
│   │   └── dashboards.routes.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── users.controller.js
│   │   ├── teams.controller.js
│   │   ├── projects.controller.js
│   │   ├── categories.controller.js
│   │   ├── time-entries.controller.js
│   │   ├── timesheets.controller.js
│   │   ├── templates.controller.js
│   │   └── dashboards.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── users.service.js
│   │   ├── teams.service.js
│   │   ├── projects.service.js
│   │   ├── categories.service.js
│   │   ├── time-entries.service.js
│   │   ├── timesheets.service.js
│   │   ├── templates.service.js
│   │   ├── dashboards.service.js
│   │   └── audit.service.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── rbac.middleware.js
│   │   ├── validate.middleware.js
│   │   ├── error.middleware.js
│   │   └── rateLimiter.middleware.js
│   │
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── users.validator.js
│   │   ├── teams.validator.js
│   │   ├── projects.validator.js
│   │   ├── categories.validator.js
│   │   ├── time-entries.validator.js
│   │   ├── timesheets.validator.js
│   │   └── templates.validator.js
│   │
│   ├── utils/
│   │   ├── supabase.js
│   │   ├── AppError.js
│   │   ├── response.js
│   │   ├── pagination.js
│   │   └── transformers.js
│   │
│   └── tests/
│       ├── setup.js
│       ├── routes/
│       ├── services/
│       └── middleware/
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── nginx.conf
│   ├── Dockerfile.dev
│   ├── Dockerfile.prod
│   │
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       │
│       ├── components/
│       │   ├── ui/                 # shadcn/ui
│       │   ├── common/             # Layout, Nav, etc.
│       │   └── features/
│       │       ├── auth/
│       │       ├── time-tracking/
│       │       ├── timesheets/
│       │       ├── dashboards/
│       │       ├── teams/
│       │       ├── projects/
│       │       ├── categories/
│       │       └── templates/
│       │
│       ├── pages/
│       │   ├── LoginPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── TimeTrackingPage.jsx
│       │   ├── TimesheetsPage.jsx
│       │   ├── TemplatesPage.jsx
│       │   ├── TeamsPage.jsx
│       │   ├── ProjectsPage.jsx
│       │   ├── CategoriesPage.jsx
│       │   ├── ValidationPage.jsx
│       │   └── ProfilePage.jsx
│       │
│       ├── hooks/
│       ├── contexts/
│       ├── services/
│       ├── lib/
│       └── __tests__/
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_rls_policies.sql
│       └── 003_indexes.sql
│
├── Docs/
└── docs/
```

### Architectural Boundaries

**API Boundaries:**
- All routes under `/api/v1`
- Auth endpoints: `/api/v1/auth/*`
- Resource endpoints: `/api/v1/{resource}`
- Dashboard endpoints: `/api/v1/dashboards/*`

**Component Boundaries:**
- UI primitives: `components/ui/` (shadcn/ui)
- Shared layouts: `components/common/`
- Feature components: `components/features/{domain}/`
- Page components: `pages/`

**Service Boundaries:**
- Backend services encapsulate business logic
- Frontend services encapsulate API calls
- Controllers handle HTTP only, delegate to services
- Supabase SDK is the data access layer

**Data Boundaries:**
- Database accessed only via Supabase SDK
- RLS policies enforce row-level security
- Backend validates all inputs (Zod)
- Frontend validates for UX (not security)

### Requirements to Structure Mapping

| Domaine FR | Backend | Frontend |
|------------|---------|----------|
| Auth (FR1-5) | `routes/auth`, `services/auth`, `middleware/auth` | `features/auth`, `contexts/AuthContext` |
| RBAC (FR6-13) | `middleware/rbac` | `common/ProtectedRoute` |
| Time Tracking (FR14-30) | `routes/time-entries`, `services/time-entries` | `features/time-tracking` |
| Timesheets (FR31-39) | `routes/timesheets`, `services/timesheets` | `features/timesheets` |
| Teams (FR40-45) | `routes/teams`, `services/teams` | `features/teams` |
| Projects (FR46-52) | `routes/projects`, `services/projects` | `features/projects` |
| Dashboards (FR53-74) | `routes/dashboards`, `services/dashboards` | `features/dashboards` |
| Audit (FR75-81) | `services/audit` | N/A (invisible) |
| Templates (FR24-30) | `routes/templates`, `services/templates` | `features/templates` |

### Integration Points

**Internal Communication:**
- Frontend → Backend: HTTP REST via fetch
- Backend → Supabase: Supabase JS SDK
- Components → State: React Context + hooks

**External Integrations:**
- Supabase Auth: Authentication provider
- Supabase Database: PostgreSQL BaaS
- Docker Hub: Container registry
- GitHub Actions: CI/CD

**Data Flow:**
```
User Action → React Component → Service → API → Controller → Service → Supabase → DB
                                                                          ↓
User Display ← React Component ← Hook ← Service ← API Response ← Controller
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- Express 5 + Supabase SDK: Fully compatible
- React 19 + Vite 7 + Tailwind: Fully compatible
- Supabase Auth integration: Native and seamless
- Context API for state: Sufficient for MVP scope
- Docker + CI/CD: Already functional, compatible with new code

**Pattern Consistency:**
- Naming conventions coherent across DB (snake_case) → API/JS (camelCase)
- Backend Layered pattern aligned with Express best practices
- Frontend feature-based structure aligned with React patterns
- Error handling patterns consistent backend ↔ frontend

**Structure Alignment:**
- Backend structure supports routes/controllers/services pattern
- Frontend structure supports features/pages/hooks separation
- Tests organized mirroring source code structure
- Integration points clearly defined

### Requirements Coverage Validation ✅

**Functional Requirements (95 FRs):**

| Category | FRs | Coverage | Implementation |
|----------|-----|----------|----------------|
| Auth & User Management | FR1-FR5 | ✅ | Supabase Auth + profiles table |
| Authorization | FR6-FR13 | ✅ | RLS policies + RBAC middleware |
| Time Tracking - Simple | FR14-FR18 | ✅ | time_entries + start/stop endpoints |
| Time Tracking - Day | FR19-FR23 | ✅ | time_entries + timeline component |
| Time Tracking - Template | FR24-FR30 | ✅ | templates table + apply endpoint |
| Timesheets | FR31-FR39 | ✅ | timesheets + workflow states |
| Teams | FR40-FR45 | ✅ | teams + team_members |
| Projects | FR46-FR52 | ✅ | projects + team_projects |
| Dashboard Employee | FR53-FR58 | ✅ | dashboards endpoint + Recharts |
| Dashboard Manager | FR59-FR66 | ✅ | dashboards endpoint + Recharts |
| Dashboard Project | FR67-FR74 | ✅ | dashboards endpoint + Recharts |
| Audit Trail | FR75-FR81 | ✅ | audit_logs table + service |
| Data Visualization | FR82-FR89 | ✅ | 7 chart types with Recharts |
| Mobile/Responsive | FR90-FR95 | ✅ | Mobile-first + shadcn/ui |

**Non-Functional Requirements (57 NFRs):**

| Category | NFRs | Coverage |
|----------|------|----------|
| Performance | NFR1-NFR7 | ✅ DB indexes, lazy loading planned |
| Security | NFR8-NFR17 | ✅ Supabase Auth, RLS, Helmet, rate limiting |
| Scalability | NFR18-NFR22 | ✅ Stateless architecture, Supabase managed |
| Accessibility | NFR23-NFR26 | ✅ shadcn/ui (Radix = WCAG compliant) |
| Testing | NFR32-NFR38 | ✅ Jest/Vitest configured, test structure defined |
| Operations | NFR39-NFR45 | ✅ Docker, CI/CD, health checks |

### Implementation Readiness Validation ✅

**Decision Completeness:**
- ✅ All technologies documented with versions
- ✅ Complete DB schema with SQL ready to execute
- ✅ All API endpoints listed with methods
- ✅ Response format standardized with examples

**Structure Completeness:**
- ✅ All backend files and directories defined
- ✅ All frontend components organized by feature
- ✅ FR → file mapping documented
- ✅ Test structure defined

**Pattern Completeness:**
- ✅ Naming conventions for DB, API, JavaScript
- ✅ Error handling patterns with code examples
- ✅ Response format with success/error examples
- ✅ Anti-patterns documented to avoid

### Gap Analysis Results

**Critical Gaps:** None identified

**Minor Gaps (Nice-to-Have, can be added during implementation):**
- OpenAPI/Swagger documentation (generate during implementation)
- Storybook for UI components (optional)
- Stricter ESLint rules to enforce naming conventions

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (Medium-High)
- [x] Technical constraints identified (Brownfield project)
- [x] Cross-cutting concerns mapped (Auth, RBAC, Audit, Error Handling)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined (REST, Supabase SDK)
- [x] Performance considerations addressed (indexes, lazy loading)

**✅ Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented (error handling, loading states)

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** ✅ READY FOR IMPLEMENTATION

**Confidence Level:** HIGH

**Key Strengths:**
- Supabase Auth eliminates complex authentication code
- Modern, cohesive technology stack
- Clear patterns prevent implementation conflicts
- Complete structure mapped to all 95 functional requirements
- Brownfield project with solid infrastructure foundation

**Areas for Future Enhancement:**
- Add WebSocket for real-time notifications (post-MVP)
- Consider Redis caching if performance issues arise
- GraphQL layer if query complexity increases

### Implementation Handoff

**AI Agent Guidelines:**
1. Follow all architectural decisions exactly as documented
2. Use implementation patterns consistently across all components
3. Respect project structure and boundaries
4. Transform snake_case (DB) ↔ camelCase (API/JS) in controllers
5. Use AppError class for all backend errors
6. Refer to this document for all architectural questions

**First Implementation Priority:**
1. Create Supabase tables (execute SQL schema)
2. Configure RLS policies
3. Implement auth middleware
4. Build core CRUD routes
5. Create frontend auth flow
6. Develop time tracking features
7. Build dashboards

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2026-01-10
**Document Location:** `_bmad-output/planning-artifacts/architecture.md`

### Final Architecture Deliverables

**📋 Complete Architecture Document**
- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**🏗️ Implementation Ready Foundation**
- 25+ architectural decisions made
- 5 implementation pattern categories defined
- 10 database tables + 40+ API endpoints specified
- 95 functional requirements + 57 NFRs fully supported

**📚 AI Agent Implementation Guide**
- Technology stack with verified versions
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Quality Assurance Checklist

**✅ Architecture Coherence**
- [x] All decisions work together without conflicts
- [x] Technology choices are compatible
- [x] Patterns support the architectural decisions
- [x] Structure aligns with all choices

**✅ Requirements Coverage**
- [x] All 95 functional requirements are supported
- [x] All 57 non-functional requirements are addressed
- [x] Cross-cutting concerns are handled
- [x] Integration points are defined

**✅ Implementation Readiness**
- [x] Decisions are specific and actionable
- [x] Patterns prevent agent conflicts
- [x] Structure is complete and unambiguous
- [x] Examples are provided for clarity

### Project Success Factors

**🎯 Clear Decision Framework**
Every technology choice was made collaboratively with clear rationale, ensuring all stakeholders understand the architectural direction.

**🔧 Consistency Guarantee**
Implementation patterns and rules ensure that multiple AI agents will produce compatible, consistent code that works together seamlessly.

**📋 Complete Coverage**
All project requirements are architecturally supported, with clear mapping from business needs to technical implementation.

**🏗️ Solid Foundation**
The Brownfield project infrastructure and architectural patterns provide a production-ready foundation following current best practices.

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.

