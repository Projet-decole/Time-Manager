# Guide Docker - Time Manager

Guide complet pour comprendre et utiliser Docker dans ce projet.

## Table des matières

- [Concepts Docker](#concepts-docker)
- [Structure des fichiers](#structure-des-fichiers)
- [Dockerfiles expliqués](#dockerfiles-expliqués)
- [Docker Compose](#docker-compose)
- [Commandes utiles](#commandes-utiles)
- [Workflows](#workflows)
- [Troubleshooting](#troubleshooting)

## Concepts Docker

### Qu'est-ce que Docker ?

Docker crée des **conteneurs** : des environnements isolés contenant une application et toutes ses dépendances.

**Analogie** : Un conteneur est comme un appartement meublé - tout est inclus, déménage facilement, identique partout.

### Vocabulaire

| Terme              | Définition                       | Analogie                          |
| ------------------ | -------------------------------- | --------------------------------- |
| **Image**          | Template immuable                | Plan de construction d'une maison |
| **Conteneur**      | Instance d'une image qui tourne  | Maison construite depuis le plan  |
| **Dockerfile**     | Recette pour créer une image     | Instructions de construction      |
| **Volume**         | Dossier partagé hôte ↔ conteneur | Porte entre deux pièces           |
| **Port mapping**   | Exposition de ports              | Numéro de porte de l'appartement  |
| **Docker Compose** | Orchestration multi-conteneurs   | Gérer un immeuble entier          |

### Pourquoi Docker pour ce projet ?

- **Reproductibilité** : Fonctionne identiquement partout
- **Isolation** : Pas de conflit de versions (Node, npm, etc.)
- **Portabilité** : Deploy facile sur n'importe quel serveur
- **Dev/Prod similaires** : Réduit les bugs "ça marche sur ma machine"
- **Monorepo-friendly** : Gestion unifiée des workspaces

## Structure des fichiers

```
Time-Manager/
├── package.json              # Workspace racine
├── package-lock.json         # Lockfile partagé
│
├── backend/
│   ├── Dockerfile.dev        # Image développement backend
│   ├── Dockerfile.prod       # Image production backend
│   └── .dockerignore         # Fichiers à exclure
│
├── frontend/
│   ├── Dockerfile.dev        # Image développement frontend
│   ├── Dockerfile.prod       # Image production frontend (multi-stage)
│   ├── nginx.conf            # Configuration Nginx (prod)
│   └── .dockerignore         # Fichiers à exclure
│
├── docker-compose.dev.yml    # Orchestration développement
└── docker-compose.prod.yml   # Orchestration production
```

## Dockerfiles expliqués

### Particularité : Architecture Monorepo

**Changement majeur** : Avec l'architecture monorepo (npm workspaces), les Dockerfiles ont été adaptés :

- **Context de build** : Racine du projet (`.`) au lieu de `./backend` ou `./frontend`
- **Copie des package.json** : Racine + workspace pour profiter des dépendances partagées
- **WORKDIR** : `/app/backend` ou `/app/frontend` au lieu de `/app`

### Backend - Dockerfile.dev

```dockerfile
FROM node:20-alpine
# Image de base : Node.js 20 sur Alpine Linux (léger, ~50 MB)

WORKDIR /app
# Définit /app comme répertoire de travail

COPY --chown=node:node package*.json ./
COPY --chown=node:node backend/package*.json ./backend/
# Copie le package.json racine ET celui du workspace backend
# --chown=node:node : propriétaire = utilisateur node (sécurité)

RUN npm install
# Installe TOUTES les dépendances (dependencies + devDependencies)
# Installe les dépendances du workspace via le package.json racine

COPY --chown=node:node backend/ ./backend/
# Copie le code du backend

WORKDIR /app/backend
# Change le répertoire de travail vers le backend

USER node
# Bascule sur utilisateur non-root (sécurité)

EXPOSE 3000
# Documentation : le conteneur écoute sur le port 3000

CMD ["npm", "run", "dev"]
# Commande au démarrage : nodemon pour hot-reload
```

**Particularités dev** :
- `npm install` : Installe tout (devDependencies inclus pour nodemon)
- `CMD ["npm", "run", "dev"]` : Lance nodemon pour hot-reload
- Utilisé avec un **volume** : code synchronisé en temps réel
- **Context racine** : Profite des workspaces npm

### Backend - Dockerfile.prod

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY --chown=node:node package*.json ./
COPY --chown=node:node backend/package*.json ./backend/
# Même structure que dev pour la cohérence

RUN npm ci --omit=dev
# npm ci : Installation reproductible (lit package-lock.json strictement)
# --omit=dev : N'installe PAS les devDependencies (nodemon, jest, etc.)
# Plus rapide et plus fiable que npm install

COPY --chown=node:node backend/ ./backend/
# Copie le code du backend

WORKDIR /app/backend
# Change vers le workspace backend

USER node

EXPOSE 3000

CMD ["node", "server.js"]
# Lance directement avec node (pas npm), plus performant
# Meilleure gestion des signaux (SIGTERM, SIGINT)
```

**Différences vs dev** :
- `npm ci --omit=dev` : ~30-40% de réduction de taille, installation plus fiable
- `CMD ["node", "server.js"]` : Pas de couche npm, meilleure gestion des signaux
- **Pas de volume** : Code figé dans l'image
- Production-ready : optimisé pour performance et sécurité

### Frontend - Dockerfile.dev

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY --chown=node:node package*.json ./
COPY --chown=node:node frontend/package*.json ./frontend/
# Structure identique au backend pour cohérence

RUN npm install

COPY --chown=node:node frontend/ ./frontend/

WORKDIR /app/frontend
# Change vers le workspace frontend

USER node

EXPOSE 5173
# Port par défaut de Vite

CMD ["npm", "run", "dev", "--", "--host"]
# -- : sépare les args npm des args Vite
# --host : écoute sur 0.0.0.0 (accessible depuis Docker)
```

**Pourquoi `--host` ?**

Sans `--host` :
- Vite écoute sur `127.0.0.1` (localhost du conteneur)
- Inaccessible depuis l'extérieur du conteneur

Avec `--host` :
- Vite écoute sur `0.0.0.0` (toutes les interfaces)
- Accessible via `http://localhost:5173`

### Frontend - Dockerfile.prod (Multi-stage)

```dockerfile
# ===== ÉTAPE 1 : BUILD =====
FROM node:20-alpine AS builder
# AS builder : nomme cette étape pour la référencer plus tard

WORKDIR /app

COPY --chown=node:node package*.json ./
COPY --chown=node:node frontend/package*.json ./frontend/
# Structure workspace

RUN npm ci
# npm ci : reproductible (pas npm install)

COPY --chown=node:node frontend/ ./frontend/
# Copie le code source

WORKDIR /app/frontend

RUN npm run build
# Crée le dossier dist/ avec les fichiers optimisés
# - Minification (JS, CSS, HTML)
# - Tree-shaking (suppression code inutilisé)
# - Code splitting (chargement progressif)
# - Hashing des fichiers (cache busting)


# ===== ÉTAPE 2 : PRODUCTION =====
FROM nginx:alpine
# Image Nginx légère (~10 MB)
# Tout Node.js est jeté après l'étape 1

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
# Copie UNIQUEMENT dist/ depuis l'étape précédente
# Tout le reste (Node, npm, node_modules, src) est abandonné

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
# Copie la configuration Nginx personnalisée

EXPOSE 80
# Port HTTP standard

CMD ["nginx", "-g", "daemon off;"]
# Lance Nginx en mode foreground (nécessaire pour Docker)
```

**Avantages du multi-stage** :
- **Image finale** : ~15 MB (vs ~300 MB sans multi-stage) - **95% de réduction** 🔥
- **Pas de Node.js ni npm en production** → Surface d'attaque réduite
- **Seulement Nginx + fichiers statiques** → Ultra performant
- **Sécurité** : Moins de composants = moins de vulnérabilités

### Nginx.conf expliqué

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # ========================================
    # Routing SPA : CRITIQUE pour React Router
    # ========================================
    location / {
        try_files $uri $uri/ /index.html;
        # 1. Cherche le fichier exact ($uri)
        # 2. Cherche un dossier ($uri/)
        # 3. Sinon, sert index.html (React Router prend le relais)
    }

    # ========================================
    # Cache agressif pour les assets
    # ========================================
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        # immutable : le fichier ne changera JAMAIS
        # Vite ajoute un hash au nom (ex: app.abc123.js)
        # Si le contenu change, le hash change aussi
    }

    # ========================================
    # Pas de cache pour index.html
    # ========================================
    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
        # index.html n'a pas de hash → doit toujours être à jour
    }

    # ========================================
    # Compression gzip (réduit la bande passante)
    # ========================================
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 1000;
    # Compresse les fichiers > 1 KB
}
```

**Pourquoi `try_files` est crucial ?**

**Scénario problématique** :
1. Utilisateur navigue vers `/dashboard` via React Router
2. URL dans le navigateur : `http://example.com/dashboard`
3. Utilisateur refresh (F5) → Navigateur demande `GET /dashboard` au serveur
4. **Sans `try_files`** : Nginx cherche un fichier `/dashboard` → 404
5. **Avec `try_files`** : Nginx sert `index.html` → React charge et affiche `/dashboard`

**Résumé** : `try_files` permet de gérer le routing côté client tout en servant depuis Nginx.

## Docker Compose

### docker-compose.dev.yml

```yaml
version: '3.8'

services:
  backend-dev:
    build:
      context: .                        # CHANGEMENT : Racine (pas ./backend)
      dockerfile: backend/Dockerfile.dev
    ports:
      - "3000:3000"                     # HOST:CONTAINER
    volumes:
      - ./backend:/app/backend          # Synchro code en temps réel
      - ./package.json:/app/package.json
      - ./package-lock.json:/app/package-lock.json
      - /app/node_modules               # Protège node_modules du conteneur
    environment:
      - NODE_ENV=development
      - PORT=3000
    env_file:
      - ./backend/.env                  # Charge les variables d'environnement

  frontend-dev:
    build:
      context: .                        # CHANGEMENT : Racine (pas ./frontend)
      dockerfile: frontend/Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app/frontend        # Synchro code frontend
      - ./package.json:/app/package.json
      - ./package-lock.json:/app/package-lock.json
      - /app/node_modules
    environment:
      - NODE_ENV=development
    depends_on:
      - backend-dev                     # Démarre après le backend
```

**Volumes expliqués** :

```yaml
volumes:
  - ./backend:/app/backend              # Monte ./backend de l'hôte dans /app/backend du conteneur
  - ./package.json:/app/package.json    # Synchro package.json racine
  - /app/node_modules                   # Volume anonyme : protège node_modules
```

**Pourquoi `/app/node_modules` est crucial ?**

Sans le volume anonyme :
1. Dockerfile : `RUN npm install` → installe dans `/app/node_modules`
2. docker-compose : `./backend:/app/backend` → monte le dossier hôte
3. Mais aussi `./package.json:/app/package.json` → écrase `/app`
4. **Problème** : node_modules de l'hôte (vide ou différent) écrase celui du conteneur
5. Crash : `Cannot find module 'express'`

Avec le volume anonyme :
- Docker dit "synchronise tout dans `/app` SAUF `/app/node_modules`"
- node_modules reste celui installé dans le conteneur

**Variables d'environnement** :

```yaml
environment:
  - NODE_ENV=development    # Variable non sensible, documentée
env_file:
  - ./backend/.env          # Secrets, credentials (pas dans git)
```

Différence :
- `environment` : Variables simples, visible dans docker-compose
- `env_file` : Fichier séparé (non versionné), pour secrets

### docker-compose.prod.yml

```yaml
version: '3.8'

services:
  backend-prod:
    build:
      context: .
      dockerfile: backend/Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - ./backend/.env
    restart: unless-stopped             # NOUVEAU : auto-restart

  frontend-prod:
    build:
      context: .
      dockerfile: frontend/Dockerfile.prod
    ports:
      - "80:80"                         # Port HTTP standard
    depends_on:
      - backend-prod
    restart: unless-stopped
```

**Différences vs dev** :
- **Pas de volumes** : Code figé dans l'image (immuable)
- `restart: unless-stopped` : Haute disponibilité (redémarre automatiquement)
- Port 80 pour le frontend : Standard HTTP
- Images optimisées : Dockerfiles de production

**Restart policies** :

| Policy             | Comportement                                          |
| ------------------ | ----------------------------------------------------- |
| `no`               | Ne redémarre jamais (défaut)                          |
| `always`           | Toujours, même après `docker-compose down`            |
| `on-failure`       | Seulement si crash (exit code ≠ 0)                    |
| `unless-stopped`   | Toujours, sauf si arrêt manuel (recommandé en prod) |

## Commandes utiles

### Build & Run

```bash
# ========================================
# Développement
# ========================================

# Démarrer les services (foreground, logs visibles)
docker-compose -f docker-compose.dev.yml up

# Démarrer en arrière-plan (detached)
docker-compose -f docker-compose.dev.yml up -d

# Force rebuild (si Dockerfile ou package.json modifié)
docker-compose -f docker-compose.dev.yml up --build

# Rebuild un seul service
docker-compose -f docker-compose.dev.yml up --build backend-dev

# ========================================
# Production
# ========================================

# Build les images
docker-compose -f docker-compose.prod.yml build

# Démarrer en production (toujours en -d)
docker-compose -f docker-compose.prod.yml up -d

# Build + Start en une commande
docker-compose -f docker-compose.prod.yml up -d --build
```

### Gestion des conteneurs

```bash
# Voir les conteneurs actifs
docker-compose -f docker-compose.dev.yml ps

# Arrêter les conteneurs (gardent les images et volumes)
docker-compose -f docker-compose.dev.yml down

# Arrêter et supprimer tout (images + volumes)
docker-compose -f docker-compose.dev.yml down --rmi all --volumes

# Redémarrer un service spécifique
docker-compose -f docker-compose.dev.yml restart backend-dev

# Arrêter un service sans le supprimer
docker-compose -f docker-compose.dev.yml stop frontend-dev

# Redémarrer un service arrêté
docker-compose -f docker-compose.dev.yml start frontend-dev
```

### Logs

```bash
# Tous les logs
docker-compose -f docker-compose.dev.yml logs

# Logs d'un service spécifique
docker-compose -f docker-compose.dev.yml logs backend-dev

# Suivre les logs en temps réel (comme tail -f)
docker-compose -f docker-compose.dev.yml logs -f

# Suivre les logs d'un service
docker-compose -f docker-compose.dev.yml logs -f frontend-dev

# Dernières 100 lignes
docker-compose -f docker-compose.dev.yml logs --tail=100

# Logs depuis une heure
docker-compose -f docker-compose.dev.yml logs --since 1h
```

### Exécuter des commandes dans un conteneur

```bash
# Shell interactif dans un conteneur (pour explorer)
docker-compose -f docker-compose.dev.yml exec backend-dev sh

# Exécuter une commande ponctuelle
docker-compose -f docker-compose.dev.yml exec backend-dev npm install axios

# Vérifier les variables d'environnement
docker-compose -f docker-compose.dev.yml exec backend-dev env

# Lister les fichiers
docker-compose -f docker-compose.dev.yml exec backend-dev ls -la

# Tester une route API depuis le conteneur
docker-compose -f docker-compose.dev.yml exec backend-dev curl http://localhost:3000/
```

### Images

```bash
# Lister les images
docker images

# Lister les images du projet
docker images | grep time-manager

# Supprimer une image
docker rmi <image-id>

# Supprimer une image par nom
docker rmi time-manager-backend-dev

# Nettoyer les images non utilisées (dangling)
docker image prune

# Nettoyer TOUTES les images non utilisées
docker image prune -a

# Voir la taille des images (formaté)
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

### Volumes

```bash
# Lister les volumes
docker volume ls

# Inspecter un volume (voir où il est monté)
docker volume inspect <volume-name>

# Supprimer les volumes inutilisés
docker volume prune

# Supprimer un volume spécifique
docker volume rm <volume-name>
```

### Nettoyage global

```bash
# Nettoyer tout ce qui est inutilisé (conteneurs arrêtés, images, volumes)
# ATTENTION : Supprime tout ce qui n'est pas utilisé par un conteneur actif
docker system prune -a --volumes

# Nettoyage sans supprimer les volumes
docker system prune -a

# Voir l'espace disque utilisé par Docker
docker system df

# Détail de l'utilisation
docker system df -v
```

## Workflows

### Workflow développement quotidien

```bash
# ========================================
# 1. Premier lancement du jour
# ========================================
docker-compose -f docker-compose.dev.yml up

# Ou en arrière-plan
docker-compose -f docker-compose.dev.yml up -d

# ========================================
# 2. Développer normalement
# ========================================
# - Modifier le code → hot-reload automatique (nodemon/Vite)
# - Pas besoin de rebuild ou restart
# - Les changements sont visibles instantanément

# ========================================
# 3. Installer une nouvelle dépendance
# ========================================

# Option A : Installer sur l'hôte puis rebuild
cd backend
npm install axios
cd ..
docker-compose -f docker-compose.dev.yml up --build backend-dev

# Option B : Installer directement dans le conteneur (plus rapide)
docker-compose -f docker-compose.dev.yml exec backend-dev npm install axios
# Attention : aussi installer sur l'hôte pour cohérence
cd backend && npm install axios && cd ..

# ========================================
# 4. Voir les logs en temps réel
# ========================================
docker-compose -f docker-compose.dev.yml logs -f

# ========================================
# 5. Redémarrer un service si besoin
# ========================================
docker-compose -f docker-compose.dev.yml restart backend-dev

# ========================================
# 6. Arrêter proprement en fin de journée
# ========================================
docker-compose -f docker-compose.dev.yml down
```

### Workflow déploiement production

```bash
# ========================================
# 1. Tester localement en mode prod
# ========================================
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up

# Ou en une commande
docker-compose -f docker-compose.prod.yml up --build

# ========================================
# 2. Vérifier que tout fonctionne
# ========================================
# Frontend : http://localhost
# Backend : http://localhost:3000
# Tester les routes, la navigation, etc.

# ========================================
# 3. Tag et push les images (si registry)
# ========================================
# Tag avec version
docker tag time-manager-backend-prod myregistry/time-manager-backend:1.0.0
docker tag time-manager-frontend-prod myregistry/time-manager-frontend:1.0.0

# Tag latest
docker tag time-manager-backend-prod myregistry/time-manager-backend:latest
docker tag time-manager-frontend-prod myregistry/time-manager-frontend:latest

# Push vers le registry
docker push myregistry/time-manager-backend:1.0.0
docker push myregistry/time-manager-backend:latest
docker push myregistry/time-manager-frontend:1.0.0
docker push myregistry/time-manager-frontend:latest

# ========================================
# 4. Sur le serveur de production
# ========================================
# Pull les images
docker-compose -f docker-compose.prod.yml pull

# Démarrer les services
docker-compose -f docker-compose.prod.yml up -d

# ========================================
# 5. Vérifier les logs
# ========================================
docker-compose -f docker-compose.prod.yml logs -f

# Si tout est OK, détacher avec Ctrl+C
```

### Workflow modification de Dockerfile

```bash
# ========================================
# Après modification d'un Dockerfile
# ========================================

# Rebuild sans cache (force à tout refaire)
docker-compose -f docker-compose.dev.yml build --no-cache backend-dev

# Rebuild avec cache (plus rapide)
docker-compose -f docker-compose.dev.yml build backend-dev

# Rebuild et démarrer
docker-compose -f docker-compose.dev.yml up --build backend-dev
```

**Quand utiliser `--no-cache` ?**
- Changement d'image de base (FROM)
- Problème de cache suspect
- Mise à jour de système (apt-get, apk)

**Sinon** : Build normal avec cache (beaucoup plus rapide)

### Workflow changement de branche Git

```bash
# ========================================
# Passer sur une autre branche
# ========================================
git checkout feature-branch

# ========================================
# Rebuild si Dockerfile ou package.json ont changé
# ========================================
docker-compose -f docker-compose.dev.yml up --build

# Ou rebuild seulement si nécessaire
docker-compose -f docker-compose.dev.yml up

# Si problème de dépendances
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

### Workflow mise à jour dépendances

```bash
# ========================================
# Mettre à jour une dépendance
# ========================================

# 1. Mettre à jour sur l'hôte
cd backend
npm update express
cd ..

# 2. Rebuild l'image
docker-compose -f docker-compose.dev.yml up --build backend-dev

# ========================================
# Mettre à jour TOUTES les dépendances
# ========================================
cd backend
npm update
cd ..
docker-compose -f docker-compose.dev.yml build --no-cache backend-dev
docker-compose -f docker-compose.dev.yml up
```

## Troubleshooting

### Problème : Port déjà utilisé

**Symptôme** :
```
Error: bind: address already in use
ERROR: for backend-dev  Cannot start service backend-dev:
  driver failed programming external connectivity on endpoint
```

**Cause** : Un processus utilise déjà le port (Node, autre conteneur, etc.)

**Solutions** :

1. **Trouver le processus qui utilise le port** :
```bash
# Linux/Mac
sudo lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

2. **Tuer le processus** :
```bash
# Linux/Mac
kill -9 <PID>

# Windows
taskkill /PID <PID> /F
```

3. **Ou changer le port dans docker-compose** :
```yaml
# docker-compose.dev.yml
ports:
  - "3001:3000"  # Utilise 3001 sur l'hôte, 3000 dans le conteneur
```

### Problème : Cannot find module 'express'

**Symptôme** :
```
Error: Cannot find module 'express'
    at Function.Module._resolveFilename (internal/modules/cjs/loader.js:...)
```

**Causes possibles** :

1. **node_modules pas installé dans le conteneur** :
```bash
# Solution : rebuild l'image
docker-compose -f docker-compose.dev.yml up --build
```

2. **Volume node_modules manquant** :
```yaml
# Vérifier dans docker-compose.dev.yml
volumes:
  - ./backend:/app/backend
  - /app/node_modules  # DOIT être présent
```

3. **Dépendance installée sur l'hôte mais pas dans le conteneur** :
```bash
# Installer dans le conteneur
docker-compose -f docker-compose.dev.yml exec backend-dev npm install

# Ou rebuild
docker-compose -f docker-compose.dev.yml up --build backend-dev
```

4. **package.json ou package-lock.json modifié** :
```bash
# Rebuild obligatoire
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

### Problème : Frontend inaccessible (Vite)

**Symptôme** :
- Vite démarre dans le conteneur
- Logs montrent "ready in X ms"
- Mais `http://localhost:5173` ne répond pas

**Cause** : Vite écoute sur `127.0.0.1` (localhost du conteneur) au lieu de `0.0.0.0`

**Solutions** :

1. **Vérifier que `--host` est présent dans CMD** :
```dockerfile
# frontend/Dockerfile.dev
CMD ["npm", "run", "dev", "--", "--host"]
                              ^^^^^^^^^^
```

2. **Ou ajouter dans `vite.config.js`** :
```javascript
export default {
  server: {
    host: '0.0.0.0',  // Écoute sur toutes les interfaces
    port: 5173
  }
}
```

3. **Vérifier les logs Vite** :
```bash
docker-compose -f docker-compose.dev.yml logs frontend-dev
```

Doit afficher :
```
VITE v5.x.x  ready in X ms
➜  Local:   http://localhost:5173/
➜  Network: http://172.xx.x.x:5173/  ← Doit être présent
```

### Problème : React Router 404 en prod

**Symptôme** :
- Route `/` fonctionne
- Navigation via React fonctionne
- Refresh (F5) sur `/about` → **404 Nginx**

**Cause** : Nginx cherche un fichier `/about` qui n'existe pas

**Solution** :

Vérifier `frontend/nginx.conf` :
```nginx
location / {
    try_files $uri $uri/ /index.html;  # DOIT être présent
}
```

Si absent, ajouter et rebuild :
```bash
docker-compose -f docker-compose.prod.yml build frontend-prod
docker-compose -f docker-compose.prod.yml up -d
```

### Problème : Changements de code non visibles

**En dev (hot-reload ne marche pas)** :

1. **Vérifier les volumes** :
```bash
docker-compose -f docker-compose.dev.yml config | grep volumes -A 3
# Doit montrer : ./backend:/app/backend
```

2. **Vérifier que nodemon/Vite tourne** :
```bash
docker-compose -f docker-compose.dev.yml logs backend-dev | grep nodemon
# Doit montrer : [nodemon] watching path(s)

docker-compose -f docker-compose.dev.yml logs frontend-dev | grep VITE
# Doit montrer : VITE vX.x.x  ready
```

3. **Redémarrer le service** :
```bash
docker-compose -f docker-compose.dev.yml restart backend-dev
```

4. **Si package.json modifié, rebuild obligatoire** :
```bash
docker-compose -f docker-compose.dev.yml up --build
```

**En prod (normal)** :

C'est le comportement attendu ! Le code est figé dans l'image.
Pour voir les changements :
```bash
# Rebuild obligatoire
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Problème : Variables d'environnement non chargées

**Symptôme** :
```javascript
console.log(process.env.SUPABASE_URL);  // undefined
```

**Solutions** :

1. **Vérifier que `.env` existe** :
```bash
ls -la backend/.env
cat backend/.env  # Vérifier le contenu
```

2. **Vérifier docker-compose.yml** :
```yaml
env_file:
  - ./backend/.env  # Chemin correct depuis la racine du projet
```

3. **Vérifier les variables dans le conteneur** :
```bash
docker-compose -f docker-compose.dev.yml exec backend-dev env | grep SUPABASE
```

Si vide, le fichier n'est pas chargé.

4. **Redémarrer après modification de .env** :
```bash
docker-compose -f docker-compose.dev.yml restart backend-dev
```

5. **Vérifier que dotenv est chargé** (backend Node.js) :
```javascript
// server.js ou app.js (tout en haut)
require('dotenv').config();
```

### Problème : Image trop volumineuse

**Symptôme** :
```bash
docker images
# backend-prod    500 MB  ← Trop gros !
```

**Solutions** :

1. **Vérifier l'image de base Alpine** (déjà fait) :
```dockerfile
FROM node:20-alpine  # au lieu de FROM node:20
```

2. **Production dependencies only** (déjà fait) :
```dockerfile
RUN npm ci --omit=dev  # Exclut devDependencies
```

3. **Multi-stage build** (frontend déjà fait) :
```dockerfile
FROM node:20-alpine AS builder
# ... build ...
FROM nginx:alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
```

4. **Ajouter/vérifier `.dockerignore`** :
```
# backend/.dockerignore
node_modules
npm-debug.log
.git
.env
coverage
*.test.js
.dockerignore
Dockerfile*
```

5. **Rebuild avec --no-cache pour vérifier** :
```bash
docker-compose -f docker-compose.prod.yml build --no-cache
docker images | grep time-manager
```

**Tailles attendues** :
- Backend prod : ~80-100 MB
- Frontend prod : ~15-25 MB (avec Nginx)
- Frontend dev : ~150-200 MB (avec Node)

### Problème : Conteneur crash en boucle

**Symptôme** :
```bash
docker-compose ps
# backend-prod    Restarting (1)  ← Reboot en boucle
```

**Diagnostic** :

1. **Voir les logs** :
```bash
docker-compose -f docker-compose.dev.yml logs backend-dev
```

Rechercher :
- Erreur de syntaxe JavaScript
- Module manquant
- Port déjà utilisé
- Erreur de connexion DB

2. **Tester sans restart policy** :
```yaml
# Commenter temporairement dans docker-compose.yml
# restart: unless-stopped
```

3. **Exécuter en interactif pour débugger** :
```bash
# Arrêter le conteneur en crash
docker-compose -f docker-compose.dev.yml down

# Lancer en interactif
docker-compose -f docker-compose.dev.yml run backend-dev sh

# Dans le shell du conteneur, lancer manuellement
node server.js
# L'erreur s'affichera directement
```

4. **Vérifier les fichiers nécessaires** :
```bash
docker-compose -f docker-compose.dev.yml run backend-dev ls -la
# Vérifier que server.js, app.js, etc. sont présents
```

### Problème : Cache Docker invalide

**Symptôme** :
- Build très rapide (utilise le cache)
- Mais anciennes dépendances installées
- Code modifié non pris en compte

**Cause** : Docker utilise le cache des layers précédents

**Solution** :
```bash
# Rebuild sans cache (force à tout refaire)
docker-compose -f docker-compose.dev.yml build --no-cache

# Ou pour un service spécifique
docker-compose -f docker-compose.dev.yml build --no-cache backend-dev

# Puis redémarrer
docker-compose -f docker-compose.dev.yml up
```

### Problème : "npm ERR! code ELIFECYCLE"

**Symptôme** :
```
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! backend@1.0.0 dev: `nodemon server.js`
npm ERR! Exit status 1
```

**Cause** : Le script npm crash (erreur dans le code)

**Solutions** :

1. **Voir les logs complets** :
```bash
docker-compose -f docker-compose.dev.yml logs backend-dev
```

2. **Tester le script manuellement** :
```bash
docker-compose -f docker-compose.dev.yml run backend-dev sh
# Dans le conteneur :
npm run dev
# L'erreur complète s'affichera
```

3. **Erreurs courantes** :
- Syntaxe JavaScript invalide
- Module manquant
- Port déjà utilisé
- Variables d'environnement manquantes

---

## Tableau récapitulatif

| Aspect                  | Développement                     | Production                          |
| ----------------------- | --------------------------------- | ----------------------------------- |
| **Fichier**             | docker-compose.dev.yml            | docker-compose.prod.yml             |
| **Dockerfile Backend**  | Dockerfile.dev                    | Dockerfile.prod                     |
| **Dockerfile Frontend** | Dockerfile.dev                    | Dockerfile.prod (multi-stage)       |
| **Context build**       | `.` (racine monorepo)             | `.` (racine monorepo)               |
| **Backend Port**        | 3000                              | 3000                                |
| **Frontend Port**       | 5173                              | 80                                  |
| **Backend CMD**         | `npm run dev` (nodemon)           | `node server.js`                    |
| **Frontend CMD**        | `npm run dev -- --host`           | `nginx -g "daemon off;"`            |
| **Volumes**             | Oui (synchro code)              | Non (figé)                        |
| **Hot-reload**          | Oui (nodemon + Vite HMR)        | Non                               |
| **npm install**         | `npm install` (all)               | `npm ci --omit=dev`                 |
| **Rebuild nécessaire**  | Rarement (si package.json change) | Toujours (pour chaque deploy)       |
| **Taille Backend**      | ~180-200 MB                       | ~80-100 MB                          |
| **Taille Frontend**     | ~180-200 MB                       | ~15-25 MB (Nginx seul)              |
| **NODE_ENV**            | `development`                     | `production`                        |
| **Restart policy**      | Aucune                            | `unless-stopped`                    |
| **Optimisations**       | Aucune                          | Build minifié, tree-shaking, etc. |
| **Source maps**         | Oui                             |  Non                               |
| **Logs**                | Verbeux                           | Optimisés                           |
| **Utilisateur**         | `node` (non-root)                 | `node` (backend), `nginx` (frontend) |
| **Sécurité**            | Développement local               | Hardened, production-ready          |

---

**Prêt pour la production !** 
