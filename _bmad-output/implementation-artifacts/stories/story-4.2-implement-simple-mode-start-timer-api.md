# Story 4.2: Implement Simple Mode - Start Timer API

## Story Info
- **Epic:** Epic 4 - Time Tracking - 3 Modes
- **Story ID:** 4.2
- **Status:** done
- **Priority:** High
- **Estimated Effort:** Small
- **FRs Covered:** FR14, FR16, FR17

## User Story

**As an** employee,
**I want to** start a timer with one click,
**So that** I can track time with minimal friction.

## Acceptance Criteria

### AC1: Start Timer (No Active Timer)
**Given** an authenticated employee with no active timer
**When** POST `/api/v1/time-entries/start` is called with `{ projectId?, categoryId?, description? }`
**Then** a new time entry is created with:
- `startTime` = now (server timestamp)
- `endTime` = null (indicates running)
- `entryMode` = 'simple'
**And** response includes the running entry with status 201
**And** response format is `{ success: true, data: { id, userId, startTime, endTime, durationMinutes, projectId, categoryId, description, entryMode, createdAt, updatedAt } }`

### AC2: Start Timer (Timer Already Running)
**Given** an employee already has an active timer (time entry with endTime = null)
**When** POST `/api/v1/time-entries/start` is called
**Then** response is 400 with error `{ success: false, error: { code: "TIMER_ALREADY_RUNNING", message: "Timer already running" } }`
**And** the response includes the existing active entry in `error.data`

### AC3: Get Active Timer
**Given** an authenticated employee
**When** GET `/api/v1/time-entries/active` is called
**Then** if an active timer exists (endTime = null, entryMode = 'simple'), response includes the active entry
**And** if no active timer exists, response includes `{ success: true, data: null }`
**And** project and category details are included if they exist

### AC4: Start Timer with Project/Category
**Given** an authenticated employee with no active timer
**When** POST `/api/v1/time-entries/start` is called with `{ projectId: "uuid", categoryId: "uuid", description: "..." }`
**Then** the timer is started with these optional fields populated
**And** if projectId references a non-existent project, response is 400 with "Project not found"
**And** if categoryId references a non-existent category, response is 400 with "Category not found"

### AC5: Validation Rules
**Given** invalid input data
**When** POST `/api/v1/time-entries/start` is called
**Then** response is 400 with validation error details for:
- projectId must be valid UUID if provided
- categoryId must be valid UUID if provided
- description must not exceed 500 characters

### AC6: User Isolation
**Given** user A has an active timer
**When** user B calls POST `/api/v1/time-entries/start`
**Then** user B can successfully start their own timer
**And** user A's timer is not affected

---

## Technical Implementation

### Files to Create/Modify

#### 1. Routes - `backend/routes/time-entries.routes.js` (Modify)
```javascript
// Add new routes BEFORE the /:id route to avoid conflicts:
// POST   /api/v1/time-entries/start     - Start a new timer
// GET    /api/v1/time-entries/active    - Get active timer (if any)

// Route order matters - specific routes before parameterized routes:
// 1. POST /start
// 2. GET /active
// 3. GET /:id (existing)
```

#### 2. Controller - `backend/controllers/time-entries.controller.js` (Modify)
```javascript
// Methods to add:
// - startTimer(req, res)    - Start new timer, return 201
// - getActive(req, res)     - Get active timer or null
```

#### 3. Service - `backend/services/time-entries.service.js` (Modify)
```javascript
// Methods to add:
// - getActiveTimer(userId)              - Find active entry (endTime = null, entryMode = 'simple')
// - startTimer(userId, data)            - Check no active timer, create entry with startTime=now
```

#### 4. Validator - `backend/validators/time-entries.validator.js` (Modify)
```javascript
// Schema to add:
// - startTimerSchema: {
//     projectId: UUID (optional),
//     categoryId: UUID (optional),
//     description: string (optional, max 500)
//   }
```

### Database Queries

#### Check for Active Timer
```sql
SELECT *
FROM time_entries
WHERE user_id = $1
  AND end_time IS NULL
  AND entry_mode = 'simple'
LIMIT 1;
```

#### Create Timer Entry
```sql
INSERT INTO time_entries (user_id, start_time, end_time, duration_minutes, project_id, category_id, description, entry_mode)
VALUES ($userId, NOW(), NULL, NULL, $projectId, $categoryId, $description, 'simple')
RETURNING *;
```

### API Request/Response Examples

#### POST /api/v1/time-entries/start (Success)
**Request:**
```json
{
  "projectId": "550e8400-e29b-41d4-a716-446655440001",
  "categoryId": "550e8400-e29b-41d4-a716-446655440002",
  "description": "Working on feature X"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-uuid",
    "startTime": "2026-01-12T14:30:00.000Z",
    "endTime": null,
    "durationMinutes": null,
    "projectId": "550e8400-e29b-41d4-a716-446655440001",
    "categoryId": "550e8400-e29b-41d4-a716-446655440002",
    "description": "Working on feature X",
    "entryMode": "simple",
    "createdAt": "2026-01-12T14:30:00.000Z",
    "updatedAt": "2026-01-12T14:30:00.000Z"
  }
}
```

#### POST /api/v1/time-entries/start (Timer Already Running)
**Request:**
```json
{}
```
**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "TIMER_ALREADY_RUNNING",
    "message": "Timer already running",
    "data": {
      "id": "existing-timer-uuid",
      "startTime": "2026-01-12T10:00:00.000Z",
      "endTime": null,
      "entryMode": "simple"
    }
  }
}
```

#### GET /api/v1/time-entries/active (Active Timer Exists)
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-uuid",
    "startTime": "2026-01-12T14:30:00.000Z",
    "endTime": null,
    "durationMinutes": null,
    "projectId": "550e8400-e29b-41d4-a716-446655440001",
    "categoryId": "550e8400-e29b-41d4-a716-446655440002",
    "description": "Working on feature X",
    "entryMode": "simple",
    "createdAt": "2026-01-12T14:30:00.000Z",
    "updatedAt": "2026-01-12T14:30:00.000Z",
    "project": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "code": "PRJ-001",
      "name": "Time Manager"
    },
    "category": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Development",
      "color": "#3B82F6"
    }
  }
}
```

#### GET /api/v1/time-entries/active (No Active Timer)
**Response (200 OK):**
```json
{
  "success": true,
  "data": null
}
```

### Business Logic Details

#### Active Timer Detection
Only 'simple' mode entries with `end_time = NULL` are considered active timers.
Day mode entries have different lifecycle (day start/end) and should not conflict.

```javascript
const getActiveTimer = async (userId) => {
  const { data, error } = await supabase
    .from('time_entries')
    .select(`
      id, user_id, project_id, category_id, start_time, end_time,
      duration_minutes, description, entry_mode, created_at, updated_at,
      projects:project_id (id, code, name),
      categories:category_id (id, name, color)
    `)
    .eq('user_id', userId)
    .is('end_time', null)
    .eq('entry_mode', 'simple')
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    throw new AppError('Failed to check active timer', 500, 'DATABASE_ERROR');
  }

  return data ? transformEntry(data) : null;
};
```

#### Start Timer Logic
```javascript
const startTimer = async (userId, data) => {
  // 1. Check for existing active timer
  const activeTimer = await getActiveTimer(userId);
  if (activeTimer) {
    const error = new AppError('Timer already running', 400, 'TIMER_ALREADY_RUNNING');
    error.data = activeTimer;
    throw error;
  }

  // 2. Create new entry with startTime = now
  const entry = {
    user_id: userId,
    start_time: new Date().toISOString(),
    end_time: null,
    duration_minutes: null,
    project_id: data.projectId || null,
    category_id: data.categoryId || null,
    description: data.description || null,
    entry_mode: 'simple'
  };

  // 3. Insert and return
  const { data: created, error } = await supabase
    .from('time_entries')
    .insert(entry)
    .select('*')
    .single();

  if (error) {
    // Handle FK violations
    if (error.code === '23503') {
      if (error.message.includes('project_id')) {
        throw new AppError('Project not found', 400, 'INVALID_PROJECT_ID');
      }
      if (error.message.includes('category_id')) {
        throw new AppError('Category not found', 400, 'INVALID_CATEGORY_ID');
      }
    }
    throw new AppError('Failed to start timer', 500, 'CREATE_FAILED');
  }

  return snakeToCamel(created);
};
```

---

## Testing Requirements

### Unit Tests - `backend/tests/services/time-entries.service.test.js` (Add to existing)

**getActiveTimer tests:**
- Test returns null when no active timer exists
- Test returns active entry when timer is running
- Test ignores entries with entryMode !== 'simple'
- Test ignores entries with endTime !== null
- Test only returns user's own active timer

**startTimer tests:**
- Test creates entry with startTime = now (approximately)
- Test creates entry with entryMode = 'simple'
- Test creates entry with endTime = null
- Test creates entry with durationMinutes = null
- Test accepts optional projectId
- Test accepts optional categoryId
- Test accepts optional description
- Test throws TIMER_ALREADY_RUNNING when timer exists
- Test error includes existing timer data
- Test validates projectId is valid UUID
- Test validates categoryId is valid UUID
- Test throws INVALID_PROJECT_ID for non-existent project
- Test throws INVALID_CATEGORY_ID for non-existent category
- Test user isolation (user A's timer doesn't affect user B)

### Integration Tests - `backend/tests/routes/time-entries.routes.test.js` (Add to existing)

**POST /time-entries/start tests:**
- Test without auth returns 401
- Test creates timer successfully (201)
- Test response includes all required fields
- Test startTime is approximately now
- Test returns 400 when timer already running
- Test error response includes existing timer
- Test with valid projectId creates entry
- Test with invalid projectId returns 400
- Test with valid categoryId creates entry
- Test with invalid categoryId returns 400
- Test with description creates entry
- Test with description > 500 chars returns 400

**GET /time-entries/active tests:**
- Test without auth returns 401
- Test returns null when no active timer
- Test returns active timer when exists
- Test includes project details when available
- Test includes category details when available
- Test only returns user's own timer

### Coverage Target
- >80% coverage for new methods in time-entries.service.js
- 100% route coverage for new endpoints

---

## Definition of Done

- [x] POST /api/v1/time-entries/start endpoint implemented
- [x] GET /api/v1/time-entries/active endpoint implemented
- [x] Routes added BEFORE /:id route in time-entries.routes.js
- [x] Validation schema for start timer request
- [x] getActiveTimer service method implemented
- [x] startTimer service method implemented
- [x] All tests passing
- [x] >80% test coverage for new code
- [x] API follows project conventions (CommonJS, camelCase responses, snake_case DB)
- [x] Error handling uses AppError class
- [x] Error includes existing timer data when TIMER_ALREADY_RUNNING

---

## Notes

- This story builds on Story 4.1 (Time Entries CRUD API) which is now complete
- Routes must be added BEFORE the `/:id` route to prevent Express from matching `/start` as an ID
- Only 'simple' mode entries are considered for active timer detection - this allows future Day Mode coexistence
- The startTime should use server time (not client time) for consistency
- Story 4.3 (Stop Timer) will complement this by stopping the active timer
- Frontend (Story 4.4) will poll /active endpoint to sync timer state

---

## Dependencies

- **Story 4.1 (Done):** Time Entries CRUD API provides base routes, service, and controller
- **Epic 2 (Done):** Authentication middleware for protecting endpoints
- **Epic 3 (Done):** Projects and Categories exist for optional association

## Related Stories

- **Story 4.3:** Will implement stop timer functionality (POST /time-entries/stop)
- **Story 4.4:** Will implement Simple Mode UI using these endpoints
- **Story 4.5-4.6:** Day Mode uses different entry_mode, no conflict with simple timer

---

## Dev Agent Record

### Implementation Date
2026-01-12

### File List
| File | Action | Description |
|------|--------|-------------|
| `backend/routes/time-entries.routes.js` | Modify | Add /start and /active routes before /:id |
| `backend/controllers/time-entries.controller.js` | Modify | Add startTimer and getActive methods |
| `backend/services/time-entries.service.js` | Modify | Add getActiveTimer and startTimer methods |
| `backend/validators/time-entries.validator.js` | Modify | Add startTimerSchema |
| `backend/tests/routes/time-entries.routes.test.js` | Modify | Add integration tests for new endpoints |
| `backend/tests/services/time-entries.service.test.js` | Modify | Add unit tests for new service methods |
| `supabase/migrations/20260112074909_add_active_timer_indexes.sql` | Create | Race condition prevention + query optimization |

### Change Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-01-12 | Initial implementation | Story 4.2 Simple Mode Start Timer |
| 2026-01-12 | Code review completed | Senior Developer Review |
| 2026-01-12 | Adversarial code review #2 | Dev Agent CR workflow |
| 2026-01-12 | Added DB indexes | Race condition prevention + performance |

### Test Coverage
- **time-entries.routes.js**: 100% coverage
- **time-entries.controller.js**: 100% coverage
- **time-entries.service.js**: 93.37% statements, 86.66% branches
- **Total tests for Story 4.2**: 114 tests passing

### Senior Developer Review (AI)

**Review Date:** 2026-01-12
**Reviewer:** Claude Opus 4.5 (AI Senior Developer)
**Status:** APPROVED

#### Code Quality Assessment

**Routes (`time-entries.routes.js`):**
- Routes `/start` and `/active` are correctly placed BEFORE `/:id` to prevent Express route conflicts
- Authentication middleware properly applied
- Validation middleware correctly integrated for startTimerSchema
- JSDoc comments are comprehensive

**Controller (`time-entries.controller.js`):**
- Clean separation of concerns
- Proper use of validatedBody from middleware
- Correct HTTP status codes (201 for timer creation, 200 for getActive)
- Follows project patterns consistently

**Service (`time-entries.service.js`):**
- `getActiveTimer`: Correctly queries for `end_time IS NULL` and `entry_mode = 'simple'`
- `startTimer`: Properly implements the single active timer constraint per user
- Error handling with AppError class is correct
- Error includes existing timer data when TIMER_ALREADY_RUNNING (AC2 compliant)
- Foreign key violations (23503) properly handled for projectId/categoryId
- CamelCase transformation and relation flattening consistent with project patterns

**Validator (`time-entries.validator.js`):**
- `startTimerSchema` correctly validates:
  - projectId: optional, valid UUID
  - categoryId: optional, valid UUID
  - description: optional, max 500 characters
- UUID regex is standard and correct

**Error Handling (`error.middleware.js`):**
- Correctly includes `error.data` in response for TIMER_ALREADY_RUNNING errors
- Comment references Story 4.2 AC2 for traceability

#### Security Assessment
- Authentication required on all endpoints
- User isolation enforced (users only see their own timers)
- Input validation prevents injection attacks
- No sensitive data exposure

#### Acceptance Criteria Verification
- [x] AC1: Start Timer (No Active Timer) - Implemented correctly
- [x] AC2: Start Timer (Timer Already Running) - Returns 400 with TIMER_ALREADY_RUNNING and existing timer data
- [x] AC3: Get Active Timer - Returns active timer or null with project/category details
- [x] AC4: Start Timer with Project/Category - Optional fields validated and FK checked
- [x] AC5: Validation Rules - UUID validation, description max 500 chars
- [x] AC6: User Isolation - Each user can have their own timer independently

#### Test Coverage Assessment
- Unit tests cover all service methods with edge cases
- Integration tests verify HTTP contracts
- Tests for authentication, validation, and error cases
- Coverage exceeds 80% requirement for new code

#### Issues Found: NONE

#### Recommendations (Non-Blocking):
1. Consider adding index on `(user_id, end_time, entry_mode)` for performance optimization on active timer queries (future optimization)
2. Server timestamp is correctly used for startTime (not client time)

**Final Verdict:** Code meets all acceptance criteria, follows project conventions, has comprehensive test coverage, and is production-ready.

---

### Adversarial Code Review #2 (AI)

**Review Date:** 2026-01-12
**Reviewer:** Claude Opus 4.5 (Dev Agent CR Workflow)
**Mode:** Adversarial (find 3-10 issues minimum)

#### Issues Found and Fixed

| Severity | Issue | Resolution |
|----------|-------|------------|
| MEDIUM | **M1: Race Condition** - Between `getActiveTimer()` check and INSERT, concurrent requests could create multiple timers | **FIXED**: Added unique partial index `idx_unique_active_simple_timer` to enforce single active timer at DB level |
| MEDIUM | **M3: Missing Index** - Query `getActiveTimer` filters on `(user_id, end_time IS NULL, entry_mode)` without optimized index | **FIXED**: Added partial index `idx_time_entries_active_timer_lookup` for query optimization |
| LOW | **L1: JSDoc Incomplete** - `startTimer` doesn't document `CREATE_FAILED` error | Deferred - Non-blocking |
| LOW | **L2: Console Logs** - `console.error` in service could expose details in production | Deferred - Recommend structured logger |
| LOW | **L3: Magic Number** - `500` char limit repeated, could be constant | Deferred - Non-blocking |

#### Database Migration Applied

```sql
-- supabase/migrations/20260112074909_add_active_timer_indexes.sql

-- M1: Prevents race condition - only one active simple timer per user
CREATE UNIQUE INDEX idx_unique_active_simple_timer
ON time_entries (user_id)
WHERE end_time IS NULL AND entry_mode = 'simple';

-- M3: Optimizes getActiveTimer query
CREATE INDEX idx_time_entries_active_timer_lookup
ON time_entries (user_id, entry_mode)
WHERE end_time IS NULL;
```

#### Test Results Post-Review
- **Service Tests:** 120/120 passing
- **Route Tests:** 93/93 passing
- **Total:** 213/213 (100%)

**Final Status:** APPROVED - All critical/medium issues resolved, low issues documented for future improvement.
