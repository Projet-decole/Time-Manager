# Story 3.1: Implement Teams CRUD API

## Story Info
- **Epic:** Epic 3 - Admin Data Management
- **Story ID:** 3.1
- **Status:** done
- **Priority:** High
- **Estimated Effort:** Medium
- **FRs Covered:** FR40-FR45

## User Story

**As a** manager,
**I want to** create, view, update, and delete teams,
**So that** I can organize employees into groups.

## Acceptance Criteria

### AC1: Create Team
**Given** an authenticated manager
**When** POST `/api/v1/teams` is called with `{ name, description }`
**Then** a new team is created
**And** response includes `{ success: true, data: { id, name, description, createdAt, updatedAt } }`

### AC2: List Teams
**Given** an authenticated manager
**When** GET `/api/v1/teams` is called
**Then** response includes list of all teams with member counts
**And** supports pagination via `?page=1&limit=20`
**And** response format is `{ success: true, data: [...], meta: { pagination: {...} } }`

### AC3: Get Team Details
**Given** an authenticated manager
**When** GET `/api/v1/teams/:id` is called
**Then** response includes team details with:
- Team info (id, name, description, timestamps)
- List of members (user profiles)
- List of assigned projects (if any)

### AC4: Update Team
**Given** an authenticated manager
**When** PATCH `/api/v1/teams/:id` is called with `{ name?, description? }`
**Then** team name/description is updated
**And** response includes updated team data

### AC5: Delete Team
**Given** an authenticated manager
**When** DELETE `/api/v1/teams/:id` is called
**Then** team is deleted (cascade removes team_members, team_projects)
**And** response is `{ success: true, data: { message: "Team deleted successfully" } }`

### AC6: Authorization Check
**Given** an employee tries any team mutation endpoint (POST, PATCH, DELETE)
**When** the request is processed
**Then** response is 403 Forbidden with `{ success: false, error: { code: "FORBIDDEN", message: "..." } }`

### AC7: Validation
**Given** invalid data (empty name, name too long, etc.)
**When** any mutation endpoint is called
**Then** response is 400 with validation error details

---

## Technical Implementation

### Files to Create/Modify

#### 1. Routes - `backend/routes/teams.routes.js`
```javascript
// Routes to implement:
// GET    /api/v1/teams          - List all teams (manager only)
// POST   /api/v1/teams          - Create team (manager only)
// GET    /api/v1/teams/:id      - Get team details (manager only)
// PATCH  /api/v1/teams/:id      - Update team (manager only)
// DELETE /api/v1/teams/:id      - Delete team (manager only)
```

#### 2. Controller - `backend/controllers/teams.controller.js`
```javascript
// Methods to implement:
// - getAll(req, res)     - List teams with pagination and member counts
// - getById(req, res)    - Get team with members and projects
// - create(req, res)     - Create new team
// - update(req, res)     - Update team
// - remove(req, res)     - Delete team (soft or hard delete)
```

#### 3. Service - `backend/services/teams.service.js`
```javascript
// Methods to implement:
// - getAll(page, limit)          - Fetch teams with member counts
// - getById(id)                  - Fetch team with relations
// - create(data)                 - Insert new team
// - update(id, data)             - Update team
// - remove(id)                   - Delete team (cascade)
```

#### 4. Validator - `backend/validators/teams.validator.js`
```javascript
// Schemas to implement:
// - createTeamSchema: { name: string (required, 1-100 chars), description?: string (max 500) }
// - updateTeamSchema: { name?: string, description?: string }
```

#### 5. Register Route - `backend/routes/index.js`
```javascript
// Add: router.use('/teams', teamsRoutes);
```

### Database Schema Reference

```sql
-- Table: teams (already exists from Epic 1)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: team_members (for member counts)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);
```

### API Response Examples

#### GET /api/v1/teams
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Engineering",
      "description": "Development team",
      "memberCount": 5,
      "createdAt": "2026-01-10T10:00:00Z",
      "updatedAt": "2026-01-10T10:00:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1
    }
  }
}
```

#### GET /api/v1/teams/:id
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Engineering",
    "description": "Development team",
    "createdAt": "2026-01-10T10:00:00Z",
    "updatedAt": "2026-01-10T10:00:00Z",
    "members": [
      {
        "id": "user-uuid",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "employee"
      }
    ],
    "projects": [
      {
        "id": "project-uuid",
        "code": "PRJ-001",
        "name": "Time Manager"
      }
    ]
  }
}
```

---

## Testing Requirements

### Unit Tests - `backend/tests/services/teams.service.test.js`
- Test getAll with pagination
- Test getAll returns member counts
- Test getById returns team with relations
- Test getById throws 404 for non-existent team
- Test create team successfully
- Test create team with missing name fails validation
- Test update team successfully
- Test update non-existent team throws 404
- Test delete team successfully
- Test delete cascades to team_members

### Integration Tests - `backend/tests/routes/teams.routes.test.js`
- Test GET /teams without auth returns 401
- Test GET /teams as employee returns 403
- Test GET /teams as manager returns teams
- Test POST /teams creates team
- Test POST /teams with invalid data returns 400
- Test GET /teams/:id returns team with relations
- Test GET /teams/:id with invalid id returns 404
- Test PATCH /teams/:id updates team
- Test DELETE /teams/:id removes team

### Coverage Target
- >80% coverage for teams.service.js
- 100% route coverage

---

## Definition of Done

- [x] All routes implemented and registered
- [x] Controller methods handle all edge cases
- [x] Service layer with proper Supabase queries
- [x] Validation schemas for all inputs
- [x] All tests passing
- [x] >80% test coverage
- [x] API follows project conventions (CommonJS, camelCase responses, snake_case DB)
- [x] Error handling uses AppError class
- [x] Response format follows standard wrapper

---

## Notes

- Use existing patterns from `users.routes.js`, `users.controller.js`, `users.service.js`
- Cascade delete is handled by database foreign key constraints
- Member count should be computed via JOIN or subquery for efficiency
- Employees can READ teams in future stories (for team selection) - but this story is manager-only

---

## Dev Agent Record

### Implementation Date
2026-01-11

### File List
| File | Action | Description |
|------|--------|-------------|
| `backend/routes/teams.routes.js` | Created | Teams CRUD routes with auth/rbac middleware |
| `backend/controllers/teams.controller.js` | Created | Controller with getAll, getById, create, update, remove |
| `backend/services/teams.service.js` | Created | Service layer with Supabase queries |
| `backend/validators/teams.validator.js` | Created | Zod validation schemas |
| `backend/routes/index.js` | Modified | Added teams routes registration |
| `backend/tests/routes/teams.routes.test.js` | Created | Integration tests (131 tests) |
| `backend/tests/services/teams.service.test.js` | Created | Unit tests for service layer |

### Change Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-01-11 | Initial implementation | Story 3.1 Teams CRUD API |
| 2026-01-11 | Added `.strict()` to updateTeamSchema | Code review: reject invalid fields explicitly |
| 2026-01-11 | Changed update() no-fields behavior | Code review: throw error instead of silent query |
| 2026-01-11 | Added test for invalid fields in PATCH | Code review: ensure validator rejects unknown properties |

### Test Coverage
```
teams.service.js | 97.27% Stmts | 92.56% Branch | 100% Funcs | 97.24% Lines
```

### Senior Developer Review (AI)
**Date:** 2026-01-11
**Reviewer:** Amelia (Dev Agent)
**Outcome:** APPROVED with fixes applied

**Issues Found & Fixed:**
1. ✅ updateTeamSchema was too permissive - Added `.strict()` to reject unknown properties
2. ✅ Service did unnecessary query for empty update - Now throws VALIDATION_ERROR
3. ✅ Missing Dev Agent Record section - Added

**Remaining Notes:**
- Story includes code for Stories 3.2 and 3.4 (member/project assignment) as parallel development
- Console.error logging acceptable for now, consider structured logger for production
