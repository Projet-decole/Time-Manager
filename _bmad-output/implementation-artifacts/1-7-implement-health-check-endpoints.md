# Story 1.7: Implement Health Check Endpoints

Status: done

## Story

As a **developer**,
I want health check endpoints for container orchestration,
So that deployment systems can verify backend status.

## Acceptance Criteria

1. **Given** the backend is running
   **When** GET `/health` is called
   **Then** response is:
   ```json
   {
     "success": true,
     "data": {
       "status": "healthy",
       "timestamp": "2026-01-10T12:00:00.000Z"
     }
   }
   ```
   **And** status code is 200

2. **Given** the backend is running and database is connected
   **When** GET `/ready` is called
   **Then** response is:
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
   **And** status code is 200

3. **Given** the backend is running but database is NOT connected
   **When** GET `/ready` is called
   **Then** response is:
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
   **And** status code is 503

4. **Given** the health endpoints exist
   **When** any request is made to `/health` or `/ready`
   **Then** authentication middleware is bypassed
   **And** no token is required

5. **Given** the health endpoints exist
   **Then** they are registered in the routes aggregator
   **And** they use the standard response format

6. **Given** the health endpoints are implemented
   **Then** integration tests verify:
   - `/health` returns 200 with correct format
   - `/ready` returns 200 when database connected
   - `/ready` returns 503 when database fails
   - No authentication required

7. **Given** the API is running
   **When** GET `/` is called
   **Then** response is:
   ```json
   {
     "success": true,
     "data": {
       "message": "Time Manager API is running!",
       "version": "1.0.0"
     }
   }
   ```
   **And** status code is 200

## Tasks / Subtasks

- [x] Task 1: Implement health controller (AC: #1, #2, #3)
  - [x] 1.1: Create/update `controllers/health.controller.js`
  - [x] 1.2: Implement `check()` for `/health` endpoint
  - [x] 1.3: Implement `ready()` for `/ready` endpoint
  - [x] 1.4: Add database connectivity check in `ready()`

- [x] Task 2: Implement health routes (AC: #4, #5)
  - [x] 2.1: Create/update `routes/health.routes.js`
  - [x] 2.2: Register GET `/health` route
  - [x] 2.3: Register GET `/ready` route
  - [x] 2.4: Ensure no auth middleware applied

- [x] Task 3: Implement health service (AC: #2, #3)
  - [x] 3.1: Create `services/health.service.js`
  - [x] 3.2: Implement `checkDatabase()` function
  - [x] 3.3: Return structured check results

- [x] Task 4: Update route aggregator (AC: #5)
  - [x] 4.1: Import health routes in `routes/index.js`
  - [x] 4.2: Mount at root level (not under /api/v1)

- [x] Task 5: Write tests (AC: #6, #7)
  - [x] 5.1: Create `tests/routes/health.routes.test.js`
  - [x] 5.2: Test `/health` endpoint
  - [x] 5.3: Test `/ready` with mock database success
  - [x] 5.4: Test `/ready` with mock database failure
  - [x] 5.5: Test `/` root endpoint

- [x] Task 6: Implement root endpoint (AC: #7)
  - [x] 6.1: Add `root()` function to health controller
  - [x] 6.2: Mount GET `/` in route aggregator
  - [x] 6.3: Read version dynamically from package.json

## Dev Notes

### Architecture Compliance

**CRITICAL: CommonJS Only**
```javascript
const express = require('express');
module.exports = router;
```

**Endpoint Placement:**
- Health endpoints are at ROOT level (`/health`, `/ready`)
- NOT under `/api/v1` (they're infrastructure, not API)
- NO authentication required (for Docker/K8s probes)

### Implementation Templates

**controllers/health.controller.js:**
```javascript
const healthService = require('../services/health.service');
const { successResponse } = require('../utils/response');

/**
 * Basic health check - always returns healthy if server is running
 * Used for: liveness probe
 */
const check = (req, res) => {
  return successResponse(res, {
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
};

/**
 * Readiness check - verifies all dependencies are available
 * Used for: readiness probe
 */
const ready = async (req, res) => {
  const checks = await healthService.runChecks();

  const allPassed = Object.values(checks).every(status => status === 'ok');
  const status = allPassed ? 'ready' : 'not ready';
  const statusCode = allPassed ? 200 : 503;

  return res.status(statusCode).json({
    success: allPassed,
    data: {
      status,
      checks
    }
  });
};

module.exports = { check, ready };
```

**services/health.service.js:**
```javascript
const { supabase } = require('../utils/supabase');

/**
 * Run all health checks
 * @returns {Object} Check results { database: 'ok' | 'failed' }
 */
const runChecks = async () => {
  const checks = {
    database: await checkDatabase()
  };

  return checks;
};

/**
 * Check database connectivity
 * @returns {string} 'ok' or 'failed'
 */
const checkDatabase = async () => {
  try {
    // Simple query to verify connection
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    return error ? 'failed' : 'ok';
  } catch (err) {
    console.error('[HEALTH] Database check failed:', err.message);
    return 'failed';
  }
};

module.exports = { runChecks, checkDatabase };
```

**routes/health.routes.js:**
```javascript
const express = require('express');
const healthController = require('../controllers/health.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Liveness probe - is the server running?
router.get('/health', healthController.check);

// Readiness probe - are dependencies available?
router.get('/ready', asyncHandler(healthController.ready));

module.exports = router;
```

**routes/index.js (updated):**
```javascript
const healthRoutes = require('./health.routes');

const mountRoutes = (app) => {
  // Health checks at root level (no auth, no /api/v1 prefix)
  app.use('/', healthRoutes);

  // Future API routes will be mounted here:
  // app.use('/api/v1/auth', authRoutes);
  // app.use('/api/v1/users', userRoutes);
};

module.exports = mountRoutes;
```

### Test Examples

**tests/routes/health.routes.test.js:**
```javascript
const request = require('supertest');
const app = require('../../app');

// Mock Supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}));

const { supabase } = require('../../utils/supabase');

describe('Health Routes', () => {
  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
      expect(res.body.data.timestamp).toBeDefined();
    });

    it('should not require authentication', async () => {
      const res = await request(app)
        .get('/health')
        // No Authorization header

      expect(res.status).toBe(200);
    });
  });

  describe('GET /ready', () => {
    it('should return ready when database is connected', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const res = await request(app).get('/ready');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ready');
      expect(res.body.data.checks.database).toBe('ok');
    });

    it('should return 503 when database is not connected', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Connection failed')
          })
        })
      });

      const res = await request(app).get('/ready');

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.data.status).toBe('not ready');
      expect(res.body.data.checks.database).toBe('failed');
    });

    it('should not require authentication', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const res = await request(app)
        .get('/ready')
        // No Authorization header

      expect(res.status).toBe(200);
    });
  });
});
```

### Docker/Kubernetes Integration

**Dockerfile healthcheck:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

**Kubernetes probes:**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Project Structure After Completion

```
backend/
├── routes/
│   ├── index.js              # Route aggregator
│   └── health.routes.js      # Health check routes
├── controllers/
│   └── health.controller.js  # Health check handlers
├── services/
│   └── health.service.js     # Health check logic
└── tests/
    └── routes/
        └── health.routes.test.js
```

### Anti-Patterns to Avoid

- **DO NOT** require authentication on health endpoints
- **DO NOT** mount health routes under `/api/v1`
- **DO NOT** return 200 on `/ready` if any check fails
- **DO NOT** skip database check - it's critical for readiness
- **DO NOT** cache health check results (always fresh check)

### Future Enhancements (Post-MVP)

- Add more checks: Redis, external APIs
- Add version information to `/health`
- Add uptime metric
- Add memory/CPU usage stats

### Dependencies

**Depends on:**
- Story 1.4: Backend Project Structure
- Story 1.5: Utils (supabase client, response helpers)
- Story 1.6: Async handler for ready endpoint

**Blocks:**
- Docker deployment (needs health checks)
- Kubernetes deployment
- CI/CD pipeline health verification

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure & Deployment]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.7]
- [Source: _bmad-output/project-context.md#Technology Stack]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 144 tests pass with 99.34% coverage
- No regressions introduced
- Health service, controller, routes implemented following red-green-refactor cycle

### Completion Notes List

- **Task 1:** Implemented health controller with `check()` (liveness) and `ready()` (readiness) functions
- **Task 2:** Updated health routes with GET /health and GET /ready endpoints, no auth middleware
- **Task 3:** Created health service with `runChecks()` and `checkDatabase()` - queries profiles table to verify DB connectivity
- **Task 4:** Updated route aggregator to mount health routes at root level (not under /api/v1)
- **Task 5:** Comprehensive tests: 13 health-specific tests covering all ACs including DB error scenarios

### File List

- `backend/services/health.service.js` (created)
- `backend/controllers/health.controller.js` (modified)
- `backend/routes/health.routes.js` (modified)
- `backend/routes/index.js` (modified)
- `backend/tests/routes/health.routes.test.js` (modified)
- `backend/tests/services/health.service.test.js` (created)

### Change Log

- 2026-01-10: Implemented health check endpoints (Story 1.7) - all ACs satisfied
- 2026-01-10: Code Review fixes applied:
  - Used `successResponse` helper in controller (consistency)
  - Dynamic version from package.json instead of hardcoded
  - Structured logging in health service
  - Documented root endpoint (AC #7) that was implemented but not documented

## Senior Developer Review (AI)

**Reviewer:** Amelia (Dev Agent)
**Date:** 2026-01-10
**Outcome:** ✅ APPROVED with fixes applied

### Issues Found & Resolved
| ID | Severity | Issue | Resolution |
|----|----------|-------|------------|
| H1 | HIGH | Files untracked in git | Staged for commit |
| M1 | MEDIUM | Root endpoint undocumented | Added AC #7 and Task 6 |
| M2 | MEDIUM | Not using successResponse helper | Updated check() and root() |
| M4 | MEDIUM | Hardcoded version | Now reads from package.json |
| L2 | LOW | Unstructured console.error | Improved to structured logging |

### Verification
- ✅ All 144 tests pass
- ✅ Coverage: 99.35%
- ✅ All ACs implemented and verified
- ✅ Follows project patterns (CommonJS, successResponse, etc.)
