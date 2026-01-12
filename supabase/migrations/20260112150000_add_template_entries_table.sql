-- ==========================================
-- Template Entries Table - Story 4.8
-- Migration: 20260112150000_add_template_entries_table
-- ==========================================
-- Template Entries (replaces JSONB config in templates table)
-- Each template can have multiple entries representing time blocks in a day

-- Template Entries Table
CREATE TABLE template_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT template_entries_time_check CHECK (end_time > start_time),
  CONSTRAINT template_entries_description_length CHECK (char_length(description) <= 500)
);

-- Indexes for efficient queries
CREATE INDEX idx_template_entries_template_id ON template_entries(template_id);
CREATE INDEX idx_template_entries_sort ON template_entries(template_id, sort_order);

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_template_entries
  BEFORE UPDATE ON template_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Make config column optional in templates table (for migration period)
-- This allows new templates to use template_entries instead of JSONB config
ALTER TABLE templates ALTER COLUMN config DROP NOT NULL;

-- Add constraint for template name length
ALTER TABLE templates ADD CONSTRAINT templates_name_length CHECK (char_length(name) <= 100);
ALTER TABLE templates ADD CONSTRAINT templates_description_length CHECK (char_length(description) <= 500);

-- ==========================================
-- RLS Policies for template_entries
-- ==========================================

-- Enable RLS on template_entries
ALTER TABLE template_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view entries of their own templates
CREATE POLICY "Users can view own template entries"
  ON template_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM templates t
      WHERE t.id = template_entries.template_id
      AND t.user_id = auth.uid()
    )
  );

-- Policy: Users can insert entries into their own templates
CREATE POLICY "Users can insert own template entries"
  ON template_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM templates t
      WHERE t.id = template_entries.template_id
      AND t.user_id = auth.uid()
    )
  );

-- Policy: Users can update entries of their own templates
CREATE POLICY "Users can update own template entries"
  ON template_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM templates t
      WHERE t.id = template_entries.template_id
      AND t.user_id = auth.uid()
    )
  );

-- Policy: Users can delete entries of their own templates
CREATE POLICY "Users can delete own template entries"
  ON template_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM templates t
      WHERE t.id = template_entries.template_id
      AND t.user_id = auth.uid()
    )
  );

-- ==========================================
-- Comments
-- ==========================================
COMMENT ON TABLE template_entries IS 'Template entries representing time blocks within a template';
COMMENT ON COLUMN template_entries.start_time IS 'Start time in HH:MM format (TIME type)';
COMMENT ON COLUMN template_entries.end_time IS 'End time in HH:MM format (TIME type)';
COMMENT ON COLUMN template_entries.sort_order IS 'Order of entries within a template';
