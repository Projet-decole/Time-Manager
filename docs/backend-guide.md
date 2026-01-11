# Guide Backend - Time Manager

> **Version** : 1.0 | **Date** : 2026-01-11 | **Stack** : Node.js 20 + Express 5 + Supabase

## Structure du Backend

```
backend/
├── server.js                   # Point d'entree HTTP
├── app.js                      # Configuration Express
├── package.json                # Dependances
│
├── routes/                     # Definition des endpoints
│   ├── index.js               # Routeur principal
│   ├── auth.routes.js         # /api/v1/auth/*
│   ├── users.routes.js        # /api/v1/users/*
│   └── health.routes.js       # /health, /ready
│
├── controllers/                # Logique requete/reponse
│   ├── auth.controller.js
│   ├── users.controller.js
│   └── health.controller.js
│
├── services/                   # Business logic
│   ├── auth.service.js
│   ├── users.service.js
│   └── health.service.js
│
├── middleware/                 # Middleware Express
│   ├── auth.middleware.js     # JWT validation
│   ├── rbac.middleware.js     # Role-based access
│   ├── validate.middleware.js # Placeholder (legacy)
│   └── error.middleware.js    # Error handler global
│
├── validators/                 # Schemas Zod
│   ├── auth.validator.js
│   └── users.validator.js
│
├── utils/                      # Utilitaires
│   ├── supabase.js            # Clients Supabase
│   ├── response.js            # Response helpers
│   ├── pagination.js          # Pagination helpers
│   ├── transformers.js        # snake_case <-> camelCase
│   ├── validation.js          # Middleware Zod
│   ├── asyncHandler.js        # Async error wrapper
│   └── AppError.js            # Custom error class
│
└── tests/                      # Tests Jest
    ├── routes/                # Tests integration
    └── services/              # Tests unitaires
```

## Architecture en Couches

```
HTTP Request
     ↓
┌─────────────────────────────────────┐
│           Middleware Chain           │
│  ┌─────────┐ ┌──────┐ ┌──────────┐ │
│  │  auth   │→│ rbac │→│ validate │ │
│  └─────────┘ └──────┘ └──────────┘ │
└─────────────────────────────────────┘
     ↓
┌─────────────────────────────────────┐
│            Controller                │
│  - Extract data from req            │
│  - Call service                      │
│  - Format response                   │
└─────────────────────────────────────┘
     ↓
┌─────────────────────────────────────┐
│             Service                  │
│  - Business logic                    │
│  - Database operations               │
│  - Data transformation               │
└─────────────────────────────────────┘
     ↓
┌─────────────────────────────────────┐
│         Supabase Client              │
│  - supabase (anon key)              │
│  - supabaseAdmin (service role)     │
└─────────────────────────────────────┘
```

---

## Configuration Express

### server.js

Point d'entree HTTP.

```javascript
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### app.js

Configuration Express avec middleware.

```javascript
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const healthRoutes = require('./routes/health.routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// Middleware globaux
app.use(cors());
app.use(express.json());

// Routes health (avant /api pour probes)
app.use(healthRoutes);

// API routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Time Manager API' });
});

// Error handler (DOIT etre dernier)
app.use(errorHandler);

module.exports = app;
```

---

## Routes

### Structure Standard

```javascript
// routes/users.routes.js
const express = require('express');
const usersController = require('../controllers/users.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth.middleware');
const { rbac } = require('../middleware/rbac.middleware');
const { updateProfileSchema, validate } = require('../validators/users.validator');

const router = express.Router();

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/me', authenticate, asyncHandler(usersController.getMe));

/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update current user's profile
 * @access  Private
 */
router.patch('/me',
  authenticate,
  validate(updateProfileSchema),
  asyncHandler(usersController.updateMe)
);

/**
 * @route   GET /api/v1/users
 * @desc    List all users (manager only)
 * @access  Private + Manager role
 */
router.get('/',
  authenticate,
  rbac('manager'),
  asyncHandler(usersController.getAll)
);

module.exports = router;
```

### asyncHandler

Wrapper pour gerer les erreurs async automatiquement.

```javascript
// utils/asyncHandler.js
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
```

---

## Controllers

### Structure Standard

```javascript
// controllers/users.controller.js
const usersService = require('../services/users.service');
const { successResponse, paginatedResponse } = require('../utils/response');

/**
 * Get current user's profile
 * @route GET /api/v1/users/me
 */
const getMe = async (req, res) => {
  const userId = req.user.id;  // From auth middleware

  const profile = await usersService.getProfile(userId);

  return successResponse(res, profile);
};

/**
 * Get all users (manager only)
 * @route GET /api/v1/users
 */
const getAll = async (req, res) => {
  const { page, limit, role } = req.query;
  const filters = role ? { role } : {};
  const pagination = { page, limit };

  const result = await usersService.getAllUsers(filters, pagination);

  return paginatedResponse(res, result.data, result.pagination);
};

module.exports = { getMe, getAll };
```

### Response Helpers

```javascript
// utils/response.js

// Reponse simple
const successResponse = (res, data, meta = null) => {
  const response = { success: true, data };
  if (meta) response.meta = meta;
  return res.json(response);
};

// Reponse paginee
const paginatedResponse = (res, data, pagination) => {
  return res.json({
    success: true,
    data,
    meta: { pagination }
  });
};

// Reponse erreur (utilise par error middleware)
const errorResponse = (res, error) => {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message,
      details: error.details || null
    }
  });
};

module.exports = { successResponse, paginatedResponse, errorResponse };
```

---

## Services

### Structure Standard

```javascript
// services/users.service.js
const { supabase, supabaseAdmin } = require('../utils/supabase');
const AppError = require('../utils/AppError');
const { snakeToCamel, camelToSnake } = require('../utils/transformers');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/pagination');

/**
 * Get user profile by ID
 */
const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role, weekly_hours_target, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new AppError('Profile not found', 404, 'NOT_FOUND');
  }

  return snakeToCamel(data);  // Transform to camelCase
};

/**
 * Get all users with pagination
 */
const getAllUsers = async (filters = {}, pagination = {}) => {
  const { page, limit, offset } = parsePaginationParams(pagination);

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters.role) {
    query = query.eq('role', filters.role);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new AppError('Failed to retrieve users', 500, 'DATABASE_ERROR');
  }

  return {
    data: (data || []).map(snakeToCamel),
    pagination: buildPaginationMeta(page, limit, count || 0)
  };
};

module.exports = { getProfile, getAllUsers };
```

### AppError

Classe d'erreur custom pour erreurs operationnelles.

```javascript
// utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

---

## Middleware

### Authentication

```javascript
// middleware/auth.middleware.js
const { supabase } = require('../utils/supabase');
const AppError = require('../utils/AppError');
const { snakeToCamel } = require('../utils/transformers');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      throw new AppError('Authorization header required', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.slice(7);

    // Validate with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new AppError('Invalid or expired token', 401, 'UNAUTHORIZED');
    }

    // Fetch profile for role
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, role, weekly_hours_target')
      .eq('id', user.id)
      .single();

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      ...snakeToCamel(profile || {})
    };

    req.accessToken = token;  // For logout endpoint

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate };
```

### RBAC (Role-Based Access Control)

```javascript
// middleware/rbac.middleware.js
const AppError = require('../utils/AppError');

const ROLE_HIERARCHY = {
  employee: ['employee'],
  manager: ['manager', 'employee']  // Manager herite employee
};

const rbac = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    const userRole = req.user.role;
    const effectiveRoles = ROLE_HIERARCHY[userRole] || [userRole];

    const hasPermission = allowedRoles.some(role => effectiveRoles.includes(role));

    if (!hasPermission) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
    }

    next();
  };
};

module.exports = { rbac, ROLE_HIERARCHY };
```

### Error Handler

```javascript
// middleware/error.middleware.js
const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  // Log error
  console.error('[ERROR]', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: err.message,
    code: err.code
  });

  // AppError (operational)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }

  // JSON parse error
  if (err instanceof SyntaxError && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid JSON in request body',
        details: null
      }
    });
  }

  // Unknown error - hide details in production
  const message = process.env.NODE_ENV === 'development'
    ? err.message
    : 'Internal server error';

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
      details: null
    }
  });
};

module.exports = errorHandler;
```

---

## Validation avec Zod

### Schema Definition

```javascript
// validators/users.validator.js
const { z } = require('zod');
const { validate } = require('../utils/validation');

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  weeklyHoursTarget: z.number().min(0).max(168).optional()
});

const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(['employee', 'manager']).default('employee'),
  weeklyHoursTarget: z.number().min(0).max(168).default(35)
});

module.exports = {
  updateProfileSchema,
  createUserSchema,
  validate
};
```

### Validation Middleware

```javascript
// utils/validation.js
const validate = (schema) => {
  return (req, res, next) => {
    const body = req.body || {};
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = result.error.issues.map(err => ({
        field: err.path.join('.') || 'body',
        message: err.message
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors
        }
      });
    }

    req.validatedBody = result.data;
    next();
  };
};

module.exports = { validate };
```

---

## Supabase

### Configuration

```javascript
// utils/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client standard (respects RLS)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase, supabaseAdmin };
```

### Quand utiliser quel client

| Client | Use Case |
|--------|----------|
| `supabase` | Operations utilisateur (profile, time entries) |
| `supabaseAdmin` | Operations admin (create user, logout, bypass RLS) |

---

## Pagination

```javascript
// utils/pagination.js
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const parsePaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit) || DEFAULT_LIMIT));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

const buildPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

module.exports = { parsePaginationParams, buildPaginationMeta };
```

---

## Transformers

```javascript
// utils/transformers.js

// snake_case → camelCase
const snakeToCamel = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
    acc[camelKey] = snakeToCamel(obj[key]);
    return acc;
  }, {});
};

// camelCase → snake_case
const camelToSnake = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);

  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase();
    acc[snakeKey] = camelToSnake(obj[key]);
    return acc;
  }, {});
};

module.exports = { snakeToCamel, camelToSnake };
```

---

## Tests

### Configuration Jest

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ]
};
```

### Test Integration

```javascript
// tests/routes/users.routes.test.js
const request = require('supertest');
const app = require('../../app');

describe('GET /api/v1/users/me', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/v1/users/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return profile with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('email');
  });
});
```

### Test Service

```javascript
// tests/services/users.service.test.js
const usersService = require('../../services/users.service');

// Mock Supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { id: '123', email: 'test@example.com', first_name: 'John' },
      error: null
    })
  }
}));

describe('usersService.getProfile', () => {
  it('should return profile in camelCase', async () => {
    const profile = await usersService.getProfile('123');

    expect(profile.firstName).toBe('John');
    expect(profile.first_name).toBeUndefined();
  });
});
```

---

## Variables d'Environnement

```bash
# .env
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Frontend (for password reset redirect)
FRONTEND_URL=http://localhost:5173
```

---

## Conventions

### Nommage

- **Fichiers** : kebab-case (`users.controller.js`)
- **Classes** : PascalCase (`AppError`)
- **Fonctions** : camelCase (`getProfile`)
- **Constantes** : SCREAMING_SNAKE_CASE (`MAX_LIMIT`)

### Structure Fichier

```javascript
// 1. Imports externes
const express = require('express');

// 2. Imports internes
const usersService = require('../services/users.service');

// 3. Constantes
const MAX_LIMIT = 100;

// 4. Fonctions
const getProfile = async (userId) => { /* ... */ };

// 5. Exports
module.exports = { getProfile };
```
