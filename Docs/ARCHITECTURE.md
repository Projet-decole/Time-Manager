# Architecture du projet Time Manager

Documentation des choix techniques et de l'architecture globale.

## Table des matières

- [Architecture du projet Time Manager](#architecture-du-projet-time-manager)
  - [Table des matières](#table-des-matières)
  - [Vue d'ensemble](#vue-densemble)
  - [Environnements](#environnements)
    - [Développement](#développement)
    - [Production](#production)
  - [Sécurité](#sécurité)
    - [Conteneurs Docker](#conteneurs-docker)
    - [Backend](#backend)
    - [Frontend](#frontend)
    - [Base de données (Supabase)](#base-de-données-supabase)
  - [Qualité et CI/CD](#qualité-et-cicd)
    - [Git Hooks (Husky)](#git-hooks-husky)
    - [CI/CD Pipeline (GitHub Actions)](#cicd-pipeline-github-actions)
    - [Framework de tests](#framework-de-tests)

## Vue d'ensemble

Time Manager est une application web moderne suivant l'architecture Client-Server avec une Single Page Application (SPA) côté client, organisée en monorepo avec npm workspaces.

```
┌─────────────────────────────────────────┐
│          Navigateur (Client)            │
│  ┌───────────────────────────────────┐  │
│  │   React SPA (port 5173/80)     │  │
│  │   - UI moderne et réactive        │  │
│  │   - Appelle l'API backend         │  │
│  │   - State management React        │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
            ↓ HTTP/HTTPS
┌─────────────────────────────────────────┐
│        Serveur (Docker containers)      │
│  ┌───────────────────────────────────┐  │
│  │   Frontend Container              │  │
│  │   Dev:  Vite dev server (5173)   │  │
│  │   Prod: Nginx (80)                │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   Backend Container               │  │
│  │   Express API (3000)              │  │
│  │   - Logique métier                │  │
│  │   - Authentification              │  │
│  │   - Communication Supabase        │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
            ↓ HTTPS
┌─────────────────────────────────────────┐
│        Supabase (Cloud)                 │
│  - PostgreSQL database                  │
│  - Authentication                       │
│  - Real-time subscriptions              │
└─────────────────────────────────────────┘

## Architecture monorepo

Le projet utilise une architecture **monorepo avec npm workspaces**, centralisant la gestion des dépendances et facilitant le développement.

### Structure du projet

```
Time-Manager/
├── package.json              # Workspaces racine + scripts globaux
├── package-lock.json         # Lockfile partagé
├── node_modules/             # Dépendances partagées
│
├── frontend/                 # Workspace frontend
│   ├── package.json          # Dépendances frontend
│   ├── src/                  # Code source React
│   ├── Dockerfile.dev        # Image dev frontend
│   └── Dockerfile.prod       # Image prod frontend (multi-stage)
│
├── backend/                  # Workspace backend
│   ├── package.json          # Dépendances backend
│   ├── app.js                # Configuration Express
│   ├── server.js             # Point d'entrée
│   ├── tests/                # Tests Jest
│   ├── Dockerfile.dev        # Image dev backend
│   └── Dockerfile.prod       # Image prod backend
│
├── docker-compose.dev.yml    # Orchestration développement
├── docker-compose.prod.yml   # Orchestration production
│
├── .husky/                   # Git hooks
│   ├── pre-commit            # Lint-staged
│   └── pre-push              # Tests complets
│
├── .github/workflows/        # CI/CD GitHub Actions
│   └── ci-cd.yml             # Pipeline automatisé
│
└── Docs/                     # Documentation
    ├── ARCHITECTURE.md
    ├── DOCKER.md
    ├── CI-CD.md
    └── TESTS.md
```

### Avantages du monorepo

- **Gestion unifiée** : Un seul `npm install` pour tout le projet
- **Cohérence des versions** : Dépendances partagées dans un seul lockfile
- **Scripts centralisés** : `npm test` exécute les tests des deux workspaces
- **Refactoring simplifié** : Modifications simultanées frontend/backend
- **CI/CD optimisé** : Installation unique des dépendances

### Scripts racine

```json
{
  "scripts": {
    "prepare": "husky || true",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspace=frontend"
  }
}

## Choix techniques

### Frontend : React + Vite

**React** a été choisi pour :
- Composants réutilisables et maintenables
- Virtual DOM pour des performances optimales
- Écosystème riche (React Router, bibliothèques UI)
- Single Page Application (navigation fluide sans rechargement)
- Large communauté et documentation

**Vite** :
- Build et hot-reload ultra-rapides (ESM natif)
- Rapide, moderne, 
- Configuration minimale
- Optimisations de production automatiques (tree-shaking, code splitting, minification)
- Support TypeScript/JSX natif

**Nginx** (Production) :
- Serveur web ultra-performant pour fichiers statiques
- Faible empreinte mémoire
- Configuration flexible
- Reverse proxy si nécessaire

### Backend : Express + Node.js

**Express** :
- Framework minimaliste et flexible
- Middleware ecosystem mature
- Facilité d'intégration avec Supabase
- Async/await natif
- Performance optimale pour API REST
- Compatibilité avec l'écosystème Node.js

**Node.js 20 Alpine** :
- Version LTS (Long Term Support)
- Image Alpine pour conteneurs légers
- Performance et stabilité éprouvées

### Base de données : Supabase

**Supabase** (PostgreSQL) :
- PostgreSQL hébergé (gestion serveur simplifiée)
- Authentification intégrée (JWT, OAuth, magic links)
- API REST auto-générée depuis le schéma
- Row Level Security (RLS) pour sécurité fine
- Gratuit pour développement et petits projets

### Conteneurisation : Docker

**Docker** :
- Reproductibilité : Environnements identiques dev/prod
- Isolation : Dépendances encapsulées par service
- Portabilité : Déploiement sur n'importe quel serveur
- Scalabilité : Orchestration simple avec Compose

**Docker Compose** :
- Orchestration multi-conteneurs simplifiée
- Gestion automatique des dépendances (depends_on)
- Configurations séparées dev/prod

### Tests

Frontend : Vitest + Testing Library
- **Vitest** : Compatible Vite, ultra-rapide, API Jest-like
- **React Testing Library** : Tests orientés comportement utilisateur
- **jsdom** : Simulation du DOM pour tests

Backend : Jest + Supertest
- **Jest** : Framework de test mature et complet
- **Supertest** : Tests d'intégration HTTP
- **Coverage** : Rapports de couverture de code

## Architecture applicative

## Frontend (React)

```
frontend/
├── src/
│   ├── main.jsx          # Point d'entrée React
│   ├── App.jsx           # Composant racine + routing
│   ├── App.css           # Styles globaux
│   ├── index.css         # Reset CSS
│   ├── setupTests.js     # Configuration Vitest
│   │
│   ├── assets/           # Images, fonts, fichiers statiques
│   │
│   └── __tests__/        # Tests unitaires/intégration
│       └── App.test.jsx
│
├── public/               # Fichiers statiques servis tel quel
├── index.html            # Point d'entrée HTML
├── vite.config.js        # Configuration Vite
├── vitest.config.js      # Configuration tests
└── eslint.config.js      # Configuration linter
```

Architecture prévue pour croissance :
```
src/
├── components/           # Composants réutilisables
│   ├── Button.jsx
│   ├── Header.jsx
│   └── ...
├── pages/                # Pages/Routes
│   ├── Home.jsx
│   ├── Dashboard.jsx
│   └── ...
├── services/             # API calls
│   ├── api.js
│   └── auth.js
├── hooks/                # Custom hooks
│   └── useAuth.js
└── utils/                # Fonctions utilitaires
    └── helpers.js
```

### Backend (Express)

```
backend/
├── server.js             # Point d'entrée (démarre le serveur)
├── app.js                # Configuration Express (middlewares, routes)
│
└── tests/                # Tests Jest
    └── app.test.js       # Tests d'intégration API
```

Architecture prévue pour croissance :
```
backend/
├── routes/               # Définition des endpoints
│   ├── users.js
│   ├── auth.js
│   └── ...
├── controllers/          # Logique métier
│   ├── userController.js
│   └── ...
├── middleware/           # Middleware Express
│   ├── auth.js
│   ├── errorHandler.js
│   └── ...
├── services/             # Communication externe (Supabase)
│   └── supabase.js
└── utils/                # Utilitaires
    └── validators.js
```

**Principe de séparation des responsabilités** :
```
Routes → Controllers → Services → Supabase
  ↓          ↓            ↓
Routing   Logique     Communication
          métier      externe
```

## Flux de données

### 1. Chargement initial de l'application
```
1. Utilisateur → Navigateur ouvre http://localhost:5173 (dev) ou http://localhost (prod)
2. Serveur (Vite/Nginx) → Envoie index.html + bundle JavaScript
3. Navigateur → Parse HTML, télécharge et exécute bundle.js
4. React → Initialise l'application (render <App />)
5. React → Peut faire des appels API initiaux (fetch('/api/...'))
6. Express API → Traite la requête, interroge Supabase
7. Supabase → Retourne les données (JSON)
8. Express → Envoie la réponse JSON au client
9. React → Met à jour le state, re-render des composants
```
### 2. Navigation dans l'application (SPA)

```
1. Utilisateur clique sur un lien interne
2. React Router (ou similaire) intercepte le clic
3. React change l'URL via History API (pushState)
4. React affiche le nouveau composant correspondant à la route
5. Navigation instantanée, sans rechargement de page
```

### 3. Appel API typique

Exemple : Récupération des utilisateurs
```javascript
// Frontend (React)
const response = await fetch('http://localhost:3000/api/users');
const users = await response.json();
console.log(users);
```

Flux détaillé :
```
1. React → fetch('http://localhost:3000/api/users')
2. Navigateur → Envoie requête HTTP GET
3. Express → Reçoit la requête sur le endpoint /api/users
4. Route handler → Appelle le controller approprié
5. Controller → Logique métier, appelle le service
6. Service → Supabase client : supabase.from('users').select('*')
7. Supabase → Exécute la requête SQL, applique RLS
8. Supabase → Retourne les données (JSON)
9. Service → Retourne au controller
10. Controller → res.json(users)
11. Express → Envoie la réponse HTTP
12. React → Reçoit les données, met à jour le state
13. React → Re-render automatique des composants dépendants
```

## Environnements

### Développement

Objectif : Confort et rapidité de développement

Caractéristiques :
- Volumes Docker : Code synchronisé en temps réel (./frontend:/app/frontend)
- Hot-reload :
  - Backend : Nodemon détecte les changements et redémarre automatiquement
  - Frontend : Vite HMR (Hot Module Replacement) sans rechargement complet
- Source maps : Debugging facilité avec lignes de code originales
- Logs verbeux : Toutes les erreurs et infos visibles dans la console
- Pas d'optimisation : Build rapide, code non minifié

Configuration Docker :
```yaml
# docker-compose.dev.yml
services:
  backend-dev:
    build:
      context: .                    # Build depuis la racine (workspaces)
      dockerfile: backend/Dockerfile.dev
    volumes:
      - ./backend:/app/backend      # Sync code backend
      - ./package.json:/app/package.json
      - /app/node_modules           # Protège node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev            # Nodemon

  frontend-dev:
    build:
      context: .
      dockerfile: frontend/Dockerfile.dev
    volumes:
      - ./frontend:/app/frontend    # Sync code frontend
      - ./package.json:/app/package.json
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev -- --host  # Vite avec exposition réseau
```

**Commandes** :
```bash
# Démarrer l'environnement de développement
docker-compose -f docker-compose.dev.yml up

# Modifier le code → Changements visibles instantanément
# Logs en temps réel dans le terminal
```

### Production

Objectif : Performance, sécurité, fiabilité

Caractéristiques :
- Pas de volumes : Code figé dans l'image Docker
- Build optimisé :
  - Minification du code
  - Tree-shaking (suppression du code inutilisé)
  - Code splitting (chargement progressif)
  - Compression gzip/brotli
- Nginx : Serveur ultra-performant pour le frontend
- Dépendances minimales : npm ci --omit=dev (seulement dependencies)
- Auto-restart : restart: unless-stopped en cas de crash
- Images légères : Alpine Linux (images de ~50-150 MB)
- Multi-stage build : Frontend buildé puis servi par Nginx

Configuration Docker :
```yaml
# docker-compose.prod.yml
services:
  backend-prod:
    build:
      context: .
      dockerfile: backend/Dockerfile.prod
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    # Pas de volumes

  frontend-prod:
    build:
      context: .
      dockerfile: frontend/Dockerfile.prod  # Multi-stage avec Nginx
    restart: unless-stopped
    # Pas de volumes
```

Différences clés :

| Aspect              | Développement      | Production                    |
| ------------------- | ------------------ | ----------------------------- |
| Frontend            | Vite dev server    | Nginx + build statique        |
| Backend             | Nodemon            | Node direct                   |
| Code                | Source non minifié | Minifié, optimisé             |
| Volumes             | Oui (hot-reload)   | Non (immuable)                |
| Taille image        | ~200 MB/service    | 180 MB + 15 MB                |
| Démarrage           | ~3-5 sec           | ~1 sec                        |
| Modification code   | Instantané         | Rebuild nécessaire            |
| Restart automatique | Non                | Oui (unless-stopped)          |
| Optimisation        | Aucune             | Maximale                      |

## Sécurité

### Conteneurs Docker

Utilisateur non-root :
USER node
- Tous les conteneurs s'exécutent avec l'utilisateur node (non-privilégié)
- Réduit la surface d'attaque en cas de compromission

Images Alpine :
- Distribution Linux minimale
- Moins de packages = moins de vulnérabilités potentielles
- Mises à jour de sécurité régulières

### Backend

Variables d'environnement :
- Secrets stockés dans .env, exclus du Git (.gitignore)
- Jamais de secrets hardcodés dans le code

CORS :
- Configuration stricte des origines autorisées
- Protection contre les requêtes cross-origin non autorisées

### Frontend

Pas de secrets côté client :
- Aucune clé API sensible dans le code frontend
- Toutes les opérations sensibles passent par le backend

Validation des entrées :
- Validation côté client ET côté serveur
- Sanitization des données utilisateur

### Base de données (Supabase)

Row Level Security (RLS) :
- Politiques de sécurité au niveau de la base de données
- Contrôle d'accès fin par utilisateur/rôle
- Protection même en cas de faille backend

Prepared statements :
- Protection native contre les injections SQL
- Client Supabase gère automatiquement

API Keys :
- Clé publique (anon key) : Limitée par RLS
- Clé service (service_role key) : Stockée backend uniquement, accès complet

## Qualité et CI/CD

### Git Hooks (Husky)

Pre-commit : Vérification avant commit
- Lint et tests sur les fichiers modifiés uniquement
- ESLint sur les fichiers frontend modifiés
- Tests rapides pour validation immédiate
- Empêche de commiter du code cassé

Pre-push : Validation complète avant push
- Exécute toute la suite de tests des deux workspaces
- Assure que le code pushé est entièrement validé
- Empêche de pousser du code non testé

### CI/CD Pipeline (GitHub Actions)

Workflow automatisé sur tous les push et pull requests :

Push/PR → Tests → Lint → Build Docker → Push Registry

Phase 1 : Tests (parallèles) :
- test-backend : Jest avec couverture
- test-frontend : Vitest
- lint-frontend : ESLint

Phase 2 : Build (après succès tests) :
- build-backend : Image Docker production backend
- build-frontend : Image Docker production frontend (multi-stage)
- Push vers Docker Hub avec tags :
  - nom-branche (ex: main, develop)
  - nom-branche-sha123 (traçabilité)
  - latest (si branche par défaut)

Cache Docker :
- Layers cachés entre builds
- Accélération significative du pipeline

Sécurité :
- Secrets GitHub (DOCKERHUB_USERNAME, DOCKERHUB_TOKEN)
- Exécution uniquement sur le repo principal (Projet-decole/Time-Manager)

Fichier : .github/workflows/ci-cd.yml

### Framework de tests

Frontend (Vitest + Testing Library)

Backend (Jest + Supertest)

Commandes :
```
# Tests unitaires + intégration
npm test                              # Tous les workspaces
npm test --workspace=frontend         # Frontend uniquement
npm test --workspace=backend          # Backend uniquement

# Tests en mode watch (développement)
npm run test:watch --workspace=frontend

# Couverture de code
npm test --workspace=backend          # Jest génère automatiquement coverage/
```

---

Cette architecture assure maintenabilité, performance et scalabilité du projet.