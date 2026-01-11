# CI/CD - Time Manager

> **Pipeline** : Husky (local) + GitHub Actions (distant) | **Registry** : Docker Hub

## Architecture

```
git commit  →  Pre-commit hook    →  lint-staged (fichiers modifies)     [5-10s]
git push    →  Pre-push hook      →  Tests complets backend + frontend   [30-60s]
Push GitHub →  GitHub Actions     →  Tests → Build Docker → Push Hub     [5-10min]
```

## Husky - Git Hooks

### Pre-commit (`.husky/pre-commit`)
Execute `lint-staged` sur fichiers stages uniquement.

**Configuration lint-staged** (package.json racine) :
```json
{
  "lint-staged": {
    "frontend/**/*.{js,jsx}": [
      "npm run lint --workspace=frontend -- --fix",
      "npm run test --workspace=frontend -- --run"
    ],
    "backend/**/*.js": [
      "npm run test --workspace=backend -- --passWithNoTests"
    ]
  }
}
```

### Pre-push (`.husky/pre-push`)
Execute tous les tests backend + frontend.

### Bypass (exceptionnel)
```bash
git commit --no-verify
git push --no-verify
```

## GitHub Actions

**Fichier** : `.github/workflows/ci-cd.yml`

**Declencheurs** : Push et PR sur toutes les branches

**Restriction** : `if: github.repository == 'Projet-decole/Time-Manager'`

### Phase 1 : Tests (paralleles)

| Job | Action |
|-----|--------|
| test-backend | `npm test --workspace=backend` |
| test-frontend | `npm test --workspace=frontend` |
| lint-frontend | `npm run lint --workspace=frontend` |

### Phase 2 : Build (apres tests OK)

| Job | Depends on | Action |
|-----|------------|--------|
| build-backend | test-backend | Build + push Docker |
| build-frontend | test-frontend, lint-frontend | Build + push Docker |

### Tags Docker generes

```
username/time-manager-backend:main
username/time-manager-backend:sha-abc1234
username/time-manager-backend:latest    # Si branche par defaut

username/time-manager-frontend:main
username/time-manager-frontend:sha-abc1234
username/time-manager-frontend:latest
```

## Secrets GitHub requis

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Nom d'utilisateur Docker Hub |
| `DOCKERHUB_TOKEN` | Token d'acces (pas le mot de passe) |
| `VITE_API_URL` | URL API pour build frontend |
| `VITE_SUPABASE_URL` | URL Supabase |
| `VITE_SUPABASE_ANON_KEY` | Cle anon Supabase |

**Configuration** : Settings → Secrets and variables → Actions

## Workflow developpement

```bash
# 1. Creer branche
git checkout -b feat/ma-feature

# 2. Developper + tester localement
npm test

# 3. Commit (declenche pre-commit)
git add . && git commit -m "feat: description"

# 4. Push (declenche pre-push + GitHub Actions)
git push origin feat/ma-feature

# 5. Creer PR sur GitHub
# Pipeline s'execute automatiquement
```

## Workflow deploiement

```bash
# Sur serveur de production
docker pull username/time-manager-backend:latest
docker pull username/time-manager-frontend:latest
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

| Probleme | Solution |
|----------|----------|
| Tests OK local, KO en CI | Verifier NODE_ENV, versions Node, tests isoles |
| Push Docker echoue | Verifier secrets DOCKERHUB_* |
| Pre-commit ne se declenche pas | `npm install` pour reinstaller Husky |
| lint-staged echoue | `npm run lint --workspace=frontend -- --fix` |

## Conventions Git

**Branches** : `feat/`, `fix/`, `refactor/`, `docs/`, `test/`

**Commits** (Conventional Commits) :
```
feat(backend): add user authentication
fix(frontend): resolve button click issue
test(backend): add auth controller tests
```
