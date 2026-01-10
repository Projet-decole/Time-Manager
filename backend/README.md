# Time Manager - Backend

API REST Express 5 pour l'application Time Manager.

## Quick Start

```bash
# Depuis la racine du projet
npm install

# Configurer les variables d'environnement
cp backend/.env.example backend/.env
# Editer backend/.env avec vos credentials Supabase

# Lancer en developpement (avec hot-reload)
npm run dev --workspace=backend

# Ou via Docker
docker-compose -f docker-compose.dev.yml up backend-dev
```

L'API est disponible sur `http://localhost:3000`.

## Architecture

Le backend suit une architecture **layered** (en couches) :

```
backend/
├── server.js           # Point d'entree HTTP, graceful shutdown
├── app.js              # Configuration Express (middleware, routes)
├── routes/             # Definitions des endpoints HTTP
│   ├── index.js        # Montage des routes
│   └── health.routes.js
├── controllers/        # Logique requete/reponse
│   └── health.controller.js
├── services/           # Business logic, acces donnees
│   └── health.service.js
├── middleware/         # Middleware Express
│   ├── auth.middleware.js      # Verification JWT Supabase
│   ├── rbac.middleware.js      # Role-based access control
│   ├── validate.middleware.js  # Validation schemas Zod
│   └── error.middleware.js     # Gestion centralisee des erreurs
├── utils/              # Fonctions utilitaires
│   ├── supabase.js     # Clients Supabase (anon + admin)
│   ├── response.js     # Helpers reponses standardisees
│   ├── AppError.js     # Classe erreur custom
│   ├── asyncHandler.js # Wrapper async/await
│   ├── pagination.js   # Helpers pagination
│   └── transformers.js # Transformations donnees
├── validators/         # Schemas Zod (a implementer)
└── tests/              # Tests Jest + Supertest
```

### Flux d'une requete

```
Request → Routes → Controller → Service → Supabase → Response
                       ↓
                  Middleware (auth, validation, error)
```

## API Endpoints

### Health Check

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Message de bienvenue + version | Non |
| GET | `/health` | Liveness probe (serveur actif) | Non |
| GET | `/ready` | Readiness probe (DB accessible) | Non |

**Exemples de reponses :**

```bash
# GET /
curl http://localhost:3000/
```
```json
{
  "success": true,
  "data": {
    "message": "Time Manager API is running!",
    "version": "1.0.0"
  }
}
```

```bash
# GET /health
curl http://localhost:3000/health
```
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-10T12:00:00.000Z"
  }
}
```

```bash
# GET /ready
curl http://localhost:3000/ready
```
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "checks": {
      "database": "ok"
    }
  }
}
```

### API v1 (a venir)

Les endpoints metier seront prefixes par `/api/v1/` :

- `/api/v1/auth` - Authentification (login, logout, refresh)
- `/api/v1/users` - Gestion utilisateurs
- `/api/v1/teams` - Gestion equipes
- `/api/v1/projects` - Gestion projets
- `/api/v1/categories` - Gestion categories
- `/api/v1/time-entries` - Pointages
- `/api/v1/timesheets` - Feuilles de temps
- `/api/v1/dashboards` - KPIs et statistiques

## Variables d'environnement

Creer un fichier `.env` dans le dossier `backend/` :

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server (optionnel)
PORT=3000
NODE_ENV=development
```

| Variable | Description | Requis |
|----------|-------------|--------|
| `SUPABASE_URL` | URL du projet Supabase | Oui |
| `SUPABASE_ANON_KEY` | Cle publique (anon) pour operations RLS | Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Cle service (admin) pour bypass RLS | Oui |
| `PORT` | Port du serveur (defaut: 3000) | Non |
| `NODE_ENV` | Environnement (development/production/test) | Non |

## Tests

Le backend atteint **99%+ de couverture de tests**.

```bash
# Lancer tous les tests avec coverage
npm test --workspace=backend

# Mode watch (re-run automatique)
npm run test --workspace=backend -- --watch

# Test d'un fichier specifique
npm test --workspace=backend -- tests/app.test.js

# Verbose (details)
npm test --workspace=backend -- --verbose
```

### Structure des tests

```
tests/
├── setup.js            # Configuration globale (mocks)
├── app.test.js         # Tests integration API
├── routes/             # Tests unitaires routes
├── middleware/         # Tests unitaires middleware
├── services/           # Tests unitaires services
└── utils/              # Tests unitaires utilitaires
```

### Rapport de couverture

Apres `npm test`, ouvrir `backend/coverage/lcov-report/index.html` pour voir le rapport detaille.

## Format des reponses

Toutes les reponses suivent un format standardise :

### Succes

```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }  // optionnel (pagination)
}
```

### Erreur

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description de l'erreur",
    "details": null  // optionnel
  }
}
```

### Codes d'erreur HTTP

| Code | Signification |
|------|---------------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request (validation) |
| 401 | Unauthorized (auth required) |
| 403 | Forbidden (permission denied) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 422 | Unprocessable Entity |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

## Base de donnees

### Schema Supabase (10 tables)

| Table | Description |
|-------|-------------|
| `profiles` | Utilisateurs (extends auth.users) |
| `teams` | Equipes |
| `team_members` | Junction users - teams |
| `projects` | Projets avec budget |
| `team_projects` | Junction teams - projects |
| `categories` | Categories de temps avec couleur |
| `time_entries` | Pointages individuels |
| `timesheets` | Feuilles de temps hebdomadaires |
| `templates` | Templates de pointage |
| `audit_logs` | Historique modifications |

### Row Level Security (RLS)

Toutes les tables ont des politiques RLS actives :
- Les utilisateurs ne peuvent acceder qu'a leurs propres donnees
- Les managers ont acces aux donnees de leur equipe
- L'admin (service role) bypass RLS pour operations systeme

## Scripts npm

```bash
npm start --workspace=backend     # Production
npm run dev --workspace=backend   # Developpement (nodemon)
npm test --workspace=backend      # Tests avec coverage
```

## Docker

### Developpement

```bash
docker-compose -f docker-compose.dev.yml up backend-dev
```

- Hot-reload actif via nodemon
- Volume monte pour modifications en temps reel
- Port 3000 expose

### Production

```bash
docker-compose -f docker-compose.prod.yml up backend-prod
```

- Image optimisee (Node.js Alpine)
- Dependencies production only
- Graceful shutdown configure

## CommonJS

Le backend utilise la syntaxe **CommonJS** :

```javascript
// Import
const express = require('express');
const { supabase } = require('./utils/supabase');

// Export
module.exports = { myFunction };
```

## Contribuer

1. Suivre l'architecture layered existante
2. Ajouter des tests pour tout nouveau code
3. Maintenir la couverture >80%
4. Utiliser les helpers existants (`response.js`, `asyncHandler.js`)
5. Documenter les nouveaux endpoints
