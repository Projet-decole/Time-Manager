# Guide de Test - Time Manager

## Table des matières

- [Tests automatisés](#tests-automatisés)
- [Tests manuels API](#tests-manuels-api)
- [Utilisateurs de test](#utilisateurs-de-test)
- [Seed de la base de données](#seed-de-la-base-de-données)

---

## Tests automatisés

### Backend (Jest)

```bash
# Depuis la racine du projet
cd backend
npm test

# Avec couverture de code
npm test -- --coverage

# Via Docker
docker-compose -f docker-compose.dev.yml exec -T backend-dev npm test
```

**Couverture cible:** >80%

### Frontend (Vitest)

```bash
cd frontend
npm test

# Via Docker
docker-compose -f docker-compose.dev.yml exec -T frontend-dev npm test
```

**Couverture cible:** >60%

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

**Dernière mise à jour:** 2026-01-10
