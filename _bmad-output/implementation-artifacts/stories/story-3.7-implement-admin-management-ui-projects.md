# Story 3.7: Implement Admin Management UI - Projects

## Story Info
- **Epic:** Epic 3 - Admin Data Management
- **Story ID:** 3.7
- **Status:** done
- **Priority:** High
- **Estimated Effort:** Medium
- **FRs Covered:** FR46-FR48, FR50 (UI)
- **Depends On:** Story 3.3 (Backend API)

## User Story

**As a** manager,
**I want a** UI to manage projects,
**So that** I can configure work tracking.

## Acceptance Criteria

### AC1: Projects List Page
**Given** I navigate to the Projects management page
**When** the page loads
**Then** I see a list of all projects with:
- Code (e.g., PRJ-001)
- Name
- Budget hours (or "No budget")
- Status badge (Active/Archived)
- Total hours tracked
- Actions (Edit, Archive/Restore)
**And** archived projects are visually distinct (grayed out or filtered)
**And** I see filter options for status

### AC2: Create Project Modal
**Given** I click "Create Project"
**When** the modal opens
**Then** I see a form with:
- Name field (required)
- Description field (optional, textarea)
- Budget hours field (optional, number input)
- Preview of auto-generated code (e.g., "Will be assigned: PRJ-007")
- Save and Cancel buttons
**And** clicking "Save" creates the project
**And** the generated code is displayed in success message

### AC3: Edit Project
**Given** I click "Edit" on a project row
**When** the edit form opens
**Then** I see the current values pre-filled
**And** the code field is displayed but disabled (immutable)
**And** I can modify name, description, budget hours
**And** saving updates the project

### AC4: Archive Project
**Given** I click "Archive" on an active project
**When** confirmation is accepted
**Then** the project status changes to "Archived"
**And** the project appears grayed out or moves to archived section
**And** the button changes to "Restore"

### AC5: Restore Project
**Given** I click "Restore" on an archived project
**When** the action completes
**Then** the project status changes to "Active"
**And** the project appears normally in the list

### AC6: Project Details View
**Given** I click on a project row
**When** the detail view opens
**Then** I see:
- Full project info (code, name, description, budget)
- Total hours tracked
- Budget progress (if budget set)
- List of assigned teams (from team-project assignments)

### AC7: Filter by Status
**Given** the projects list is displayed
**When** I toggle the "Show Archived" filter
**Then** archived projects are shown/hidden accordingly

### AC8: Access Control
**Given** an employee navigates to /admin/projects
**When** the route is accessed
**Then** they are redirected to dashboard with error message

---

## Technical Implementation

### Files to Create

#### 1. Pages
```
frontend/src/pages/admin/ProjectsPage.jsx                    - Main projects management page
frontend/src/__tests__/pages/admin/ProjectsPage.test.jsx     - Tests
```

#### 2. Components
```
frontend/src/components/features/projects/ProjectsList.jsx        - Projects table
frontend/src/components/features/projects/ProjectForm.jsx         - Create/Edit form
frontend/src/components/features/projects/ProjectDetailPanel.jsx  - Detail view
frontend/src/components/features/projects/BudgetProgress.jsx      - Budget visualization
frontend/src/components/features/projects/index.js                - Barrel export
```

#### 3. Services
```
frontend/src/services/projectsService.js        - API calls for projects
```

#### 4. Hooks
```
frontend/src/hooks/useProjects.js               - Projects data fetching hook
```

#### 5. Routing
```
Add route:
/admin/projects -> ProjectsPage (manager only)
```

### UI Components Reference

- `Table` - for projects list
- `Dialog` - for modals
- `Form` + `Input` + `Textarea` - for forms
- `Button` - actions
- `Badge` - for status (Active/Archived)
- `Progress` - for budget usage
- `Switch` or `Checkbox` - for "Show Archived" toggle
- `Sheet` - for side panel detail view

### API Endpoints Used

```javascript
// Projects CRUD (Story 3.3)
GET    /api/v1/projects              - List projects (with ?includeArchived)
POST   /api/v1/projects              - Create project
GET    /api/v1/projects/:id          - Get project details
PATCH  /api/v1/projects/:id          - Update project
POST   /api/v1/projects/:id/archive  - Archive project
POST   /api/v1/projects/:id/restore  - Restore project
```

### UI Layout Sketch

```
+------------------------------------------------------------+
|  Projects Management             [Show Archived] [+ Create] |
+------------------------------------------------------------+
| Code     | Name           | Budget  | Tracked | Status | Act|
|----------|----------------|---------|---------|--------|-----|
| PRJ-001  | Time Manager   | 500h    | 120h    | Active | ✏️📦|
| PRJ-002  | Mobile App     | 200h    | 180h    | Active | ✏️📦|
| PRJ-003  | Legacy System  | -       | 50h     | Archived| ✏️♻️|
+------------------------------------------------------------+

[Click row for details]

Budget Progress (when budget set):
┌──────────────────────────────────────────────────┐
│ Budget: 120h / 500h (24%)                        │
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└──────────────────────────────────────────────────┘
```

### State Management

```javascript
const [projects, setProjects] = useState([]);
const [loading, setLoading] = useState(true);
const [showArchived, setShowArchived] = useState(false);
const [selectedProject, setSelectedProject] = useState(null);
const [isCreateModalOpen, setCreateModalOpen] = useState(false);
```

---

## Testing Requirements

### Component Tests
- ProjectsPage renders with loading state
- ProjectsPage displays projects list
- Create modal shows code preview
- Edit modal shows code as disabled
- Archive/Restore toggle works
- Filter toggle shows/hides archived
- Budget progress displays correctly
- Project detail panel shows info

### Integration Tests
- Full create project flow (verify code generated)
- Full edit project flow
- Archive and restore flows
- Filter functionality

---

## Definition of Done

- [x] ProjectsPage component implemented
- [x] All CRUD operations working
- [x] Archive/Restore functionality
- [x] Code shown as immutable in edit
- [x] Budget progress visualization
- [x] Filter for archived projects
- [x] Route protected for managers only
- [x] Loading and error states handled
- [x] Tests passing

---

## Dev Agent Record

### Code Review Fixes (2026-01-11)

**Issues Fixed:**

1. **HIGH - AC2 nextCode preview missing**: Added `calculateNextCode()` function and passed `nextCode` prop to ProjectForm. Preview now shows "Sera assigne: PRJ-XXX" in create modal.

2. **MEDIUM - Double useEffect causing double fetch**: Merged two useEffect hooks into one that handles both initial load and filter changes.

3. **MEDIUM - Teams not fetched in detail panel**: Added async fetch of project details via `getById()` when opening detail panel. Teams now display correctly.

4. **MEDIUM - Test act() warnings**: Fixed ProjectsPage tests by properly wrapping async assertions in `waitFor()`.

**Remaining (Deferred):**
- LOW: useProjects hook exists but not used in ProjectsPage (code duplication but functional)
- LOW: Missing tests for ProjectForm, ProjectDetailPanel, useProjects hook

### File List

| File | Action |
|------|--------|
| `frontend/src/pages/admin/ProjectsPage.jsx` | Modified - Added nextCode preview, teams fetch, fixed useEffect |
| `frontend/src/components/features/projects/ProjectDetailPanel.jsx` | Modified - Added loading state for teams |
| `frontend/src/__tests__/pages/admin/ProjectsPage.test.jsx` | Modified - Fixed act() warnings, added getById mock |
