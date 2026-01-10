// backend/tests/services/health.service.test.js

// Mock Supabase before requiring the service
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn()
  },
  supabaseAdmin: null,
  validateEnvVars: jest.fn()
}));

const { supabase } = require('../../utils/supabase');
const healthService = require('../../services/health.service');

describe('Health Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDatabase', () => {
    it('should return "ok" when database is connected', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const result = await healthService.checkDatabase();

      expect(result).toBe('ok');
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should return "failed" when database returns an error', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Connection failed')
          })
        })
      });

      const result = await healthService.checkDatabase();

      expect(result).toBe('failed');
    });

    it('should return "failed" when database throws an exception', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockRejectedValue(new Error('Network error'))
        })
      });

      const result = await healthService.checkDatabase();

      expect(result).toBe('failed');
    });
  });

  describe('runChecks', () => {
    it('should return all check results', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const result = await healthService.runChecks();

      expect(result).toHaveProperty('database', 'ok');
    });

    it('should return failed checks when database is down', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Connection failed')
          })
        })
      });

      const result = await healthService.runChecks();

      expect(result).toHaveProperty('database', 'failed');
    });
  });
});
