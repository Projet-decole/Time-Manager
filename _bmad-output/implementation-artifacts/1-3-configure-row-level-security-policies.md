# Story 1.3: Configure Row Level Security Policies

Status: ready-for-dev

## Story

As a **developer**,
I want RLS policies configured on all tables,
So that data access is secured at the database level.

## Acceptance Criteria

1. **Given** all database tables exist (from Stories 1.1 and 1.2)
   **When** RLS is enabled on `profiles` table
   **Then** the following policies exist:
   - Users can SELECT their own profile (`auth.uid() = id`)
   - Managers can SELECT all profiles (`role = 'manager'`)
   - Users can UPDATE only their own profile (`auth.uid() = id`)
   - Users can INSERT their own profile on signup (`auth.uid() = id`)

2. **Given** RLS is enabled on `time_entries` table
   **Then** the following policies exist:
   - Users can SELECT, INSERT, UPDATE, DELETE their own entries (`user_id = auth.uid()`)
   - Managers can SELECT all entries (for reporting)

3. **Given** RLS is enabled on `timesheets` table
   **Then** the following policies exist:
   - Users can SELECT their own timesheets (`user_id = auth.uid()`)
   - Users can INSERT their own timesheets (`user_id = auth.uid()`)
   - Users can UPDATE their own timesheets in 'draft' or 'rejected' status
   - Managers can SELECT all timesheets
   - Managers can UPDATE timesheets (for validation/rejection) except their own for validation

4. **Given** RLS is enabled on `templates` table
   **Then** the following policies exist:
   - Users can full CRUD on their own templates (`user_id = auth.uid()`)

5. **Given** RLS is enabled on `teams`, `projects`, `categories` tables
   **Then** the following policies exist:
   - All authenticated users can SELECT (read access)
   - Only managers can INSERT, UPDATE, DELETE

6. **Given** RLS is enabled on `team_members` and `team_projects` junction tables
   **Then** the following policies exist:
   - All authenticated users can SELECT
   - Only managers can INSERT, DELETE

7. **Given** RLS is enabled on `audit_logs` table
   **Then** the following policies exist:
   - No user-level SELECT access (backend service role only)
   - INSERT allowed via service role only (triggered by backend)

8. **Given** all RLS policies are applied
   **Then** the migration file is saved in `supabase/migrations/`

## Tasks / Subtasks

- [ ] Task 1: Create migration file (AC: #8)
  - [ ] 1.1: Create migration file `003_rls_policies.sql`

- [ ] Task 2: Enable RLS on all tables
  - [ ] 2.1: `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`
  - [ ] 2.2: `ALTER TABLE teams ENABLE ROW LEVEL SECURITY;`
  - [ ] 2.3: `ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;`
  - [ ] 2.4: `ALTER TABLE projects ENABLE ROW LEVEL SECURITY;`
  - [ ] 2.5: `ALTER TABLE team_projects ENABLE ROW LEVEL SECURITY;`
  - [ ] 2.6: `ALTER TABLE categories ENABLE ROW LEVEL SECURITY;`
  - [ ] 2.7: `ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;`
  - [ ] 2.8: `ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;`
  - [ ] 2.9: `ALTER TABLE templates ENABLE ROW LEVEL SECURITY;`
  - [ ] 2.10: `ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;`

- [ ] Task 3: Implement profiles policies (AC: #1)
  - [ ] 3.1: Policy for users to read own profile
  - [ ] 3.2: Policy for managers to read all profiles
  - [ ] 3.3: Policy for users to update own profile
  - [ ] 3.4: Policy for users to insert own profile

- [ ] Task 4: Implement time_entries policies (AC: #2)
  - [ ] 4.1: Policy for users to CRUD own entries
  - [ ] 4.2: Policy for managers to read all entries

- [ ] Task 5: Implement timesheets policies (AC: #3)
  - [ ] 5.1: Policy for users to read own timesheets
  - [ ] 5.2: Policy for users to create own timesheets
  - [ ] 5.3: Policy for users to update own draft/rejected timesheets
  - [ ] 5.4: Policy for managers to read all timesheets
  - [ ] 5.5: Policy for managers to update timesheets (validate/reject)

- [ ] Task 6: Implement templates policies (AC: #4)
  - [ ] 6.1: Policy for users to full CRUD own templates

- [ ] Task 7: Implement admin tables policies (AC: #5, #6)
  - [ ] 7.1: Policy for all authenticated to read teams, projects, categories
  - [ ] 7.2: Policy for managers to mutate teams, projects, categories
  - [ ] 7.3: Policy for all authenticated to read junction tables
  - [ ] 7.4: Policy for managers to mutate junction tables

- [ ] Task 8: Implement audit_logs policies (AC: #7)
  - [ ] 8.1: No SELECT policy (service role only)
  - [ ] 8.2: INSERT via service role only

- [ ] Task 9: Apply and verify migration
  - [ ] 9.1: Apply migration via Supabase MCP
  - [ ] 9.2: Test user access patterns
  - [ ] 9.3: Test manager access patterns
  - [ ] 9.4: Verify audit_logs is protected

## Dev Notes

### Architecture Compliance

**RLS Policy Naming Convention:**
```
{table}_{operation}_{scope}
```
Examples:
- `profiles_select_own` - Users read own profile
- `profiles_select_manager` - Managers read all profiles
- `time_entries_all_own` - Users CRUD own entries
- `teams_select_authenticated` - All authenticated read teams
- `teams_mutate_manager` - Managers can modify teams

**Helper Function for Role Check:**
```sql
-- Create helper function to check if user is manager
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Technical Requirements

**Supabase Auth Integration:**
- `auth.uid()` returns the current user's UUID
- `auth.role()` returns 'authenticated' or 'anon'
- Service role bypasses RLS (for backend operations)

**Critical Security Rules:**
1. Employees can ONLY access their own data
2. Managers inherit employee permissions + can view all
3. Managers cannot validate their own timesheets (FR38)
4. Audit logs are never readable by users (FR80)

### SQL Template Reference

```sql
-- ==========================================
-- ROW LEVEL SECURITY POLICIES - Story 1.3
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- HELPER FUNCTION
-- ==========================================

CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- PROFILES POLICIES
-- ==========================================

-- Users can read their own profile
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Managers can read all profiles
CREATE POLICY profiles_select_manager ON profiles
  FOR SELECT USING (is_manager());

-- Users can update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ==========================================
-- TIME_ENTRIES POLICIES
-- ==========================================

-- Users can CRUD their own time entries
CREATE POLICY time_entries_all_own ON time_entries
  FOR ALL USING (auth.uid() = user_id);

-- Managers can read all time entries
CREATE POLICY time_entries_select_manager ON time_entries
  FOR SELECT USING (is_manager());

-- ==========================================
-- TIMESHEETS POLICIES
-- ==========================================

-- Users can read their own timesheets
CREATE POLICY timesheets_select_own ON timesheets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own timesheets
CREATE POLICY timesheets_insert_own ON timesheets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own draft/rejected timesheets
CREATE POLICY timesheets_update_own ON timesheets
  FOR UPDATE USING (
    auth.uid() = user_id
    AND status IN ('draft', 'rejected')
  );

-- Managers can read all timesheets
CREATE POLICY timesheets_select_manager ON timesheets
  FOR SELECT USING (is_manager());

-- Managers can update timesheets (for validation/rejection)
-- Note: Business logic to prevent self-validation is in backend
CREATE POLICY timesheets_update_manager ON timesheets
  FOR UPDATE USING (is_manager());

-- ==========================================
-- TEMPLATES POLICIES
-- ==========================================

-- Users can CRUD their own templates
CREATE POLICY templates_all_own ON templates
  FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- ADMIN TABLES POLICIES (teams, projects, categories)
-- ==========================================

-- All authenticated users can read teams
CREATE POLICY teams_select_authenticated ON teams
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only managers can mutate teams
CREATE POLICY teams_mutate_manager ON teams
  FOR ALL USING (is_manager());

-- All authenticated users can read projects
CREATE POLICY projects_select_authenticated ON projects
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only managers can mutate projects
CREATE POLICY projects_mutate_manager ON projects
  FOR ALL USING (is_manager());

-- All authenticated users can read categories
CREATE POLICY categories_select_authenticated ON categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only managers can mutate categories
CREATE POLICY categories_mutate_manager ON categories
  FOR ALL USING (is_manager());

-- ==========================================
-- JUNCTION TABLES POLICIES
-- ==========================================

-- All authenticated can read team_members
CREATE POLICY team_members_select_authenticated ON team_members
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only managers can mutate team_members
CREATE POLICY team_members_mutate_manager ON team_members
  FOR ALL USING (is_manager());

-- All authenticated can read team_projects
CREATE POLICY team_projects_select_authenticated ON team_projects
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only managers can mutate team_projects
CREATE POLICY team_projects_mutate_manager ON team_projects
  FOR ALL USING (is_manager());

-- ==========================================
-- AUDIT_LOGS POLICIES
-- ==========================================

-- No SELECT policy - only service role can read
-- No INSERT policy for users - backend uses service role
-- This effectively blocks all user access
```

### Project Structure Notes

**Migration File Location:**
```
Time-Manager/
└── supabase/
    └── migrations/
        ├── 20260110000001_create_core_database_schema.sql  (Story 1.1)
        ├── 20260110000002_create_time_tracking_tables.sql  (Story 1.2)
        └── 20260110000003_rls_policies.sql                 (Story 1.3)
```

### Security Considerations

**FR38 - Manager Self-Validation Prevention:**
- RLS allows managers to UPDATE timesheets
- Business logic in backend prevents `validated_by = user_id`
- This is intentional - RLS is for data access, not business rules

**FR80 - Audit Logs Invisible to Users:**
- No SELECT policy = users cannot read
- Service role (backend) can still write and read
- Admin queries use service role key

### Anti-Patterns to Avoid

- **DO NOT** create SELECT policies that allow users to see other users' time entries
- **DO NOT** forget `SECURITY DEFINER` on helper functions
- **DO NOT** create policies that would allow DELETE on audit_logs
- **DO NOT** use `FOR ALL` when you need specific operations (can be confusing)
- **DO NOT** forget that multiple SELECT policies are OR'd together

### Testing Checklist

**Test as Employee:**
- [ ] Can read own profile
- [ ] Cannot read other profiles
- [ ] Can CRUD own time_entries
- [ ] Cannot see other users' time_entries
- [ ] Can read teams, projects, categories
- [ ] Cannot create/modify teams, projects, categories
- [ ] Cannot read audit_logs

**Test as Manager:**
- [ ] Can read all profiles
- [ ] Can read all time_entries
- [ ] Can read/update all timesheets
- [ ] Can CRUD teams, projects, categories
- [ ] Cannot read audit_logs (unless service role)

### Dependencies

**Depends on:**
- Story 1.1: Core Database Schema
- Story 1.2: Time Tracking Tables

**Blocks:**
- Story 2.x: Authentication features (needs secure data access)
- All API endpoints (rely on RLS for security layer)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Row Level Security]
- [Source: _bmad-output/planning-artifacts/architecture.md#RBAC Rules]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: _bmad-output/project-context.md#Database]

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled during implementation_

### Completion Notes List

_To be filled during implementation_

### File List

_To be filled during implementation - expected:_
- `supabase/migrations/20260110XXXXXX_rls_policies.sql`
