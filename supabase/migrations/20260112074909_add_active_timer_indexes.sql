-- Migration: Add indexes for active timer optimization
-- Story 4.2 Code Review: Performance and race condition prevention
-- Date: 2026-01-12

-- M1: Unique partial index to prevent race condition in startTimer
-- This ensures only ONE active simple timer per user at database level
-- If two concurrent startTimer requests arrive, only one will succeed
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_simple_timer
ON time_entries (user_id)
WHERE end_time IS NULL AND entry_mode = 'simple';

-- M3: Composite index for getActiveTimer query performance
-- Optimizes: SELECT * FROM time_entries WHERE user_id = $1 AND end_time IS NULL AND entry_mode = 'simple'
CREATE INDEX IF NOT EXISTS idx_time_entries_active_timer_lookup
ON time_entries (user_id, entry_mode)
WHERE end_time IS NULL;

COMMENT ON INDEX idx_unique_active_simple_timer IS 'Story 4.2: Prevents race condition - only one active simple timer per user';
COMMENT ON INDEX idx_time_entries_active_timer_lookup IS 'Story 4.2: Optimizes getActiveTimer query performance';

-- NOTE: Day Mode index (idx_unique_active_day) will be added in migration
-- 20260112140000_add_parent_id_to_time_entries.sql when parent_id column is created
