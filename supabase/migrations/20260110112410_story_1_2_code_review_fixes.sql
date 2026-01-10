-- ==========================================
-- Story 1.2 Code Review Fixes
-- Migration: 20260110112410_story_1_2_code_review_fixes
-- Issues addressed:
--   CRITICAL #2: audit_logs append-only protection
--   MEDIUM #3: ON DELETE SET NULL for FK
--   MEDIUM #4: Missing index on templates(user_id)
--   MEDIUM #5: Function search_path security
-- ==========================================

-- ==========================================
-- FIX #2: Protect audit_logs from DELETE (FR79 - append-only)
-- ==========================================

CREATE OR REPLACE FUNCTION prevent_audit_logs_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'DELETE operations are not allowed on audit_logs table (FR79: append-only)';
  RETURN NULL;
END;
$$;

CREATE TRIGGER prevent_audit_logs_delete_trigger
  BEFORE DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_logs_delete();

-- ==========================================
-- FIX #3: Add ON DELETE SET NULL for project_id and category_id
-- ==========================================

-- Drop existing constraints
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_project_id_fkey;
ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_category_id_fkey;

-- Recreate with ON DELETE SET NULL
ALTER TABLE time_entries
  ADD CONSTRAINT time_entries_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

ALTER TABLE time_entries
  ADD CONSTRAINT time_entries_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- ==========================================
-- FIX #4: Add missing index on templates(user_id)
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);

-- ==========================================
-- FIX #5: Fix function search_path for security
-- ==========================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;
