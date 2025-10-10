# CI/CD Pipeline - Time Manager

Documentation complète du pipeline d'intégration et de déploiement continu.

## Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Architecture du pipeline](#architecture-du-pipeline)
- [GitHub Actions](#github-actions)
- [Git Hooks avec Husky](#git-hooks-avec-husky)
- [Phases du pipeline](#phases-du-pipeline)
- [Configuration](#configuration)
- [Workflows détaillés](#workflows-détaillés)
- [Bonnes pratiques](#bonnes-pratiques)
- [Troubleshooting](#troubleshooting)

## Vue d'ensemble

Le projet Time Manager implémente une stratégie CI/CD complète avec **trois niveaux de validation** :

1. **Pré-commit** (local) : Validation immédiate avant commit via Husky
2. **Pré-push** (local) : Validation complète avant push via Husky
3. **CI/CD Pipeline** (distant) : Build et déploiement automatisé via GitHub Actions

### Objectifs

- **Qualité du code** : Empêcher le code défectueux d'entrer dans le dépôt
- **Tests automatisés** : Exécution systématique des tests à chaque modification
- **Build automatisé** : Construction et publication des images Docker
- **Feedback rapide** : Détection précoce des erreurs
- **Déploiement fiable** : Images Docker prêtes pour production

### Technologies utilisées

- **Husky** : Git hooks automatisés (pre-commit, pre-push)
- **lint-staged** : Exécution de tâches sur les fichiers modifiés uniquement
- **GitHub Actions** : Pipeline CI/CD dans le cloud
- **Docker Hub** : Registry pour les images Docker
- **npm workspaces** : Gestion des dépendances monorepo

## Architecture du pipeline

### Vue globale

```
┌─────────────────────────────────────────────────────────────────┐
│                     Développeur Local                           │
│                                                                 │
│  1. Modifications du code                                       │
│  2. git add .                                                   │
│  3. git commit -m "..."  ──→  PRE-COMMIT HOOK                  │
│                               - lint-staged                     │
│                               - ESLint (fichiers modifiés)      │
│                               - Tests (fichiers modifiés)       │
│                               ✓ Rapide (quelques secondes)     │
│                                                                 │
│  4. git push            ──→  PRE-PUSH HOOK                     │
│                               - Tests complets backend          │
│                               - Tests complets frontend         │
│                               ✓ Complet (30-60 secondes)       │
└─────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub (Remote)                             │
│                                                                 │
│  Push/Pull Request  ──→  GITHUB ACTIONS                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PHASE 1 : Tests (parallèles)                            │  │
│  │  ├─ test-backend   : Jest + Coverage                     │  │
│  │  ├─ test-frontend  : Vitest                              │  │
│  │  └─ lint-frontend  : ESLint                              │  │
│  │  ✓ 2-3 minutes                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ↓ (Si tous réussissent)               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PHASE 2 : Build (parallèles)                            │  │
│  │  ├─ build-backend  : Docker image production             │  │
│  │  │                   Push vers Docker Hub                │  │
│  │  └─ build-frontend : Docker image production (multi-stage)│ │
│  │                      Push vers Docker Hub                │  │
│  │  ✓ 5-8 minutes (avec cache)                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Résultat : Images Docker prêtes sur Docker Hub                │
│             - username/time-manager-backend:branch-name         │
│             - username/time-manager-backend:branch-sha123       │
│             - username/time-manager-frontend:branch-name        │
│             - username/time-manager-frontend:branch-sha123      │
└─────────────────────────────────────────────────────────────────┘
```

### Flux chronologique

```
Événement            Action                          Durée      Bloquant
─────────────────────────────────────────────────────────────────────────
git commit     →     Pre-commit hook                 5-10s      Oui
                     - lint-staged
                     - ESLint (fichiers modifiés)
                     - Tests rapides

git push       →     Pre-push hook                   30-60s     Oui
                     - Tests complets backend
                     - Tests complets frontend

Push GitHub    →     GitHub Actions : Tests          2-3 min    Non*
                     - test-backend (Jest)
                     - test-frontend (Vitest)
                     - lint-frontend (ESLint)
                     * Peut bloquer la merge de PR

Tests OK       →     GitHub Actions : Build          5-8 min    Non
                     - build-backend (Docker)
                     - build-frontend (Docker)
                     - Push vers Docker Hub

Build OK       →     Images disponibles              -          -
                     Prêtes pour déploiement
```

## GitHub Actions

### Fichier de configuration

Le pipeline est défini dans `.github/workflows/ci-cd.yml`.

### Déclencheurs

```yaml
on:
  push:
    branches: ["**"]      # Tous les push sur toutes les branches
  pull_request:
    branches: ["**"]      # Toutes les pull requests
```

Le pipeline s'exécute sur :
- Chaque push vers n'importe quelle branche
- Chaque création/mise à jour de pull request

### Restriction de repository

```yaml
if: github.repository == 'Projet-decole/Time-Manager'
```

Toutes les jobs vérifient que l'exécution se fait sur le repository principal, pas sur un fork. Cela évite :
- L'échec sur les forks (pas d'accès aux secrets)
- La consommation de minutes GitHub Actions inutiles

### Variables d'environnement globales

```yaml
env:
  REGISTRY: docker.io
  IMAGE_NAME_BACKEND: ${{ secrets.DOCKERHUB_USERNAME }}/time-manager-backend
  IMAGE_NAME_FRONTEND: ${{ secrets.DOCKERHUB_USERNAME }}/time-manager-frontend
```

Ces variables sont accessibles par toutes les jobs du workflow.

## Git Hooks avec Husky

### Installation et configuration

Husky est installé automatiquement lors du `npm install` grâce au script `prepare` :

```json
{
  "scripts": {
    "prepare": "husky || true"
  }
}
```

Le `|| true` empêche l'échec dans les environnements CI où Husky n'est pas nécessaire.

### Structure des hooks

```
.husky/
├── _/                  # Fichiers internes Husky
├── pre-commit          # Hook exécuté avant chaque commit
└── pre-push            # Hook exécuté avant chaque push
```

### Pre-commit Hook

**Fichier** : `.husky/pre-commit`

```bash
echo "Running linters and formatters..."
npx lint-staged
```

**Comportement** :
- S'exécute automatiquement avant chaque `git commit`
- Lance `lint-staged` qui exécute des tâches sur les fichiers stagés uniquement
- Rapide (quelques secondes) car ne traite que les fichiers modifiés
- Bloque le commit si une erreur est détectée

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

**Détails** :
- **Frontend** :
  - ESLint avec auto-fix (`--fix`)
  - Tests Vitest en mode non-watch (`--run`)
- **Backend** :
  - Tests Jest (seulement sur les fichiers modifiés)
  - `--passWithNoTests` : Ne fail pas s'il n'y a pas de tests

### Pre-push Hook

**Fichier** : `.husky/pre-push`

```bash
echo "Running full test suite..."

# Backend tests
echo "Testing backend..."
npm run test --workspace=backend || {
  echo "❌ Backend tests failed!"
  exit 1
}

# Frontend tests
echo "Testing frontend..."
npm run test --workspace=frontend || {
  echo "✅ Frontend tests failed!"
  exit 1
}

echo "✅ All tests passed!"
```

**Comportement** :
- S'exécute automatiquement avant chaque `git push`
- Lance **toute la suite de tests** des deux workspaces
- Plus lent (30-60 secondes) mais complet
- Bloque le push si un test échoue

**Pourquoi deux niveaux ?**
- **Pre-commit** : Feedback rapide, validation minimale
- **Pre-push** : Validation complète avant envoi distant

### Bypass des hooks (usage exceptionnel)

Si nécessaire (déconseillé), vous pouvez bypasser les hooks :

```bash
# Bypass pre-commit
git commit -m "message" --no-verify

# Bypass pre-push
git push --no-verify
```

**Attention** : À utiliser seulement en cas d'urgence. Le code passera quand même par GitHub Actions.

## Phases du pipeline

### Phase 1 : Tests (parallèles)

Trois jobs s'exécutent en parallèle :

#### Job : test-backend

```yaml
test-backend:
  name: Test Backend
  runs-on: ubuntu-latest
  if: github.repository == 'Projet-decole/Time-Manager'
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: "20"
        cache: "npm"
    - run: npm ci
    - run: npm test --workspace=backend
```

**Actions** :
1. Checkout du code
2. Installation de Node.js 20 avec cache npm
3. Installation des dépendances (`npm ci`)
4. Exécution des tests backend (Jest)

**Outputs** :
- Résultats des tests
- Rapport de couverture (coverage)

#### Job : test-frontend

```yaml
test-frontend:
  name: Test Frontend
  runs-on: ubuntu-latest
  if: github.repository == 'Projet-decole/Time-Manager'
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: "20"
        cache: "npm"
    - run: npm ci
    - run: npm test --workspace=frontend
```

**Actions** :
1. Checkout du code
2. Installation de Node.js 20 avec cache npm
3. Installation des dépendances
4. Exécution des tests frontend (Vitest)

#### Job : lint-frontend

```yaml
lint-frontend:
  name: Lint Frontend
  runs-on: ubuntu-latest
  if: github.repository == 'Projet-decole/Time-Manager'
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: "20"
        cache: "npm"
    - run: npm ci
    - run: npm run lint --workspace=frontend
```

**Actions** :
1. Checkout du code
2. Installation de Node.js 20 avec cache npm
3. Installation des dépendances
4. Exécution d'ESLint sur le frontend

**Pourquoi pas de lint backend ?**
Le backend n'a pas encore de configuration ESLint. Peut être ajouté ultérieurement.

### Phase 2 : Build (parallèles après tests)

Deux jobs s'exécutent en parallèle, **seulement si tous les tests passent** :

#### Job : build-backend

```yaml
build-backend:
  name: Build Backend Image
  runs-on: ubuntu-latest
  if: github.repository == 'Projet-decole/Time-Manager'
  needs: [test-backend]      # Attend le succès de test-backend

  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Log in to Docker Hub
      uses: docker/login-action@v3
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.IMAGE_NAME_BACKEND }}
        tags: |
          type=ref,event=branch
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}

    - name: Build and push
      uses: docker/build-push-action@v5
      with:
        context: .
        file: ./backend/Dockerfile.prod
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=registry,ref=${{ env.IMAGE_NAME_BACKEND }}:buildcache
        cache-to: type=registry,ref=${{ env.IMAGE_NAME_BACKEND }}:buildcache,mode=max
```

**Dépendance** : `needs: [test-backend]` - Ne démarre que si les tests backend passent.

**Actions** :
1. **Checkout** : Récupère le code
2. **Docker Buildx** : Configure le builder Docker avancé
3. **Login Docker Hub** : Authentification avec les secrets GitHub
4. **Extract metadata** : Génère automatiquement les tags d'image
5. **Build and push** :
   - Build l'image depuis `backend/Dockerfile.prod`
   - Context racine (`.`) pour monorepo
   - Push vers Docker Hub
   - Utilise le cache pour accélérer

**Tags générés** :

Exemple pour un push sur la branche `feat/ci-cd` avec commit `abc1234` :

```
username/time-manager-backend:feat-ci-cd
username/time-manager-backend:feat-ci-cd-abc1234
```

Pour un push sur `main` :

```
username/time-manager-backend:main
username/time-manager-backend:main-abc1234
username/time-manager-backend:latest
```

**Cache Docker** :

Le cache est stocké sur Docker Hub dans un tag spécial `buildcache` :
- `cache-from` : Utilise le cache existant pour accélérer le build
- `cache-to` : Sauvegarde le cache pour les builds futurs
- Peut réduire le temps de build de 80% (8 min → 1-2 min)

#### Job : build-frontend

```yaml
build-frontend:
  name: Build Frontend Image
  runs-on: ubuntu-latest
  if: github.repository == 'Projet-decole/Time-Manager'
  needs: [test-frontend, lint-frontend]  # Attend les deux jobs

  steps:
    # Identiques à build-backend, mais avec :
    file: ./frontend/Dockerfile.prod
    IMAGE_NAME_FRONTEND
```

**Dépendance** : `needs: [test-frontend, lint-frontend]` - Attend que les deux jobs réussissent.

**Particularités** :
- Dockerfile multi-stage (builder + nginx)
- Image finale très légère (environ 15-25 MB)

## Configuration

### Secrets GitHub

Le pipeline nécessite deux secrets configurés dans le repository GitHub :

**Configuration** : Settings → Secrets and variables → Actions → New repository secret

1. **DOCKERHUB_USERNAME**
   - Nom d'utilisateur Docker Hub
   - Exemple : `johndoe`

2. **DOCKERHUB_TOKEN**
   - Token d'accès Docker Hub (pas le mot de passe)
   - Génération : Docker Hub → Account Settings → Security → New Access Token
   - Permissions recommandées : Read, Write, Delete

**Pourquoi un token et pas le mot de passe ?**
- Plus sécurisé (révocable sans changer le mot de passe)
- Permissions granulaires
- Traçabilité des accès

### Cache npm

Le cache npm est automatiquement géré par l'action `actions/setup-node@v4` :

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: "20"
    cache: "npm"          # Active le cache automatique
```

**Avantages** :
- Accélère l'installation des dépendances (60s → 10s)
- Basé sur le hash de `package-lock.json`
- Invalidé automatiquement si les dépendances changent

### Cache Docker

Le cache Docker est configuré dans les jobs de build :

```yaml
cache-from: type=registry,ref=${{ env.IMAGE_NAME_BACKEND }}:buildcache
cache-to: type=registry,ref=${{ env.IMAGE_NAME_BACKEND }}:buildcache,mode=max
```

**Fonctionnement** :
- Chaque layer Docker est mis en cache
- Stocké directement sur Docker Hub
- Réutilisé automatiquement lors des builds suivants
- `mode=max` : Cache tous les layers, pas seulement le résultat final

**Exemple d'accélération** :

Sans cache :
```
[+] Building 480.5s (12/12) FINISHED
 => [1/6] FROM docker.io/library/node:20-alpine      45.2s
 => [2/6] WORKDIR /app                                0.3s
 => [3/6] COPY package*.json ./                       0.4s
 => [4/6] RUN npm ci --omit=dev                     340.8s
 => [5/6] COPY backend/ ./backend/                   15.2s
 => [6/6] WORKDIR /app/backend                        0.1s
```

Avec cache :
```
[+] Building 45.2s (12/12) FINISHED
 => [1/6] FROM docker.io/library/node:20-alpine      0.0s (cached)
 => [2/6] WORKDIR /app                                0.0s (cached)
 => [3/6] COPY package*.json ./                       0.1s
 => [4/6] RUN npm ci --omit=dev                       0.0s (cached)
 => [5/6] COPY backend/ ./backend/                   38.5s
 => [6/6] WORKDIR /app/backend                        0.1s
```

## Workflows détaillés

### Workflow : Développement quotidien

```bash
# 1. Créer une branche pour votre fonctionnalité
git checkout -b feat/nouvelle-fonctionnalite

# 2. Développer et tester localement
npm test --workspace=backend
npm test --workspace=frontend
npm run lint --workspace=frontend

# 3. Commit (déclenche pre-commit hook)
git add .
git commit -m "feat: ajout de la nouvelle fonctionnalité"
# → ESLint s'exécute sur les fichiers modifiés
# → Tests rapides sur les fichiers modifiés
# → Si OK, commit créé ; sinon, bloqué

# 4. Push (déclenche pre-push hook + GitHub Actions)
git push origin feat/nouvelle-fonctionnalite
# → Tests complets backend et frontend
# → Si OK, push réussi ; sinon, bloqué
# → GitHub Actions démarre automatiquement

# 5. Vérifier le pipeline sur GitHub
# → Aller sur l'onglet "Actions" du repository
# → Voir le statut en temps réel
```

### Workflow : Pull Request

```bash
# 1. Créer la PR sur GitHub
# → Le pipeline se déclenche automatiquement
# → Status visible directement dans la PR

# 2. Le pipeline exécute :
#    - Tests backend, frontend, lint
#    - Build des images Docker
#    - Push vers Docker Hub avec tag du nom de la branche

# 3. Review de la PR
# → Si le pipeline est vert, review du code
# → Si rouge, corriger les erreurs

# 4. Merge de la PR
# → Généralement, merge seulement si pipeline vert
# → Après merge, nouveau build sur la branche cible (main)
```

### Workflow : Correction d'un échec de pipeline

**Scénario** : Un test échoue dans GitHub Actions

```bash
# 1. Identifier l'erreur
# → Aller sur Actions → Cliquer sur le workflow en échec
# → Lire les logs de la job qui a échoué

# Exemple : test-backend a échoué
# Logs montrent : "Error: Expected 200 but got 404"

# 2. Reproduire localement
npm test --workspace=backend
# → Devrait afficher la même erreur

# 3. Corriger le bug
# Modifier le code

# 4. Vérifier localement
npm test --workspace=backend
# → Tests passent maintenant

# 5. Commit et push
git add .
git commit -m "fix: correction du bug de routing"
git push
# → Nouveau pipeline démarre
# → Devrait passer cette fois
```

### Workflow : Déploiement en production

```bash
# 1. Merger les PR dans la branche main
# → Le pipeline build et push les images avec tag "latest"

# 2. Sur le serveur de production, pull les images
docker pull username/time-manager-backend:latest
docker pull username/time-manager-frontend:latest

# 3. Redémarrer les services
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# 4. Vérifier le déploiement
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

### Workflow : Rollback (retour en arrière)

**Scénario** : Une nouvelle version cause un bug en production

```bash
# 1. Identifier la version stable précédente
# → Sur Docker Hub, voir les tags disponibles
# → Exemple : main-abc1234 (version précédente stable)

# 2. Pull la version stable
docker pull username/time-manager-backend:main-abc1234
docker pull username/time-manager-frontend:main-abc1234

# 3. Tag comme "latest" localement
docker tag username/time-manager-backend:main-abc1234 username/time-manager-backend:latest
docker tag username/time-manager-frontend:main-abc1234 username/time-manager-frontend:latest

# 4. Redémarrer avec la version stable
docker-compose -f docker-compose.prod.yml up -d

# Alternative : Modifier docker-compose.prod.yml pour pointer vers le tag spécifique
# image: username/time-manager-backend:main-abc1234
```

## Bonnes pratiques

### Commits et branches

**Convention de nommage des branches** :
```
feat/description       # Nouvelle fonctionnalité
fix/description        # Correction de bug
refactor/description   # Refactoring
docs/description       # Documentation
test/description       # Ajout/modification de tests
chore/description      # Maintenance (dépendances, config)
```

**Convention de messages de commit** (Conventional Commits) :
```
type(scope): description

Exemples :
feat(backend): add user authentication endpoint
fix(frontend): resolve button click issue on mobile
test(backend): add unit tests for auth controller
docs(ci-cd): update pipeline documentation
```

**Avantages** :
- Historique Git clair et lisible
- Génération automatique de changelogs
- Facilite les revues de code

### Tests

**Écrire des tests significatifs** :
- Tests unitaires pour la logique métier
- Tests d'intégration pour les API
- Tests de composants pour le frontend

**Maintenir une bonne couverture** :
- Backend : Viser >80% de couverture
- Frontend : Viser >70% de couverture
- Le rapport de couverture est généré automatiquement par Jest

**Ne pas commit de tests désactivés** :
```javascript
// ❌ Mauvais
test.skip('should work', () => { ... });
xit('should work', () => { ... });

// ✅ Bon
test('should work', () => { ... });
```

### CI/CD

**Ne jamais push sur main directement** :
- Toujours passer par une branche et une PR
- Permet la review du code et l'exécution du pipeline

**Vérifier le statut du pipeline avant merge** :
- Attendre que le pipeline soit vert
- Vérifier les logs si des warnings apparaissent

**Ne pas bypass les hooks sans raison** :
- `--no-verify` doit être exceptionnel
- Si vous devez bypass, documentez pourquoi dans le commit message

**Surveiller les temps d'exécution** :
- Si le pipeline devient trop lent (>15 min), optimiser :
  - Paralléliser davantage
  - Optimiser les tests
  - Améliorer le cache

### Images Docker

**Utiliser les tags spécifiques en production** :
```yaml
# ❌ Éviter en production (peut changer sans préavis)
image: username/time-manager-backend:latest

# ✅ Préférer en production (immuable)
image: username/time-manager-backend:main-abc1234
```

**Nettoyer les anciennes images** :
- Sur Docker Hub, supprimer les tags obsolètes régulièrement
- Garder les tags de production et les versions récentes

## Troubleshooting

### Pipeline échoue sur le repository principal mais pas en local

**Symptôme** :
- Tests passent en local : `npm test` ✅
- Tests échouent dans GitHub Actions ❌

**Causes possibles** :

1. **Variables d'environnement manquantes**
```yaml
# Solution : Ajouter les variables dans le workflow
env:
  NODE_ENV: test
```

2. **Dépendances manquantes dans package.json**
```bash
# En local, dépendance installée globalement
# Solution : Ajouter dans devDependencies
npm install --save-dev missing-package
```

3. **Différence de versions Node.js**
```bash
# Vérifier la version locale
node --version

# Comparer avec le workflow (.github/workflows/ci-cd.yml)
# Aligner si nécessaire
```

4. **Tests dépendants de l'ordre d'exécution**
```javascript
// ❌ Mauvais : tests interdépendants
let user;
test('create user', () => { user = ... });
test('get user', () => { expect(user)... });

// ✅ Bon : tests isolés
test('get user', () => {
  const user = createTestUser();
  expect(user)...
});
```

### Build Docker échoue dans GitHub Actions

**Symptôme** :
```
Error: failed to solve: failed to compute cache key: failed to calculate checksum
```

**Causes et solutions** :

1. **Contexte de build incorrect**
```yaml
# ❌ Mauvais
context: ./backend

# ✅ Bon (monorepo)
context: .
file: ./backend/Dockerfile.prod
```

2. **Fichier manquant dans le contexte**
```dockerfile
# Dockerfile essaie de copier un fichier qui n'existe pas
COPY missing-file.txt ./

# Solution : Vérifier que le fichier existe à la racine du contexte
```

3. **Cache corrompu**
```yaml
# Solution temporaire : Désactiver le cache
# Dans .github/workflows/ci-cd.yml, commenter :
# cache-from: ...
# cache-to: ...
```

### Push vers Docker Hub échoue

**Symptôme** :
```
Error: failed to push: unauthorized: authentication required
```

**Solutions** :

1. **Vérifier les secrets GitHub**
```bash
# Sur GitHub : Settings → Secrets → Actions
# Vérifier que DOCKERHUB_USERNAME et DOCKERHUB_TOKEN existent
```

2. **Token Docker Hub expiré ou invalide**
```bash
# Regénérer un token sur Docker Hub
# Mettre à jour DOCKERHUB_TOKEN dans GitHub
```

3. **Nom d'image incorrect**
```yaml
# Vérifier que le format est correct
IMAGE_NAME_BACKEND: ${{ secrets.DOCKERHUB_USERNAME }}/time-manager-backend
# Pas d'espace, pas de caractères spéciaux
```

### Pre-commit hook ne se déclenche pas

**Symptôme** :
- `git commit` réussit immédiatement sans lancer ESLint/tests

**Solutions** :

1. **Husky pas installé**
```bash
# Réinstaller les dépendances
npm install

# Vérifier que .husky/ existe
ls -la .husky/
```

2. **Hook pas exécutable**
```bash
# Rendre le hook exécutable
chmod +x .husky/pre-commit
```

3. **Husky désactivé**
```bash
# Vérifier que HUSKY=0 n'est pas défini
echo $HUSKY

# Si défini, le désactiver
unset HUSKY
```

### Tests passent en pre-commit mais échouent en pre-push

**Symptôme** :
- Pre-commit ✅ (tests sur fichiers modifiés)
- Pre-push ❌ (tests complets)

**Cause** :
Un test dans un autre fichier non modifié échoue.

**Solution** :
```bash
# Lancer tous les tests localement
npm test --workspace=backend
npm test --workspace=frontend

# Identifier et corriger le test qui échoue
```

### Pipeline très lent (>15 minutes)

**Optimisations possibles** :

1. **Vérifier que le cache fonctionne**
```yaml
# Dans les logs GitHub Actions, chercher :
# "CACHED" à côté des steps
# Si absent, le cache ne fonctionne pas
```

2. **Paralléliser davantage**
```yaml
# Séparer les tests en plusieurs jobs
test-backend-unit:
  run: npm test --workspace=backend -- unit

test-backend-integration:
  run: npm test --workspace=backend -- integration
```

3. **Optimiser les tests**
```javascript
// Utiliser des timeouts plus courts
jest.setTimeout(5000); // 5s au lieu de 30s par défaut

// Éviter les attentes inutiles
// ❌ Mauvais
await sleep(5000);

// ✅ Bon
await waitFor(() => expect(element).toBeInTheDocument());
```

4. **Réduire la taille des images Docker**
```dockerfile
# Utiliser .dockerignore pour exclure les fichiers inutiles
node_modules
.git
*.md
tests/
```

### Échec de lint-staged

**Symptôme** :
```
⚠ Skipped because of errors from tasks.
```

**Cause** :
ESLint trouve des erreurs dans les fichiers modifiés.

**Solution** :
```bash
# Voir les erreurs détaillées
npm run lint --workspace=frontend

# Corriger automatiquement si possible
npm run lint --workspace=frontend -- --fix

# Corriger manuellement les erreurs restantes
```

---

## Résumé des commandes utiles

### Localement

```bash
# Lancer les tests
npm test                                    # Tous les workspaces
npm test --workspace=backend                # Backend uniquement
npm test --workspace=frontend               # Frontend uniquement

# Lancer le linter
npm run lint --workspace=frontend           # Lint frontend
npm run lint --workspace=frontend -- --fix  # Lint + auto-fix

# Forcer un commit/push sans hooks (exceptionnel)
git commit --no-verify
git push --no-verify

# Réinstaller Husky
rm -rf .husky/_
npm install
```

### GitHub Actions

```bash
# Voir les workflows
https://github.com/Projet-decole/Time-Manager/actions

# Re-run un workflow échoué
# → Cliquer sur le workflow → Re-run failed jobs

# Annuler un workflow en cours
# → Cliquer sur le workflow → Cancel workflow
```

### Docker Hub

```bash
# Voir les images publiées
https://hub.docker.com/r/<username>/time-manager-backend/tags
https://hub.docker.com/r/<username>/time-manager-frontend/tags

# Pull une image spécifique
docker pull <username>/time-manager-backend:main-abc1234

# Supprimer un tag (via interface web)
https://hub.docker.com/r/<username>/time-manager-backend/tags
→ Sélectionner le tag → Delete
```

---

**Pipeline robuste, qualité garantie !**
