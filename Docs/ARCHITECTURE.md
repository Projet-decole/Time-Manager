# Architecture du projet Time Manager

Documentation des choix techniques et de l'architecture globale.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Choix techniques](#choix-techniques)
- [Architecture applicative](#architecture-applicative)
- [Flux de données](#flux-de-données)
- [Environnements](#environnements)

## 🎯 Vue d'ensemble

Time Manager est une application web moderne suivant l'architecture **Client-Server** avec une **Single Page Application (SPA)** côté client.

```
┌─────────────────────────────────────────┐
│          Navigateur (Client)            │
│  ┌───────────────────────────────────┐  │
│  │   React SPA (port 5173/80)        │  │
│  │   - Gère l'UI et le routing       │  │
│  │   - Appelle l'API backend         │  │
│  │   - State management local        │  │
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
```

## 🔧 Choix techniques

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
- Optimisations de production automatiques

**Nginx** :
- Nginx est optimal pour servir des fichiers statiques
- Ultra rapide
- Léger,
- Config flexible

### Backend : Express + Node.js

**Express** pour :
- Framework minimaliste et flexible
- Middleware ecosystem mature
- Facilité d'intégration avec Supabase
- Performance suffisante pour une API REST
- Familiarité de l'équipe avec JavaScript

**Node.js 20 Alpine** :
- Version LTS (Long Term Support)
- Image Alpine pour conteneurs légers (~180 MB vs 1+ GB)
- Compatible avec toutes nos dépendances

### Base de données : Supabase

**Supabase** :
- PostgreSQL hébergé (pas de gestion serveur)
- Authentification intégrée (JWT, OAuth)
- API REST auto-générée
- Row Level Security pour la sécurité des données
- Gratuit en développement

### Conteneurisation : Docker

**Docker** pour :
- **Reproductibilité** : "Ça marche sur ma machine" → "Ça marche partout"
- **Isolation** : Chaque service dans son conteneur
- **Portabilité** : Déploiement identique dev/staging/prod
- **Scalabilité** : Facile d'ajouter des conteneurs

**Docker Compose** pour :
- Orchestration multi-conteneurs simplifiée
- Gestion des dépendances entre services

## Architecture applicative

### Frontend (React)

```
frontend/src/
├── components/        # Composants réutilisables
│   ├── Header.jsx
│   ├── Button.jsx
│   └── ...
├── pages/            # Pages/Routes de l'application
│   ├── Home.jsx
│   ├── Dashboard.jsx
│   └── ...
├── services/         # Logique d'appel API
│   ├── api.js
│   └── auth.js
├── hooks/            # Custom React hooks
│   └── useAuth.js
├── utils/            # Fonctions utilitaires
│   └── helpers.js
├── App.jsx           # Composant racine + routing
└── main.jsx          # Point d'entrée
```


### Backend (Express)

```
backend/
├── routes/           # Définition des endpoints
│   ├── users.js
│   ├── auth.js
│   └── ...
├── controllers/      # Logique métier
│   ├── userController.js
│   └── ...
├── middleware/       # Middleware Express
│   ├── auth.js
│   ├── errorHandler.js
│   └── ...
├── services/         # Communication externe (Supabase)
│   └── supabase.js
├── utils/            # Utilitaires
│   └── validators.js
├── app.js            # Configuration Express
└── server.js         # Lance le serveur
```

**Architecture en couches** :
```
Routes → Controllers → Services → Supabase
  ↓          ↓            ↓
Routing   Logique     Communication
          métier      externe
```

## Flux de données

### 1. Chargement initial de l'application

```
1. Navigateur → GET / → Nginx (prod) ou Vite (dev)
2. Serveur → Envoie index.html + bundle.js
3. Navigateur → Exécute React
4. React → Initialise l'application
5. React → fetch('/api/user') → Express API
6. Express → Query Supabase
7. Supabase → Retourne données
8. Express → JSON response
9. React → Met à jour l'UI
```

### 2. Navigation dans l'application (SPA)

```
1. Utilisateur clique sur un lien
2. React Router intercepte
3. React change l'URL (History API)
4. React affiche le nouveau composant
5. Aucune requête serveur (navigation instantanée)
```

### 3. Appel API

```javascript
// Frontend
const response = await fetch('/api/users');
const data = await response.json();
```

```
1. React → fetch('/api/users')
2. Navigateur → GET http://localhost:3000/api/users
3. Express → Route handler
4. Controller → Logique métier
5. Service → Supabase.from('users').select()
6. Supabase → Retourne données
7. Express → res.json(data)
8. React → Reçoit données, met à jour state
9. UI se rafraîchit automatiquement
```

## Environnements

### Développement

**Objectif** : Confort et rapidité de développement

- **Volumes Docker** : Code synchronisé en temps réel
- **Hot-reload** : 
  - Backend : Nodemon détecte les changements
  - Frontend : Vite HMR (Hot Module Replacement)
- **Source maps** : Debugging facilité
- **Logs verbeux** : Toutes les erreurs visibles
- **Pas d'optimisation** : Build rapide

**Configuration** :
```yaml
# docker-compose.dev.yml
volumes:
  - ./backend:/app           # Synchro code
  - /app/node_modules        # Protect dependencies
environment:
  - NODE_ENV=development
```

**Commandes** :
```bash
docker-compose -f docker-compose.dev.yml up
# Modifier le code → Changements visibles instantanément
```

### Production

**Objectif** : Performance, sécurité, fiabilité

- **Pas de volumes** : Code figé dans l'image
- **Build optimisé** :
  - Minification du code
  - Tree-shaking (suppression du code inutilisé)
  - Code splitting (chargement progressif)
- **Nginx** : Serveur ultra-performant pour le frontend
- **Dépendances minimales** : Seulement `dependencies` (pas `devDependencies`)
- **Auto-restart** : `restart: unless-stopped`
- **Images légères** : Alpine Linux

**Configuration** :
```yaml
# docker-compose.prod.yml
# Pas de volumes
environment:
  - NODE_ENV=production
restart: unless-stopped
```

**Différences clés** :

| Aspect                | Développement      | Production             |
| --------------------- | ------------------ | ---------------------- |
| **Frontend**          | Vite dev server    | Nginx + build statique |
| **Backend**           | Nodemon            | Node direct            |
| **Code**              | Source non minifié | Minifié, optimisé      |
| **Volumes**           | Oui (hot-reload)   | Non (immuable)         |
| **Taille images**     | ~200 MB/service    | 180 MB + 15 MB         |
| **Démarrage**         | ~3-5 sec           | ~1 sec                 |
| **Modification code** | Instantané         | Rebuild nécessaire     |
| **Restart**           | Manuel             | Automatique            |

## 🔐 Sécurité

### Backend

- **Utilisateur non-root** : `USER node` dans les Dockerfiles
- **Variables d'environnement** : Secrets dans `.env` (non versionné)
- **CORS** : Configuration des origines autorisées

### Frontend

- **Utilisateur non-root** : `USER node` dans les Dockerfiles
- **Pas de secrets** : Aucun secret côté client

### Base de données

- **Row Level Security** : Supabase gère les permissions
- **API Keys** : Stockées côté backend uniquement
- **Prepared statements** : Protection contre SQL injection (natif Supabase)

## 🔄 CI/CD (À implémenter)

Architecture prévue pour CI/CD :

```
Git Push → GitHub Actions → Build → Tests → Deploy
```

1. **Build** : Images Docker créées
2. **Tests** : Unitaires + intégration
3. **Push** : Images vers registry (Docker Hub, ECR)
4. **Deploy** : Pull images sur serveur production

---

Cette architecture assure **maintenabilité**, **performance** et **scalabilité** du projet.****