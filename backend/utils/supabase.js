// backend/utils/supabase.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Validates that required environment variables are present.
 * Throws descriptive error if any are missing.
 */
const validateEnvVars = () => {
  const missing = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');
  if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Please ensure these are set in your .env file.'
    );
  }
};

// Validate on module load (skip in test environment to allow mocking)
if (process.env.NODE_ENV !== 'test') {
  validateEnvVars();
}

/**
 * Supabase client for user operations.
 * Uses anon key and respects Row Level Security (RLS) policies.
 */
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Supabase admin client for service role operations.
 * Uses service role key and bypasses RLS policies.
 * Use with caution - only for admin operations.
 */
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

module.exports = { supabase, supabaseAdmin, validateEnvVars };
