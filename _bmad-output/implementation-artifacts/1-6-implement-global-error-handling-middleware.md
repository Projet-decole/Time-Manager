# Story 1.6: Implement Global Error Handling Middleware

Status: ready-for-dev

## Story

As a **developer**,
I want centralized error handling middleware,
So that all errors are caught and formatted consistently.

## Acceptance Criteria

1. **Given** the AppError class exists (from Story 1.5)
   **When** an AppError is thrown in any route
   **Then** the error middleware catches it
   **And** returns the AppError's statusCode
   **And** returns formatted response: `{ success: false, error: { code, message, details } }`

2. **Given** an unexpected error occurs (not AppError)
   **When** in production environment (`NODE_ENV=production`)
   **Then** returns 500 status code
   **And** returns generic message: "Internal server error"
   **And** does NOT expose stack trace or internal details

3. **Given** an unexpected error occurs
   **When** in development environment (`NODE_ENV=development`)
   **Then** returns 500 status code
   **And** includes error message in response
   **And** logs full stack trace to console

4. **Given** an async route handler throws an error
   **When** the error is thrown inside async/await
   **Then** the error is properly caught and passed to error middleware
   **And** the application does not crash

5. **Given** the error middleware is implemented
   **When** any error is caught
   **Then** error details are logged (timestamp, path, method, error)
   **And** log format is structured for parsing

6. **Given** the error middleware is implemented
   **Then** it is registered LAST in the Express middleware chain
   **And** it has the signature `(err, req, res, next)`

7. **Given** the error middleware is implemented
   **Then** unit tests verify:
   - AppError handling with correct status codes
   - Unknown error handling in production mode
   - Unknown error handling in development mode
   - Async error propagation

## Tasks / Subtasks

- [ ] Task 1: Implement error middleware (AC: #1, #2, #3, #6)
  - [ ] 1.1: Update `middleware/error.middleware.js`
  - [ ] 1.2: Handle AppError instances with proper status/code
  - [ ] 1.3: Handle unknown errors with 500 status
  - [ ] 1.4: Differentiate production vs development responses
  - [ ] 1.5: Ensure 4-parameter signature (err, req, res, next)

- [ ] Task 2: Implement error logging (AC: #5)
  - [ ] 2.1: Log timestamp, request path, method
  - [ ] 2.2: Log error message and code
  - [ ] 2.3: Log stack trace in development only
  - [ ] 2.4: Use structured log format

- [ ] Task 3: Implement async error wrapper (AC: #4)
  - [ ] 3.1: Create `utils/asyncHandler.js` wrapper function
  - [ ] 3.2: Wrap async route handlers to catch errors
  - [ ] 3.3: Pass caught errors to next()

- [ ] Task 4: Integrate with app.js (AC: #6)
  - [ ] 4.1: Import error middleware in app.js
  - [ ] 4.2: Register as LAST middleware
  - [ ] 4.3: Verify order: routes → errorHandler

- [ ] Task 5: Write unit tests (AC: #7)
  - [ ] 5.1: Create `tests/middleware/error.middleware.test.js`
  - [ ] 5.2: Test AppError handling
  - [ ] 5.3: Test unknown error handling (prod/dev modes)
  - [ ] 5.4: Test async error propagation

## Dev Notes

### Architecture Compliance

**CRITICAL: CommonJS Only**
```javascript
const AppError = require('../utils/AppError');
module.exports = errorHandler;
```

**Error Response Format (from architecture.md):**
```javascript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [{ "field": "email", "message": "Invalid format" }]
  }
}
```

### Implementation Templates

**middleware/error.middleware.js:**
```javascript
const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  // Log error
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: err.message,
    code: err.code || 'INTERNAL_ERROR'
  };

  if (process.env.NODE_ENV === 'development') {
    console.error('[ERROR]', logData, err.stack);
  } else {
    console.error('[ERROR]', logData);
  }

  // Handle AppError (operational errors)
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

  // Handle unknown errors
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  return res.status(statusCode).json({
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

**utils/asyncHandler.js:**
```javascript
/**
 * Wraps async route handlers to catch errors and pass to error middleware
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
```

**Integration in app.js:**
```javascript
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// Body parser
app.use(express.json());

// CORS
app.use(cors());

// Routes
routes(app);

// Error handler - MUST BE LAST
app.use(errorHandler);

module.exports = app;
```

### Test Examples

**tests/middleware/error.middleware.test.js:**
```javascript
const errorHandler = require('../../middleware/error.middleware');
const AppError = require('../../utils/AppError');

describe('Error Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = { method: 'GET', path: '/test' };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('AppError handling', () => {
    it('should return correct status and format for AppError', () => {
      const error = new AppError('Not found', 404, 'NOT_FOUND');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Not found',
          details: null
        }
      });
    });

    it('should include details when provided', () => {
      const details = [{ field: 'email', message: 'Invalid' }];
      const error = new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details
        }
      });
    });
  });

  describe('Unknown error handling', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should hide message in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Sensitive database error');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: null
        }
      });
    });

    it('should show message in development', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Database connection failed');

      errorHandler(error, mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Database connection failed',
          details: null
        }
      });
    });
  });
});
```

**tests/utils/asyncHandler.test.js:**
```javascript
const asyncHandler = require('../../utils/asyncHandler');

describe('asyncHandler', () => {
  it('should pass errors to next()', async () => {
    const error = new Error('Async error');
    const mockFn = jest.fn().mockRejectedValue(error);
    const mockNext = jest.fn();

    const handler = asyncHandler(mockFn);
    await handler({}, {}, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('should not call next on success', async () => {
    const mockFn = jest.fn().mockResolvedValue();
    const mockNext = jest.fn();

    const handler = asyncHandler(mockFn);
    await handler({}, {}, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
  });
});
```

### Usage Pattern in Controllers

```javascript
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// Route with async handler
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await usersService.getById(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  res.json({ success: true, data: user });
}));
```

### Project Structure After Completion

```
backend/
├── middleware/
│   ├── error.middleware.js    # Global error handler
│   ├── auth.middleware.js     # (placeholder)
│   ├── rbac.middleware.js     # (placeholder)
│   └── validate.middleware.js # (placeholder)
├── utils/
│   ├── AppError.js            # (from Story 1.5)
│   ├── asyncHandler.js        # Async wrapper
│   └── ...
└── tests/
    ├── middleware/
    │   └── error.middleware.test.js
    └── utils/
        └── asyncHandler.test.js
```

### Anti-Patterns to Avoid

- **DO NOT** expose stack traces in production
- **DO NOT** expose internal error messages in production
- **DO NOT** forget the 4-parameter signature `(err, req, res, next)`
- **DO NOT** place error middleware before routes
- **DO NOT** forget to use asyncHandler for async routes

### Error Codes Reference

| HTTP | Code | Usage |
|------|------|-------|
| 400 | VALIDATION_ERROR | Invalid input data |
| 401 | UNAUTHORIZED | Missing/invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | State conflict (e.g., duplicate) |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Unexpected server error |

### Dependencies

**Depends on:**
- Story 1.4: Backend Project Structure
- Story 1.5: AppError class

**Blocks:**
- All API routes (need error handling)
- Story 2.3: Auth middleware (throws AppError)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns - Error Handling]
- [Source: _bmad-output/planning-artifacts/architecture.md#Error Codes]
- [Source: _bmad-output/project-context.md#Error Handling]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6]

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled during implementation_

### File List

_To be filled during implementation - expected:_
- `backend/middleware/error.middleware.js`
- `backend/utils/asyncHandler.js`
- `backend/tests/middleware/error.middleware.test.js`
- `backend/tests/utils/asyncHandler.test.js`
