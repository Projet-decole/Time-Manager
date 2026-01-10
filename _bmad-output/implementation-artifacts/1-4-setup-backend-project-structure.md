# Story 1.4: Setup Backend Project Structure

Status: done

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

- [x] Task 1: Create directory structure
  - [x] 1.1: Create `backend/routes/` directory
  - [x] 1.2: Create `backend/controllers/` directory
  - [x] 1.3: Create `backend/services/` directory
  - [x] 1.4: Create `backend/middleware/` directory
  - [x] 1.5: Create `backend/utils/` directory
  - [x] 1.6: Create `backend/validators/` directory
  - [x] 1.7: Create `backend/tests/routes/` directory
  - [x] 1.8: Create `backend/tests/services/` directory

- [x] Task 2: Setup app.js (AC: #4)
  - [x] 2.1: Configure Express instance
  - [x] 2.2: Add JSON body parser middleware
  - [x] 2.3: Add CORS middleware (existing config)
  - [x] 2.4: Mount routes from `routes/index.js`
  - [x] 2.5: Add error handling middleware (last position)
  - [x] 2.6: Export app instance

- [x] Task 3: Setup server.js (AC: #5)
  - [x] 3.1: Import app from app.js
  - [x] 3.2: Read PORT from environment
  - [x] 3.3: Start HTTP server
  - [x] 3.4: Add startup log message

- [x] Task 4: Create routes/index.js (AC: #2)
  - [x] 4.1: Create route aggregator function
  - [x] 4.2: Mount health routes as example
  - [x] 4.3: Export mount function

- [x] Task 5: Create middleware placeholders (AC: #3)
  - [x] 5.1: Create `middleware/auth.middleware.js` with TODO
  - [x] 5.2: Create `middleware/rbac.middleware.js` with TODO
  - [x] 5.3: Create `middleware/validate.middleware.js` with TODO
  - [x] 5.4: Create `middleware/error.middleware.js` with basic handler

- [x] Task 6: Create sample route chain (AC: #7)
  - [x] 6.1: Create `routes/health.routes.js`
  - [x] 6.2: Create `controllers/health.controller.js`
  - [x] 6.3: Wire them together demonstrating pattern

- [x] Task 7: Create test setup (AC: #1)
  - [x] 7.1: Create `tests/setup.js` with Jest configuration
  - [x] 7.2: Verify test structure mirrors source

- [x] Task 8: Verify CommonJS compliance (AC: #6)
  - [x] 8.1: Ensure all files use `require()`
  - [x] 8.2: Ensure all files use `module.exports`
  - [x] 8.3: NO `import`/`export` statements

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

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 24 tests passing (3 test suites)
- Coverage: 100% statements, branches, functions, lines
- CommonJS compliance verified via grep: no import/export statements found

### Code Review Fixes Applied (2026-01-10)

**HIGH Severity Fixed:**
- H1: Added 404 handler with standard JSON format in `app.js`
- H2: Created comprehensive error middleware tests achieving 100% coverage

**MEDIUM Severity Fixed:**
- M1: Rewrote JSON body parsing test to properly verify functionality
- M2: Added SIGINT handler for graceful shutdown in development (Ctrl+C)
- M3: Fixed by H1 - 404s now return standard JSON format

**LOW Severity Fixed:**
- L2: Added tests verifying standard error response format
- L3: Enhanced 404 tests to verify response body and HTTP method inclusion

**Additional Improvements:**
- Error middleware now only logs 5xx errors (server errors), not 4xx (expected client errors)

### Completion Notes List

- **Task 1:** Created full directory structure with .gitkeep files for empty directories
- **Task 2:** Refactored app.js to use layered architecture pattern - imports routes from index.js, uses error middleware last
- **Task 3:** Fixed server.js bug (undefined `server` variable) and added graceful shutdown with SIGTERM handling
- **Task 4:** Created routes/index.js as route aggregator mounting health routes on /health and /ready
- **Task 5:** Created all 4 middleware placeholders with TODO comments and proper documentation
- **Task 6:** Created health.routes.js → health.controller.js chain with standard response format
- **Task 7:** Created tests/setup.js with Jest configuration and added route integration tests
- **Task 8:** Verified all files use CommonJS (require/module.exports) - no ES modules

### File List

**Modified:**
- `backend/app.js` - Refactored to use routes/index.js, error middleware, and 404 JSON handler
- `backend/server.js` - Fixed server variable bug, added graceful shutdown (SIGTERM + SIGINT)
- `backend/package.json` - Added Jest setupFilesAfterEnv configuration
- `backend/tests/app.test.js` - Comprehensive tests for JSON parsing, CORS, and 404 handling
- `backend/middleware/error.middleware.js` - Global error handler (logs 5xx only)

**Created:**
- `backend/routes/index.js` - Route aggregator
- `backend/routes/health.routes.js` - Health check routes
- `backend/controllers/health.controller.js` - Health check controller
- `backend/middleware/auth.middleware.js` - Auth placeholder
- `backend/middleware/rbac.middleware.js` - RBAC placeholder
- `backend/middleware/validate.middleware.js` - Validation placeholder
- `backend/tests/setup.js` - Jest setup
- `backend/tests/routes/health.routes.test.js` - Route integration tests
- `backend/tests/middleware/error.middleware.test.js` - Error middleware unit tests (100% coverage)
- `backend/services/.gitkeep` - Placeholder
- `backend/utils/.gitkeep` - Placeholder
- `backend/validators/.gitkeep` - Placeholder
- `backend/tests/services/.gitkeep` - Placeholder

## Change Log

- 2026-01-10: Story 1.4 implemented - Backend structure reorganized with layered architecture
- 2026-01-10: Code review completed - Fixed 8 issues (2 HIGH, 3 MEDIUM, 3 LOW), coverage improved to 100%
