-- ==========================================
-- ROW LEVEL SECURITY POLICIES - Story 1.3
-- ==========================================

-- ==========================================
-- HELPER FUNCTION
-- ==========================================

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

-- ==========================================
-- ENABLE RLS ON ALL TABLES
-- ==========================================

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
-- PROFILES POLICIES (AC #1)
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
-- TIME_ENTRIES POLICIES (AC #2)
-- ==========================================

-- Users can CRUD their own time entries
CREATE POLICY time_entries_all_own ON time_entries
  FOR ALL USING (auth.uid() = user_id);

-- Managers can read all time entries
CREATE POLICY time_entries_select_manager ON time_entries
  FOR SELECT USING (is_manager());

-- ==========================================
-- TIMESHEETS POLICIES (AC #3)
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
-- Note: Business logic to prevent self-validation is in backend (FR38)
CREATE POLICY timesheets_update_manager ON timesheets
  FOR UPDATE USING (is_manager());

-- ==========================================
-- TEMPLATES POLICIES (AC #4)
-- ==========================================

-- Users can CRUD their own templates
CREATE POLICY templates_all_own ON templates
  FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- ADMIN TABLES POLICIES - teams (AC #5)
-- ==========================================

-- All authenticated users can read teams
CREATE POLICY teams_select_authenticated ON teams
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only managers can mutate teams
CREATE POLICY teams_insert_manager ON teams
  FOR INSERT WITH CHECK (is_manager());

CREATE POLICY teams_update_manager ON teams
  FOR UPDATE USING (is_manager());

CREATE POLICY teams_delete_manager ON teams
  FOR DELETE USING (is_manager());

-- ==========================================
-- ADMIN TABLES POLICIES - projects (AC #5)
-- ==========================================

-- All authenticated users can read projects
CREATE POLICY projects_select_authenticated ON projects
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only managers can mutate projects
CREATE POLICY projects_insert_manager ON projects
  FOR INSERT WITH CHECK (is_manager());

CREATE POLICY projects_update_manager ON projects
  FOR UPDATE USING (is_manager());

CREATE POLICY projects_delete_manager ON projects
  FOR DELETE USING (is_manager());

-- ==========================================
-- ADMIN TABLES POLICIES - categories (AC #5)
-- ==========================================

-- All authenticated users can read categories
CREATE POLICY categories_select_authenticated ON categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only managers can mutate categories
CREATE POLICY categories_insert_manager ON categories
  FOR INSERT WITH CHECK (is_manager());

CREATE POLICY categories_update_manager ON categories
  FOR UPDATE USING (is_manager());

CREATE POLICY categories_delete_manager ON categories
  FOR DELETE USING (is_manager());

-- ==========================================
-- JUNCTION TABLES POLICIES - team_members (AC #6)
-- ==========================================

-- All authenticated can read team_members
CREATE POLICY team_members_select_authenticated ON team_members
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only managers can mutate team_members
CREATE POLICY team_members_insert_manager ON team_members
  FOR INSERT WITH CHECK (is_manager());

CREATE POLICY team_members_delete_manager ON team_members
  FOR DELETE USING (is_manager());

-- ==========================================
-- JUNCTION TABLES POLICIES - team_projects (AC #6)
-- ==========================================

-- All authenticated can read team_projects
CREATE POLICY team_projects_select_authenticated ON team_projects
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only managers can mutate team_projects
CREATE POLICY team_projects_insert_manager ON team_projects
  FOR INSERT WITH CHECK (is_manager());

CREATE POLICY team_projects_delete_manager ON team_projects
  FOR DELETE USING (is_manager());

-- ==========================================
-- AUDIT_LOGS POLICIES (AC #7)
-- ==========================================

-- No SELECT policy - only service role can read
-- No INSERT policy for users - backend uses service role
-- This effectively blocks all user access to audit_logs
-- Service role bypasses RLS automatically
