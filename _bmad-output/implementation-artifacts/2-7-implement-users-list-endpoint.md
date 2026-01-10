# Story 2.7: Implement Users List Endpoint (Manager Only)

Status: ready-for-dev

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

- [ ] Task 1: Add users list route (AC: #1-4)
  - [ ] Add GET `/` to `backend/routes/users.routes.js`
  - [ ] Apply authenticate + rbac('manager') middleware

- [ ] Task 2: Add query validator (AC: #2)
  - [ ] Add getUsersQuerySchema to validators
  - [ ] Validate page, limit, role parameters

- [ ] Task 3: Implement service method (AC: #1, #2)
  - [ ] Add `getAllUsers(filters, pagination)` to users.service.js
  - [ ] Support filtering by role
  - [ ] Return count for pagination

- [ ] Task 4: Write tests (AC: #1-4)
  - [ ] Test manager gets list with pagination
  - [ ] Test employee gets 403
  - [ ] Test filtering works

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
### Debug Log References
### Completion Notes List
### File List
