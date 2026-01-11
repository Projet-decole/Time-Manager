# Story 3.2: Implement Team Member Assignment API

## Story Info
- **Epic:** Epic 3 - Admin Data Management
- **Story ID:** 3.2
- **Status:** done
- **Priority:** High
- **Estimated Effort:** Medium
- **FRs Covered:** FR41, FR43
- **Depends On:** Story 3.1 (Teams CRUD API)

## User Story

**As a** manager,
**I want to** add and remove members from teams,
**So that** I can manage team composition.

## Acceptance Criteria

### AC1: Add Member to Team
**Given** an authenticated manager and an existing team
**When** POST `/api/v1/teams/:teamId/members` is called with `{ userId }`
**Then** the user is added to the team
**And** response includes `{ success: true, data: { id, teamId, userId, createdAt } }`

### AC2: Prevent Duplicate Assignment
**Given** a user already in the team
**When** trying to add them again
**Then** response is 400 with `{ success: false, error: { code: "ALREADY_MEMBER", message: "User already in team" } }`

### AC3: Remove Member from Team
**Given** an authenticated manager
**When** DELETE `/api/v1/teams/:teamId/members/:userId` is called
**Then** the user is removed from the team
**And** response is `{ success: true, data: { message: "Member removed successfully" } }`

### AC4: List Team Members
**Given** an authenticated manager
**When** GET `/api/v1/teams/:teamId/members` is called
**Then** response includes list of all team members with their profiles
**And** supports pagination

### AC5: Multiple Team Membership (FR43)
**Given** a user belongs to Team A
**When** the user is added to Team B
**Then** the assignment succeeds (no unique constraint across teams)
**And** the user now belongs to both teams

### AC6: Authorization Check
**Given** an employee tries any team member endpoint
**When** the request is processed
**Then** response is 403 Forbidden

### AC7: Non-existent References
**Given** an invalid teamId or userId
**When** any endpoint is called
**Then** response is 404 with appropriate error message

---

## Technical Implementation

### Files to Create/Modify

#### 1. Routes - Add to `backend/routes/teams.routes.js`
```javascript
// New routes to add:
// GET    /api/v1/teams/:teamId/members           - List team members
// POST   /api/v1/teams/:teamId/members           - Add member to team
// DELETE /api/v1/teams/:teamId/members/:userId   - Remove member from team
```

#### 2. Controller - Add to `backend/controllers/teams.controller.js`
```javascript
// Methods to add:
// - getMembers(req, res)     - List members with profiles
// - addMember(req, res)      - Add user to team
// - removeMember(req, res)   - Remove user from team
```

#### 3. Service - Add to `backend/services/teams.service.js`
```javascript
// Methods to add:
// - getMembers(teamId, page, limit)     - Fetch members with pagination
// - addMember(teamId, userId)           - Insert team_members record
// - removeMember(teamId, userId)        - Delete team_members record
// - isMember(teamId, userId)            - Check if user is already member
```

#### 4. Validator - Add to `backend/validators/teams.validator.js`
```javascript
// Schema to add:
// - addMemberSchema: { userId: string (required, UUID format) }
```

### Database Schema Reference

```sql
-- Table: team_members (already exists from Epic 1)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)  -- Prevents duplicate in same team
);
```

### API Response Examples

#### GET /api/v1/teams/:teamId/members
```json
{
  "success": true,
  "data": [
    {
      "id": "membership-uuid",
      "userId": "user-uuid",
      "teamId": "team-uuid",
      "createdAt": "2026-01-10T10:00:00Z",
      "user": {
        "id": "user-uuid",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "employee"
      }
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

#### POST /api/v1/teams/:teamId/members
```json
{
  "success": true,
  "data": {
    "id": "membership-uuid",
    "teamId": "team-uuid",
    "userId": "user-uuid",
    "createdAt": "2026-01-10T10:00:00Z"
  }
}
```

---

## Testing Requirements

### Unit Tests - Add to `backend/tests/services/teams.service.test.js`
- Test getMembers returns paginated members with profiles
- Test getMembers for non-existent team throws 404
- Test addMember successfully adds user to team
- Test addMember for non-existent team throws 404
- Test addMember for non-existent user throws 404
- Test addMember for duplicate membership throws error
- Test removeMember successfully removes user
- Test removeMember for non-member throws 404
- Test isMember returns true for existing member
- Test isMember returns false for non-member

### Integration Tests - Add to `backend/tests/routes/teams.routes.test.js`
- Test GET /teams/:teamId/members without auth returns 401
- Test GET /teams/:teamId/members as employee returns 403
- Test GET /teams/:teamId/members as manager returns members
- Test POST /teams/:teamId/members adds member
- Test POST /teams/:teamId/members with duplicate returns 400
- Test POST /teams/:teamId/members with invalid userId returns 400/404
- Test DELETE /teams/:teamId/members/:userId removes member
- Test DELETE /teams/:teamId/members/:userId for non-member returns 404

---

## Definition of Done

- [x] All routes added to teams.routes.js
- [x] Controller methods handle all edge cases
- [x] Service layer with proper Supabase queries
- [x] Validation for userId (UUID format)
- [x] All tests passing
- [x] >80% test coverage maintained
- [x] Proper error codes (ALREADY_MEMBER, NOT_MEMBER, etc.)

---

## Notes

- Reuse patterns from Story 3.1
- team_members table has UNIQUE(team_id, user_id) - handle constraint violations gracefully
- Need to verify both team and user exist before adding membership
- When fetching members, JOIN with profiles table for user details

---

## Dev Agent Record

### File List
| File | Action | Description |
|------|--------|-------------|
| `backend/routes/teams.routes.js` | Modified | Added member routes: GET/POST /:teamId/members, DELETE /:teamId/members/:userId |
| `backend/controllers/teams.controller.js` | Modified | Added getMembers, addMember, removeMember methods |
| `backend/services/teams.service.js` | Modified | Added getMembers, addMember, removeMember, isMember service methods |
| `backend/validators/teams.validator.js` | Modified | Added addMemberSchema for userId validation |
| `backend/tests/services/teams.service.test.js` | Modified | Added tests for member service methods + AC5 multiple membership test |
| `backend/tests/routes/teams.routes.test.js` | Modified | Added integration tests for member routes |

### Change Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-01-11 | Initial implementation | Story 3.2 development |
| 2026-01-11 | Added AC5 explicit test | Code review finding - missing test for FR43 multiple team membership |
| 2026-01-11 | Cleaned up validator imports | Code review finding - removed duplicate validateUUID export |
