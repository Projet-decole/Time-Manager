# Story 4.5: Implement Day Mode - Day Start/End API

## Story Info
- **Epic:** Epic 4 - Time Tracking - 3 Modes
- **Story ID:** 4.5
- **Status:** done
- **Priority:** High
- **Estimated Effort:** Medium
- **FRs Covered:** FR19, FR20, FR21 (partial)
- **Depends On:** Stories 4.1, 4.2, 4.3, 4.4 (all completed)

## User Story

**As an** employee,
**I want to** record when I start and end my workday,
**So that** I can manage my daily time blocks.

## Acceptance Criteria

### AC1: Start Day
**Given** an authenticated employee
**When** POST `/api/v1/time-entries/day/start` is called
**Then** a new "day container" entry is created with:
- `startTime` = now
- `endTime` = null
- `entryMode` = 'day'
**And** response includes the day entry with format:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "user-uuid",
    "startTime": "2026-01-12T08:00:00Z",
    "endTime": null,
    "durationMinutes": null,
    "projectId": null,
    "categoryId": null,
    "description": null,
    "entryMode": "day",
    "parentId": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### AC2: Prevent Multiple Active Days
**Given** an employee with an active day (endTime = null, entryMode = 'day')
**When** POST `/api/v1/time-entries/day/start` is called
**Then** response is 400 with:
```json
{
  "success": false,
  "error": {
    "code": "DAY_ALREADY_ACTIVE",
    "message": "A day is already in progress",
    "data": { /* existing active day entry */ }
  }
}
```

### AC3: End Day
**Given** an employee with an active day
**When** POST `/api/v1/time-entries/day/end` is called
**Then** the day entry is updated with:
- `endTime` = now
- `durationMinutes` = calculated from startTime to endTime
**And** response includes the completed day with all its child time blocks:
```json
{
  "success": true,
  "data": {
    "id": "day-uuid",
    "userId": "user-uuid",
    "startTime": "2026-01-12T08:00:00Z",
    "endTime": "2026-01-12T17:30:00Z",
    "durationMinutes": 570,
    "entryMode": "day",
    "blocks": [
      {
        "id": "block-uuid",
        "startTime": "2026-01-12T08:00:00Z",
        "endTime": "2026-01-12T12:00:00Z",
        "durationMinutes": 240,
        "projectId": "project-uuid",
        "categoryId": "category-uuid",
        "description": "Morning development",
        "project": { "id": "...", "code": "PRJ-001", "name": "Project A" },
        "category": { "id": "...", "name": "Development", "color": "#3B82F6" }
      }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### AC4: End Day - No Active Day
**Given** an employee with no active day
**When** POST `/api/v1/time-entries/day/end` is called
**Then** response is 404 with:
```json
{
  "success": false,
  "error": {
    "code": "NO_ACTIVE_DAY",
    "message": "No active day found"
  }
}
```

### AC5: Get Active Day
**Given** an employee with an active day
**When** GET `/api/v1/time-entries/day/active` is called
**Then** response includes the day entry and its time blocks (child entries):
```json
{
  "success": true,
  "data": {
    "id": "day-uuid",
    "userId": "user-uuid",
    "startTime": "2026-01-12T08:00:00Z",
    "endTime": null,
    "durationMinutes": null,
    "entryMode": "day",
    "blocks": [
      {
        "id": "block-uuid",
        "startTime": "2026-01-12T08:00:00Z",
        "endTime": "2026-01-12T10:00:00Z",
        "durationMinutes": 120,
        "projectId": "project-uuid",
        "categoryId": "category-uuid",
        "description": "Task work",
        "project": { ... },
        "category": { ... }
      }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### AC6: Get Active Day - No Active Day
**Given** an employee with no active day
**When** GET `/api/v1/time-entries/day/active` is called
**Then** response is:
```json
{
  "success": true,
  "data": null
}
```

### AC7: Day and Simple Timer Coexistence
**Given** an employee with an active day
**When** the employee tries to start a simple timer via `/api/v1/time-entries/start`
**Then** the simple timer can coexist with the day container (independent tracking modes)
**Note:** Day mode and Simple mode operate independently. They don't interfere with each other.

### AC8: Optional Day Start Parameters
**Given** an authenticated employee
**When** POST `/api/v1/time-entries/day/start` is called with optional `{ description }`
**Then** the day entry is created with the provided description
**And** description can be updated later via standard PATCH endpoint

---

## Technical Implementation

### Files to Create/Modify

#### 1. Routes - `backend/routes/time-entries.routes.js` (Modify)
Add new routes for Day Mode:
```javascript
// Day Mode routes (Story 4.5)
// POST /api/v1/time-entries/day/start  - Start a workday
// POST /api/v1/time-entries/day/end    - End the workday
// GET  /api/v1/time-entries/day/active - Get active day with blocks
```

#### 2. Controller - `backend/controllers/time-entries.controller.js` (Modify)
Add new controller methods:
```javascript
// Methods to add:
// - startDay(req, res)      - Start a new workday
// - endDay(req, res)        - End the active workday
// - getActiveDay(req, res)  - Get active day with child blocks
```

#### 3. Service - `backend/services/time-entries.service.js` (Modify)
Add new service methods:
```javascript
// Methods to add:
// - getActiveDay(userId)         - Find active day entry for user
// - startDay(userId, data)       - Create day container entry
// - endDay(userId)               - Complete day and return with blocks
// - getDayWithBlocks(dayId, userId)  - Get day entry with child time blocks
```

#### 4. Validator - `backend/validators/time-entries.validator.js` (Modify)
Add new validation schemas:
```javascript
// Schemas to add:
// - startDaySchema: { description?: string (max 500) }
```

### Database Schema Reference

The `time_entries` table already supports Day Mode entries. The key distinction is:
- `entry_mode = 'day'` for day container entries
- `parent_id` (to be added) references the day container for time blocks

**Required Schema Update (if parent_id doesn't exist):**
```sql
-- Add parent_id column if not already present
ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES time_entries(id) ON DELETE CASCADE;

-- Index for efficient child lookup
CREATE INDEX IF NOT EXISTS idx_time_entries_parent_id ON time_entries(parent_id);
```

**Note:** If `parent_id` column already exists, skip the migration. Check Story 1.2 for the original schema.

### API Endpoints Specification

#### POST /api/v1/time-entries/day/start
**Request:**
```json
{
  "description": "Working from home" // optional
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-uuid",
    "startTime": "2026-01-12T08:00:00Z",
    "endTime": null,
    "durationMinutes": null,
    "projectId": null,
    "categoryId": null,
    "description": "Working from home",
    "entryMode": "day",
    "parentId": null,
    "createdAt": "2026-01-12T08:00:05Z",
    "updatedAt": "2026-01-12T08:00:05Z"
  }
}
```
**Error (400 - Day already active):**
```json
{
  "success": false,
  "error": {
    "code": "DAY_ALREADY_ACTIVE",
    "message": "A day is already in progress",
    "data": { /* existing active day */ }
  }
}
```

#### POST /api/v1/time-entries/day/end
**Request:** No body required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "day-uuid",
    "userId": "user-uuid",
    "startTime": "2026-01-12T08:00:00Z",
    "endTime": "2026-01-12T17:30:00Z",
    "durationMinutes": 570,
    "projectId": null,
    "categoryId": null,
    "description": "Working from home",
    "entryMode": "day",
    "parentId": null,
    "blocks": [
      {
        "id": "block-1-uuid",
        "startTime": "2026-01-12T08:00:00Z",
        "endTime": "2026-01-12T12:00:00Z",
        "durationMinutes": 240,
        "projectId": "project-uuid",
        "categoryId": "category-uuid",
        "description": "Feature development",
        "entryMode": "day",
        "parentId": "day-uuid",
        "project": { "id": "...", "code": "PRJ-001", "name": "Time Manager" },
        "category": { "id": "...", "name": "Development", "color": "#3B82F6" }
      }
    ],
    "createdAt": "2026-01-12T08:00:05Z",
    "updatedAt": "2026-01-12T17:30:00Z"
  }
}
```
**Error (404 - No active day):**
```json
{
  "success": false,
  "error": {
    "code": "NO_ACTIVE_DAY",
    "message": "No active day found"
  }
}
```

#### GET /api/v1/time-entries/day/active
**Response (200 OK - Active day exists):**
```json
{
  "success": true,
  "data": {
    "id": "day-uuid",
    "userId": "user-uuid",
    "startTime": "2026-01-12T08:00:00Z",
    "endTime": null,
    "durationMinutes": null,
    "description": "Working from home",
    "entryMode": "day",
    "parentId": null,
    "blocks": [
      {
        "id": "block-uuid",
        "startTime": "2026-01-12T08:00:00Z",
        "endTime": "2026-01-12T10:00:00Z",
        "durationMinutes": 120,
        "projectId": "project-uuid",
        "categoryId": "category-uuid",
        "description": "Morning work",
        "project": { ... },
        "category": { ... }
      }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```
**Response (200 OK - No active day):**
```json
{
  "success": true,
  "data": null
}
```

### Business Logic Details

#### Active Day Detection
```javascript
// An active day is a time entry where:
// - entry_mode = 'day'
// - end_time IS NULL
// - parent_id IS NULL (not a child block)
const getActiveDay = async (userId) => {
  const { data, error } = await supabase
    .from('time_entries')
    .select('...')
    .eq('user_id', userId)
    .eq('entry_mode', 'day')
    .is('end_time', null)
    .is('parent_id', null)  // Only parent day entries, not blocks
    .maybeSingle();

  return data;
};
```

#### Day with Blocks Query
```javascript
// Fetch day entry with all child blocks
const getDayWithBlocks = async (dayId, userId) => {
  // 1. Get the day entry
  const dayEntry = await getById(dayId, userId, 'employee');

  // 2. Get all child blocks for this day
  const { data: blocks } = await supabase
    .from('time_entries')
    .select(`
      id, user_id, project_id, category_id, start_time, end_time,
      duration_minutes, description, entry_mode, parent_id,
      created_at, updated_at,
      projects:project_id (id, code, name),
      categories:category_id (id, name, color)
    `)
    .eq('parent_id', dayId)
    .eq('user_id', userId)
    .order('start_time', { ascending: true });

  return { ...dayEntry, blocks: blocks || [] };
};
```

#### End Day Logic
```javascript
const endDay = async (userId) => {
  // 1. Find active day
  const activeDay = await getActiveDay(userId);
  if (!activeDay) {
    throw new AppError('No active day found', 404, 'NO_ACTIVE_DAY');
  }

  // 2. Update day with end time
  const endTime = new Date().toISOString();
  const startTime = new Date(activeDay.startTime);
  const durationMinutes = Math.round((new Date(endTime) - startTime) / 60000);

  // 3. Update in database
  await supabase
    .from('time_entries')
    .update({
      end_time: endTime,
      duration_minutes: durationMinutes,
      updated_at: endTime
    })
    .eq('id', activeDay.id);

  // 4. Return day with blocks
  return getDayWithBlocks(activeDay.id, userId);
};
```

---

## Testing Requirements

### Unit Tests - `backend/tests/services/time-entries.service.test.js` (Add)

**getActiveDay tests:**
- Test returns null when no active day exists
- Test returns active day entry when one exists
- Test ignores completed days (end_time not null)
- Test ignores non-day entries (entry_mode !== 'day')
- Test ignores child blocks (parent_id not null)
- Test returns only user's own active day

**startDay tests:**
- Test creates day entry with correct fields
- Test startTime is set to current time
- Test entryMode is 'day'
- Test endTime is null
- Test throws DAY_ALREADY_ACTIVE if day already active
- Test includes existing day in error data
- Test creates day with optional description
- Test description defaults to null

**endDay tests:**
- Test updates day with endTime
- Test calculates durationMinutes correctly
- Test throws NO_ACTIVE_DAY if no active day
- Test returns day with blocks after ending
- Test handles day with no blocks
- Test handles day with multiple blocks
- Test blocks are sorted by startTime ascending

**getDayWithBlocks tests:**
- Test returns day entry with empty blocks array
- Test returns day entry with child blocks
- Test blocks include project and category relations
- Test throws NOT_FOUND for invalid dayId
- Test throws FORBIDDEN for other user's day

### Integration Tests - `backend/tests/routes/time-entries.routes.test.js` (Add)

**Authentication tests:**
- Test POST /time-entries/day/start without auth returns 401
- Test POST /time-entries/day/end without auth returns 401
- Test GET /time-entries/day/active without auth returns 401

**Start Day tests:**
- Test POST /time-entries/day/start creates day entry (201)
- Test POST /time-entries/day/start with description
- Test POST /time-entries/day/start when day active returns 400
- Test response format matches specification

**End Day tests:**
- Test POST /time-entries/day/end completes day (200)
- Test POST /time-entries/day/end when no active day returns 404
- Test response includes blocks
- Test duration is calculated correctly

**Get Active Day tests:**
- Test GET /time-entries/day/active returns active day with blocks
- Test GET /time-entries/day/active returns null when no active day
- Test blocks are included in response

**Coexistence tests:**
- Test can start simple timer while day is active
- Test can have active day while simple timer is running
- Test day mode and simple mode are independent

### Coverage Target
- >80% coverage for new service methods
- 100% coverage for new routes
- All acceptance criteria verified

---

## Definition of Done

- [x] `parent_id` column exists in time_entries table (check/add if needed)
- [x] Routes for day/start, day/end, day/active implemented
- [x] Controller methods startDay, endDay, getActiveDay implemented
- [x] Service methods for Day Mode implemented
- [x] Validator for startDaySchema created
- [x] All tests passing
- [x] >80% test coverage for new code
- [x] API follows project conventions (CommonJS, camelCase responses, snake_case DB)
- [x] Error handling uses AppError class
- [x] Response format follows standard wrapper `{ success, data, meta }`
- [x] JSDoc documentation on all new methods

---

## Notes

- Day Mode entries are distinct from Simple Mode entries via `entry_mode` field
- A day entry can have child time blocks (tracked via `parent_id`)
- Story 4.6 will implement the time block management API (CRUD for blocks within a day)
- Story 4.7 will implement the Day Mode UI with timeline visualization
- The `parent_id` column allows hierarchical time entries (day contains blocks)
- Day entries don't have project/category - only their blocks do
- Use existing patterns from Simple Mode (Stories 4.2, 4.3) for consistency

### Comparison with Simple Mode

| Aspect | Simple Mode | Day Mode |
|--------|-------------|----------|
| Entry Type | Single standalone entry | Container with child blocks |
| entry_mode | 'simple' | 'day' |
| Has parent | No (parent_id = null) | No (parent_id = null for container) |
| Has children | No | Yes (blocks with parent_id = day_id) |
| Project/Category | On entry itself | On child blocks only |
| Duration | Calculated on stop | Sum of blocks or container duration |

---

## Dependencies

- **Story 4.1 (Done):** Time Entries CRUD API - Base infrastructure
- **Story 4.2 (Done):** Start Timer API - Pattern for start endpoint
- **Story 4.3 (Done):** Stop Timer API - Pattern for stop/end endpoint
- **Story 4.4 (Done):** Simple Mode UI - Frontend patterns established
- **Epic 1 (Done):** Database schema with time_entries table
- **Epic 2 (Done):** Authentication middleware

## Related Stories

- **Story 4.6 (Next):** Day Mode Time Block Management API
- **Story 4.7:** Day Mode UI with Timeline
- **Story 4.8-4.10:** Template Mode (uses Day Mode concepts)

---

## Implementation Notes for Developer

### Step 1: Check Database Schema
First verify if `parent_id` column exists in `time_entries` table. If not, create a migration:

```javascript
// Check via Supabase dashboard or:
// SELECT column_name FROM information_schema.columns
// WHERE table_name = 'time_entries' AND column_name = 'parent_id';
```

### Step 2: Add Routes (in order before /:id routes)
Routes must be added before the `/:id` parameter routes to avoid conflicts:

```javascript
// Add BEFORE router.get('/:id', ...)
router.post('/day/start', authenticate, validate(startDaySchema), asyncHandler(timeEntriesController.startDay));
router.post('/day/end', authenticate, asyncHandler(timeEntriesController.endDay));
router.get('/day/active', authenticate, asyncHandler(timeEntriesController.getActiveDay));
```

### Step 3: Implement Service Methods
Follow the pattern established in Stories 4.2/4.3 for consistency.

### Step 4: Write Tests
Use existing test patterns from `time-entries.routes.test.js` and `time-entries.service.test.js`.

---

## Dev Agent Record

### Implementation Date
2026-01-12

### File List
| File | Action | Description |
|------|--------|-------------|
| `backend/routes/time-entries.routes.js` | Modify | Add day/start (line 72), day/end (line 80), day/active (line 88) routes |
| `backend/controllers/time-entries.controller.js` | Modify | Add startDay (lines 158-172), endDay (lines 177-189), getActiveDay (lines 192-205) |
| `backend/services/time-entries.service.js` | Modify | Add getActiveDay (659-690), getDayWithBlocks (700-777), startDay (788-835), endDay (844-879) |
| `backend/validators/time-entries.validator.js` | Modify | Add startDaySchema (lines 183-189) |
| `backend/tests/routes/time-entries.routes.test.js` | Modify | Add Day Mode route tests |
| `backend/tests/services/time-entries.service.test.js` | Modify | Add Day Mode service tests (getActiveDay, startDay, endDay) |
| `supabase/migrations/20260112140000_add_parent_id_to_time_entries.sql` | Create | Add parent_id column with indexes |

### Change Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-01-12 | Initial implementation | Story 4.5 Day Mode Day Start/End API |
| 2026-01-12 | Code Review - Updated status and documentation | Story was implemented but marked ready-for-dev |

### Test Coverage
| File | Statements | Branches | Functions | Lines |
|------|------------|----------|-----------|-------|
| time-entries.service.js | 84% | 75.8% | 96.66% | 83.75% |
| time-entries.controller.js | 100% | 100% | 100% | 100% |
| time-entries.routes.js | 100% | 100% | 100% | 100% |
| time-entries.validator.js | 81.25% | 66.66% | 71.42% | 81.25% |

**All tests passing: 213/213** (includes Stories 4.1-4.6)

### Senior Developer Review (AI)
**Reviewer:** Claude Opus 4.5
**Date:** 2026-01-12
**Status:** APPROVED

#### Acceptance Criteria Verification
- [x] AC1: Start Day - Creates day entry with entryMode='day', parentId=null
- [x] AC2: Prevent Multiple Active Days - DAY_ALREADY_ACTIVE with existing day data
- [x] AC3: End Day - Updates with endTime, durationMinutes, returns blocks
- [x] AC4: End Day - No Active Day - Returns NO_ACTIVE_DAY 404
- [x] AC5: Get Active Day - Returns day with blocks array
- [x] AC6: Get Active Day - No Active - Returns { success: true, data: null }
- [x] AC7: Coexistence - Simple and Day modes are independent (different entry_mode checks)
- [x] AC8: Optional Description - startDaySchema accepts optional description

#### Code Quality
- Clean separation of concerns (controller → service → DB)
- Proper error handling with AppError class
- JSDoc documentation on all methods
- snakeToCamel transformation for consistent API responses
- Child blocks sorted by startTime ascending
