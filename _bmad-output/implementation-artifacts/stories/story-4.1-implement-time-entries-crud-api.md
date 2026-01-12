# Story 4.1: Implement Time Entries CRUD API

## Story Info
- **Epic:** Epic 4 - Time Tracking - 3 Modes
- **Story ID:** 4.1
- **Status:** done
- **Priority:** High
- **Estimated Effort:** Medium
- **FRs Covered:** FR8, FR14, FR16, FR18 (partial)

## User Story

**As an** employee,
**I want** API endpoints to manage my time entries,
**So that** I can create, view, update and delete my time records.

## Acceptance Criteria

### AC1: Create Time Entry
**Given** an authenticated employee
**When** POST `/api/v1/time-entries` is called with `{ startTime, endTime?, projectId?, categoryId?, description?, entryMode }`
**Then** a new time entry is created for the user
**And** response includes the created entry with calculated duration (if endTime provided)
**And** entry mode is one of: 'simple', 'day', 'template'
**And** response format is `{ success: true, data: { id, userId, startTime, endTime, durationMinutes, projectId, categoryId, description, entryMode, createdAt, updatedAt } }`

### AC2: List Time Entries (Own)
**Given** an authenticated employee
**When** GET `/api/v1/time-entries` is called
**Then** response includes only the user's own time entries
**And** supports date range filter `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
**And** supports pagination via `?page=1&limit=20`
**And** entries are sorted by startTime descending (most recent first)
**And** response format is `{ success: true, data: [...], meta: { pagination: {...} } }`

### AC3: Get Time Entry by ID
**Given** an authenticated employee
**When** GET `/api/v1/time-entries/:id` is called
**Then** response includes the time entry details
**And** returns 404 if entry not found
**And** returns 403 if entry belongs to another user (unless manager)

### AC4: Update Time Entry
**Given** an authenticated employee
**When** PATCH `/api/v1/time-entries/:id` is called with `{ startTime?, endTime?, projectId?, categoryId?, description? }`
**Then** the entry is updated only if:
- The entry belongs to the user
- The associated timesheet is in 'draft' status (or no timesheet exists for that week)
**And** duration is recalculated if startTime or endTime changes
**And** otherwise returns 403 with message "Cannot modify time entry in submitted/validated timesheet"

### AC5: Delete Time Entry
**Given** an authenticated employee
**When** DELETE `/api/v1/time-entries/:id` is called
**Then** the entry is deleted only if:
- The entry belongs to the user
- The associated timesheet is in 'draft' status (or no timesheet exists)
**And** otherwise returns 403 with message "Cannot delete time entry in submitted/validated timesheet"
**And** successful response is `{ success: true, data: { message: "Time entry deleted successfully" } }`

### AC6: Manager Read Access
**Given** an authenticated manager
**When** GET `/api/v1/time-entries` is called
**Then** supports optional `?userId=` filter to view any employee's entries
**And** without userId filter, returns manager's own entries

### AC7: Validation Rules
**Given** invalid input data
**When** any mutation endpoint (POST, PATCH) is called
**Then** response is 400 with validation error details for:
- startTime is required (POST only)
- entryMode must be 'simple', 'day', or 'template' (POST only)
- endTime must be after startTime (if both provided)
- projectId must be valid UUID if provided
- categoryId must be valid UUID if provided
- startTime and endTime must be valid ISO 8601 timestamps

### AC8: Duration Calculation
**Given** a time entry with both startTime and endTime
**When** the entry is created or updated
**Then** durationMinutes is automatically calculated as the difference in minutes
**And** if endTime is null (running timer), durationMinutes is null

---

## Technical Implementation

### Files to Create/Modify

#### 1. Routes - `backend/routes/time-entries.routes.js`
```javascript
// Routes to implement:
// GET    /api/v1/time-entries          - List time entries (own or filtered)
// POST   /api/v1/time-entries          - Create time entry
// GET    /api/v1/time-entries/:id      - Get time entry details
// PATCH  /api/v1/time-entries/:id      - Update time entry
// DELETE /api/v1/time-entries/:id      - Delete time entry
```

#### 2. Controller - `backend/controllers/time-entries.controller.js`
```javascript
// Methods to implement:
// - getAll(req, res)     - List entries with filters and pagination
// - getById(req, res)    - Get single entry
// - create(req, res)     - Create new entry with duration calculation
// - update(req, res)     - Update entry (check timesheet status)
// - remove(req, res)     - Delete entry (check timesheet status)
```

#### 3. Service - `backend/services/time-entries.service.js`
```javascript
// Methods to implement:
// - getAll(userId, options)           - Fetch entries with filters
// - getById(id, requestingUserId, userRole)   - Fetch single entry with permission check
// - create(userId, data)              - Insert entry with duration calculation
// - update(id, userId, data, userRole)        - Update with timesheet check
// - remove(id, userId, userRole)              - Delete with timesheet check
// - calculateDuration(startTime, endTime)     - Helper for duration
// - checkTimesheetStatus(userId, entryDate)   - Check if timesheet allows modification
```

#### 4. Validator - `backend/validators/time-entries.validator.js`
```javascript
// Schemas to implement:
// - createTimeEntrySchema: {
//     startTime: ISO string (required),
//     endTime: ISO string (optional),
//     projectId: UUID (optional),
//     categoryId: UUID (optional),
//     description: string (optional, max 500),
//     entryMode: 'simple' | 'day' | 'template' (required)
//   }
// - updateTimeEntrySchema: {
//     startTime?: ISO string,
//     endTime?: ISO string,
//     projectId?: UUID | null,
//     categoryId?: UUID | null,
//     description?: string
//   }
// - Custom validation: endTime > startTime
```

#### 5. Register Route - `backend/routes/index.js`
```javascript
// Add: router.use('/time-entries', timeEntriesRoutes);
```

### Database Schema Reference

```sql
-- Table: time_entries (already exists from Epic 1)
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  category_id UUID REFERENCES categories(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  description TEXT,
  entry_mode TEXT CHECK (entry_mode IN ('simple', 'day', 'template')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: timesheets (for modification check)
CREATE TABLE timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'validated', 'rejected')),
  -- ...
  UNIQUE(user_id, week_start)
);

-- Indexes
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_start_time ON time_entries(start_time);
```

### API Response Examples

#### POST /api/v1/time-entries
**Request:**
```json
{
  "startTime": "2026-01-12T09:00:00Z",
  "endTime": "2026-01-12T12:30:00Z",
  "projectId": "550e8400-e29b-41d4-a716-446655440001",
  "categoryId": "550e8400-e29b-41d4-a716-446655440002",
  "description": "Working on feature X",
  "entryMode": "simple"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "user-uuid",
    "startTime": "2026-01-12T09:00:00Z",
    "endTime": "2026-01-12T12:30:00Z",
    "durationMinutes": 210,
    "projectId": "550e8400-e29b-41d4-a716-446655440001",
    "categoryId": "550e8400-e29b-41d4-a716-446655440002",
    "description": "Working on feature X",
    "entryMode": "simple",
    "createdAt": "2026-01-12T09:00:05Z",
    "updatedAt": "2026-01-12T09:00:05Z"
  }
}
```

#### GET /api/v1/time-entries?startDate=2026-01-06&endDate=2026-01-12&page=1&limit=20
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "startTime": "2026-01-12T09:00:00Z",
      "endTime": "2026-01-12T12:30:00Z",
      "durationMinutes": 210,
      "projectId": "project-uuid",
      "categoryId": "category-uuid",
      "description": "Working on feature X",
      "entryMode": "simple",
      "createdAt": "2026-01-12T09:00:05Z",
      "updatedAt": "2026-01-12T09:00:05Z",
      "project": {
        "id": "project-uuid",
        "code": "PRJ-001",
        "name": "Time Manager"
      },
      "category": {
        "id": "category-uuid",
        "name": "Development",
        "color": "#3B82F6"
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

#### PATCH /api/v1/time-entries/:id (Forbidden due to timesheet status)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Cannot modify time entry in submitted/validated timesheet"
  }
}
```

### Business Logic Details

#### Timesheet Status Check Logic
When updating or deleting a time entry:
1. Get the entry's start_time date
2. Calculate the week_start for that date (Monday of that week)
3. Check if a timesheet exists for the user with that week_start
4. If timesheet exists and status is NOT 'draft':
   - Block the modification with 403
5. If no timesheet exists OR status is 'draft':
   - Allow the modification

```javascript
// Helper function pseudo-code
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday as start of week
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
};

const checkTimesheetStatus = async (userId, entryDate) => {
  const weekStart = getWeekStart(entryDate);
  const { data: timesheet } = await supabase
    .from('timesheets')
    .select('id, status')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .single();

  if (!timesheet) return { canModify: true };
  if (timesheet.status === 'draft') return { canModify: true };
  return { canModify: false, status: timesheet.status };
};
```

#### Duration Calculation
```javascript
const calculateDuration = (startTime, endTime) => {
  if (!endTime) return null;
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end - start;
  return Math.round(diffMs / 60000); // Convert to minutes
};
```

---

## Testing Requirements

### Unit Tests - `backend/tests/services/time-entries.service.test.js`

**getAll tests:**
- Test returns only user's entries
- Test pagination (page, limit, offset)
- Test date range filtering (startDate, endDate)
- Test sorting by startTime descending
- Test empty result returns empty array

**getById tests:**
- Test returns entry for owner
- Test throws 404 for non-existent entry
- Test throws 403 for non-owner (employee)
- Test allows manager to view any entry

**create tests:**
- Test creates entry with all fields
- Test creates entry with minimal fields (startTime, entryMode)
- Test calculates duration when endTime provided
- Test duration is null when endTime not provided
- Test validates entryMode is one of valid values
- Test validates startTime is required
- Test validates endTime > startTime

**update tests:**
- Test updates entry fields
- Test recalculates duration when times change
- Test blocks update when timesheet is submitted
- Test blocks update when timesheet is validated
- Test allows update when timesheet is draft
- Test allows update when no timesheet exists
- Test throws 404 for non-existent entry
- Test throws 403 for non-owner

**remove tests:**
- Test deletes entry successfully
- Test blocks delete when timesheet is submitted
- Test blocks delete when timesheet is validated
- Test allows delete when timesheet is draft
- Test throws 404 for non-existent entry
- Test throws 403 for non-owner

**Helper function tests:**
- Test calculateDuration with various time differences
- Test getWeekStart returns correct Monday
- Test checkTimesheetStatus for all status scenarios

### Integration Tests - `backend/tests/routes/time-entries.routes.test.js`

**Authentication tests:**
- Test GET /time-entries without auth returns 401
- Test POST /time-entries without auth returns 401
- Test PATCH /time-entries/:id without auth returns 401
- Test DELETE /time-entries/:id without auth returns 401

**Authorization tests:**
- Test employee can only see own entries
- Test employee cannot modify other's entries (403)
- Test manager can view any employee's entries with ?userId=
- Test manager cannot modify other's entries (only view)

**CRUD operation tests:**
- Test GET /time-entries returns entries with pagination
- Test GET /time-entries with date filters
- Test GET /time-entries/:id returns single entry
- Test GET /time-entries/:id with invalid UUID returns 400
- Test GET /time-entries/:id not found returns 404
- Test POST /time-entries creates entry
- Test POST /time-entries with invalid data returns 400
- Test POST /time-entries calculates duration
- Test PATCH /time-entries/:id updates entry
- Test PATCH /time-entries/:id on submitted timesheet returns 403
- Test DELETE /time-entries/:id removes entry
- Test DELETE /time-entries/:id on validated timesheet returns 403

**Edge cases:**
- Test entry with null endTime (running timer)
- Test entry spanning midnight
- Test entry with projectId referencing non-existent project
- Test entry with categoryId referencing inactive category

### Coverage Target
- >80% coverage for time-entries.service.js
- 100% route coverage

---

## Definition of Done

- [x] All routes implemented and registered in `/api/v1/time-entries`
- [x] Controller methods handle all edge cases
- [x] Service layer with proper Supabase queries
- [x] Validation schemas for all inputs (Zod)
- [x] Timesheet status check implemented
- [x] Duration calculation working correctly
- [x] All tests passing
- [x] >80% test coverage (91.79% for service, 100% for controller)
- [x] API follows project conventions (CommonJS, camelCase responses, snake_case DB)
- [x] Error handling uses AppError class
- [x] Response format follows standard wrapper `{ success, data, meta }`

---

## Notes

- Use existing patterns from `categories.routes.js`, `categories.controller.js`, `categories.service.js`
- This story provides the foundation for Stories 4.2-4.3 (Simple Mode Start/Stop)
- Entry mode field allows tracking which mode created the entry (for analytics)
- The timesheet check is crucial for data integrity - entries in submitted/validated timesheets must not be modified
- Project and category relations should be included in list response for display purposes
- Consider adding index on `(user_id, start_time)` for efficient date range queries

---

## Dependencies

- **Epic 1 (Done):** Database schema with time_entries and timesheets tables
- **Epic 2 (Done):** Authentication middleware and RBAC
- **Epic 3 (Done):** Projects and Categories exist for reference

## Related Stories

- **Story 4.2:** Will use this API to implement start timer
- **Story 4.3:** Will use this API to implement stop timer
- **Story 5.1:** Timesheets CRUD will interact with time entries

---

## Dev Agent Record

### Implementation Date
2026-01-12

### File List
| File | Action | Description |
|------|--------|-------------|
| `backend/routes/time-entries.routes.js` | Create | Time entries CRUD routes with auth middleware |
| `backend/controllers/time-entries.controller.js` | Create | Controller with getAll, getById, create, update, remove |
| `backend/services/time-entries.service.js` | Create | Service layer with Supabase queries and timesheet checks |
| `backend/validators/time-entries.validator.js` | Create | Zod validation schemas |
| `backend/routes/index.js` | Modify | Add time-entries routes registration |
| `backend/tests/routes/time-entries.routes.test.js` | Create | Integration tests (34 tests) |
| `backend/tests/services/time-entries.service.test.js` | Create | Unit tests for service layer (51 tests) |

### Change Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-01-12 | Initial implementation | Story 4.1 Time Entries CRUD API |
| 2026-01-12 | Added validateUUID middleware to :id and :blockId routes | Code Review - Security consistency |
| 2026-01-12 | Changed checkTimesheetStatus to fail-closed on DB error | Code Review - Data integrity |

### Test Coverage
```
time-entries.service.js    |      84 |    75.8 |   96.66 |   83.75 |
time-entries.controller.js |     100 |      100 |     100 |     100 |
time-entries.routes.js     |     100 |      100 |     100 |     100 |
time-entries.validator.js  |   81.25 |    66.66 |   71.42 |   81.25 |

Test Suites: 2 passed, 2 total
Tests:       213 passed, 213 total (includes Stories 4.2, 4.3, 4.5, 4.6)
```

### Senior Developer Review (AI)
**Date:** 2026-01-12
**Reviewer:** Claude Opus 4.5 (Senior Developer)
**Outcome:** APPROVED

#### Review Summary
Code review completed successfully. All acceptance criteria implemented correctly.

#### Code Quality: EXCELLENT
- Architecture follows project patterns (service/controller/routes/validators)
- Proper use of camelCase responses, snake_case database fields
- AppError class used consistently for error handling
- JSDoc documentation complete on all exported functions
- Transformers (snakeToCamel, camelToSnake) properly applied

#### Security: PASS
- All routes protected by `authenticate` middleware
- Ownership verification on all mutations (userId check)
- Manager read access properly scoped (view only, cannot modify others' entries)
- Input validation via Zod schemas (UUID format, ISO timestamps, entry modes)
- Timesheet status check prevents modification of submitted/validated entries (AC4, AC5)

#### Test Coverage: EXCEEDS REQUIREMENTS
| Component | Stmts | Branch | Funcs | Lines |
|-----------|-------|--------|-------|-------|
| time-entries.service.js | 91.79% | 83.87% | 100% | 91.6% |
| time-entries.controller.js | 100% | 100% | 100% | 100% |
| time-entries.routes.js | 100% | 100% | 100% | 100% |
| **Total Tests: 85 passed** | | | | |

#### Acceptance Criteria Verification
- AC1: Create Time Entry - PASS
- AC2: List Time Entries (Own) - PASS
- AC3: Get Time Entry by ID - PASS
- AC4: Update Time Entry - PASS
- AC5: Delete Time Entry - PASS
- AC6: Manager Read Access - PASS
- AC7: Validation Rules - PASS
- AC8: Duration Calculation - PASS

#### Issues Found: None critical
Minor uncovered lines (334, 369-381, 385) are edge case error handlers that are difficult to mock but do not affect functionality.

#### Recommendations (future stories)
1. Consider adding UUID validation middleware on `:id` routes
2. `ENTRY_MODES` constant could be shared if reused elsewhere
