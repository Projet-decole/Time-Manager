# Story 2.7: Implement Users List Endpoint (Manager Only)

Status: done

## Story

As a **manager**,
I want an API endpoint to list all users,
So that I can view my team members and their information.

## Acceptance Criteria

1. **Given** an authenticated manager
   **When** GET `/api/v1/users` is called
   **Then** response includes paginated list of all users
   **And** format is `{ success: true, data: [...], meta: { pagination: {...} } }`

2. **Given** query parameters `?page=2&limit=10&role=employee`
   **When** request is made
   **Then** results are filtered and paginated correctly

3. **Given** an authenticated employee
   **When** GET `/api/v1/users` is called
   **Then** response is 403 Forbidden

4. **Given** an unauthenticated request
   **When** GET `/api/v1/users` is called
   **Then** response is 401 Unauthorized

## Tasks / Subtasks

- [x] Task 1: Add users list route (AC: #1-4)
  - [x] Add GET `/` to `backend/routes/users.routes.js`
  - [x] Apply authenticate + rbac('manager') middleware

- [x] Task 2: Add query validator (AC: #2)
  - [x] Pagination handled via parsePaginationParams utility
  - [x] Role filter validation in service (only employee|manager accepted)

- [x] Task 3: Implement service method (AC: #1, #2)
  - [x] Add `getAllUsers(filters, pagination)` to users.service.js
  - [x] Support filtering by role
  - [x] Return count for pagination

- [x] Task 4: Write tests (AC: #1-4)
  - [x] Test manager gets list with pagination
  - [x] Test employee gets 403
  - [x] Test filtering works

## Dev Notes

### Service Implementation

```javascript
const getAllUsers = async (filters = {}, pagination = {}) => {
  const { page = 1, limit = 20 } = pagination;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role, weekly_hours_target, created_at', { count: 'exact' });

  if (filters.role) {
    query = query.eq('role', filters.role);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return {
    data: data.map(snakeToCamel),
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
  };
};
```

### Response Format

```json
{
  "success": true,
  "data": [
    { "id": "uuid", "email": "john@example.com", "firstName": "John", "role": "employee" }
  ],
  "meta": {
    "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 }
  }
}
```

### E2E Testing Notes

**Test manuel:**
```bash
# En tant que manager
curl -H "Authorization: Bearer <manager-token>" \
  "http://localhost:3000/api/v1/users?page=1&limit=10&role=employee"

# En tant qu'employee (doit retourner 403)
curl -H "Authorization: Bearer <employee-token>" \
  "http://localhost:3000/api/v1/users"
```

## What User Can Do After This Story

**Backend API seulement** - Pas de changement visible pour l'utilisateur final.

**Pour le développeur/testeur:**
- Les managers peuvent lister tous les utilisateurs via API
- Les employees reçoivent 403 Forbidden
- La pagination fonctionne correctement
- Le filtrage par rôle fonctionne

**La page UI manager sera ajoutée dans Story 2-13.**

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
N/A - Clean implementation

### Completion Notes List
- Implemented GET /api/v1/users endpoint with authenticate + rbac('manager') middleware
- Added getAllUsers service method with pagination and role filtering
- Used existing parsePaginationParams and buildPaginationMeta utilities
- Role filter only accepts 'employee' or 'manager' (invalid values ignored)
- paginatedResponse helper used for standard response format
- 16 new tests added (10 route tests + 6 service tests)
- All 273 backend tests pass (post-review)

### File List
- `backend/routes/users.routes.js` (modified - added GET / route)
- `backend/controllers/users.controller.js` (modified - added getAll)
- `backend/services/users.service.js` (modified - added getAllUsers)
- `backend/tests/routes/users.routes.test.js` (modified - added GET tests)
- `backend/tests/services/users.service.test.js` (modified - added getAllUsers tests)

### Change Log
- 2026-01-10: Implemented users list endpoint with RBAC, pagination, and role filtering
- 2026-01-10: Code review fixes applied (see Senior Developer Review below)

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.5 (Dev Agent)
**Date:** 2026-01-10
**Outcome:** ✅ APPROVED

### Findings Resolved

| Severity | Issue | Resolution |
|----------|-------|------------|
| MEDIUM | M1: Test count claim incorrect (20→16) | Fixed in Completion Notes |
| MEDIUM | M2: require() inside function | Moved import to top of users.service.js |
| LOW | L1: Coverage gap data null case | Added test, now 100% branch coverage |

### Post-Review Test Results
```
Tests:       273 passed (+1 new)
Coverage:    users.service.js 100% lines, 100% branches
Full Suite:  17 suites, 273 tests
```

### Files Modified During Review
- `backend/services/users.service.js` - moved pagination import to top
- `backend/tests/services/users.service.test.js` - added null data test
