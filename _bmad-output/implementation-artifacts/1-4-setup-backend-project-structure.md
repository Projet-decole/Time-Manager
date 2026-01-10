# Story 1.4: Setup Backend Project Structure

Status: ready-for-dev

## Story

As a **developer**,
I want the Express backend structured with layered architecture,
So that code organization follows best practices.

## Acceptance Criteria

1. **Given** the existing backend codebase
   **When** the structure is reorganized
   **Then** the following directory structure exists:
   ```
   backend/
   ├── server.js              # HTTP server entry point
   ├── app.js                 # Express app configuration
   ├── routes/
   │   └── index.js           # Route aggregator
   ├── controllers/           # Request handlers
   ├── services/              # Business logic
   ├── middleware/            # Auth, RBAC, error handling
   ├── utils/                 # Helpers (supabase, AppError, etc.)
   ├── validators/            # Zod validation schemas
   └── tests/
       ├── routes/            # Route integration tests
       ├── services/          # Service unit tests
       └── setup.js           # Test configuration
   ```

2. **Given** the directory structure exists
   **When** looking at the routes directory
   **Then** `routes/index.js` exists as the route aggregator
   **And** it exports a function that mounts all routes

3. **Given** the directory structure exists
   **When** looking at the middleware directory
   **Then** placeholder files exist for:
   - `auth.middleware.js`
   - `rbac.middleware.js`
   - `validate.middleware.js`
   - `error.middleware.js`

4. **Given** the directory structure exists
   **When** `app.js` is examined
   **Then** it configures Express with:
   - JSON body parser
   - CORS middleware
   - Route mounting via `routes/index.js`
   - Error handling middleware (last)

5. **Given** the directory structure exists
   **When** `server.js` is examined
   **Then** it:
   - Imports the app from `app.js`
   - Starts the HTTP server on configured port
   - Logs startup message

6. **Given** the structure is complete
   **Then** CommonJS module syntax is used throughout (`require`/`module.exports`)
   **And** NO ES modules (`import`/`export`)

7. **Given** the structure is complete
   **Then** a sample route/controller/service chain demonstrates the pattern:
   - `routes/health.routes.js` → `controllers/health.controller.js` → returns health status

## Tasks / Subtasks

- [ ] Task 1: Create directory structure
  - [ ] 1.1: Create `backend/routes/` directory
  - [ ] 1.2: Create `backend/controllers/` directory
  - [ ] 1.3: Create `backend/services/` directory
  - [ ] 1.4: Create `backend/middleware/` directory
  - [ ] 1.5: Create `backend/utils/` directory
  - [ ] 1.6: Create `backend/validators/` directory
  - [ ] 1.7: Create `backend/tests/routes/` directory
  - [ ] 1.8: Create `backend/tests/services/` directory

- [ ] Task 2: Setup app.js (AC: #4)
  - [ ] 2.1: Configure Express instance
  - [ ] 2.2: Add JSON body parser middleware
  - [ ] 2.3: Add CORS middleware (existing config)
  - [ ] 2.4: Mount routes from `routes/index.js`
  - [ ] 2.5: Add error handling middleware (last position)
  - [ ] 2.6: Export app instance

- [ ] Task 3: Setup server.js (AC: #5)
  - [ ] 3.1: Import app from app.js
  - [ ] 3.2: Read PORT from environment
  - [ ] 3.3: Start HTTP server
  - [ ] 3.4: Add startup log message

- [ ] Task 4: Create routes/index.js (AC: #2)
  - [ ] 4.1: Create route aggregator function
  - [ ] 4.2: Mount health routes as example
  - [ ] 4.3: Export mount function

- [ ] Task 5: Create middleware placeholders (AC: #3)
  - [ ] 5.1: Create `middleware/auth.middleware.js` with TODO
  - [ ] 5.2: Create `middleware/rbac.middleware.js` with TODO
  - [ ] 5.3: Create `middleware/validate.middleware.js` with TODO
  - [ ] 5.4: Create `middleware/error.middleware.js` with basic handler

- [ ] Task 6: Create sample route chain (AC: #7)
  - [ ] 6.1: Create `routes/health.routes.js`
  - [ ] 6.2: Create `controllers/health.controller.js`
  - [ ] 6.3: Wire them together demonstrating pattern

- [ ] Task 7: Create test setup (AC: #1)
  - [ ] 7.1: Create `tests/setup.js` with Jest configuration
  - [ ] 7.2: Verify test structure mirrors source

- [ ] Task 8: Verify CommonJS compliance (AC: #6)
  - [ ] 8.1: Ensure all files use `require()`
  - [ ] 8.2: Ensure all files use `module.exports`
  - [ ] 8.3: NO `import`/`export` statements

## Dev Notes

### Architecture Compliance

**CRITICAL: CommonJS Only (from project-context.md)**
```javascript
// CORRECT - CommonJS
const express = require('express');
module.exports = { handler };

// WRONG - ES Modules (DO NOT USE)
import express from 'express';
export const handler = () => {};
```

**File Naming Conventions:**
- Routes: `{resource}.routes.js` (kebab-case)
- Controllers: `{resource}.controller.js`
- Services: `{resource}.service.js`
- Middleware: `{name}.middleware.js`
- Validators: `{resource}.validator.js`

**Layered Architecture Pattern:**
```
Request → Route → Controller → Service → Database
                      ↓
Response ← Controller ← Service
```

### Technical Requirements

**Express Configuration in app.js:**
```javascript
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
routes(app);

// Error handling (MUST be last)
app.use(errorHandler);

module.exports = app;
```

**Server Entry in server.js:**
```javascript
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Route Aggregator Pattern:**
```javascript
// routes/index.js
const healthRoutes = require('./health.routes');

const mountRoutes = (app) => {
  app.use('/health', healthRoutes);
  app.use('/ready', healthRoutes);
  // Future routes will be added here
  // app.use('/api/v1/auth', authRoutes);
  // app.use('/api/v1/users', userRoutes);
};

module.exports = mountRoutes;
```

### Project Structure Reference

```
backend/
├── server.js                 # HTTP server entry
├── app.js                    # Express configuration
├── package.json
├── .env.example
│
├── routes/
│   ├── index.js              # Route aggregator
│   └── health.routes.js      # Health check routes (sample)
│
├── controllers/
│   └── health.controller.js  # Health check controller (sample)
│
├── services/
│   └── .gitkeep              # Placeholder
│
├── middleware/
│   ├── auth.middleware.js    # Placeholder - Story 2.3
│   ├── rbac.middleware.js    # Placeholder - Story 2.6
│   ├── validate.middleware.js # Placeholder
│   └── error.middleware.js   # Basic error handler
│
├── utils/
│   └── .gitkeep              # Placeholder - Story 1.5
│
├── validators/
│   └── .gitkeep              # Placeholder
│
└── tests/
    ├── setup.js              # Jest setup
    ├── routes/
    │   └── health.routes.test.js
    └── services/
        └── .gitkeep
```

### Sample Route/Controller Chain

**routes/health.routes.js:**
```javascript
const express = require('express');
const healthController = require('../controllers/health.controller');

const router = express.Router();

router.get('/', healthController.check);

module.exports = router;
```

**controllers/health.controller.js:**
```javascript
const check = (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = { check };
```

### Anti-Patterns to Avoid

- **DO NOT** use ES modules (`import`/`export`)
- **DO NOT** put business logic in controllers (use services)
- **DO NOT** put database queries in controllers (use services)
- **DO NOT** forget to export functions/objects
- **DO NOT** use default exports (use named exports in object)

### Existing Code Considerations

**Check for existing files:**
- If `app.js` or `server.js` exist, refactor them
- Preserve existing functionality (CORS, etc.)
- Move route definitions to routes/ directory

### Dependencies

**Depends on:**
- Node.js project initialized
- Express installed

**Blocks:**
- Story 1.5: Core Backend Utilities (needs utils/ directory)
- Story 1.6: Error Handling Middleware
- Story 1.7: Health Check Endpoints (extends sample)
- All Epic 2+ backend stories

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Backend Architecture Pattern]
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure Patterns]
- [Source: _bmad-output/project-context.md#Backend (CommonJS)]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled during implementation_

### File List

_To be filled during implementation - expected:_
- `backend/app.js`
- `backend/server.js`
- `backend/routes/index.js`
- `backend/routes/health.routes.js`
- `backend/controllers/health.controller.js`
- `backend/middleware/error.middleware.js`
- `backend/middleware/auth.middleware.js` (placeholder)
- `backend/middleware/rbac.middleware.js` (placeholder)
- `backend/middleware/validate.middleware.js` (placeholder)
- `backend/tests/setup.js`
