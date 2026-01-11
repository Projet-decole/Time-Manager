# Story 3.8: Implement Admin Management UI - Categories

## Story Info
- **Epic:** Epic 3 - Admin Data Management
- **Story ID:** 3.8
- **Status:** done
- **Priority:** High
- **Estimated Effort:** Medium
- **FRs Covered:** FR49-FR52 (UI)
- **Depends On:** Story 3.5 (Backend API)

## User Story

**As a** manager,
**I want a** UI to manage time categories,
**So that** I can define how time is classified.

## Acceptance Criteria

### AC1: Categories List Page
**Given** I navigate to the Categories management page
**When** the page loads
**Then** I see a list of all categories with:
- Color chip (visual color preview)
- Name
- Description (truncated)
- Status (Active/Inactive badge)
- Actions (Edit, Deactivate/Activate)
**And** inactive categories are visually distinct (grayed out)
**And** I see a "Create Category" button

### AC2: Create Category Modal
**Given** I click "Create Category"
**When** the modal opens
**Then** I see a form with:
- Name field (required)
- Description field (optional)
- Color picker (required, shows hex value)
- Preview of the color
- Save and Cancel buttons
**And** clicking "Save" creates the category

### AC3: Color Picker
**Given** the create/edit form is open
**When** I interact with the color picker
**Then** I can select a color from a palette
**And** the hex value is displayed (e.g., #3B82F6)
**And** a preview of the color is shown
**And** custom hex input is supported

### AC4: Edit Category
**Given** I click "Edit" on a category row
**When** the edit form opens
**Then** I see the current values pre-filled
**And** the color picker shows the current color
**And** I can modify name, description, color
**And** saving updates the category

### AC5: Deactivate Category
**Given** I click "Deactivate" on an active category
**When** confirmation is accepted
**Then** the category is marked as inactive
**And** it's no longer selectable for new time entries
**And** the button changes to "Activate"
**And** existing entries retain their category (historical data)

### AC6: Activate Category
**Given** I click "Activate" on an inactive category
**When** the action completes
**Then** the category is marked as active
**And** it becomes selectable for new time entries

### AC7: Filter by Status
**Given** the categories list is displayed
**When** I toggle the "Show Inactive" filter
**Then** inactive categories are shown/hidden accordingly

### AC8: Access Control
**Given** an employee navigates to /admin/categories
**When** the route is accessed
**Then** they are redirected to dashboard with error message

---

## Technical Implementation

### Files to Create

#### 1. Pages
```
frontend/src/pages/admin/CategoriesPage.jsx                    - Main categories management page
frontend/src/__tests__/pages/admin/CategoriesPage.test.jsx     - Tests
```

#### 2. Components
```
frontend/src/components/features/categories/CategoriesList.jsx    - Categories table
frontend/src/components/features/categories/CategoryForm.jsx      - Create/Edit form
frontend/src/components/features/categories/ColorPicker.jsx       - Color selection component
frontend/src/components/features/categories/ColorChip.jsx         - Color preview chip
frontend/src/components/features/categories/index.js              - Barrel export
```

#### 3. Services
```
frontend/src/services/categoriesService.js        - API calls for categories
```

#### 4. Hooks
```
frontend/src/hooks/useCategories.js               - Categories data fetching hook
```

#### 5. Routing
```
Add route:
/admin/categories -> CategoriesPage (manager only)
```

### UI Components Reference

- `Table` - for categories list
- `Dialog` - for modals
- `Form` + `Input` + `Textarea` - for forms
- `Button` - actions
- `Badge` - for status (Active/Inactive)
- Color picker options:
  - Use a simple color palette grid
  - Or integrate `react-colorful` (lightweight)
  - Or custom hex input with preview

### Predefined Color Palette

```javascript
const CATEGORY_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Gray', value: '#6B7280' },
];
```

### API Endpoints Used

```javascript
// Categories CRUD (Story 3.5)
GET    /api/v1/categories              - List categories (with ?includeInactive)
POST   /api/v1/categories              - Create category
GET    /api/v1/categories/:id          - Get category details
PATCH  /api/v1/categories/:id          - Update category
DELETE /api/v1/categories/:id          - Deactivate category
POST   /api/v1/categories/:id/activate - Activate category
```

### UI Layout Sketch

```
+------------------------------------------------------------+
|  Categories Management          [Show Inactive] [+ Create]  |
+------------------------------------------------------------+
| Color | Name          | Description        | Status   | Act |
|-------|---------------|--------------------|---------|----- |
| 🔵    | Development   | Coding and dev...  | Active  | ✏️ ⏸ |
| 🟢    | Meeting       | Team meetings...   | Active  | ✏️ ⏸ |
| 🟡    | Research      | Research and...    | Active  | ✏️ ⏸ |
| 🔴    | Admin         | Administrative...  | Inactive| ✏️ ▶️ |
+------------------------------------------------------------+

Color Picker Component:
┌────────────────────────────────────┐
│ Select a color:                    │
│ 🔵 🟢 🟡 🔴 🟣 💗 🔷 🩵 🟠 ⚫     │
│                                    │
│ Or enter hex: [#3B82F6]            │
│ Preview: ████                      │
└────────────────────────────────────┘
```

### State Management

```javascript
const [categories, setCategories] = useState([]);
const [loading, setLoading] = useState(true);
const [showInactive, setShowInactive] = useState(false);
const [selectedCategory, setSelectedCategory] = useState(null);
const [isCreateModalOpen, setCreateModalOpen] = useState(false);
```

---

## Testing Requirements

### Component Tests
- CategoriesPage renders with loading state
- CategoriesPage displays categories list
- Color chips display correct colors
- Create modal with color picker works
- Edit modal pre-fills color
- Deactivate/Activate toggle works
- Filter toggle shows/hides inactive
- Color validation (hex format)

### Integration Tests
- Full create category flow with color
- Full edit category flow
- Deactivate and activate flows
- Filter functionality

---

## Definition of Done

- [x] CategoriesPage component implemented
- [x] All CRUD operations working
- [x] Color picker functional
- [x] Deactivate/Activate functionality
- [x] Color chips display correctly
- [x] Filter for inactive categories
- [x] Route protected for managers only
- [x] Loading and error states handled
- [x] Tests passing

---

## Notes

- Color picker should be simple - palette + hex input
- Consider accessibility - color alone shouldn't convey meaning
- Categories are used in time entry forms - ensure color contrast is good
- Inactive categories should still display in historical time entries

---

## Dev Agent Record

### Implementation Date
2026-01-11

### File List

#### Created Files
| File | Purpose |
|------|---------|
| `frontend/src/pages/admin/CategoriesPage.jsx` | Main categories management page |
| `frontend/src/components/features/categories/CategoriesList.jsx` | Categories table component |
| `frontend/src/components/features/categories/CategoryForm.jsx` | Create/Edit form modal |
| `frontend/src/components/features/categories/ColorPicker.jsx` | Color selection with palette and hex input |
| `frontend/src/components/features/categories/ColorChip.jsx` | Color preview chip component |
| `frontend/src/components/features/categories/index.js` | Barrel export |
| `frontend/src/services/categoriesService.js` | API calls for categories CRUD |
| `frontend/src/hooks/useCategories.js` | Categories data fetching hook |

#### Test Files
| File | Purpose |
|------|---------|
| `frontend/src/__tests__/pages/admin/CategoriesPage.test.jsx` | Page tests (AC1-AC8, integration) |
| `frontend/src/__tests__/components/features/categories/CategoriesList.test.jsx` | List component tests |
| `frontend/src/__tests__/components/features/categories/CategoryForm.test.jsx` | Form component tests |
| `frontend/src/__tests__/components/features/categories/ColorPicker.test.jsx` | Color picker tests |
| `frontend/src/__tests__/components/features/categories/ColorChip.test.jsx` | Color chip tests |
| `frontend/src/__tests__/hooks/useCategories.test.js` | Hook tests |
| `frontend/src/__tests__/services/categoriesService.test.js` | Service tests |

#### Modified Files
| File | Change |
|------|--------|
| `frontend/src/App.jsx` | Added `/admin/categories` route with RoleProtectedRoute |

### Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-01-11 | Initial implementation | Story 3.8 development |
| 2026-01-11 | Code review fixes | Added missing tests, fixed memory leak in useCategories, improved error handling |

### Code Review Notes
- **M2 Fixed**: Added `isMountedRef` to prevent state updates after unmount in useCategories hook
- **M3 Fixed**: CRUD operations now throw errors when API returns `success: false` for proper error propagation
- **Tests Added**: CategoriesList, CategoryForm, useCategories, categoriesService unit tests
- **Integration Tests Added**: Full CRUD flow tests in CategoriesPage.test.jsx
