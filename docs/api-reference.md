# Reference API - Time Manager

> **Version** : 1.0 | **Base URL** : `/api/v1` | **Date** : 2026-01-11

## Conventions

### Authentification

Toutes les routes protegees requierent un header `Authorization` :

```
Authorization: Bearer <access_token>
```

Le token est obtenu via l'endpoint `/auth/login`.

### Format des Reponses

**Succes** :
```json
{
  "success": true,
  "data": { ... }
}
```

**Succes avec pagination** :
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Erreur** :
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description lisible",
    "details": [ ... ]  // optionnel, pour erreurs de validation
  }
}
```

### Codes d'Erreur

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Token manquant, invalide ou expire |
| `FORBIDDEN` | 403 | Permissions insuffisantes |
| `NOT_FOUND` | 404 | Ressource non trouvee |
| `VALIDATION_ERROR` | 400 | Donnees invalides |
| `EMAIL_EXISTS` | 409 | Email deja enregistre |
| `INVALID_CREDENTIALS` | 401 | Email ou mot de passe incorrect |
| `INTERNAL_ERROR` | 500 | Erreur serveur |

---

## Authentication

### POST /auth/login

Authentifie un utilisateur avec email et mot de passe.

**Auth** : Non requise

**Request Body** :
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Validation** :
| Champ | Type | Requis | Regles |
|-------|------|--------|--------|
| email | string | oui | Format email valide |
| password | string | oui | Non vide |

**Response 200** :
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "employee",
      "weeklyHoursTarget": 35
    },
    "session": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ...",
      "expiresAt": 1736600000
    }
  }
}
```

**Erreurs** :
| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Email ou mot de passe incorrect |
| `VALIDATION_ERROR` | Donnees invalides |

---

### POST /auth/logout

Deconnecte l'utilisateur et invalide toutes ses sessions.

**Auth** : Bearer token requis

**Request Body** : Aucun

**Response 200** :
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

**Erreurs** :
| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Token manquant ou invalide |
| `LOGOUT_FAILED` | Echec de la deconnexion |

---

### POST /auth/forgot-password

Envoie un email de reinitialisation de mot de passe.

**Auth** : Non requise

**Request Body** :
```json
{
  "email": "user@example.com"
}
```

**Response 200** :
```json
{
  "success": true,
  "data": {
    "message": "If an account exists, a reset email has been sent"
  }
}
```

> **Note securite** : Retourne toujours succes pour eviter l'enumeration d'emails.

---

## Users

### GET /users/me

Recupere le profil de l'utilisateur connecte.

**Auth** : Bearer token requis

**Response 200** :
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "employee",
    "weeklyHoursTarget": 35,
    "createdAt": "2026-01-10T10:00:00Z",
    "updatedAt": "2026-01-11T15:30:00Z"
  }
}
```

---

### PATCH /users/me

Met a jour le profil de l'utilisateur connecte.

**Auth** : Bearer token requis

**Request Body** :
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "weeklyHoursTarget": 40
}
```

**Validation** :
| Champ | Type | Requis | Regles |
|-------|------|--------|--------|
| firstName | string | non | 1-100 caracteres |
| lastName | string | non | 1-100 caracteres |
| weeklyHoursTarget | number | non | 0-168 |

> **Note** : Les champs `email` et `role` ne peuvent pas etre modifies via cet endpoint.

**Response 200** :
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "role": "employee",
    "weeklyHoursTarget": 40,
    "createdAt": "2026-01-10T10:00:00Z",
    "updatedAt": "2026-01-11T16:00:00Z"
  }
}
```

---

### GET /users

Liste tous les utilisateurs avec pagination et filtrage.

**Auth** : Bearer token requis
**Role** : `manager` uniquement

**Query Parameters** :
| Param | Type | Defaut | Description |
|-------|------|--------|-------------|
| page | number | 1 | Numero de page |
| limit | number | 20 | Items par page (max 100) |
| role | string | - | Filtrer par role : `employee` ou `manager` |

**Exemple** :
```
GET /users?page=1&limit=10&role=employee
```

**Response 200** :
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "employee",
      "weeklyHoursTarget": 35,
      "createdAt": "2026-01-10T10:00:00Z",
      "updatedAt": "2026-01-11T15:30:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Erreurs** :
| Code | Description |
|------|-------------|
| `FORBIDDEN` | Role insuffisant (non-manager) |

---

### POST /users

Cree un nouvel utilisateur (manager uniquement).

**Auth** : Bearer token requis
**Role** : `manager` uniquement

**Request Body** :
```json
{
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "employee",
  "weeklyHoursTarget": 35
}
```

**Validation** :
| Champ | Type | Requis | Defaut | Regles |
|-------|------|--------|--------|--------|
| email | string | oui | - | Format email valide |
| firstName | string | oui | - | 1-100 caracteres |
| lastName | string | oui | - | 1-100 caracteres |
| role | string | non | `employee` | `employee` ou `manager` |
| weeklyHoursTarget | number | non | 35 | 0-168 |

**Response 201** :
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "employee",
    "weeklyHoursTarget": 35
  }
}
```

> **Note** : Un email de reinitialisation de mot de passe est automatiquement envoye au nouvel utilisateur.

**Erreurs** :
| Code | Description |
|------|-------------|
| `EMAIL_EXISTS` | Un utilisateur avec cet email existe deja |
| `FORBIDDEN` | Role insuffisant |
| `VALIDATION_ERROR` | Donnees invalides |

---

### PATCH /users/:id

Met a jour un utilisateur (manager uniquement).

**Auth** : Bearer token requis
**Role** : `manager` uniquement

**Path Parameters** :
| Param | Type | Description |
|-------|------|-------------|
| id | UUID | ID de l'utilisateur |

**Request Body** :
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "weeklyHoursTarget": 40
}
```

**Validation** :
| Champ | Type | Requis | Regles |
|-------|------|--------|--------|
| firstName | string | non | 1-100 caracteres |
| lastName | string | non | 1-100 caracteres |
| weeklyHoursTarget | number | non | 0-168 |

> **Note** : Au moins un champ doit etre fourni. Les champs `email` et `role` ne peuvent pas etre modifies.

**Response 200** :
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "employee",
    "weeklyHoursTarget": 40
  }
}
```

**Erreurs** :
| Code | Description |
|------|-------------|
| `NOT_FOUND` | Utilisateur non trouve |
| `FORBIDDEN` | Role insuffisant |
| `VALIDATION_ERROR` | Donnees invalides ou aucun champ fourni |

---

## Health

### GET /health

Probe de vivacite - verifie si le serveur repond.

**Auth** : Non requise

**Response 200** :
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-11T16:00:00.000Z"
  }
}
```

---

### GET /ready

Probe de disponibilite - verifie que toutes les dependances sont accessibles.

**Auth** : Non requise

**Response 200** (pret) :
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

**Response 503** (non pret) :
```json
{
  "success": false,
  "data": {
    "status": "not ready",
    "checks": {
      "database": "failed"
    }
  }
}
```

---

## Exemples cURL

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Get Profile
```bash
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <token>"
```

### Update Profile
```bash
curl -X PATCH http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Smith"}'
```

### List Users (Manager)
```bash
curl "http://localhost:3000/api/v1/users?page=1&limit=10&role=employee" \
  -H "Authorization: Bearer <manager_token>"
```

### Create User (Manager)
```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer <manager_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"newuser@example.com",
    "firstName":"Jane",
    "lastName":"Doe",
    "role":"employee"
  }'
```

---

## Changelog

### v1.0 (Epic 2)
- `POST /auth/login` - Authentification
- `POST /auth/logout` - Deconnexion
- `POST /auth/forgot-password` - Reset password
- `GET /users/me` - Profil utilisateur
- `PATCH /users/me` - Mise a jour profil
- `GET /users` - Liste utilisateurs (manager)
- `POST /users` - Creation utilisateur (manager)
- `PATCH /users/:id` - Modification utilisateur (manager)
