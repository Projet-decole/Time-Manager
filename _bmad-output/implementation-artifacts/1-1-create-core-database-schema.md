# Story 1.1: Create Core Database Schema

Status: done

## Story

As a **developer**,
I want the core database tables created in Supabase,
So that I have the data foundation for all features.

## Acceptance Criteria

1. **Given** a fresh Supabase project
   **When** the migration script is executed
   **Then** the `profiles` table is created with:
   - `id` UUID PRIMARY KEY referencing `auth.users(id)` ON DELETE CASCADE
   - `email` TEXT NOT NULL
   - `first_name` TEXT NOT NULL
   - `last_name` TEXT NOT NULL
   - `role` TEXT NOT NULL with CHECK constraint for ('employee', 'manager')
   - `weekly_hours_target` INTEGER DEFAULT 35
   - `created_at` TIMESTAMPTZ DEFAULT NOW()
   - `updated_at` TIMESTAMPTZ DEFAULT NOW()

2. **Given** the migration script is executed
   **Then** the `teams` table is created with:
   - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - `name` TEXT NOT NULL
   - `description` TEXT (nullable)
   - `created_at` TIMESTAMPTZ DEFAULT NOW()
   - `updated_at` TIMESTAMPTZ DEFAULT NOW()

3. **Given** the migration script is executed
   **Then** the `team_members` junction table is created with:
   - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - `team_id` UUID REFERENCES teams(id) ON DELETE CASCADE
   - `user_id` UUID REFERENCES profiles(id) ON DELETE CASCADE
   - `created_at` TIMESTAMPTZ DEFAULT NOW()
   - UNIQUE constraint on (team_id, user_id)

4. **Given** the migration script is executed
   **Then** the `projects` table is created with:
   - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - `code` TEXT UNIQUE NOT NULL
   - `name` TEXT NOT NULL
   - `description` TEXT (nullable)
   - `budget_hours` INTEGER (nullable)
   - `status` TEXT DEFAULT 'active' with CHECK constraint for ('active', 'archived')
   - `created_at` TIMESTAMPTZ DEFAULT NOW()
   - `updated_at` TIMESTAMPTZ DEFAULT NOW()

5. **Given** the migration script is executed
   **Then** the `categories` table is created with:
   - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - `name` TEXT NOT NULL
   - `description` TEXT (nullable)
   - `color` TEXT NOT NULL (hex format #RRGGBB)
   - `is_active` BOOLEAN DEFAULT true
   - `created_at` TIMESTAMPTZ DEFAULT NOW()
   - `updated_at` TIMESTAMPTZ DEFAULT NOW()

6. **Given** the migration script is executed
   **Then** the `team_projects` junction table is created with:
   - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - `team_id` UUID REFERENCES teams(id) ON DELETE CASCADE
   - `project_id` UUID REFERENCES projects(id) ON DELETE CASCADE
   - `created_at` TIMESTAMPTZ DEFAULT NOW()
   - UNIQUE constraint on (team_id, project_id)

7. **Given** all tables are created
   **Then** appropriate indexes exist:
   - `idx_team_members_user_id` on team_members(user_id)
   - `idx_team_members_team_id` on team_members(team_id)
   - `idx_team_projects_team_id` on team_projects(team_id)
   - `idx_team_projects_project_id` on team_projects(project_id)

8. **Given** the migration is applied
   **Then** the migration file is saved in `supabase/migrations/` with timestamp prefix

## Tasks / Subtasks

- [x] Task 1: Create migration file structure (AC: #8)
  - [x] 1.1: Create `supabase/migrations/` directory if not exists
  - [x] 1.2: Create migration file `001_core_schema.sql` with timestamp prefix

- [x] Task 2: Implement profiles table (AC: #1)
  - [x] 2.1: Write CREATE TABLE statement for profiles
  - [x] 2.2: Add CHECK constraint for role enum
  - [x] 2.3: Add foreign key to auth.users with CASCADE delete

- [x] Task 3: Implement teams table (AC: #2)
  - [x] 3.1: Write CREATE TABLE statement for teams

- [x] Task 4: Implement team_members junction table (AC: #3)
  - [x] 4.1: Write CREATE TABLE statement for team_members
  - [x] 4.2: Add UNIQUE constraint for (team_id, user_id)
  - [x] 4.3: Add CASCADE delete foreign keys

- [x] Task 5: Implement projects table (AC: #4)
  - [x] 5.1: Write CREATE TABLE statement for projects
  - [x] 5.2: Add UNIQUE constraint on code
  - [x] 5.3: Add CHECK constraint for status enum

- [x] Task 6: Implement categories table (AC: #5)
  - [x] 6.1: Write CREATE TABLE statement for categories
  - [x] 6.2: Verify color field accepts hex format

- [x] Task 7: Implement team_projects junction table (AC: #6)
  - [x] 7.1: Write CREATE TABLE statement for team_projects
  - [x] 7.2: Add UNIQUE constraint for (team_id, project_id)
  - [x] 7.3: Add CASCADE delete foreign keys

- [x] Task 8: Create indexes (AC: #7)
  - [x] 8.1: Create index on team_members(user_id)
  - [x] 8.2: Create index on team_members(team_id)
  - [x] 8.3: Create index on team_projects(team_id)
  - [x] 8.4: Create index on team_projects(project_id)

- [x] Task 9: Apply and verify migration
  - [x] 9.1: Apply migration via Supabase MCP or dashboard
  - [x] 9.2: Verify all tables created correctly
  - [x] 9.3: Verify all constraints and indexes exist

## Dev Notes

### Architecture Compliance

**Database Naming Conventions (MANDATORY):**
- Tables: snake_case, plural (`profiles`, `team_members`, `team_projects`)
- Columns: snake_case (`user_id`, `created_at`, `budget_hours`)
- Foreign Keys: `{table_singular}_id` (`team_id`, `project_id`, `user_id`)
- Indexes: `idx_{table}_{columns}` (`idx_team_members_user_id`)
- Constraints: `{table}_{type}_{columns}` (`team_members_unique_team_user`)

**Data Types (MANDATORY):**
- Primary keys: UUID with `gen_random_uuid()` default
- Timestamps: `TIMESTAMPTZ` with `DEFAULT NOW()` (NOT `TIMESTAMP`)
- Booleans: `BOOLEAN` (NOT `INTEGER` or `TEXT`)
- Enums: Use `TEXT` with `CHECK` constraint (NOT PostgreSQL ENUM type)

**Foreign Key Rules:**
- Always use `ON DELETE CASCADE` for dependent tables
- profiles.id references auth.users(id) - this is the Supabase Auth integration

### Technical Requirements

**Supabase MCP Integration:**
- Use `mcp__supabase__apply_migration` tool to apply the migration
- Migration name should be descriptive: `create_core_database_schema`
- SQL must be valid PostgreSQL syntax

**Critical Constraints:**
- `profiles.id` MUST reference `auth.users(id)` - this links to Supabase Auth
- `profiles.role` MUST only allow 'employee' or 'manager' values
- `projects.code` MUST be UNIQUE for auto-generated project codes
- Junction tables MUST have UNIQUE constraints to prevent duplicates

### SQL Template Reference

```sql
-- ==========================================
-- CORE TABLES - Story 1.1
-- ==========================================

-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('employee', 'manager')),
  weekly_hours_target INTEGER DEFAULT 35,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Members (junction table)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  budget_hours INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team Projects (junction table)
CREATE TABLE team_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, project_id)
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_projects_team_id ON team_projects(team_id);
CREATE INDEX idx_team_projects_project_id ON team_projects(project_id);
```

### Project Structure Notes

**Migration File Location:**
```
Time-Manager/
└── supabase/
    └── migrations/
        └── 20260110000001_create_core_database_schema.sql
```

**Important:** This migration creates the foundation for ALL other features. Story 1.2 will add time tracking tables that depend on `profiles`, `projects`, and `categories`.

### Anti-Patterns to Avoid

- **DO NOT** use PostgreSQL ENUM types - use TEXT with CHECK constraint instead (easier to modify)
- **DO NOT** use `TIMESTAMP` - always use `TIMESTAMPTZ` for timezone awareness
- **DO NOT** forget `NOT NULL` on foreign key columns in junction tables
- **DO NOT** use `INTEGER` for IDs - always use `UUID`
- **DO NOT** forget `ON DELETE CASCADE` on child tables

### Dependencies

**Depends on:**
- Supabase project must be configured and accessible
- auth.users table must exist (created by Supabase Auth)

**Blocks:**
- Story 1.2: Create Time Tracking Database Tables (needs profiles, projects, categories)
- Story 1.3: Configure Row Level Security Policies (needs all tables)
- All other stories depend on database schema

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md#Database Schema SQL]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]
- [Source: _bmad-output/project-context.md#Technology Stack]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Migration applied via Supabase MCP: `mcp__supabase__apply_migration`
- Tables verified via: `mcp__supabase__list_tables`
- Indexes verified via: `mcp__supabase__execute_sql` (pg_indexes query)

### Completion Notes List

- ✅ Created 6 tables: profiles, teams, team_members, projects, categories, team_projects
- ✅ All foreign keys with ON DELETE CASCADE configured correctly
- ✅ CHECK constraints for profiles.role ('employee', 'manager') and projects.status ('active', 'archived')
- ✅ UNIQUE constraints on team_members(team_id, user_id), team_projects(team_id, project_id), projects.code
- ✅ 4 indexes created: idx_team_members_user_id, idx_team_members_team_id, idx_team_projects_team_id, idx_team_projects_project_id
- ✅ Migration recorded in Supabase: 20260110105727_create_core_database_schema
- ✅ Local migration file saved for version control

### Code Review Fixes Applied

- ✅ **HIGH-1 FIXED:** Added CHECK constraint `categories_color_hex_format` to validate hex color format (#RRGGBB)
- ✅ **MEDIUM-3 FIXED:** Added `update_updated_at_column()` trigger function and triggers on profiles, teams, projects, categories
- ✅ **MEDIUM-1 FIXED:** Renamed local migration file to match Supabase timestamp (20260110105727)
- ℹ️ **MEDIUM-2 NOTED:** `supabase/` directory needs git commit (user action required)
- ℹ️ **LOW-1 OK:** RLS disabled is expected - Story 1.3 handles RLS configuration
- ℹ️ **LOW-2 DEFERRED:** TEXT length constraints not added (not in original AC)

### File List

- `supabase/migrations/20260110105727_create_core_database_schema.sql` (NEW)
- `supabase/migrations/20260110110735_add_color_hex_check_constraint.sql` (NEW - Code Review Fix)
- `supabase/migrations/20260110110751_add_updated_at_triggers.sql` (NEW - Code Review Fix)

## Change Log

| Date | Change |
|------|--------|
| 2026-01-10 | Story implementation complete - all 6 core tables, indexes, and constraints created via Supabase MCP |
| 2026-01-10 | **Code Review Fix (HIGH-1):** Added CHECK constraint for hex color format on categories.color |
| 2026-01-10 | **Code Review Fix (MEDIUM-3):** Added updated_at triggers for profiles, teams, projects, categories |
| 2026-01-10 | **Code Review Fix (MEDIUM-1):** Synchronized local migration filename with Supabase timestamp |
