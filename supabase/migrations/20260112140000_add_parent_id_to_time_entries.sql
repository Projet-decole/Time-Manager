-- ==========================================
-- ADD PARENT_ID COLUMN - Story 4.5
-- Migration: 20260112140000_add_parent_id_to_time_entries
-- ==========================================

-- Add parent_id column to time_entries for Day Mode hierarchical entries
-- A day entry (entry_mode='day', parent_id=NULL) can have child time blocks
-- Child blocks reference the parent day via parent_id
ALTER TABLE time_entries
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES time_entries(id) ON DELETE CASCADE;

-- Index for efficient child lookup
CREATE INDEX IF NOT EXISTS idx_time_entries_parent_id ON time_entries(parent_id);

-- Index for active day lookup (entry_mode + end_time + parent_id)
CREATE INDEX IF NOT EXISTS idx_time_entries_active_day ON time_entries(user_id, entry_mode, end_time)
WHERE entry_mode = 'day' AND end_time IS NULL AND parent_id IS NULL;
