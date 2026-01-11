# Story 3.6: Implement Admin Management UI - Teams

## Story Info
- **Epic:** Epic 3 - Admin Data Management
- **Story ID:** 3.6
- **Status:** review
- **Priority:** High
- **Estimated Effort:** Large
- **FRs Covered:** FR40-FR45 (UI)
- **Depends On:** Stories 3.1, 3.2, 3.4 (Backend APIs)

## User Story

**As a** manager,
**I want a** UI to manage teams,
**So that** I can organize the workforce visually.

## Acceptance Criteria

### AC1: Teams List Page
**Given** I navigate to the Teams management page
**When** the page loads
**Then** I see a list of all teams with:
- Team name
- Description (truncated)
- Member count
- "Edit" and "Delete" action buttons
**And** I see a "Create Team" button at the top

### AC2: Create Team Modal
**Given** I click "Create Team"
**When** the modal opens
**Then** I see a form with:
- Name field (required)
- Description field (optional, textarea)
- Save and Cancel buttons
**And** clicking "Save" creates the team and refreshes the list
**And** validation errors are shown inline

### AC3: Edit Team
**Given** I click "Edit" on a team row
**When** the edit form opens
**Then** I see the current values pre-filled
**And** I can modify name and description
**And** saving updates the team

### AC4: Delete Team
**Given** I click "Delete" on a team
**When** a confirmation dialog appears
**Then** clicking "Confirm" deletes the team
**And** the list refreshes
**And** clicking "Cancel" dismisses the dialog

### AC5: Team Detail Panel
**Given** I click on a team row (not action buttons)
**When** the detail panel opens
**Then** I see:
- Team info (name, description)
- Members list with user details
- "Add Member" button
- "Remove" button next to each member
- Assigned projects list
- "Assign Project" button
- "Unassign" button next to each project

### AC6: Add Member
**Given** I click "Add Member" in team detail
**When** a user selector modal opens
**Then** I can search/filter users
**And** selecting a user adds them to the team
**And** already-members are excluded from selection

### AC7: Remove Member
**Given** I click "Remove" next to a member
**When** confirmation is accepted
**Then** the member is removed from the team
**And** the members list refreshes

### AC8: Assign/Unassign Project
**Given** I click "Assign Project"
**When** a project selector modal opens
**Then** I can select a project to assign
**And** already-assigned projects are excluded
**And** unassigning removes the project from the team

### AC9: Access Control
**Given** an employee navigates to /admin/teams
**When** the route is accessed
**Then** they are redirected to dashboard with error message

---

## Technical Implementation

### Files to Create

#### 1. Pages
```
frontend/src/pages/admin/TeamsPage.jsx                    - Main teams management page
frontend/src/__tests__/pages/admin/TeamsPage.test.jsx     - Tests
```

#### 2. Components
```
frontend/src/components/features/teams/TeamsList.jsx        - Teams table/list
frontend/src/components/features/teams/TeamForm.jsx         - Create/Edit form
frontend/src/components/features/teams/TeamDetailPanel.jsx  - Side panel with members/projects
frontend/src/components/features/teams/MemberSelector.jsx   - User selection modal
frontend/src/components/features/teams/ProjectSelector.jsx  - Project selection modal
frontend/src/components/features/teams/index.js             - Barrel export
```

#### 3. Services
```
frontend/src/services/teamsService.js        - API calls for teams
```

#### 4. Hooks
```
frontend/src/hooks/useTeams.js               - Teams data fetching hook
```

#### 5. Routing
```
Add route to frontend/src/App.jsx or router config:
/admin/teams -> TeamsPage (manager only)
```

### UI Components Reference

Use existing shadcn/ui components:
- `Table` - for teams list
- `Dialog` - for modals
- `Form` + `Input` + `Textarea` - for forms
- `Button` - actions
- `Sheet` - for side panel (team detail)
- `Command` or `Select` - for user/project selectors
- `AlertDialog` - for delete confirmation

### API Endpoints Used

```javascript
// Teams CRUD (Story 3.1)
GET    /api/v1/teams              - List teams
POST   /api/v1/teams              - Create team
GET    /api/v1/teams/:id          - Get team details
PATCH  /api/v1/teams/:id          - Update team
DELETE /api/v1/teams/:id          - Delete team

// Team Members (Story 3.2)
GET    /api/v1/teams/:id/members           - List members
POST   /api/v1/teams/:id/members           - Add member
DELETE /api/v1/teams/:id/members/:userId   - Remove member

// Team Projects (Story 3.4)
GET    /api/v1/teams/:id/projects              - List projects
POST   /api/v1/teams/:id/projects              - Assign project
DELETE /api/v1/teams/:id/projects/:projectId   - Unassign project

// Users (for selector)
GET    /api/v1/users              - List all users
```

### State Management

```javascript
// TeamsPage state
const [teams, setTeams] = useState([]);
const [loading, setLoading] = useState(true);
const [selectedTeam, setSelectedTeam] = useState(null);
const [isCreateModalOpen, setCreateModalOpen] = useState(false);
const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [teamToDelete, setTeamToDelete] = useState(null);
```

### UI Layout Sketch

```
+--------------------------------------------------+
|  Teams Management                    [+ Create]  |
+--------------------------------------------------+
| Name          | Description      | Members | Act |
|---------------|------------------|---------|-----|
| Engineering   | Dev team...      | 5       | ✏️🗑️|
| Design        | UX/UI team...    | 3       | ✏️🗑️|
| Marketing     | Marketing...     | 4       | ✏️🗑️|
+--------------------------------------------------+

[Click row to open detail panel]

+----------------------+  +------------------------+
| Teams List           |  | Engineering            |
|                      |  | Dev team for...        |
|                      |  |                        |
|                      |  | Members (5)    [+ Add] |
|                      |  | - John Doe     [Remove]|
|                      |  | - Jane Smith   [Remove]|
|                      |  |                        |
|                      |  | Projects (2)   [+ Add] |
|                      |  | - PRJ-001      [Remove]|
|                      |  | - PRJ-002      [Remove]|
+----------------------+  +------------------------+
```

---

## Testing Requirements

### Component Tests
- TeamsPage renders with loading state
- TeamsPage displays teams list
- Create modal opens and submits
- Edit modal pre-fills data
- Delete confirmation works
- Team detail panel shows members and projects
- Add/Remove member flows work
- Assign/Unassign project flows work

### Integration Tests
- Full create team flow
- Full edit team flow
- Full delete team flow
- Member management flow
- Project assignment flow

---

## Critical Issues Found

### Issue #1: Tests causing system crashes (RESOLVED)

**Severity:** CRITICAL - Caused multiple system crashes during code review

**Root Causes:**
1. **`vi.useFakeTimers({ shouldAdvanceTime: true })`** - Auto-advancing time created infinite timer cascades with component `setTimeout` calls
2. **Infinite promises `new Promise(() => {})`** - Used for loading state tests but never resolved, blocking the test process
3. **Fake timers + userEvent incompatibility** - `userEvent.setup()` requires real timers or explicit `advanceTimers` configuration

**Resolution Applied:**
- Removed fake timers entirely from all admin page tests
- Replaced infinite promises with controlled deferred promises that resolve after assertions
- Added global test timeouts in `vite.config.js`:
  ```javascript
  testTimeout: 10000,
  hookTimeout: 10000,
  teardownTimeout: 5000
  ```

**Files Modified:**
- `frontend/vite.config.js` - Added timeout configuration
- `frontend/src/__tests__/pages/admin/TeamsPage.test.jsx` - Removed fake timers, fixed infinite promise
- `frontend/src/__tests__/pages/admin/ProjectsPage.test.jsx` - Fixed infinite promise
- `frontend/src/__tests__/pages/admin/CategoriesPage.test.jsx` - Cleaned up

**Prevention:** See `docs/project-context.md` for mandatory testing rules.

---

## Definition of Done

- [x] TeamsPage component implemented
- [x] All CRUD operations working
- [x] Member management working
- [x] Project assignment working
- [x] Route protected for managers only
- [x] Loading and error states handled
- [x] Tests passing
- [x] Responsive design (works on tablet+)

---

## Dev Agent Record

### File List

**Pages Created:**
- `frontend/src/pages/admin/TeamsPage.jsx` - Main teams management page
- `frontend/src/__tests__/pages/admin/TeamsPage.test.jsx` - Page tests (AC1-AC9)

**Components Created:**
- `frontend/src/components/features/teams/TeamsList.jsx` - Teams table component
- `frontend/src/components/features/teams/TeamForm.jsx` - Create/Edit form modal
- `frontend/src/components/features/teams/TeamDetailPanel.jsx` - Side panel with members/projects
- `frontend/src/components/features/teams/MemberSelector.jsx` - User selection modal
- `frontend/src/components/features/teams/ProjectSelector.jsx` - Project selection modal
- `frontend/src/components/features/teams/index.js` - Barrel export

**UI Components Created:**
- `frontend/src/components/ui/Sheet.jsx` - Side panel component
- `frontend/src/components/ui/Textarea.jsx` - Textarea component

**Services Created:**
- `frontend/src/services/teamsService.js` - API calls for teams CRUD and member/project management
- `frontend/src/__tests__/services/teamsService.test.js` - Service unit tests

**Hooks Created:**
- `frontend/src/hooks/useTeams.js` - Teams data fetching and management hooks
- `frontend/src/__tests__/hooks/useTeams.test.js` - Hook unit tests

**Component Tests Created:**
- `frontend/src/__tests__/components/features/teams/TeamsList.test.jsx` - TeamsList component tests
- `frontend/src/__tests__/components/features/teams/TeamForm.test.jsx` - TeamForm component tests

**Files Modified:**
- `frontend/src/App.jsx` - Added /admin/teams route with RoleProtectedRoute

### Code Review Issues Fixed

1. **AC9 test added** - Access control verification for manager-only route
2. **Service tests added** - 16 unit tests for teamsService.js
3. **Hook tests added** - 18 unit tests for useTeams and useTeamDetails hooks
4. **Component tests added** - TeamsList and TeamForm component tests
5. **Memory leak fix** - Added isMountedRef cleanup to useTeams and useTeamDetails hooks
6. **Error handling improved** - Replaced console.error with proper state-based error handling
7. **React act() warning fixed** - Wrapped async state updates in act()

### Test Coverage

- Page tests: 32 tests (AC1-AC9)
- Service tests: 16 tests
- Hook tests: 18 tests
- Component tests: 28 tests
- **Total: 94 tests for Story 3.6**
