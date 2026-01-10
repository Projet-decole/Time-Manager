// backend/services/health.service.js

const { supabase } = require('../utils/supabase');

/**
 * Run all health checks
 * @returns {Promise<Object>} Check results { database: 'ok' | 'failed' }
 */
const runChecks = async () => {
  const checks = {
    database: await checkDatabase()
  };

  return checks;
};

/**
 * Check database connectivity
 * @returns {Promise<string>} 'ok' or 'failed'
 */
const checkDatabase = async () => {
  try {
    // Simple query to verify connection
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    return error ? 'failed' : 'ok';
  } catch (err) {
    console.error('[HEALTH]', {
      check: 'database',
      status: 'failed',
      error: err.message,
      timestamp: new Date().toISOString()
    });
    return 'failed';
  }
};

module.exports = { runChecks, checkDatabase };
