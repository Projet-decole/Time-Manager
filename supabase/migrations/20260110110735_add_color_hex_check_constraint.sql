-- ==========================================
-- FIX: Add CHECK constraint for hex color format
-- Story: 1.1 - Code Review Fix
-- Issue: HIGH-1 - AC #5 requires hex format validation
-- ==========================================

-- Add CHECK constraint to validate hex color format (#RRGGBB)
ALTER TABLE categories
ADD CONSTRAINT categories_color_hex_format
CHECK (color ~ '^#[0-9A-Fa-f]{6}$');
