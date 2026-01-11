# Guide de Test - Time Manager

## Table des matières

- [Strategie de tests](#strategie-de-tests)
- [Commandes de test](#commandes-de-test)
- [Tests E2E (Playwright)](#tests-e2e-playwright)
- [Tests manuels API](#tests-manuels-api)
- [Utilisateurs de test](#utilisateurs-de-test)
- [Seed de la base de données](#seed-de-la-base-de-données)

---

## Strategie de tests

### Philosophie

Les tests sont organises en **3 niveaux** correspondant au workflow de developpement :

| Niveau | Quand | Quoi | Automatisation |
|--------|-------|------|----------------|
| **Story** | Pendant le dev d'une story | Tests unitaires cibles | Pre-commit (lint) |
| **Epic** | Avant push (fin d'epic) | Suite complete + E2E | Pre-push + manuel |
| **CI** | Apres push sur GitHub | Validation formelle | GitHub Actions |

### Niveau 1 : Developpement Story

**Objectif :** Feedback rapide, ne pas bloquer le developpeur.

- Pre-commit : Lint uniquement (pas de tests)
- Tests manuels selon besoin : `npm run test:unit`
- Focus sur les nouvelles fonctionnalites

### Niveau 2 : Fin d'Epic (avant push)

**Objectif :** Validation complete avant de partager le code.

```bash
# Commande unique pour tout valider
npm run test:epic
```

Cette commande execute sequentiellement :
1. Tests unitaires backend + frontend
2. Tests d'integration API
3. Tests E2E (parcours critiques)
4. Validation build Docker

### Niveau 3 : GitHub CI

**Objectif :** Formalite pour autoriser le merge sur main.

- Identique au niveau 2
- Build et push des images Docker
- Declenchement du deploiement Render

---

## Commandes de test

### Depuis la racine du projet

```bash
# Tests unitaires rapides (un seul workspace)
npm run test:unit --workspace=backend
npm run test:unit --workspace=frontend

# Tests unitaires complets
npm run test:unit

# Tests d'integration API
npm run test:integration

# Tests E2E (Playwright)
npm run test:e2e

# Suite complete fin d'epic
npm run test:epic

# Avec couverture
npm run test:coverage
```

### Via Docker

```bash
docker-compose -f docker-compose.dev.yml exec -T backend-dev npm test
docker-compose -f docker-compose.dev.yml exec -T frontend-dev npm test
```

### Couvertures cibles

| Scope | Cible |
|-------|-------|
| Backend | >80% |
| Frontend | >60% |

---

## Tests E2E (Playwright)

### Installation

```bash
# Depuis la racine
npm run test:e2e:install
```

### Parcours critiques testes

| Parcours | Fichier | Description |
|----------|---------|-------------|
| Login | `e2e/auth.spec.ts` | Connexion/deconnexion |
| Pointage | `e2e/timesheet.spec.ts` | Pointer une journee |
| Dashboard | `e2e/dashboard.spec.ts` | Affichage tableau de bord |

### Execution

```bash
# Tous les tests E2E
npm run test:e2e

# Mode interactif (debug)
npm run test:e2e:ui

# Un fichier specifique
npx playwright test e2e/auth.spec.ts
```

### Configuration

Fichier : `playwright.config.ts`

```typescript
// Les tests E2E necessitent que l'application soit demarree
// Utilisez docker-compose.dev.yml ou demarrez manuellement
```

---

## Tests manuels API

### Prérequis

1. Backend en cours d'exécution (Docker ou local)
2. Utilisateurs de test créés (voir [Seed](#seed-de-la-base-de-données))

### Authentification

#### Login réussi

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "employee@test.com", "password": "password123"}'
```

**Réponse attendue (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "employee@test.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "role": "employee",
      "weeklyHoursTarget": 35
    },
    "session": {
      "accessToken": "eyJhbG...",
      "refreshToken": "token...",
      "expiresAt": 1768067048
    }
  }
}
```

#### Login avec identifiants invalides

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "employee@test.com", "password": "wrongpassword"}'
```

**Réponse attendue (401):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid credentials",
    "details": null
  }
}
```

#### Login avec email manquant

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password": "password123"}'
```

**Réponse attendue (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid input: expected string, received undefined"
      }
    ]
  }
}
```

#### Login avec password manquant

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "employee@test.com"}'
```

**Réponse attendue (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "password",
        "message": "Invalid input: expected string, received undefined"
      }
    ]
  }
}
```

### Health Check

```bash
# Liveness probe
curl http://localhost:3000/health

# Readiness probe (vérifie la connexion DB)
curl http://localhost:3000/ready
```

---

## Utilisateurs de test

| Email | Password | Rôle | Prénom | Nom |
|-------|----------|------|--------|-----|
| `employee@test.com` | `password123` | employee | Jean | Dupont |
| `manager@test.com` | `password123` | manager | Marie | Martin |

---

## Seed de la base de données

### Prérequis

Le fichier `backend/.env` doit contenir :

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

> **Important:** La `SERVICE_ROLE_KEY` est nécessaire pour créer des utilisateurs via l'API Admin.

### Exécuter le seed

```bash
cd backend
node scripts/seed-test-user.js
```

**Sortie attendue:**
```
🌱 Seeding test users...

✅ Created auth user: employee@test.com (ID: xxx)
✅ Created profile: Jean Dupont (employee)
✅ Created auth user: manager@test.com (ID: xxx)
✅ Created profile: Marie Martin (manager)

🎉 Seed complete!

Test credentials:
─────────────────────────────────────
  Email:    employee@test.com
  Password: password123
  Role:     employee
─────────────────────────────────────
  Email:    manager@test.com
  Password: password123
  Role:     manager
─────────────────────────────────────
```

### Seed via Docker

```bash
docker-compose -f docker-compose.dev.yml exec -T backend-dev node scripts/seed-test-user.js
```

---

## Postman / Insomnia

### Import de collection

Une collection Postman peut être créée avec ces endpoints :

**Environment variables:**
- `base_url`: `http://localhost:3000`
- `access_token`: (à remplir après login)

**Endpoints:**
1. `POST {{base_url}}/api/v1/auth/login`
2. `GET {{base_url}}/health`
3. `GET {{base_url}}/ready`

### Authentification automatique

Après un login réussi, extraire le token pour les requêtes authentifiées :

```javascript
// Post-request script (Postman)
if (pm.response.code === 200) {
  const response = pm.response.json();
  pm.environment.set("access_token", response.data.session.accessToken);
}
```

Puis utiliser dans les headers :
```
Authorization: Bearer {{access_token}}
```

---

## CI/CD

### GitHub Actions Secrets requis

| Secret | Description | Requis pour |
|--------|-------------|-------------|
| `SUPABASE_URL` | URL du projet Supabase | Runtime |
| `SUPABASE_ANON_KEY` | Clé publique (anon) | Runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service (admin) | Seed uniquement |
| `DOCKERHUB_USERNAME` | Username Docker Hub | Push images |
| `DOCKERHUB_TOKEN` | Token Docker Hub | Push images |

### Variables d'environnement dans les workflows

```yaml
# .github/workflows/ci.yml
env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

---

## Regles critiques - Patterns interdits

> **IMPORTANT:** Ces patterns ont cause des crashs systeme. Ne JAMAIS les utiliser.

### 1. Promesses infinies

```javascript
// INTERDIT - Bloque le processus indefiniment
mockService.getAll.mockImplementation(() => new Promise(() => {}));

// CORRECT - Promesse controlee
let resolve;
const promise = new Promise((r) => { resolve = r; });
mockService.getAll.mockReturnValue(promise);
// ... assertions ...
resolve({ success: true, data: [] }); // Cleanup obligatoire
```

### 2. Fake timers avec shouldAdvanceTime

```javascript
// INTERDIT - Cascade infinie avec setTimeout des composants
vi.useFakeTimers({ shouldAdvanceTime: true });

// CORRECT - Utiliser les vrais timers pour les composants React
// Ne pas utiliser vi.useFakeTimers() du tout
```

### 3. Fake timers + userEvent

```javascript
// INTERDIT
vi.useFakeTimers();
const user = userEvent.setup(); // Bloque

// CORRECT
const user = userEvent.setup(); // Sans fake timers
```

### Configuration obligatoire (vite.config.js)

```javascript
test: {
  testTimeout: 10000,
  hookTimeout: 10000,
  teardownTimeout: 5000,
}
```

Voir aussi: `docs/project-context.md` pour plus de details.

---

**Derniere mise a jour:** 2026-01-11
