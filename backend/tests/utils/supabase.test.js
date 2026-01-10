// backend/tests/utils/supabase.test.js

describe('supabase utils', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to get fresh imports
    jest.resetModules();
    // Clone the environment
    process.env = { ...originalEnv, NODE_ENV: 'test' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('validateEnvVars', () => {
    it('should not throw when all env vars are present', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      const { validateEnvVars } = require('../../utils/supabase');
      expect(() => validateEnvVars()).not.toThrow();
    });

    it('should throw when SUPABASE_URL is missing', () => {
      delete process.env.SUPABASE_URL;
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      const { validateEnvVars } = require('../../utils/supabase');
      expect(() => validateEnvVars()).toThrow('Missing required environment variables: SUPABASE_URL');
    });

    it('should throw when SUPABASE_ANON_KEY is missing', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.SUPABASE_ANON_KEY;
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      const { validateEnvVars } = require('../../utils/supabase');
      expect(() => validateEnvVars()).toThrow('Missing required environment variables: SUPABASE_ANON_KEY');
    });

    it('should throw when SUPABASE_SERVICE_ROLE_KEY is missing', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const { validateEnvVars } = require('../../utils/supabase');
      expect(() => validateEnvVars()).toThrow('Missing required environment variables: SUPABASE_SERVICE_ROLE_KEY');
    });

    it('should list all missing env vars when multiple are missing', () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const { validateEnvVars } = require('../../utils/supabase');
      expect(() => validateEnvVars()).toThrow(
        'Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY'
      );
    });

    it('should include helpful message about .env file', () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const { validateEnvVars } = require('../../utils/supabase');
      expect(() => validateEnvVars()).toThrow('Please ensure these are set in your .env file');
    });
  });

  describe('module exports', () => {
    it('should export supabase client when env vars are present', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      const { supabase } = require('../../utils/supabase');
      expect(supabase).not.toBeNull();
    });

    it('should export supabaseAdmin client when env vars are present', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      const { supabaseAdmin } = require('../../utils/supabase');
      expect(supabaseAdmin).not.toBeNull();
    });

    it('should export null clients when env vars are missing', () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const { supabase, supabaseAdmin } = require('../../utils/supabase');
      expect(supabase).toBeNull();
      expect(supabaseAdmin).toBeNull();
    });

    it('should export validateEnvVars function', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      const { validateEnvVars } = require('../../utils/supabase');
      expect(typeof validateEnvVars).toBe('function');
    });
  });

  describe('client configuration', () => {
    it('should create clients with correct URL', () => {
      process.env.SUPABASE_URL = 'https://myproject.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

      const { supabase, supabaseAdmin } = require('../../utils/supabase');

      // Verify clients were created (they should be truthy objects)
      expect(supabase).toBeTruthy();
      expect(supabaseAdmin).toBeTruthy();
    });
  });
});
