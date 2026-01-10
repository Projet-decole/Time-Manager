# Story 1.5: Implement Core Backend Utilities

Status: done

## Story

As a **developer**,
I want reusable utilities for error handling and response formatting,
So that all endpoints follow consistent patterns.

## Acceptance Criteria

1. **Given** the backend structure from Story 1.4
   **When** `utils/AppError.js` is implemented
   **Then** the AppError class:
   - Extends the native Error class
   - Constructor accepts `(message, statusCode, code, details = null)`
   - Has `statusCode` property (e.g., 400, 404, 500)
   - Has `code` property (e.g., 'VALIDATION_ERROR', 'NOT_FOUND')
   - Has `details` property for field-level errors (nullable)
   - Has `isOperational` flag set to `true`

2. **Given** the backend structure exists
   **When** `utils/response.js` is implemented
   **Then** it provides:
   - `successResponse(res, data, meta = null)` returning `{ success: true, data, meta }`
   - `errorResponse(res, error)` returning `{ success: false, error: { code, message, details } }`
   - `paginatedResponse(res, data, pagination)` for list endpoints

3. **Given** the backend structure exists
   **When** `utils/transformers.js` is implemented
   **Then** it provides:
   - `snakeToCamel(obj)` converting `{ user_id, created_at }` → `{ userId, createdAt }`
   - `camelToSnake(obj)` converting `{ userId, createdAt }` → `{ user_id, created_at }`
   - Both functions handle nested objects and arrays
   - Both functions handle null/undefined gracefully

4. **Given** the backend structure exists
   **When** `utils/supabase.js` is implemented
   **Then** it:
   - Creates and exports a Supabase client instance
   - Reads credentials from environment variables
   - Provides both `supabase` (anon) and `supabaseAdmin` (service role) clients

5. **Given** the backend structure exists
   **When** `utils/pagination.js` is implemented
   **Then** it provides:
   - `parsePaginationParams(query)` extracting page/limit from request query
   - `buildPaginationMeta(page, limit, total)` building pagination metadata
   - Default values: page=1, limit=20, maxLimit=100

6. **Given** all utilities are implemented
   **Then** each utility has corresponding unit tests in `tests/utils/`
   **And** tests achieve >80% coverage for these files

7. **Given** all utilities are implemented
   **Then** CommonJS syntax is used throughout (`require`/`module.exports`)

## Tasks / Subtasks

- [x] Task 1: Implement AppError class (AC: #1)
  - [x] 1.1: Create `utils/AppError.js`
  - [x] 1.2: Extend Error class
  - [x] 1.3: Add statusCode, code, details, isOperational properties
  - [x] 1.4: Create unit tests in `tests/utils/AppError.test.js`

- [x] Task 2: Implement response helpers (AC: #2)
  - [x] 2.1: Create `utils/response.js`
  - [x] 2.2: Implement `successResponse()`
  - [x] 2.3: Implement `errorResponse()`
  - [x] 2.4: Implement `paginatedResponse()`
  - [x] 2.5: Create unit tests in `tests/utils/response.test.js`

- [x] Task 3: Implement transformers (AC: #3)
  - [x] 3.1: Create `utils/transformers.js`
  - [x] 3.2: Implement `snakeToCamel()` with recursion
  - [x] 3.3: Implement `camelToSnake()` with recursion
  - [x] 3.4: Handle edge cases (null, arrays, nested objects)
  - [x] 3.5: Create unit tests in `tests/utils/transformers.test.js`

- [x] Task 4: Implement Supabase client (AC: #4)
  - [x] 4.1: Create `utils/supabase.js`
  - [x] 4.2: Create anon client for user operations
  - [x] 4.3: Create admin client for service role operations
  - [x] 4.4: Read from SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

- [x] Task 5: Implement pagination helpers (AC: #5)
  - [x] 5.1: Create `utils/pagination.js`
  - [x] 5.2: Implement `parsePaginationParams()`
  - [x] 5.3: Implement `buildPaginationMeta()`
  - [x] 5.4: Create unit tests in `tests/utils/pagination.test.js`

- [x] Task 6: Verify test coverage (AC: #6)
  - [x] 6.1: Run tests with coverage
  - [x] 6.2: Ensure >80% coverage on utils/

## Dev Notes

### Architecture Compliance

**CRITICAL: CommonJS Only**
```javascript
// CORRECT
const { createClient } = require('@supabase/supabase-js');
module.exports = { AppError };

// WRONG - DO NOT USE
import { createClient } from '@supabase/supabase-js';
export class AppError {}
```

**Response Format (from architecture.md):**
```javascript
// Success
{ success: true, data: {...}, meta: { pagination: {...} } }

// Error
{ success: false, error: { code: 'ERROR_CODE', message: '...', details: [...] } }
```

### Implementation Templates

**utils/AppError.js:**
```javascript
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

**utils/response.js:**
```javascript
const successResponse = (res, data, meta = null) => {
  const response = { success: true, data };
  if (meta) response.meta = meta;
  return res.json(response);
};

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

const paginatedResponse = (res, data, pagination) => {
  return res.json({
    success: true,
    data,
    meta: { pagination }
  });
};

module.exports = { successResponse, errorResponse, paginatedResponse };
```

**utils/transformers.js:**
```javascript
const snakeToCamel = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (typeof obj !== 'object') return obj;

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
    acc[camelKey] = snakeToCamel(obj[key]);
    return acc;
  }, {});
};

const camelToSnake = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  if (typeof obj !== 'object') return obj;

  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    acc[snakeKey] = camelToSnake(obj[key]);
    return acc;
  }, {});
};

module.exports = { snakeToCamel, camelToSnake };
```

**utils/supabase.js:**
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client for user operations (respects RLS)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for service role operations (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase, supabaseAdmin };
```

**utils/pagination.js:**
```javascript
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const parsePaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
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

module.exports = { parsePaginationParams, buildPaginationMeta, DEFAULT_LIMIT, MAX_LIMIT };
```

### Test Examples

**tests/utils/AppError.test.js:**
```javascript
const AppError = require('../../utils/AppError');

describe('AppError', () => {
  it('should create error with all properties', () => {
    const error = new AppError('Not found', 404, 'NOT_FOUND');

    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.isOperational).toBe(true);
    expect(error).toBeInstanceOf(Error);
  });

  it('should handle details parameter', () => {
    const details = [{ field: 'email', message: 'Invalid' }];
    const error = new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);

    expect(error.details).toEqual(details);
  });
});
```

**tests/utils/transformers.test.js:**
```javascript
const { snakeToCamel, camelToSnake } = require('../../utils/transformers');

describe('transformers', () => {
  describe('snakeToCamel', () => {
    it('should convert snake_case to camelCase', () => {
      const input = { user_id: 1, created_at: '2026-01-10' };
      const expected = { userId: 1, createdAt: '2026-01-10' };

      expect(snakeToCamel(input)).toEqual(expected);
    });

    it('should handle nested objects', () => {
      const input = { user: { first_name: 'John', last_name: 'Doe' } };
      const expected = { user: { firstName: 'John', lastName: 'Doe' } };

      expect(snakeToCamel(input)).toEqual(expected);
    });

    it('should handle arrays', () => {
      const input = [{ user_id: 1 }, { user_id: 2 }];
      const expected = [{ userId: 1 }, { userId: 2 }];

      expect(snakeToCamel(input)).toEqual(expected);
    });

    it('should handle null and undefined', () => {
      expect(snakeToCamel(null)).toBeNull();
      expect(snakeToCamel(undefined)).toBeUndefined();
    });
  });
});
```

### Project Structure After Completion

```
backend/
└── utils/
    ├── AppError.js
    ├── response.js
    ├── transformers.js
    ├── supabase.js
    └── pagination.js
└── tests/
    └── utils/
        ├── AppError.test.js
        ├── response.test.js
        ├── transformers.test.js
        └── pagination.test.js
```

### Anti-Patterns to Avoid

- **DO NOT** use ES modules
- **DO NOT** hardcode Supabase credentials
- **DO NOT** forget null/undefined handling in transformers
- **DO NOT** skip unit tests for utilities
- **DO NOT** use `res.send()` - always use `res.json()`

### Environment Variables Required

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Dependencies

**Depends on:**
- Story 1.4: Backend Project Structure (directories must exist)
- `@supabase/supabase-js` package installed

**Blocks:**
- Story 1.6: Error Handling Middleware (uses AppError)
- All service layer implementations (use transformers, supabase)
- All controller implementations (use response helpers)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns]
- [Source: _bmad-output/project-context.md#API Response Format]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All tests passing: 124 tests, 98.78% coverage on utils/

### Completion Notes List

- ✅ Task 1: AppError class implemented with full test coverage (14 tests)
- ✅ Task 2: Response helpers (successResponse, errorResponse, paginatedResponse) implemented with full test coverage (14 tests)
- ✅ Task 3: Transformers (snakeToCamel, camelToSnake) implemented with recursive handling for nested objects/arrays, Date/RegExp preservation, acronym support (38 tests)
- ✅ Task 4: Supabase client configured with anon and admin clients, env var validation, testable exports (12 tests)
- ✅ Task 5: Pagination helpers (parsePaginationParams, buildPaginationMeta) implemented with edge case handling (25 tests)
- ✅ Task 6: Test coverage verified at 98.78% for all utils files (exceeds >80% requirement)
- All implementations follow CommonJS syntax as required
- Red-green-refactor cycle followed for all tasks with tests

### File List

**New Files:**
- `backend/utils/AppError.js`
- `backend/utils/response.js`
- `backend/utils/transformers.js`
- `backend/utils/supabase.js`
- `backend/utils/pagination.js`
- `backend/tests/utils/AppError.test.js`
- `backend/tests/utils/response.test.js`
- `backend/tests/utils/transformers.test.js`
- `backend/tests/utils/supabase.test.js`
- `backend/tests/utils/pagination.test.js`

## Change Log

- 2026-01-10: Story 1.5 implementation complete - all core backend utilities implemented with full test coverage
- 2026-01-10: Code review fixes applied:
  - transformers.js: Fixed Date/RegExp object preservation, fixed camelToSnake leading underscore bug for acronyms
  - pagination.js: Added guard against limit=0 causing Infinity in buildPaginationMeta
  - supabase.js: Added env var validation with clear error messages, exports validateEnvVars for testing
  - Added supabase.test.js with 12 tests covering validation and exports
