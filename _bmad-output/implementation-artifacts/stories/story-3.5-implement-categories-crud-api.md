# Story 3.5: Implement Categories CRUD API

## Story Info
- **Epic:** Epic 3 - Admin Data Management
- **Story ID:** 3.5
- **Status:** done
- **Priority:** High
- **Estimated Effort:** Medium
- **FRs Covered:** FR49-FR52

## User Story

**As a** manager,
**I want to** create, view, update, and deactivate categories,
**So that** time entries can be classified by type of work.

## Acceptance Criteria

### AC1: Create Category
**Given** an authenticated manager
**When** POST `/api/v1/categories` is called with `{ name, description?, color }`
**Then** a new category is created
**And** color is validated as hex format (#RRGGBB)
**And** response includes `{ success: true, data: { id, name, description, color, isActive: true, createdAt } }`

### AC2: List Categories (All Users)
**Given** an authenticated user (any role)
**When** GET `/api/v1/categories` is called
**Then** response includes list of active categories
**And** supports `?includeInactive=true` filter (manager only)
**And** supports pagination

### AC3: Get Category Details
**Given** an authenticated user
**When** GET `/api/v1/categories/:id` is called
**Then** response includes category details

### AC4: Update Category
**Given** an authenticated manager
**When** PATCH `/api/v1/categories/:id` is called
**Then** category details are updated
**And** response includes updated category data

### AC5: Deactivate Category (Soft Delete)
**Given** an authenticated manager
**When** DELETE `/api/v1/categories/:id` is called
**Then** category isActive is set to false (soft delete)
**And** existing time entries keep their category reference
**And** category is excluded from default list
**And** response is `{ success: true, data: { message: "Category deactivated" } }`

### AC6: Reactivate Category
**Given** an authenticated manager
**When** POST `/api/v1/categories/:id/activate` is called
**Then** category isActive is set to true

### AC7: Authorization for Mutations
**Given** an employee tries any category mutation endpoint
**When** the request is processed
**Then** response is 403 Forbidden

### AC8: Color Validation
**Given** an invalid color format (e.g., "red", "FFFFFF", "#GGG")
**When** creating or updating a category
**Then** response is 400 with validation error

---

## Technical Implementation

### Files to Create

#### 1. Routes - `backend/routes/categories.routes.js`
```javascript
// Routes to implement:
// GET    /api/v1/categories              - List all categories (any auth user)
// POST   /api/v1/categories              - Create category (manager only)
// GET    /api/v1/categories/:id          - Get category details (any auth user)
// PATCH  /api/v1/categories/:id          - Update category (manager only)
// DELETE /api/v1/categories/:id          - Deactivate category (manager only)
// POST   /api/v1/categories/:id/activate - Reactivate category (manager only)
```

#### 2. Controller - `backend/controllers/categories.controller.js`
```javascript
// Methods to implement:
// - getAll(req, res)      - List categories with filtering
// - getById(req, res)     - Get single category
// - create(req, res)      - Create new category
// - update(req, res)      - Update category
// - deactivate(req, res)  - Soft delete (set isActive = false)
// - activate(req, res)    - Reactivate (set isActive = true)
```

#### 3. Service - `backend/services/categories.service.js`
```javascript
// Methods to implement:
// - getAll(filters, page, limit)   - Fetch categories with optional inactive
// - getById(id)                    - Fetch single category
// - create(data)                   - Insert new category
// - update(id, data)               - Update category
// - deactivate(id)                 - Set is_active = false
// - activate(id)                   - Set is_active = true
```

#### 4. Validator - `backend/validators/categories.validator.js`
```javascript
// Schemas to implement:
// - createCategorySchema: {
//     name: required 1-50,
//     description?: max 200,
//     color: required, regex /^#[0-9A-Fa-f]{6}$/
//   }
// - updateCategorySchema: { name?, description?, color? }
```

#### 5. Register Route - `backend/routes/index.js`
```javascript
// Add: router.use('/categories', categoriesRoutes);
```

### Database Schema Reference

```sql
-- Table: categories (already exists from Epic 1)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Response Examples

#### GET /api/v1/categories
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Development",
      "description": "Coding and development work",
      "color": "#3B82F6",
      "isActive": true,
      "createdAt": "2026-01-10T10:00:00Z",
      "updatedAt": "2026-01-10T10:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Meeting",
      "description": "Team meetings and calls",
      "color": "#10B981",
      "isActive": true,
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

#### POST /api/v1/categories
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Research",
    "description": "Research and investigation",
    "color": "#8B5CF6",
    "isActive": true,
    "createdAt": "2026-01-10T10:00:00Z",
    "updatedAt": "2026-01-10T10:00:00Z"
  }
}
```

---

## Testing Requirements

### Unit Tests - `backend/tests/services/categories.service.test.js`
- Test getAll returns active categories by default
- Test getAll with includeInactive returns all
- Test getById returns category
- Test getById throws 404 for non-existent
- Test create category successfully
- Test create validates color format
- Test update category successfully
- Test deactivate sets isActive to false
- Test activate sets isActive to true

### Integration Tests - `backend/tests/routes/categories.routes.test.js`
- Test GET /categories without auth returns 401
- Test GET /categories as employee returns active only
- Test GET /categories as manager with ?includeInactive works
- Test POST /categories as employee returns 403
- Test POST /categories as manager creates category
- Test POST /categories with invalid color returns 400
- Test PATCH /categories/:id updates
- Test DELETE /categories/:id deactivates (soft delete)
- Test POST /categories/:id/activate reactivates

---

## Definition of Done

- [x] All routes implemented and registered
- [x] Color validation with hex format
- [x] Soft delete (deactivate) working
- [x] All users can READ, only managers can WRITE
- [x] All tests passing
- [x] >80% test coverage

---

## Notes

- Soft delete is important - time entries reference categories, hard delete would break data integrity
- Color picker in frontend will send hex format
- Consider adding some default categories via seed script
- Categories are simpler than teams/projects - no relations to manage

---

## Dev Agent Record

### File List

| File | Action | Description |
|------|--------|-------------|
| `backend/routes/categories.routes.js` | Created | 6 routes: GET/, POST/, GET/:id, PATCH/:id, DELETE/:id, POST/:id/activate |
| `backend/controllers/categories.controller.js` | Created | Controller with getAll, getById, create, update, deactivate, activate |
| `backend/services/categories.service.js` | Created | Service layer with Supabase queries, soft delete pattern |
| `backend/validators/categories.validator.js` | Created | Zod schemas with hex color validation (#RRGGBB) |
| `backend/routes/index.js` | Modified | Registered categories routes |
| `backend/tests/services/categories.service.test.js` | Created | 45 unit tests for service layer |
| `backend/tests/routes/categories.routes.test.js` | Created | 30 integration tests for routes |

### Change Log

| Change | Rationale |
|--------|-----------|
| Implemented CRUD endpoints for categories | FR49-FR52 requirements |
| Added hex color validation regex | AC8 - Color format #RRGGBB |
| Soft delete via is_active flag | Preserve data integrity with time entries |
| Manager-only mutations with rbac middleware | AC7 - Authorization |
| includeInactive filter for managers | AC2 - List filtering |
| Comprehensive test coverage (98%+) | DoD requirement |
