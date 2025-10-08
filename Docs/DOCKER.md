# Guide Docker - Time Manager

Guide complet pour comprendre et utiliser Docker dans ce projet.

## 📋 Table des matières

- [Concepts Docker](#concepts-docker)
- [Structure des fichiers](#structure-des-fichiers)
- [Dockerfiles expliqués](#dockerfiles-expliqués)
- [Docker Compose](#docker-compose)
- [Commandes utiles](#commandes-utiles)
- [Workflows](#workflows)
- [Troubleshooting](#troubleshooting)

## 🐳 Concepts Docker

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

✅ **Reproductibilité** : Fonctionne identiquement partout
✅ **Isolation** : Pas de conflit de versions (Node, npm, etc.)
✅ **Portabilité** : Deploy facile sur n'importe quel serveur
✅ **Dev/Prod similaires** : Réduit les bugs "ça marche sur ma machine"

## 📁 Structure des fichiers

```
time-manager/
├── backend/
│   ├── Dockerfile.dev       # Image développement backend
│   ├── Dockerfile.prod      # Image production backend
│   └── ...
├── frontend/
│   ├── Dockerfile.dev       # Image développement frontend
│   ├── Dockerfile.prod      # Image production frontend
│   ├── nginx.conf           # Configuration Nginx (prod)
│   └── ...
├── docker-compose.dev.yml   # Orchestration développement
└── docker-compose.prod.yml  # Orchestration production
```

## 🔨 Dockerfiles expliqués

### Backend - Dockerfile.dev

```dockerfile
FROM node:20-alpine
# Image de base : Node.js 20 sur Alpine Linux (léger, ~50 MB)

WORKDIR /app
# Définit /app comme répertoire de travail

COPY --chown=node:node package*.json ./
# Copie package.json et package-lock.json
# --chown=node:node : propriétaire = utilisateur node (sécurité)

RUN npm install
# Installe TOUTES les dépendances (dependencies + devDependencies)

COPY --chown=node:node . .
# Copie le reste du code

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

### Backend - Dockerfile.prod

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY --chown=node:node package*.json ./

RUN npm ci --only=production
# npm ci : Installation reproductible (lit package-lock.json strictement)
# --only=production : N'installe PAS les devDependencies (nodemon, etc.)

COPY --chown=node:node . .

USER node

EXPOSE 3000

CMD ["node", "app.js"]
# Lance directement avec node (pas npm), plus performant
```

**Différences vs dev** :
- `npm ci --only=production` : 30% de réduction de taille
- `CMD ["node", "app.js"]` : Pas de couche npm, meilleure gestion des signaux
- **Pas de volume** : Code figé dans l'image

### Frontend - Dockerfile.dev

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY --chown=node:node package*.json ./

RUN npm install

COPY --chown=node:node . .

USER node

EXPOSE 5173
# Port par défaut de Vite

CMD ["npm", "run", "dev", "--", "--host"]
# -- : sépare les args npm des args Vite
# --host : écoute sur 0.0.0.0 (accessible depuis Docker)
```

**Pourquoi `--host` ?**

Sans `--host` : Vite écoute sur `localhost` → inaccessible depuis l'extérieur du conteneur
Avec `--host` : Vite écoute sur `0.0.0.0` → accessible via `http://localhost:5173`

### Frontend - Dockerfile.prod (Multi-stage)

```dockerfile
# ===== ÉTAPE 1 : BUILD =====
FROM node:20-alpine AS builder
# AS builder : nomme cette étape pour la référencer plus tard

WORKDIR /app

COPY --chown=node:node package*.json ./

RUN npm ci
# npm ci : reproductible (pas npm install)

COPY --chown=node:node . .

RUN npm run build
# Crée le dossier dist/ avec les fichiers optimisés
# Minification, tree-shaking, code splitting


# ===== ÉTAPE 2 : PRODUCTION =====
FROM nginx:alpine
# Image Nginx légère (~10 MB)

COPY --from=builder /app/dist /usr/share/nginx/html
# Copie UNIQUEMENT dist/ depuis l'étape précédente
# Tout le reste (Node, npm, node_modules) est jeté

COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copie la configuration Nginx personnalisée

EXPOSE 80
# Port HTTP standard

CMD ["nginx", "-g", "daemon off;"]
# Lance Nginx en mode foreground (nécessaire pour Docker)
```

**Avantages du multi-stage** :
- Image finale : ~15 MB (vs ~200 MB sans multi-stage)
- Pas de Node.js ni npm en production (surface d'attaque réduite)
- Seulement Nginx + fichiers statiques

### Nginx.conf expliqué

```nginx
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;

    # Routing SPA : CRITIQUE pour React Router
    location / {
        try_files $uri $uri/ /index.html;
        # 1. Cherche le fichier exact ($uri)
        # 2. Cherche un dossier ($uri/)
        # 3. Sinon, sert index.html (React Router prend le relais)
    }

    # Cache agressif pour les assets (ont un hash dans le nom)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        # immutable : le fichier ne changera JAMAIS
    }

    # Pas de cache pour index.html (pas de hash dans le nom)
    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # Compression gzip (réduit la bande passante)
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;
}
```

**Pourquoi `try_files` est crucial ?**

Scénario :
1. Utilisateur va sur `/about` via navigation React ✅
2. Utilisateur refresh (F5) → Navigateur demande GET `/about` au serveur
3. Sans `try_files` : Nginx cherche `/about` → 404 ❌
4. Avec `try_files` : Nginx sert `index.html` → React affiche `/about` ✅

## 🎼 Docker Compose

### docker-compose.dev.yml

```yaml
version: '3.8'

services:
  backend-dev:
    build:
      context: ./backend        # Dossier de build
      dockerfile: Dockerfile.dev # Dockerfile à utiliser
    ports:
      - "3000:3000"             # HOST:CONTAINER
    volumes:
      - ./backend:/app          # Synchro code en temps réel
      - /app/node_modules       # Protège node_modules du conteneur
    environment:
      - NODE_ENV=development    # Charge les variables non sensible, documentée
    env_file:
      - ./backend/.env          # Charge les variables depuis .env (pour les Secrets, credentials, pas dans git)

  frontend-dev:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    depends_on:
      - backend-dev             # Démarre après le backend
```

**Volumes expliqués** :

```yaml
volumes:
  - ./backend:/app          # Monte ./backend de l'hôte dans /app du conteneur
  - /app/node_modules       # Volume anonyme : protège node_modules
```

Sans le 2ème volume :
1. Docker installe node_modules dans /app
2. Volume ./backend:/app écrase /app
3. node_modules de l'hôte (vide ou différent) remplace celui du conteneur
4. Crash : "Cannot find module 'express'" ❌

Avec le 2ème volume :
- Docker dit "synchronise tout SAUF node_modules"
- node_modules reste celui du conteneur ✅

### docker-compose.prod.yml

```yaml
version: '3.8'

services:
  backend-prod:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - ./backend/.env
    restart: unless-stopped     # NOUVEAU : auto-restart

  frontend-prod:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"                 # Port HTTP standard
    depends_on:
      - backend-prod
    restart: unless-stopped
```

**Différences vs dev** :
- ❌ Pas de volumes (code figé dans l'image)
- ✅ `restart: unless-stopped` (haute disponibilité)
- ✅ Port 80 pour le frontend (standard HTTP)

**Restart policies** :

| Policy           | Comportement                                |
| ---------------- | ------------------------------------------- |
| `no`             | Ne redémarre jamais                         |
| `always`         | Toujours, même après `docker-compose down`  |
| `on-failure`     | Seulement si crash (exit code ≠ 0)          |
| `unless-stopped` | Toujours, sauf si arrêt manuel (recommandé) |

## 🎮 Commandes utiles

### Build & Run

```bash
# Développement
docker-compose -f docker-compose.dev.yml up
docker-compose -f docker-compose.dev.yml up -d          # Detached (en arrière-plan)
docker-compose -f docker-compose.dev.yml up --build     # Force rebuild

# Production
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Gestion des conteneurs

```bash
# Voir les conteneurs actifs
docker-compose -f docker-compose.dev.yml ps

# Arrêter les conteneurs
docker-compose -f docker-compose.dev.yml down

# Arrêter et supprimer tout (images incluses)
docker-compose -f docker-compose.dev.yml down --rmi all --volumes

# Redémarrer un service spécifique
docker-compose -f docker-compose.dev.yml restart backend-dev
```

### Logs

```bash
# Tous les logs
docker-compose -f docker-compose.dev.yml logs

# Logs d'un service spécifique
docker-compose -f docker-compose.dev.yml logs backend-dev

# Suivre les logs en temps réel
docker-compose -f docker-compose.dev.yml logs -f

# Dernières 100 lignes
docker-compose -f docker-compose.dev.yml logs --tail=100
```

### Exécuter des commandes dans un conteneur

```bash
# Shell interactif dans un conteneur
docker-compose -f docker-compose.dev.yml exec backend-dev sh

# Exécuter une commande ponctuelle
docker-compose -f docker-compose.dev.yml exec backend-dev npm install axios

# Exemple : vérifier les variables d'environnement
docker-compose -f docker-compose.dev.yml exec backend-dev env
```

### Images

```bash
# Lister les images
docker images

# Supprimer une image
docker rmi <image-id>

# Nettoyer les images non utilisées
docker image prune

# Voir la taille des images
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

### Volumes

```bash
# Lister les volumes
docker volume ls

# Inspecter un volume
docker volume inspect <volume-name>

# Supprimer les volumes inutilisés
docker volume prune
```

### Nettoyage global

```bash
# Nettoyer TOUT ce qui est inutilisé (attention !)
docker system prune -a --volumes

# Voir l'espace disque utilisé par Docker
docker system df
```

## 🔄 Workflows

### Workflow développement quotidien

```bash
# 1. Démarrer les services (une seule fois)
docker-compose -f docker-compose.dev.yml up

# 2. Développer normalement
# - Modifier le code → hot-reload automatique
# - Pas besoin de rebuild

# 3. Installer une nouvelle dépendance
cd backend
npm install axios              # Installe sur l'hôte
docker-compose -f docker-compose.dev.yml up --build backend-dev

# Alternative : installer directement dans le conteneur
docker-compose -f docker-compose.dev.yml exec backend-dev npm install axios

# 4. Arrêter proprement
docker-compose -f docker-compose.dev.yml down
```

### Workflow déploiement production

```bash
# 1. Tester localement en mode prod
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up

# 2. Vérifier que tout fonctionne
# - Frontend : http://localhost
# - Backend : http://localhost:3000

# 3. Pousser les images (si registry)
docker tag time-manager-frontend-prod myregistry/frontend:latest
docker push myregistry/frontend:latest

# 4. Sur le serveur de production
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# 5. Vérifier les logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Workflow modification de Dockerfile

```bash
# Après modification d'un Dockerfile
docker-compose -f docker-compose.dev.yml build --no-cache backend-dev
docker-compose -f docker-compose.dev.yml up
```

`--no-cache` force à ignorer le cache (utile si changement d'image de base).

### Workflow changement de branche Git

```bash
# Passer sur une autre branche
git checkout feature-branch

# Rebuild si Dockerfile ou package.json ont changé
docker-compose -f docker-compose.dev.yml up --build

# Ou rebuild seulement si nécessaire
docker-compose -f docker-compose.dev.yml up
```

## 🐛 Troubleshooting

### Problème : Port déjà utilisé

**Symptôme** :
```
Error: bind: address already in use
```

**Solutions** :

1. **Trouver le processus qui utilise le port** :
```bash
# Linux/Mac
lsof -i :3000

# Windows
netstat -ano | findstr :3000
```

2. **Tuer le processus** ou **changer le port** :
```yaml
# docker-compose.dev.yml
ports:
  - "3001:3000"  # Utilise 3001 sur l'hôte au lieu de 3000
```

### Problème : Cannot find module 'express'

**Symptôme** :
```
Error: Cannot find module 'express'
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
  - ./backend:/app
  - /app/node_modules  # DOIT être présent
```

3. **Dépendance installée sur l'hôte mais pas dans le conteneur** :
```bash
# Installer dans le conteneur
docker-compose -f docker-compose.dev.yml exec backend-dev npm install
```

### Problème : Frontend inaccessible (Vite)

**Symptôme** :
Vite démarre mais http://localhost:5173 ne répond pas

**Solution** :
Vérifier que `--host` est présent :
```dockerfile
CMD ["npm", "run", "dev", "--", "--host"]
```

Ou ajouter dans `vite.config.js` :
```javascript
export default {
  server: {
    host: '0.0.0.0'
  }
}
```

### Problème : React Router 404 en prod

**Symptôme** :
- `/` fonctionne
- Navigation React fonctionne
- Refresh sur `/about` → 404 Nginx

**Solution** :
Vérifier `nginx.conf` :
```nginx
location / {
    try_files $uri $uri/ /index.html;  # DOIT être présent
}
```

### Problème : Changements de code non visibles

**En dev (hot-reload ne marche pas)** :

1. **Vérifier les volumes** :
```bash
docker-compose -f docker-compose.dev.yml config
# Doit montrer : ./backend:/app
```

2. **Vérifier que nodemon/Vite tourne** :
```bash
docker-compose -f docker-compose.dev.yml logs backend-dev
# Doit montrer : [nodemon] watching path(s)
```

3. **Rebuild si package.json modifié** :
```bash
docker-compose -f docker-compose.dev.yml up --build
```

**En prod (normal)** :

C'est le comportement attendu ! Le code est figé dans l'image.
Pour voir les changements :
```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Problème : Variables d'environnement non chargées

**Symptôme** :
```
SUPABASE_URL is undefined
```

**Solutions** :

1. **Vérifier que .env existe** :
```bash
ls -la backend/.env
```

2. **Vérifier docker-compose.yml** :
```yaml
env_file:
  - ./backend/.env  # Chemin correct ?
```

3. **Vérifier les variables dans le conteneur** :
```bash
docker-compose -f docker-compose.dev.yml exec backend-dev env | grep SUPABASE
```

4. **Redémarrer après modification de .env** :
```bash
docker-compose -f docker-compose.dev.yml restart backend-dev
```

### Problème : Image trop volumineuse

**Symptôme** :
```
backend-prod    500 MB
```

**Solutions** :

1. **Utiliser Alpine** (déjà fait) :
```dockerfile
FROM node:20-alpine  # ✅ au lieu de FROM node:20
```

2. **Production only dependencies** :
```dockerfile
RUN npm ci --only=production  # Exclut devDependencies
```

3. **Multi-stage build** (frontend déjà fait) :
```dockerfile
FROM node:20-alpine AS builder
# ... build ...
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

4. **Vérifier les fichiers copiés** :
Ajouter `.dockerignore` :
```
node_modules
npm-debug.log
.git
.env
dist
```

### Problème : Conteneur crash en boucle

**Symptôme** :
```bash
docker-compose ps
# STATUS: Restarting (1)
```

**Diagnostic** :

1. **Voir les logs** :
```bash
docker-compose -f docker-compose.dev.yml logs backend-dev
```

2. **Tester sans restart policy** :
```yaml
# Commenter temporairement
# restart: unless-stopped
```

3. **Exécuter en interactif** :
```bash
docker-compose -f docker-compose.dev.yml run backend-dev sh
# Puis lancer la commande manuellement pour voir l'erreur
node app.js
```

### Problème : Cache Docker invalide

**Symptôme** :
Build rapide mais anciennes dépendances installées

**Solution** :
```bash
# Rebuild sans cache
docker-compose -f docker-compose.dev.yml build --no-cache

# Ou pour une image spécifique
docker-compose -f docker-compose.dev.yml build --no-cache backend-dev
```

---

### Tableau récapitulatif

| Aspect                  | Développement              | Production                    |
| ----------------------- | -------------------------- | ----------------------------- |
| **Fichier**             | docker-compose.dev.yml     | docker-compose.prod.yml       |
| **Dockerfile Backend**  | Dockerfile.dev             | Dockerfile.prod               |
| **Dockerfile Frontend** | Dockerfile.dev             | Dockerfile.prod               |
| **Backend Port**        | 3000                       | 3000                          |
| **Frontend Port**       | 5173                       | 80                            |
| **Backend CMD**         | npm run dev (nodemon)      | node app.js                   |
| **Frontend CMD**        | npm run dev -- --host      | nginx -g "daemon off;"        |
| **Volumes**             | Oui (synchro code)         | Non (figé)                    |
| **Hot-reload**          | Oui                        | Non                           |
| **npm install**         | npm install (all)          | npm ci --only=production      |
| **Rebuild nécessaire**  | Rarement (si package.json) | Toujours (pour chaque deploy) |
| **Taille Backend**      | ~200 MB                    | ~180 MB                       |
| **Taille Frontend**     | ~200 MB                    | ~15 MB                        |
| **NODE_ENV**            | development                | production                    |
| **Restart policy**      | Aucune                     | unless-stopped                |
| **Optimisations**       | Aucune                     | Build minifié, tree-shaking   |
| **Source maps**         | Oui                        | Non                           |
| **Logs**                | Verbeux                    | Optimisés                     |
