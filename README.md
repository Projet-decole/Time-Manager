# Time Manager

Application de gestion du temps construite avec React, Express et Supabase. Architecture monorepo avec npm workspaces, Docker, tests automatisés et CI/CD.

## Démarrage rapide

### Prérequis

- **Docker** et **Docker Compose** installés
- **Node.js 20** (pour développement local)
- **Git**

### Installation

```bash
# Cloner le repository
git clone <url-du-repo>
cd Time-Manager

# Installer les dépendances (npm workspaces)
npm install

# Configurer les variables d'environnement
cp backend/.env.example backend/.env
# Éditer backend/.env avec vos credentials Supabase
```

### Lancement en développement

```bash
# Démarre backend + frontend avec rechargement automatique à chaque modification
docker-compose -f docker-compose.dev.yml up

# Accès :
# - Frontend : http://localhost:5173
# - Backend API : http://localhost:3000
```

Le hot-reload est actif : les modifications de code sont instantanément visibles.

### Lancement en production

```bash
# Build les images optimisées
docker-compose -f docker-compose.prod.yml build

# Lance les conteneurs en arrière-plan
docker-compose -f docker-compose.prod.yml up -d

# Accès :
# - Frontend : http://localhost (port 80)
# - Backend API : http://localhost:3000
```

## Structure du projet

```
Time-Manager/
├── package.json              # Workspace racine + scripts globaux
├── package-lock.json         # Lockfile partagé
├── node_modules/             # Dépendances partagées
│
├── backend/                  # Workspace backend (Express API)
│   ├── server.js             # Point d'entrée
│   ├── app.js                # Configuration Express (routes, middleware)
│   ├── tests/                # Tests Jest + Supertest
│   ├── Dockerfile.dev        # Image dev (nodemon)
│   ├── Dockerfile.prod       # Image prod (optimisée)
│   ├── package.json          # Dépendances backend
│   └── .env                  # Variables d'environnement (non versionné)
│
├── frontend/                 # Workspace frontend (React SPA)
│   ├── src/                  # Code source React
│   │   ├── __tests__/        # Tests Vitest + Testing Library
│   │   └── setupTests.js     # Configuration tests
│   ├── public/               # Assets statiques
│   ├── Dockerfile.dev        # Image dev (Vite)
│   ├── Dockerfile.prod       # Image prod (multi-stage, Nginx)
│   ├── nginx.conf            # Configuration Nginx (production)
│   └── package.json          # Dépendances frontend
│
├── .husky/                   # Git hooks
│   ├── pre-commit            # Lint + tests rapides
│   └── pre-push              # Tests complets
│
├── .github/workflows/        # CI/CD GitHub Actions
│   └── ci-cd.yml             # Pipeline automatisé
│
├── Docs/                     # Documentation
│   ├── ARCHITECTURE.md       # Choix techniques, architecture monorepo
│   ├── DOCKER.md             # Guide Docker complet
│   ├── CI-CD.md              # Pipeline CI/CD, Git hooks
│   └── TESTS.md              # Framework de tests, bonnes pratiques
│
├── docker-compose.dev.yml    # Orchestration développement
└── docker-compose.prod.yml   # Orchestration production
```

## Stack technique

### Frontend
- **React** - Framework UI
- **Vite** - Build tool ultra-rapide
- **Vitest** - Framework de tests
- **React Testing Library** - Tests de composants
- **ESLint** - Linter
- **Nginx** (prod) - Serveur web pour fichiers statiques

### Backend
- **Node.js 20** (Alpine) - Runtime
- **Express** - Framework API REST
- **Jest** - Framework de tests
- **Supertest** - Tests d'intégration HTTP
- **dotenv** - Variables d'environnement

### Base de données
- **Supabase** - PostgreSQL hébergé + authentification

### DevOps
- **Docker** - Conteneurisation
- **Docker Compose** - Orchestration multi-conteneurs
- **GitHub Actions** - CI/CD (tests, lint, build, push Docker Hub)
- **Husky** - Git hooks (pre-commit, pre-push)
- **lint-staged** - Lint sur fichiers modifiés

## Scripts npm (monorepo)

### Tests

```bash
# Tous les workspaces
npm test

# Workspace spécifique
npm test --workspace=frontend
npm test --workspace=backend

# Mode watch
npm run test:watch --workspace=frontend
```

### Linter

```bash
# Frontend uniquement (ESLint configuré)
npm run lint --workspace=frontend

# Auto-fix
npm run lint --workspace=frontend -- --fix
```

### Husky

Les hooks Git sont automatiquement installés via `npm install`.

- **Pre-commit** : ESLint + tests sur fichiers modifiés (rapide)
- **Pre-push** : Tests complets backend + frontend (exhaustif)

## Commandes Docker

### Développement

```bash
# Démarrer
docker-compose -f docker-compose.dev.yml up

# Rebuild (après modification package.json)
docker-compose -f docker-compose.dev.yml up --build

# Logs en temps réel
docker-compose -f docker-compose.dev.yml logs -f

# Shell dans un conteneur
docker-compose -f docker-compose.dev.yml exec backend-dev sh

# Arrêter
docker-compose -f docker-compose.dev.yml down
```

### Production

```bash
# Build et démarrer
docker-compose -f docker-compose.prod.yml up -d --build

# État des conteneurs
docker-compose -f docker-compose.prod.yml ps

# Logs
docker-compose -f docker-compose.prod.yml logs -f

# Redémarrer un service
docker-compose -f docker-compose.prod.yml restart backend-prod

# Arrêter
docker-compose -f docker-compose.prod.yml down
```

## CI/CD Pipeline

Le projet implémente une stratégie CI/CD complète :

### Niveaux de validation

1. **Pre-commit** (local, Husky) : Lint + tests rapides sur fichiers modifiés
2. **Pre-push** (local, Husky) : Tests complets backend + frontend
3. **GitHub Actions** (CI) : Tests + lint + build Docker + push vers Docker Hub

### Workflow GitHub Actions

**Déclencheurs** : Push sur toutes les branches, toutes les pull requests

**Phase 1 - Tests (parallèles)** :
- `test-backend` : Jest + coverage
- `test-frontend` : Vitest
- `lint-frontend` : ESLint

**Phase 2 - Build (parallèles, après succès des tests)** :
- `build-backend` : Image Docker production backend
- `build-frontend` : Image Docker production frontend (multi-stage)
- Push vers Docker Hub avec tags (branche, SHA, latest)

### Tags Docker Hub

Exemple pour un push sur `main` avec commit `abc1234` :

```
username/time-manager-backend:main
username/time-manager-backend:main-abc1234
username/time-manager-backend:latest

username/time-manager-frontend:main
username/time-manager-frontend:main-abc1234
username/time-manager-frontend:latest
```

## Documentation

| Fichier | Description |
|---------|-------------|
| **[ARCHITECTURE.md](Docs/ARCHITECTURE.md)** | Architecture monorepo, workspaces npm, choix techniques, flux de données, environnements dev/prod |
| **[DOCKER.md](Docs/DOCKER.md)** | Guide complet Docker : Dockerfiles expliqués, docker-compose, workflows, troubleshooting |
| **[CI-CD.md](Docs/CI-CD.md)** | Pipeline GitHub Actions, Git hooks Husky, phases tests/build, bonnes pratiques |
| **[TESTS.md](Docs/TESTS.md)** | Framework de tests (Vitest, Jest), écrire des tests, bonnes pratiques, troubleshooting |

## Troubleshooting

### Port déjà utilisé

```bash
# Trouver le processus
lsof -i :3000
lsof -i :5173

# Tuer le processus
kill -9 <PID>

# Ou changer le port dans docker-compose
ports:
  - "3001:3000"  # Utilise 3001 sur l'hôte
```

### Cannot find module 'express'

```bash
# Rebuild les images
docker-compose -f docker-compose.dev.yml up --build
```

### Hot-reload ne fonctionne pas

```bash
# Vérifier les volumes dans docker-compose.dev.yml
volumes:
  - ./backend:/app/backend
  - /app/node_modules  # Doit être présent

# Redémarrer les conteneurs
docker-compose -f docker-compose.dev.yml restart
```

### Tests échouent en CI mais pas en local

- Vérifier les variables d'environnement
- Vérifier la version Node.js (doit être 20)
- Tests interdépendants (ordre d'exécution)

Voir [TESTS.md](Docs/TESTS.md) pour plus de solutions.

## Contribution

### Workflow

1. Créer une branche : `git checkout -b feat/ma-fonctionnalite`
2. Développer et tester localement
3. Commit : `git commit -m "feat: description"` (déclenche pre-commit)
4. Push : `git push` (déclenche pre-push + GitHub Actions)
5. Créer une Pull Request
6. Review + merge après validation du pipeline

### Conventions

**Branches** :
- `feat/description` - Nouvelle fonctionnalité
- `fix/description` - Correction de bug
- `refactor/description` - Refactoring
- `docs/description` - Documentation
- `test/description` - Tests

**Commits** (Conventional Commits) :
```
type(scope): description

Exemples :
feat(backend): add user authentication endpoint
fix(frontend): resolve button click issue
test(backend): add unit tests for auth controller
docs(readme): update installation instructions
```

### Bonnes pratiques

- Ne jamais push directement sur `main`
- Toujours passer par une branche et une PR
- Attendre que le pipeline soit vert avant merge
- Maintenir une couverture de tests >80%
- Respecter les conventions de nommage

## Équipe

**Développeurs** : Ryan Homawoo, Lucas Noirie

**Projet** : Time Manager - Application de gestion du temps

---

Pour plus de détails, consultez la [documentation complète](Docs/).
