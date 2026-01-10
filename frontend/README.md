# Time Manager - Frontend

Application React 19 pour l'interface utilisateur Time Manager.

## Quick Start

```bash
# Depuis la racine du projet
npm install

# Lancer en developpement (avec hot-reload)
npm run dev --workspace=frontend

# Ou via Docker
docker-compose -f docker-compose.dev.yml up frontend-dev
```

L'application est disponible sur `http://localhost:5173`.

## Stack technique

- **React 19.1** - Framework UI
- **Vite 7** - Build tool et dev server
- **Vitest 3** - Framework de tests
- **React Testing Library 16** - Tests de composants
- **ESLint** - Linter

## Structure du projet

```
frontend/
├── src/
│   ├── __tests__/      # Tests Vitest
│   ├── assets/         # Images, fonts, etc.
│   ├── App.jsx         # Composant racine
│   ├── main.jsx        # Point d'entree React
│   └── setupTests.js   # Configuration tests
├── public/             # Assets statiques
├── index.html          # Template HTML
├── vite.config.js      # Configuration Vite
├── eslint.config.js    # Configuration ESLint
├── Dockerfile.dev      # Image developpement
├── Dockerfile.prod     # Image production (multi-stage)
├── nginx.conf          # Configuration Nginx (prod)
└── package.json        # Dependances
```

## Scripts npm

```bash
# Developpement (hot-reload)
npm run dev --workspace=frontend

# Build production
npm run build --workspace=frontend

# Preview du build
npm run preview --workspace=frontend

# Linter
npm run lint --workspace=frontend

# Tests
npm test --workspace=frontend

# Tests en mode watch
npm run test:watch --workspace=frontend
```

## Tests

```bash
# Lancer les tests
npm test --workspace=frontend

# Mode watch (re-run automatique)
npm run test:watch --workspace=frontend
```

### Exemple de test

```javascript
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import App from '../App';

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
    // Composant s'affiche sans erreur
  });
});
```

## Docker

### Developpement

```bash
docker-compose -f docker-compose.dev.yml up frontend-dev
```

- Hot-reload actif via Vite
- Port 5173 expose
- Depend du backend

### Production

```bash
docker-compose -f docker-compose.prod.yml up frontend-prod
```

- Build multi-stage optimise
- Nginx pour servir les fichiers statiques
- Port 80 expose

## Configuration Vite

Le fichier `vite.config.js` configure :
- Plugin React
- Environnement de test Vitest (jsdom)
- Globals pour les tests (describe, test, expect)

## Variables d'environnement

Les variables d'environnement frontend sont prefixees par `VITE_` :

```bash
# .env (a la racine de frontend/)
VITE_API_URL=http://localhost:3000
```

Acces dans le code :
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

## Prochaines etapes (Epic 2+)

- Integration API backend
- Authentification Supabase
- Composants UI (shadcn/ui + Tailwind CSS)
- Routing (React Router v7)
- State management (Context API)
- Dashboards et graphiques (Recharts)

## Contribuer

1. Suivre les conventions ESLint
2. Ajouter des tests pour les nouveaux composants
3. Utiliser des composants fonctionnels avec hooks
4. Documenter les props avec JSDoc ou PropTypes
