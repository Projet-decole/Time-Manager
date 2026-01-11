# Story 3.4: Implement Team-Project Assignment API

## Story Info
- **Epic:** Epic 3 - Admin Data Management
- **Story ID:** 3.4
- **Status:** done
- **Priority:** High
- **Estimated Effort:** Small
- **FRs Covered:** FR42
- **Depends On:** Story 3.1, Story 3.3

## User Story

**As a** manager,
**I want to** assign projects to teams,
**So that** team members can track time on assigned projects.

## Acceptance Criteria

### AC1: Assign Project to Team
**Given** an authenticated manager
**When** POST `/api/v1/teams/:teamId/projects` is called with `{ projectId }`
**Then** the project is assigned to the team
**And** response includes `{ success: true, data: { id, teamId, projectId, createdAt } }`

### AC2: Prevent Duplicate Assignment
**Given** a project already assigned to the team
**When** trying to assign it again
**Then** response is 400 with `{ success: false, error: { code: "ALREADY_ASSIGNED", message: "Project already assigned to team" } }`

### AC3: Unassign Project from Team
**Given** an authenticated manager
**When** DELETE `/api/v1/teams/:teamId/projects/:projectId` is called
**Then** the project is unassigned from the team
**And** response is `{ success: true, data: { message: "Project unassigned successfully" } }`

### AC4: List Team Projects
**Given** an authenticated manager
**When** GET `/api/v1/teams/:teamId/projects` is called
**Then** response includes list of all projects assigned to the team
**And** supports pagination

### AC5: Filter User's Projects by Team
**Given** an authenticated user
**When** GET `/api/v1/projects?myTeams=true` is called
**Then** response includes only projects assigned to the user's teams

### AC6: Authorization Check
**Given** an employee tries any team project assignment endpoint (POST, DELETE)
**When** the request is processed
**Then** response is 403 Forbidden

---

## Technical Implementation

### Files to Modify

#### 1. Routes - Add to `backend/routes/teams.routes.js`
```javascript
// New routes to add:
// GET    /api/v1/teams/:teamId/projects              - List team projects
// POST   /api/v1/teams/:teamId/projects              - Assign project to team
// DELETE /api/v1/teams/:teamId/projects/:projectId   - Unassign project
```

#### 2. Routes - Add to `backend/routes/projects.routes.js`
```javascript
// Modify GET /api/v1/projects to support ?myTeams=true filter
```

#### 3. Controller - Add to `backend/controllers/teams.controller.js`
```javascript
// Methods to add:
// - getProjects(req, res)      - List projects for team
// - assignProject(req, res)    - Assign project to team
// - unassignProject(req, res)  - Remove project from team
```

#### 4. Service - Add to `backend/services/teams.service.js`
```javascript
// Methods to add:
// - getProjects(teamId, page, limit)        - Fetch team projects
// - assignProject(teamId, projectId)        - Insert team_projects record
// - unassignProject(teamId, projectId)      - Delete team_projects record
// - isProjectAssigned(teamId, projectId)    - Check if already assigned
```

#### 5. Service - Add to `backend/services/projects.service.js`
```javascript
// Methods to add/modify:
// - getAll(filters, page, limit) - Add myTeams filter support
// - getProjectsForUserTeams(userId, page, limit) - Get projects from user's teams
```

#### 6. Validator - Add to `backend/validators/teams.validator.js`
```javascript
// Schema to add:
// - assignProjectSchema: { projectId: string (required, UUID format) }
```

### Database Schema Reference

```sql
-- Table: team_projects (already exists from Epic 1)
CREATE TABLE team_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, project_id)
);
```

### API Response Examples

#### GET /api/v1/teams/:teamId/projects
```json
{
  "success": true,
  "data": [
    {
      "id": "assignment-uuid",
      "teamId": "team-uuid",
      "projectId": "project-uuid",
      "createdAt": "2026-01-10T10:00:00Z",
      "project": {
        "id": "project-uuid",
        "code": "PRJ-001",
        "name": "Time Manager",
        "description": "Main project",
        "budgetHours": 500,
        "status": "active"
      }
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

#### GET /api/v1/projects?myTeams=true
```json
{
  "success": true,
  "data": [
    {
      "id": "project-uuid",
      "code": "PRJ-001",
      "name": "Time Manager",
      "status": "active"
    }
  ],
  "meta": {
    "pagination": { ... }
  }
}
```

---

## Testing Requirements

### Unit Tests - Add to existing test files
- Test getProjects returns paginated projects
- Test assignProject creates team_projects record
- Test assignProject throws on duplicate
- Test unassignProject removes record
- Test getProjectsForUserTeams returns correct projects

### Integration Tests
- Test GET /teams/:teamId/projects returns assigned projects
- Test POST /teams/:teamId/projects assigns project
- Test POST with duplicate returns 400
- Test DELETE /teams/:teamId/projects/:projectId unassigns
- Test GET /projects?myTeams=true filters by user's teams

---

## Definition of Done

- [x] Team-project assignment endpoints working
- [x] myTeams filter on projects endpoint
- [x] Proper error handling for duplicates
- [x] All tests passing
- [x] >80% coverage maintained

---

## Dev Agent Record

### Implementation Date
2026-01-11

### File List
| File | Action | Description |
|------|--------|-------------|
| `backend/routes/teams.routes.js` | Modified | Added team-project routes (GET/POST/DELETE) |
| `backend/controllers/teams.controller.js` | Modified | Added getProjects, assignProject, unassignProject |
| `backend/services/teams.service.js` | Modified | Added team-project service methods |
| `backend/validators/teams.validator.js` | Modified | Added assignProjectSchema |
| `backend/services/projects.service.js` | Modified | Added getProjectsForUserTeams for myTeams filter |
| `backend/controllers/projects.controller.js` | Modified | Added myTeams query param support |
| `backend/tests/routes/teams.routes.test.js` | Modified | Added team-project assignment tests |
| `backend/tests/services/teams.service.test.js` | Modified | Added team-project service tests |
| `backend/tests/routes/projects.routes.test.js` | Modified | Added myTeams filter tests |
| `backend/tests/services/projects.service.test.js` | Modified | Added getProjectsForUserTeams tests |

### Test Coverage
```
teams.service.js    | 100%   Stmts | 96.58% Branch | 100% Funcs | 100%   Lines
projects.service.js | 97.52% Stmts | 84.7%  Branch | 100% Funcs | 97.47% Lines
```

### Senior Developer Review (AI)
**Date:** 2026-01-11
**Reviewer:** Amelia (Dev Agent)
**Outcome:** APPROVED

**Notes:**
- All ACs validated and working
- 205 tests passing
- No code issues found
