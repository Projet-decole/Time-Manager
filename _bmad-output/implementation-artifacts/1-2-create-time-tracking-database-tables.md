# Story 1.2: Create Time Tracking Database Tables

Status: ready-for-dev

## Story

As a **developer**,
I want time tracking related tables created,
So that time entries and timesheets can be stored.

## Acceptance Criteria

1. **Given** the core tables exist from Story 1.1
   **When** the time tracking migration is executed
   **Then** the `time_entries` table is created with:
   - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - `user_id` UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
   - `project_id` UUID REFERENCES projects(id) (nullable)
   - `category_id` UUID REFERENCES categories(id) (nullable)
   - `start_time` TIMESTAMPTZ NOT NULL
   - `end_time` TIMESTAMPTZ (nullable - null means timer running)
   - `duration_minutes` INTEGER (nullable - calculated when end_time set)
   - `description` TEXT (nullable)
   - `entry_mode` TEXT with CHECK constraint for ('simple', 'day', 'template')
   - `created_at` TIMESTAMPTZ DEFAULT NOW()
   - `updated_at` TIMESTAMPTZ DEFAULT NOW()

2. **Given** the core tables exist from Story 1.1
   **When** the time tracking migration is executed
   **Then** the `timesheets` table is created with:
   - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - `user_id` UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
   - `week_start` DATE NOT NULL
   - `week_end` DATE NOT NULL
   - `status` TEXT DEFAULT 'draft' with CHECK constraint for ('draft', 'submitted', 'validated', 'rejected')
   - `submitted_at` TIMESTAMPTZ (nullable)
   - `validated_at` TIMESTAMPTZ (nullable)
   - `validated_by` UUID REFERENCES profiles(id) (nullable)
   - `rejection_reason` TEXT (nullable)
   - `total_hours` DECIMAL(5,2) (nullable)
   - `created_at` TIMESTAMPTZ DEFAULT NOW()
   - `updated_at` TIMESTAMPTZ DEFAULT NOW()
   - UNIQUE constraint on (user_id, week_start)

3. **Given** the core tables exist from Story 1.1
   **When** the time tracking migration is executed
   **Then** the `templates` table is created with:
   - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - `user_id` UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
   - `name` TEXT NOT NULL
   - `description` TEXT (nullable)
   - `config` JSONB NOT NULL (stores block structure)
   - `created_at` TIMESTAMPTZ DEFAULT NOW()
   - `updated_at` TIMESTAMPTZ DEFAULT NOW()

4. **Given** the core tables exist from Story 1.1
   **When** the time tracking migration is executed
   **Then** the `audit_logs` table is created with:
   - `id` UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - `user_id` UUID REFERENCES profiles(id) (nullable - for system actions)
   - `action` TEXT NOT NULL
   - `table_name` TEXT NOT NULL
   - `record_id` UUID NOT NULL
   - `old_values` JSONB (nullable)
   - `new_values` JSONB (nullable)
   - `created_at` TIMESTAMPTZ DEFAULT NOW()

5. **Given** all time tracking tables are created
   **Then** appropriate indexes exist:
   - `idx_time_entries_user_id` on time_entries(user_id)
   - `idx_time_entries_start_time` on time_entries(start_time)
   - `idx_time_entries_user_start` on time_entries(user_id, start_time)
   - `idx_timesheets_user_week` on timesheets(user_id, week_start)
   - `idx_timesheets_status` on timesheets(status)
   - `idx_audit_logs_record` on audit_logs(table_name, record_id)
   - `idx_audit_logs_user` on audit_logs(user_id)

6. **Given** the migration is applied
   **Then** the migration file is saved in `supabase/migrations/` with appropriate timestamp prefix

## Tasks / Subtasks

- [ ] Task 1: Create migration file (AC: #6)
  - [ ] 1.1: Create migration file `002_time_tracking_schema.sql` with timestamp prefix

- [ ] Task 2: Implement time_entries table (AC: #1)
  - [ ] 2.1: Write CREATE TABLE statement for time_entries
  - [ ] 2.2: Add CHECK constraint for entry_mode enum ('simple', 'day', 'template')
  - [ ] 2.3: Add foreign keys to profiles, projects, categories
  - [ ] 2.4: Verify nullable fields for running timer support

- [ ] Task 3: Implement timesheets table (AC: #2)
  - [ ] 3.1: Write CREATE TABLE statement for timesheets
  - [ ] 3.2: Add CHECK constraint for status enum
  - [ ] 3.3: Add UNIQUE constraint on (user_id, week_start)
  - [ ] 3.4: Add foreign key for validated_by to profiles

- [ ] Task 4: Implement templates table (AC: #3)
  - [ ] 4.1: Write CREATE TABLE statement for templates
  - [ ] 4.2: Verify JSONB type for config field

- [ ] Task 5: Implement audit_logs table (AC: #4)
  - [ ] 5.1: Write CREATE TABLE statement for audit_logs
  - [ ] 5.2: Verify JSONB type for old_values and new_values

- [ ] Task 6: Create indexes (AC: #5)
  - [ ] 6.1: Create composite index on time_entries(user_id, start_time)
  - [ ] 6.2: Create index on time_entries(start_time) for date range queries
  - [ ] 6.3: Create composite index on timesheets(user_id, week_start)
  - [ ] 6.4: Create index on timesheets(status) for filtering
  - [ ] 6.5: Create composite index on audit_logs(table_name, record_id)
  - [ ] 6.6: Create index on audit_logs(user_id)

- [ ] Task 7: Apply and verify migration
  - [ ] 7.1: Apply migration via Supabase MCP
  - [ ] 7.2: Verify all tables created correctly
  - [ ] 7.3: Verify all constraints and indexes exist
  - [ ] 7.4: Verify foreign key relationships work

## Dev Notes

### Architecture Compliance

**Database Naming Conventions (MANDATORY):**
- Tables: snake_case, plural (`time_entries`, `timesheets`, `audit_logs`)
- Columns: snake_case (`user_id`, `start_time`, `entry_mode`)
- Indexes: `idx_{table}_{columns}` (`idx_time_entries_user_start`)

**Data Types (MANDATORY):**
- Primary keys: UUID with `gen_random_uuid()` default
- Timestamps: `TIMESTAMPTZ` (NOT `TIMESTAMP`)
- JSON data: `JSONB` (NOT `JSON` - better performance)
- Decimal values: `DECIMAL(5,2)` for hours (allows 999.99 max)
- Enums: TEXT with CHECK constraint

**Critical Design Decisions:**

1. **time_entries.end_time nullable:** When null, indicates an active/running timer
2. **time_entries.duration_minutes:** Calculated field, set when timer stops
3. **timesheets UNIQUE(user_id, week_start):** One timesheet per user per week
4. **templates.config JSONB:** Flexible structure for storing block templates
5. **audit_logs:** Append-only table, never delete records (FR79)

### Technical Requirements

**Supabase MCP Integration:**
- Use `mcp__supabase__apply_migration` tool
- Migration name: `create_time_tracking_tables`
- Depends on Story 1.1 tables (profiles, projects, categories)

**JSONB Config Structure for Templates:**
```json
{
  "blocks": [
    {
      "startTime": "09:00",
      "endTime": "12:00",
      "projectId": "uuid-or-null",
      "categoryId": "uuid-or-null",
      "description": "Morning work"
    }
  ]
}
```

### SQL Template Reference

```sql
-- ==========================================
-- TIME TRACKING TABLES - Story 1.2
-- ==========================================

-- Time Entries
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  category_id UUID REFERENCES categories(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  description TEXT,
  entry_mode TEXT CHECK (entry_mode IN ('simple', 'day', 'template')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timesheets
CREATE TABLE timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'validated', 'rejected')),
  submitted_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  total_hours DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================

-- Time entries indexes
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_start_time ON time_entries(start_time);
CREATE INDEX idx_time_entries_user_start ON time_entries(user_id, start_time);

-- Timesheets indexes
CREATE INDEX idx_timesheets_user_week ON timesheets(user_id, week_start);
CREATE INDEX idx_timesheets_status ON timesheets(status);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
```

### Project Structure Notes

**Migration File Location:**
```
Time-Manager/
└── supabase/
    └── migrations/
        ├── 20260110000001_create_core_database_schema.sql  (Story 1.1)
        └── 20260110000002_create_time_tracking_tables.sql  (Story 1.2)
```

### Business Logic Notes

**Timesheet Status Workflow:**
```
draft → submitted → validated
                 ↘ rejected → draft (resubmit)
```

**Time Entry Modes:**
- `simple`: Start/Stop timer (FR14-FR18)
- `day`: Day mode with blocks (FR19-FR23)
- `template`: Created from template (FR24-FR30)

**Audit Log Actions:**
- `CREATE`, `UPDATE`, `DELETE` for CRUD operations
- `SUBMIT`, `VALIDATE`, `REJECT`, `REOPEN` for timesheet workflow

### Anti-Patterns to Avoid

- **DO NOT** use `TIMESTAMP` - always `TIMESTAMPTZ`
- **DO NOT** use `JSON` - always `JSONB` for better indexing
- **DO NOT** add `ON DELETE CASCADE` to audit_logs.user_id (preserve history)
- **DO NOT** forget the UNIQUE constraint on timesheets(user_id, week_start)
- **DO NOT** make audit_logs deletable - this table is append-only

### Dependencies

**Depends on:**
- Story 1.1: Core Database Schema (profiles, projects, categories must exist)

**Blocks:**
- Story 1.3: Configure Row Level Security Policies
- Story 4.x: Time Tracking features (needs time_entries)
- Story 5.x: Timesheet features (needs timesheets)
- Story 8.1: Audit Logging Service (needs audit_logs)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Database Schema SQL]
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]
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
- `supabase/migrations/20260110XXXXXX_create_time_tracking_tables.sql`
