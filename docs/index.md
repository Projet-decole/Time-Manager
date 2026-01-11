# Documentation Technique - Time Manager

> **Version** : 2.0 | **Date** : 2026-01-11 | **Epic actuel** : 2 (Authentication & Authorization)

## A propos

Time Manager est une application web de gestion du temps permettant aux employes de pointer leurs heures et aux managers de superviser leurs equipes.

**Stack technique** : React 19 + Express 5 + Supabase (PostgreSQL)

**Architecture** : Monorepo multi-part avec npm workspaces

---

## Index de la Documentation

### Architecture et Design

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | Vue d'ensemble de l'architecture, diagrammes, stack technique, patterns |
| [Modele de Donnees](./data-model.md) | Schema database, relations, RLS policies, conventions |

### Reference API

| Document | Description |
|----------|-------------|
| [Reference API](./api-reference.md) | Endpoints REST, request/response, codes erreur, exemples cURL |

### Guides de Developpement

| Document | Description |
|----------|-------------|
| [Guide Frontend](./frontend-guide.md) | Composants React, hooks, services, patterns, tests |
| [Guide Backend](./backend-guide.md) | Routes, controllers, services, middleware, validation |

### Documentation Operationnelle

| Document | Description |
|----------|-------------|
| [Docker](./docker.md) | Commandes, Dockerfiles, troubleshooting |
| [CI/CD](./ci-cd.md) | GitHub Actions, Husky hooks |
| [Tests](./tests.md) | Jest, Vitest, patterns |

### Documentation Produit

| Document | Description |
|----------|-------------|
| [PRD](_bmad-output/planning-artifacts/prd.md) | Product Requirements Document |
| [Epics & Stories](_bmad-output/planning-artifacts/epics.md) | Decomposition des fonctionnalites |
| [Architecture Decision](_bmad-output/planning-artifacts/architecture.md) | Decisions architecturales |

---

## Quick Start

### Prerequisites

- Docker + Docker Compose
- Node.js 20 (pour dev local)
- Compte Supabase

### Lancement Dev

```bash
# Cloner le repo
git clone <url>
cd Time-Manager

# Installer dependances
npm install

# Configuration
cp backend/.env.example backend/.env
# Editer backend/.env avec credentials Supabase

# Lancer avec Docker
docker-compose -f docker-compose.dev.yml up
```

**Acces** :
- Frontend : http://localhost:5173
- Backend API : http://localhost:3000

---

## Structure du Projet

```
Time-Manager/
├── backend/                     # API Express 5
│   ├── routes/                 # Endpoints REST
│   ├── controllers/            # Request handlers
│   ├── services/               # Business logic
│   ├── middleware/             # Auth, RBAC, validation
│   ├── validators/             # Schemas Zod
│   └── utils/                  # Helpers
│
├── frontend/                    # React 19 SPA
│   └── src/
│       ├── pages/             # Pages application
│       ├── components/        # Composants React
│       ├── contexts/          # State global
│       ├── hooks/             # Custom hooks
│       ├── services/          # API services
│       └── lib/               # Configuration
│
├── supabase/
│   └── migrations/             # SQL migrations
│
├── docs/                       # Documentation technique
│
├── docker-compose.dev.yml      # Orchestration dev
└── docker-compose.prod.yml     # Orchestration prod
```

---

## Etat du Projet

### Epic 2 : Authentication & Authorization - TERMINE

| Story | Description | Status |
|-------|-------------|--------|
| 2.1 | Setup Auth Infrastructure | Done |
| 2.2 | Auth Middleware | Done |
| 2.3 | RBAC Middleware | Done |
| 2.4 | Login Endpoint | Done |
| 2.5 | Logout Endpoint | Done |
| 2.6 | RBAC Integration Tests | Done |
| 2.7 | Forgot Password Endpoint | Done |
| 2.8 | Frontend Auth Infrastructure | Done |
| 2.9 | Login Page | Done |
| 2.10 | Reset Password Page | Done |
| 2.11 | Profile Page | Done |
| 2.12 | Protected Routes | Done |
| 2.13 | Admin Users Page | Done |
| 2.14 | Manager User Management | Done |

### Prochains Epics

- **Epic 3** : Teams & Projects Management
- **Epic 4** : Time Entries
- **Epic 5** : Timesheets & Validation
- **Epic 6** : Dashboard & KPIs

---

## API Quick Reference

### Authentication

```bash
# Login
POST /api/v1/auth/login
{"email": "...", "password": "..."}

# Logout (requires auth)
POST /api/v1/auth/logout

# Forgot Password
POST /api/v1/auth/forgot-password
{"email": "..."}
```

### Users

```bash
# Get my profile (requires auth)
GET /api/v1/users/me

# Update my profile (requires auth)
PATCH /api/v1/users/me
{"firstName": "...", "lastName": "..."}

# List users (requires manager role)
GET /api/v1/users?page=1&limit=20&role=employee

# Create user (requires manager role)
POST /api/v1/users
{"email": "...", "firstName": "...", "lastName": "..."}

# Update user (requires manager role)
PATCH /api/v1/users/:id
{"firstName": "...", "weeklyHoursTarget": 40}
```

### Health

```bash
# Liveness probe
GET /health

# Readiness probe
GET /ready
```

---

## Conventions

### Git

- **Branches** : `feat/`, `fix/`, `refactor/`, `docs/`, `test/`
- **Commits** : Conventional Commits (`feat(backend): add user endpoint`)

### Code

- **Backend** : CommonJS, snake_case DB → camelCase API
- **Frontend** : ESM, camelCase everywhere
- **Tests** : Jest (backend), Vitest (frontend)

### Documentation

- Francais sans accents (compatibilite)
- Markdown CommonMark
- Diagrams Mermaid quand possible

---

## Contacts

**Developpeurs** : Ryan Homawoo, Lucas Noirie

**Liens** :
- Repository : GitHub
- Documentation Supabase : https://supabase.com/docs
- React : https://react.dev

---

*Documentation generee automatiquement le 2026-01-11*
