# Story 3.3: Implement Projects CRUD API

## Story Info
- **Epic:** Epic 3 - Admin Data Management
- **Story ID:** 3.3
- **Status:** done
- **Priority:** High
- **Estimated Effort:** Medium
- **FRs Covered:** FR46-FR48, FR50

## User Story

**As a** manager,
**I want to** create, view, update, and archive projects,
**So that** I can track time against specific work items.

## Acceptance Criteria

### AC1: Create Project
**Given** an authenticated manager
**When** POST `/api/v1/projects` is called with `{ name, description?, budgetHours? }`
**Then** a new project is created
**And** a unique code is auto-generated (e.g., "PRJ-001", "PRJ-002")
**And** response includes `{ success: true, data: { id, code, name, description, budgetHours, status: "active", createdAt } }`

### AC2: List Projects (All Users)
**Given** an authenticated user (any role)
**When** GET `/api/v1/projects` is called
**Then** response includes list of active projects
**And** supports pagination via `?page=1&limit=20`
**And** supports `?includeArchived=true` filter (manager only - returns all projects)
**And** response includes total hours tracked per project

### AC3: Get Project Details
**Given** an authenticated user
**When** GET `/api/v1/projects/:id` is called
**Then** response includes project details with:
- Project info (id, code, name, description, budgetHours, status, timestamps)
- Total hours tracked
- Teams assigned (if any)

### AC4: Update Project
**Given** an authenticated manager
**When** PATCH `/api/v1/projects/:id` is called with `{ name?, description?, budgetHours? }`
**Then** project details are updated (code is immutable)
**And** response includes updated project data

### AC5: Archive Project
**Given** an authenticated manager
**When** POST `/api/v1/projects/:id/archive` is called
**Then** project status changes to "archived"
**And** archived projects are excluded from default list

### AC6: Restore Project
**Given** an authenticated manager
**When** POST `/api/v1/projects/:id/restore` is called
**Then** project status changes back to "active"

### AC7: Authorization for Mutations
**Given** an employee tries any project mutation endpoint (POST, PATCH, DELETE, archive, restore)
**When** the request is processed
**Then** response is 403 Forbidden

### AC8: Auto-generated Code Format
**Given** existing projects PRJ-001, PRJ-002, PRJ-005
**When** a new project is created
**Then** the code is PRJ-006 (next sequential number)

---

## Technical Implementation

### Files to Create/Modify

#### 1. Routes - `backend/routes/projects.routes.js`
```javascript
// Routes to implement:
// GET    /api/v1/projects              - List all projects (any auth user)
// POST   /api/v1/projects              - Create project (manager only)
// GET    /api/v1/projects/:id          - Get project details (any auth user)
// PATCH  /api/v1/projects/:id          - Update project (manager only)
// POST   /api/v1/projects/:id/archive  - Archive project (manager only)
// POST   /api/v1/projects/:id/restore  - Restore project (manager only)
```

#### 2. Controller - `backend/controllers/projects.controller.js`
```javascript
// Methods to implement:
// - getAll(req, res)     - List projects with filtering
// - getById(req, res)    - Get project with details
// - create(req, res)     - Create new project with auto-code
// - update(req, res)     - Update project (not code)
// - archive(req, res)    - Set status to archived
// - restore(req, res)    - Set status to active
```

#### 3. Service - `backend/services/projects.service.js`
```javascript
// Methods to implement:
// - getAll(filters, page, limit)   - Fetch projects with optional archived filter
// - getById(id)                    - Fetch project with teams and hours
// - create(data)                   - Generate code and insert
// - update(id, data)               - Update project
// - archive(id)                    - Set status = 'archived'
// - restore(id)                    - Set status = 'active'
// - generateNextCode()             - Generate PRJ-XXX code
```

#### 4. Validator - `backend/validators/projects.validator.js`
```javascript
// Schemas to implement:
// - createProjectSchema: { name: required 1-100, description?: max 500, budgetHours?: number >= 0 }
// - updateProjectSchema: { name?: 1-100, description?: max 500, budgetHours?: number >= 0 }
```

#### 5. Register Route - `backend/routes/index.js`
```javascript
// Add: router.use('/projects', projectsRoutes);
```

### Database Schema Reference

```sql
-- Table: projects (already exists from Epic 1)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  budget_hours INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Response Examples

#### GET /api/v1/projects
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "PRJ-001",
      "name": "Time Manager",
      "description": "Main project",
      "budgetHours": 500,
      "status": "active",
      "totalHoursTracked": 120.5,
      "createdAt": "2026-01-10T10:00:00Z",
      "updatedAt": "2026-01-10T10:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

#### POST /api/v1/projects
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "PRJ-006",
    "name": "New Project",
    "description": "Description",
    "budgetHours": 100,
    "status": "active",
    "createdAt": "2026-01-10T10:00:00Z",
    "updatedAt": "2026-01-10T10:00:00Z"
  }
}
```

---

## Testing Requirements

### Unit Tests - `backend/tests/services/projects.service.test.js`
- Test getAll returns active projects by default
- Test getAll with includeArchived returns all
- Test getAll returns totalHoursTracked
- Test getById returns project with teams
- Test getById throws 404 for non-existent
- Test create generates sequential code
- Test create with first project generates PRJ-001
- Test update project successfully (not code)
- Test archive sets status to archived
- Test restore sets status to active
- Test generateNextCode logic

### Integration Tests - `backend/tests/routes/projects.routes.test.js`
- Test GET /projects without auth returns 401
- Test GET /projects as employee returns active projects only
- Test GET /projects as manager with ?includeArchived=true works
- Test POST /projects as employee returns 403
- Test POST /projects as manager creates project
- Test POST /projects validates required fields
- Test GET /projects/:id returns project details
- Test PATCH /projects/:id as manager updates
- Test POST /projects/:id/archive archives project
- Test POST /projects/:id/restore restores project

---

## Definition of Done

- [x] All routes implemented and registered
- [x] Auto-generated code PRJ-XXX working correctly
- [x] All users can READ, only managers can WRITE
- [x] Archive/Restore functionality working
- [x] All tests passing
- [x] >80% test coverage

---

## Notes

- Code generation must be atomic to prevent duplicates (use transaction or DB sequence)
- READ endpoints are available to all authenticated users (employees need to select projects)
- WRITE endpoints are manager-only
- Total hours tracked = SUM of time_entries.duration_minutes for this project

---

## Dev Agent Record

### File List
- `backend/routes/projects.routes.js` - Routes with RBAC and UUID validation
- `backend/controllers/projects.controller.js` - Controller layer
- `backend/services/projects.service.js` - Service layer with business logic
- `backend/validators/projects.validator.js` - Zod validation schemas
- `backend/routes/index.js` - Route registration
- `backend/tests/services/projects.service.test.js` - Service unit tests
- `backend/tests/routes/projects.routes.test.js` - Route integration tests

### Change Log
| Date | Change | Author |
|------|--------|--------|
| 2026-01-11 | Initial implementation | Dev Agent |
| 2026-01-11 | Code Review fixes: Fixed alphabetical sort bug in generateNextCode (PRJ-999 vs PRJ-1000), Added retry mechanism for race conditions, Added UUID validation on route params | Amelia (Code Review) |

### Senior Developer Review (AI)
**Date:** 2026-01-11
**Reviewer:** Amelia (Dev Agent)
**Outcome:** APPROVED

**Issues Found & Fixed:**
1. **CRITICAL - Alphabetical Sort Bug:** `generateNextCode()` used alphabetical sorting which fails for codes >3 digits (PRJ-999 > PRJ-1000 alphabetically). Fixed to use numeric comparison.
2. **CRITICAL - Race Condition:** Code generation was not atomic. Added retry mechanism with max 3 retries on duplicate key errors.
3. **HIGH - Missing UUID Validation:** Routes with `:id` param had no UUID validation. Added `validateUUID('id')` middleware to all routes.
4. **HIGH - Null code handling:** Added null check for malformed project codes in generateNextCode.

**Test Results:** 81 tests passing, 97.67% coverage on projects.service.js
