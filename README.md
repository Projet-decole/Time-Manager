# Time Manager

Application de gestion du temps pour employes et managers.

**Stack** : React 19 + Express 5 + Supabase (PostgreSQL)

**Architecture** : Monorepo npm workspaces + Docker

## Quick Start

```bash
# Cloner et installer
git clone <url>
cd Time-Manager
npm install

# Configurer
cp backend/.env.example backend/.env
# Editer backend/.env avec credentials Supabase

# Lancer (Docker)
docker-compose -f docker-compose.dev.yml up

# Acces
# Frontend : http://localhost:5173
# Backend  : http://localhost:3000
```

## Structure

```
Time-Manager/
├── backend/           # API Express 5
├── frontend/          # React 19 SPA
├── supabase/          # Migrations SQL
├── docs/              # Documentation technique
└── _bmad-output/      # Artefacts planification
```

## Scripts

```bash
# Tests
npm test
npm test --workspace=backend
npm test --workspace=frontend

# Lint
npm run lint --workspace=frontend

# Docker
docker-compose -f docker-compose.dev.yml up        # Dev
docker-compose -f docker-compose.prod.yml up -d    # Prod
```

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | Stack, patterns, diagrammes |
| [API Reference](docs/api-reference.md) | Endpoints REST, exemples |
| [Data Model](docs/data-model.md) | Schema DB, RLS policies |
| [Backend Guide](docs/backend-guide.md) | Routes, controllers, middleware |
| [Frontend Guide](docs/frontend-guide.md) | Composants, hooks, services |
| [Docker](docs/docker.md) | Commandes, Dockerfiles |
| [CI/CD](docs/ci-cd.md) | GitHub Actions, Husky |
| [Tests](docs/tests.md) | Jest, Vitest, patterns |

## Conventions

**Branches** : `feat/`, `fix/`, `refactor/`, `docs/`, `test/`

**Commits** : `feat(scope): description`

## Equipe

Ryan Homawoo, Lucas Noirie
