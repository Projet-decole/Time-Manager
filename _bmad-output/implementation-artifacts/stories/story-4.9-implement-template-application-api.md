# Story 4.9: Implement Template Application API

> ## ⚠️ MERGED INTO STORY 4.8
>
> **This story was implemented as part of Story 4.8 (Templates CRUD API).**
>
> All functionality described below is complete and available at:
> - **Endpoint:** `POST /api/v1/templates/:id/apply`
> - **Implementation:** See `backend/services/templates.service.js` → `applyTemplate()`
> - **Tests:** See `backend/tests/routes/templates.routes.test.js` and `backend/tests/services/templates.service.test.js`
>
> This file is preserved for reference documentation only. No additional implementation is required.

---

## Story Info
- **Epic:** Epic 4 - Time Tracking - 3 Modes
- **Story ID:** 4.9
- **Status:** done (merged into Story 4.8)
- **Priority:** High
- **Estimated Effort:** Medium
- **FRs Covered:** FR27, FR28
- **Depends On:** Story 4.8 (Templates CRUD API - DONE), Story 4.5 (Day Mode Day Start/End API - DONE), Story 4.6 (Day Mode Time Block Management API - DONE)
- **Merged Into:** Story 4.8

## User Story

**As an** employee,
**I want to** apply a template to create a pre-filled day,
**So that** I can quickly record recurring work patterns.

## Acceptance Criteria

### AC1: Apply Template Successfully
**Given** an authenticated employee with a template
**When** POST `/api/v1/templates/:id/apply` is called with `{ date: "2025-01-15" }`
**Then** a new day entry is created for that date
**And** time entries (blocks) are created matching the template's entries
**And** entries have times adjusted to the specified date
**And** response includes the created day with all entries
**And** response format is:
```json
{
  "success": true,
  "data": {
    "id": "day-uuid",
    "userId": "user-uuid",
    "startTime": "2025-01-15T09:00:00.000Z",
    "endTime": "2025-01-15T17:00:00.000Z",
    "durationMinutes": 480,
    "description": null,
    "entryMode": "template",
    "parentId": null,
    "createdAt": "2026-01-12T10:00:00Z",
    "updatedAt": "2026-01-12T10:00:00Z",
    "blocks": [
      {
        "id": "block-uuid",
        "userId": "user-uuid",
        "parentId": "day-uuid",
        "startTime": "2025-01-15T09:00:00.000Z",
        "endTime": "2025-01-15T12:00:00.000Z",
        "durationMinutes": 180,
        "projectId": "project-uuid",
        "categoryId": "category-uuid",
        "description": "Morning development",
        "entryMode": "template",
        "project": { "id": "...", "code": "PRJ-001", "name": "Time Manager" },
        "category": { "id": "...", "name": "Development", "color": "#3B82F6" }
      }
    ],
    "meta": {
      "templateId": "template-uuid",
      "templateName": "Morning Development",
      "entriesApplied": 3
    }
  }
}
```

### AC2: Date Already Has Time Entries
**Given** a template is applied to a date with existing time entries
**When** the apply endpoint is called
**Then** response is 400 with "Date already has time entries"
**And** error code is `DATE_HAS_ENTRIES`
**And** response includes existing entries count for that date

### AC3: Convert Relative Times to Absolute Timestamps
**Given** a template with relative times (e.g., 09:00-12:00)
**When** applied to a date "2025-01-15"
**Then** entries are created with actual timestamps for that date:
- Template entry "09:00-12:00" becomes "2025-01-15T09:00:00Z" to "2025-01-15T12:00:00Z"
**And** day start time is set to the earliest entry start time
**And** day end time is set to the latest entry end time

### AC4: Handle Archived/Inactive References
**Given** a template with project/category references
**When** the template is applied
**Then** projects and categories are preserved if still active
**And** if a project is archived, block is created without project reference
**And** if a category is inactive, block is created without category reference
**And** response includes warnings array for skipped references:
```json
{
  "success": true,
  "data": { ... },
  "warnings": [
    { "type": "ARCHIVED_PROJECT", "entryIndex": 0, "projectId": "...", "message": "Project was archived, entry created without project" },
    { "type": "INACTIVE_CATEGORY", "entryIndex": 1, "categoryId": "...", "message": "Category was deactivated, entry created without category" }
  ]
}
```

### AC5: Template Not Found
**Given** an invalid template ID
**When** POST `/api/v1/templates/:id/apply` is called
**Then** response is 404 with "Template not found"

### AC6: Template Belongs to Another User
**Given** a template that belongs to another user
**When** apply endpoint is called
**Then** response is 403 with "Access denied"

### AC7: Template with No Entries
**Given** a template that has no entries
**When** POST `/api/v1/templates/:id/apply` is called
**Then** response is 400 with "Template has no entries to apply"
**And** error code is `TEMPLATE_EMPTY`

### AC8: Validation Rules
**Given** invalid input data
**When** POST `/api/v1/templates/:id/apply` is called
**Then** response is 400 with validation error details for:
- date is required
- date must be valid format (YYYY-MM-DD)
- date cannot be too far in the past (>1 year)
- date cannot be too far in the future (>1 year)

### AC9: Entry Mode Set to Template
**Given** a template is applied
**When** the day and blocks are created
**Then** all entries have `entryMode: "template"` to distinguish from manual day mode entries
**And** the day remains editable (draft status) per FR28

---

## Technical Implementation

### Files to Create/Modify

#### 1. Routes - `backend/routes/templates.routes.js` (Modify)
Add the apply endpoint to existing templates routes:
```javascript
// Add this route:
// POST /api/v1/templates/:id/apply - Apply template to create a day
router.post(
  '/:id/apply',
  authMiddleware,
  validate(templatesValidator.applyTemplateSchema),
  templatesController.apply
);
```

#### 2. Controller - `backend/controllers/templates.controller.js` (Modify)
Add the apply controller method:
```javascript
/**
 * Apply a template to create a pre-filled day
 * POST /api/v1/templates/:id/apply
 * Body: { date: "YYYY-MM-DD" }
 * Story 4.9: Template Application API - AC1-AC9
 */
const apply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date } = req.body;
    const userId = req.user.id;

    const result = await templatesService.applyTemplate(id, userId, date);

    return successResponse(res, result.data, {
      templateId: result.templateId,
      templateName: result.templateName,
      entriesApplied: result.entriesApplied,
      warnings: result.warnings
    }, 201);
  } catch (error) {
    next(error);
  }
};
```

#### 3. Service - `backend/services/templates.service.js` (Modify)
Add the apply template service method:
```javascript
/**
 * Apply a template to create a pre-filled day with time blocks
 * @param {string} templateId - Template UUID
 * @param {string} userId - User UUID
 * @param {string} date - Target date (YYYY-MM-DD)
 * @returns {Promise<Object>} Created day with blocks and meta
 * @throws {AppError} If template not found, not owned, date has entries, etc.
 * Story 4.9: Template Application API - AC1-AC9
 */
const applyTemplate = async (templateId, userId, date) => {
  // 1. Get template with entries and verify ownership
  // 2. Validate template has entries
  // 3. Check if date already has time entries
  // 4. Validate project/category references (check archived/inactive)
  // 5. Convert relative times to absolute timestamps
  // 6. Calculate day start/end from entry boundaries
  // 7. Create day entry with entryMode='template'
  // 8. Create block entries with entryMode='template'
  // 9. Return day with blocks and warnings
};
```

#### 4. Validator - `backend/validators/templates.validator.js` (Modify)
Add the apply template validation schema:
```javascript
/**
 * Apply template schema
 * Story 4.9: Template Application API - AC8
 */
const applyTemplateSchema = z.object({
  body: z.object({
    date: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .refine((date) => {
        const d = new Date(date);
        return !isNaN(d.getTime());
      }, 'Invalid date')
      .refine((date) => {
        const d = new Date(date);
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return d >= oneYearAgo;
      }, 'Date cannot be more than 1 year in the past')
      .refine((date) => {
        const d = new Date(date);
        const now = new Date();
        const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        return d <= oneYearFromNow;
      }, 'Date cannot be more than 1 year in the future')
  }),
  params: z.object({
    id: z.string().uuid('Invalid template ID format')
  })
});
```

### Database Schema Reference

Existing tables used:
```sql
-- Table: templates (from Story 4.8)
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: template_entries (from Story 4.8)
CREATE TABLE template_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: time_entries (from Story 4.1, 4.5, 4.6)
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  category_id UUID REFERENCES categories(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  description TEXT,
  entry_mode TEXT NOT NULL CHECK (entry_mode IN ('simple', 'day', 'template')),
  parent_id UUID REFERENCES time_entries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Response Examples

#### POST /api/v1/templates/:id/apply - Success
**Request:**
```json
{
  "date": "2025-01-15"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440100",
    "userId": "user-uuid",
    "startTime": "2025-01-15T09:00:00.000Z",
    "endTime": "2025-01-15T17:00:00.000Z",
    "durationMinutes": 480,
    "description": null,
    "entryMode": "template",
    "parentId": null,
    "createdAt": "2026-01-12T10:00:00Z",
    "updatedAt": "2026-01-12T10:00:00Z",
    "blocks": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440101",
        "userId": "user-uuid",
        "parentId": "550e8400-e29b-41d4-a716-446655440100",
        "startTime": "2025-01-15T09:00:00.000Z",
        "endTime": "2025-01-15T12:00:00.000Z",
        "durationMinutes": 180,
        "projectId": "project-uuid",
        "categoryId": "category-uuid",
        "description": "Morning coding session",
        "entryMode": "template",
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
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440102",
        "userId": "user-uuid",
        "parentId": "550e8400-e29b-41d4-a716-446655440100",
        "startTime": "2025-01-15T12:00:00.000Z",
        "endTime": "2025-01-15T13:00:00.000Z",
        "durationMinutes": 60,
        "projectId": null,
        "categoryId": null,
        "description": "Lunch break",
        "entryMode": "template",
        "project": null,
        "category": null
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440103",
        "userId": "user-uuid",
        "parentId": "550e8400-e29b-41d4-a716-446655440100",
        "startTime": "2025-01-15T13:00:00.000Z",
        "endTime": "2025-01-15T17:00:00.000Z",
        "durationMinutes": 240,
        "projectId": "project-uuid",
        "categoryId": "category-uuid-2",
        "description": "Afternoon development",
        "entryMode": "template",
        "project": {
          "id": "project-uuid",
          "code": "PRJ-001",
          "name": "Time Manager"
        },
        "category": {
          "id": "category-uuid-2",
          "name": "Code Review",
          "color": "#10B981"
        }
      }
    ]
  },
  "meta": {
    "templateId": "template-uuid",
    "templateName": "Morning Development",
    "entriesApplied": 3
  }
}
```

#### POST /api/v1/templates/:id/apply - Date Has Entries
**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "DATE_HAS_ENTRIES",
    "message": "Date already has time entries",
    "details": {
      "date": "2025-01-15",
      "existingEntriesCount": 3
    }
  }
}
```

#### POST /api/v1/templates/:id/apply - With Warnings
**Response (201 Created):**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "templateId": "template-uuid",
    "templateName": "My Template",
    "entriesApplied": 3,
    "warnings": [
      {
        "type": "ARCHIVED_PROJECT",
        "entryIndex": 0,
        "projectId": "archived-project-uuid",
        "message": "Project was archived, entry created without project"
      },
      {
        "type": "INACTIVE_CATEGORY",
        "entryIndex": 2,
        "categoryId": "inactive-category-uuid",
        "message": "Category was deactivated, entry created without category"
      }
    ]
  }
}
```

#### POST /api/v1/templates/:id/apply - Template Empty
**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "TEMPLATE_EMPTY",
    "message": "Template has no entries to apply"
  }
}
```

#### POST /api/v1/templates/:id/apply - Validation Error
**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "date", "message": "Date must be in YYYY-MM-DD format" }
    ]
  }
}
```

### Business Logic Details

#### Time Conversion Logic
```javascript
/**
 * Convert template entry relative times to absolute timestamps
 * @param {string} templateTime - Time in HH:MM format
 * @param {string} targetDate - Date in YYYY-MM-DD format
 * @returns {string} ISO 8601 timestamp
 */
const convertToAbsoluteTime = (templateTime, targetDate) => {
  // Parse time (HH:MM)
  const [hours, minutes] = templateTime.split(':').map(Number);

  // Create date object for target date
  const date = new Date(targetDate + 'T00:00:00.000Z');
  date.setUTCHours(hours, minutes, 0, 0);

  return date.toISOString();
};

// Example:
// convertToAbsoluteTime('09:00', '2025-01-15')
// Returns: '2025-01-15T09:00:00.000Z'
```

#### Check Existing Entries for Date
```javascript
/**
 * Check if a date already has time entries
 * @param {string} userId - User UUID
 * @param {string} date - Target date (YYYY-MM-DD)
 * @returns {Promise<Object>} { hasEntries: boolean, count: number }
 */
const checkDateHasEntries = async (userId, date) => {
  const startOfDay = new Date(date + 'T00:00:00.000Z');
  const endOfDay = new Date(date + 'T23:59:59.999Z');

  const { count, error } = await supabase
    .from('time_entries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('start_time', startOfDay.toISOString())
    .lte('start_time', endOfDay.toISOString())
    .is('parent_id', null); // Only count parent entries (days/simple)

  return { hasEntries: count > 0, count: count || 0 };
};
```

#### Validate Project/Category Status
```javascript
/**
 * Validate project and category references
 * @param {Array} entries - Template entries
 * @returns {Promise<Object>} { validEntries: Array, warnings: Array }
 */
const validateReferences = async (entries) => {
  const warnings = [];
  const validEntries = [];

  // Collect all unique project and category IDs
  const projectIds = [...new Set(entries.filter(e => e.projectId).map(e => e.projectId))];
  const categoryIds = [...new Set(entries.filter(e => e.categoryId).map(e => e.categoryId))];

  // Fetch projects and categories
  const { data: projects } = await supabase
    .from('projects')
    .select('id, is_archived')
    .in('id', projectIds);

  const { data: categories } = await supabase
    .from('categories')
    .select('id, is_active')
    .in('id', categoryIds);

  // Build lookup maps
  const projectMap = new Map(projects?.map(p => [p.id, p]) || []);
  const categoryMap = new Map(categories?.map(c => [c.id, c]) || []);

  // Process entries
  entries.forEach((entry, index) => {
    const validEntry = { ...entry };

    // Check project
    if (entry.projectId) {
      const project = projectMap.get(entry.projectId);
      if (!project || project.is_archived) {
        validEntry.projectId = null;
        warnings.push({
          type: 'ARCHIVED_PROJECT',
          entryIndex: index,
          projectId: entry.projectId,
          message: 'Project was archived, entry created without project'
        });
      }
    }

    // Check category
    if (entry.categoryId) {
      const category = categoryMap.get(entry.categoryId);
      if (!category || !category.is_active) {
        validEntry.categoryId = null;
        warnings.push({
          type: 'INACTIVE_CATEGORY',
          entryIndex: index,
          categoryId: entry.categoryId,
          message: 'Category was deactivated, entry created without category'
        });
      }
    }

    validEntries.push(validEntry);
  });

  return { validEntries, warnings };
};
```

#### Calculate Day Boundaries
```javascript
/**
 * Calculate day start and end times from template entries
 * @param {Array} entries - Template entries with absolute times
 * @returns {Object} { dayStart: string, dayEnd: string, durationMinutes: number }
 */
const calculateDayBoundaries = (entries) => {
  if (!entries.length) return null;

  const startTimes = entries.map(e => new Date(e.startTime));
  const endTimes = entries.map(e => new Date(e.endTime));

  const dayStart = new Date(Math.min(...startTimes));
  const dayEnd = new Date(Math.max(...endTimes));
  const durationMinutes = Math.round((dayEnd - dayStart) / 60000);

  return {
    dayStart: dayStart.toISOString(),
    dayEnd: dayEnd.toISOString(),
    durationMinutes
  };
};
```

---

## Testing Requirements

### Unit Tests - `backend/tests/services/templates.service.test.js` (Add)

**applyTemplate tests:**
- Test successful template application creates day and blocks
- Test returns template ID, name, and entries count in meta
- Test entries have `entryMode: 'template'`
- Test throws 404 for non-existent template
- Test throws 403 for template belonging to another user
- Test throws 400 with DATE_HAS_ENTRIES when date has entries
- Test throws 400 with TEMPLATE_EMPTY for template with no entries
- Test converts relative times to absolute timestamps correctly
- Test calculates day boundaries from entry times
- Test handles archived projects (removes reference, adds warning)
- Test handles inactive categories (removes reference, adds warning)
- Test returns warnings array when references are skipped
- Test creates blocks with correct parent_id reference
- Test entry duration is calculated correctly

**Helper function tests:**
- Test convertToAbsoluteTime with various times
- Test convertToAbsoluteTime with edge cases (00:00, 23:59)
- Test checkDateHasEntries returns correct count
- Test validateReferences with mixed valid/invalid references
- Test calculateDayBoundaries with multiple entries

### Integration Tests - `backend/tests/routes/templates.routes.test.js` (Add)

**Authentication tests:**
- Test POST /templates/:id/apply without auth returns 401
- Test POST /templates/:id/apply with valid auth returns 201

**Authorization tests:**
- Test employee can apply own template (201)
- Test employee cannot apply other user's template (403)
- Test manager can apply own template (201)

**Apply endpoint tests:**
- Test POST /templates/:id/apply creates day with blocks
- Test POST /templates/:id/apply with invalid template ID returns 404
- Test POST /templates/:id/apply with invalid date format returns 400
- Test POST /templates/:id/apply with date in past (>1 year) returns 400
- Test POST /templates/:id/apply with date in future (>1 year) returns 400
- Test POST /templates/:id/apply when date has entries returns 400
- Test POST /templates/:id/apply with empty template returns 400
- Test POST /templates/:id/apply response includes meta with templateId
- Test POST /templates/:id/apply response includes warnings when applicable
- Test POST /templates/:id/apply entries have entryMode 'template'
- Test POST /templates/:id/apply blocks reference correct day parent

**Edge cases:**
- Test apply template with single entry
- Test apply template with many entries (e.g., 10)
- Test apply template with all projects archived
- Test apply template with all categories inactive
- Test apply template for today's date
- Test apply template for future date within 1 year

### Coverage Target
- >80% coverage for templates.service.js (including applyTemplate)
- 100% route coverage for new endpoint
- All edge cases covered

---

## Definition of Done

- [ ] Apply template endpoint implemented at POST `/api/v1/templates/:id/apply`
- [ ] Validation schema for date input with proper constraints
- [ ] Service method creates day entry with `entryMode: 'template'`
- [ ] Service method creates block entries with parent_id reference
- [ ] Relative times converted to absolute timestamps for target date
- [ ] Day boundaries calculated from entry times
- [ ] Existing entries check prevents duplicate days
- [ ] Archived project references handled with warnings
- [ ] Inactive category references handled with warnings
- [ ] Response includes meta with templateId, templateName, entriesApplied
- [ ] Response includes warnings array when applicable
- [ ] All tests passing
- [ ] >80% test coverage
- [ ] API follows project conventions (CommonJS, camelCase responses, snake_case DB)
- [ ] Error handling uses AppError class
- [ ] Response format follows standard wrapper `{ success, data, meta }`

---

## Notes

- Use existing patterns from `templates.service.js` for template retrieval
- Use existing patterns from `time-entries.service.js` for creating day and blocks
- The `entry_mode` is set to 'template' to distinguish from 'day' mode entries created manually
- Applied days remain in draft status per FR28 (editable by employee)
- Template entries use TIME format (HH:MM), must be converted to TIMESTAMPTZ for time_entries
- Consider timezone handling - store as UTC, let frontend handle display
- Response meta should include source template info for UI display
- Warnings are non-blocking - entries are created even with archived/inactive references removed

---

## Dependencies

- **Story 4.8 (Done):** Templates CRUD API - provides template and template_entries
- **Story 4.5 (Done):** Day Mode Day Start/End API - day entry creation patterns
- **Story 4.6 (Done):** Day Mode Time Block Management API - block creation patterns
- **Epic 2 (Done):** Authentication middleware
- **Epic 3 (Done):** Projects and Categories with is_archived/is_active flags

## Related Stories

- **Story 4.10:** Template Mode UI - frontend for applying templates

---

## Implementation Notes for Developer

### Step 1: Add Validation Schema
Add `applyTemplateSchema` to `backend/validators/templates.validator.js`:
- Validate date format YYYY-MM-DD
- Validate date is valid
- Validate date within 1 year range

### Step 2: Add Service Method
Add `applyTemplate` to `backend/services/templates.service.js`:
1. Get template by ID with authorization check
2. Validate template has entries
3. Check if date already has entries for user
4. Validate project/category references
5. Convert template entry times to absolute timestamps
6. Calculate day boundaries
7. Create day entry
8. Create block entries in transaction-like pattern
9. Fetch created day with blocks
10. Return with meta and warnings

### Step 3: Add Controller Method
Add `apply` to `backend/controllers/templates.controller.js`:
- Extract params and body
- Call service method
- Return success response with 201 status

### Step 4: Add Route
Add route to `backend/routes/templates.routes.js`:
```javascript
router.post('/:id/apply', authMiddleware, validate(applyTemplateSchema), templatesController.apply);
```

### Step 5: Write Tests
Follow patterns from existing template and time-entries tests.

### Step 6: Test Manually
```bash
# Apply template
curl -X POST http://localhost:4000/api/v1/templates/{templateId}/apply \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-01-15"}'
```
