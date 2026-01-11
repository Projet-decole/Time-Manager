# Docker - Time Manager

> **Architecture** : Monorepo npm workspaces | **Context de build** : Racine (`.`)

## Structure

```
Time-Manager/
├── backend/
│   ├── Dockerfile.dev      # Dev avec nodemon
│   └── Dockerfile.prod     # Prod optimise
├── frontend/
│   ├── Dockerfile.dev      # Dev avec Vite HMR
│   ├── Dockerfile.prod     # Multi-stage (build + nginx)
│   └── nginx.conf          # Config SPA routing
├── docker-compose.dev.yml  # Orchestration dev
└── docker-compose.prod.yml # Orchestration prod
```

## Commandes essentielles

### Developpement

```bash
# Demarrer (foreground)
docker-compose -f docker-compose.dev.yml up

# Demarrer (background)
docker-compose -f docker-compose.dev.yml up -d

# Rebuild apres modif package.json
docker-compose -f docker-compose.dev.yml up --build

# Arreter
docker-compose -f docker-compose.dev.yml down
```

### Production

```bash
# Build + demarrer
docker-compose -f docker-compose.prod.yml up -d --build

# Arreter
docker-compose -f docker-compose.prod.yml down
```

### Rebuild complet (apres ajout npm package)

```bash
# Supprimer containers + images + volumes
docker-compose -f docker-compose.dev.yml down --rmi all --volumes

# Rebuild sans cache
docker-compose -f docker-compose.dev.yml build --no-cache

# Redemarrer
docker-compose -f docker-compose.dev.yml up
```

### Logs et debug

```bash
# Logs temps reel
docker-compose -f docker-compose.dev.yml logs -f

# Logs d'un service
docker-compose -f docker-compose.dev.yml logs -f backend-dev

# Shell dans container
docker-compose -f docker-compose.dev.yml exec backend-dev sh

# Etat des containers
docker-compose -f docker-compose.dev.yml ps
```

### Nettoyage

```bash
# Supprimer images non utilisees
docker image prune -a

# Supprimer volumes non utilises
docker volume prune

# Nettoyage complet (attention!)
docker system prune -a --volumes
```

## Ports

| Service | Dev | Prod |
|---------|-----|------|
| Backend | 3000 | 3000 |
| Frontend | 5173 | 80 |

## Dockerfiles - Points cles

### Backend Dev (`backend/Dockerfile.dev`)
- Base: `node:20-alpine`
- CMD: `npm run dev` (nodemon)
- Volume monte pour hot-reload

### Backend Prod (`backend/Dockerfile.prod`)
- `npm ci --omit=dev` (sans devDependencies)
- CMD: `node server.js` (direct, sans npm)

### Frontend Dev (`frontend/Dockerfile.dev`)
- CMD: `npm run dev -- --host` (expose sur 0.0.0.0)

### Frontend Prod (`frontend/Dockerfile.prod`)
- Multi-stage: builder (node) → nginx
- Image finale ~15MB (nginx + dist/)

## docker-compose.dev.yml - Points cles

```yaml
services:
  backend-dev:
    build:
      context: .                    # Racine monorepo
      dockerfile: backend/Dockerfile.dev
    volumes:
      - ./backend:/app/backend      # Synchro code
      - /app/node_modules           # Protege node_modules container
    env_file:
      - ./backend/.env

  frontend-dev:
    build:
      context: .
      dockerfile: frontend/Dockerfile.dev
    depends_on:
      - backend-dev
```

**Volume `/app/node_modules`** : Empeche le node_modules local d'ecraser celui du container.

## Troubleshooting

| Probleme | Solution |
|----------|----------|
| Port deja utilise | `lsof -i :3000` puis `kill -9 <PID>` |
| Cannot find module | `docker-compose -f docker-compose.dev.yml up --build` |
| Hot-reload KO | `docker-compose -f docker-compose.dev.yml restart` |
| Frontend inaccessible | Verifier `--host` dans CMD Dockerfile |
| Env vars non chargees | `exec backend-dev env \| grep SUPABASE` |

## Comparatif Dev vs Prod

| Aspect | Dev | Prod |
|--------|-----|------|
| Volumes | Oui (synchro code) | Non (fige) |
| Hot-reload | Oui | Non |
| npm install | Toutes deps | `--omit=dev` |
| CMD backend | `npm run dev` | `node server.js` |
| CMD frontend | Vite | nginx |
| Taille backend | ~200MB | ~100MB |
| Taille frontend | ~200MB | ~15MB |
