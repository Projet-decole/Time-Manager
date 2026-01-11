// frontend/src/lib/supabase.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a placeholder client if environment variables are missing
// This allows the app to load without crashing, but reset password won't work
let supabase;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  // In development/test without Supabase configured, create a mock-like object
  // that won't crash but will fail gracefully when used
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    console.warn('Missing Supabase environment variables. Reset password functionality will not work.');
  }
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      updateUser: async () => ({ error: { message: 'Supabase not configured' } })
    }
  };
}

export { supabase };
