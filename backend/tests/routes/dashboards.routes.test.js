// backend/tests/routes/dashboards.routes.test.js

const request = require('supertest');
const app = require('../../app');

// Mock Supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn()
  },
  supabaseAdmin: {
    auth: {
      admin: {
        signOut: jest.fn()
      }
    },
    from: jest.fn()
  },
  validateEnvVars: jest.fn()
}));

const { supabase } = require('../../utils/supabase');

describe('Dashboards Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockEmployeeUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'employee@example.com'
  };

  const mockEmployeeProfile = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'employee@example.com',
    first_name: 'Employee',
    last_name: 'User',
    role: 'employee',
    weekly_hours_target: 35,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z'
  };

  const mockProjectId1 = '550e8400-e29b-41d4-a716-446655440200';
  const mockCategoryId1 = '550e8400-e29b-41d4-a716-446655440300';

  const mockTimeEntries = [
    {
      duration_minutes: 420, // 7 hours
      projects: { id: mockProjectId1, name: 'Time Manager', code: 'TM-001' },
      categories: { id: mockCategoryId1, name: 'Development' }
    },
    {
      duration_minutes: 180, // 3 hours
      projects: null,
      categories: null
    }
  ];

  const mockTimesheets = [
    { status: 'validated', week_start: '2025-12-29' },
    { status: 'submitted', week_start: '2026-01-06' }
  ];

  const mockTrendEntries = [
    { start_time: '2026-01-10T09:00:00.000Z', duration_minutes: 420 },
    { start_time: '2026-01-09T09:00:00.000Z', duration_minutes: 480 }
  ];

  // Helper to setup authenticated employee
  const setupEmployeeAuth = () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: mockEmployeeUser },
      error: null
    });

    // This needs to handle multiple table queries
    let timeEntriesCallCount = 0;

    supabase.from.mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockEmployeeProfile,
                error: null
              })
            })
          })
        };
      }
      if (table === 'timesheets') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockTimesheets,
              error: null
            })
          })
        };
      }
      if (table === 'time_entries') {
        timeEntriesCallCount++;
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                lte: jest.fn().mockResolvedValue({
                  data: mockTimeEntries,
                  error: null
                })
              })
            })
          })
        };
      }
      return {};
    });
  };

  // Helper to setup unauthenticated request
  const setupUnauthenticated = () => {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' }
    });
  };

  // ===========================================
  // GET /dashboard/me Tests
  // ===========================================
  describe('GET /api/v1/dashboard/me', () => {
    it('should return 401 without authentication', async () => {
      setupUnauthenticated();

      const response = await request(app)
        .get('/api/v1/dashboard/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return summary with hours and targets', async () => {
      setupEmployeeAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.summary).toHaveProperty('hoursThisWeek');
      expect(response.body.data.summary).toHaveProperty('hoursThisMonth');
      expect(response.body.data.summary).toHaveProperty('weeklyTarget');
      expect(response.body.data.summary).toHaveProperty('monthlyTarget');
      expect(response.body.data.summary).toHaveProperty('weeklyProgress');
      expect(response.body.data.summary).toHaveProperty('monthlyProgress');
    });

    it('should return comparison data', async () => {
      setupEmployeeAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.comparison).toBeDefined();
      expect(response.body.data.comparison).toHaveProperty('weekOverWeek');
      expect(response.body.data.comparison).toHaveProperty('monthOverMonth');
    });

    it('should return timesheet status', async () => {
      setupEmployeeAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.timesheetStatus).toBeDefined();
      expect(response.body.data.timesheetStatus).toHaveProperty('current');
      expect(response.body.data.timesheetStatus).toHaveProperty('currentWeekStart');
      expect(response.body.data.timesheetStatus).toHaveProperty('pending');
      expect(response.body.data.timesheetStatus).toHaveProperty('validated');
      expect(response.body.data.timesheetStatus).toHaveProperty('rejected');
    });
  });

  // ===========================================
  // GET /dashboard/me/by-project Tests
  // ===========================================
  describe('GET /api/v1/dashboard/me/by-project', () => {
    it('should return 401 without authentication', async () => {
      setupUnauthenticated();

      const response = await request(app)
        .get('/api/v1/dashboard/me/by-project')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should return breakdown by project', async () => {
      setupEmployeeAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me/by-project')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('period');
      expect(response.body.data).toHaveProperty('periodStart');
      expect(response.body.data).toHaveProperty('periodEnd');
      expect(response.body.data).toHaveProperty('breakdown');
      expect(response.body.data).toHaveProperty('totalHours');
      expect(Array.isArray(response.body.data.breakdown)).toBe(true);
    });

    it('should support period=week', async () => {
      setupEmployeeAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me/by-project?period=week')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.period).toBe('week');
    });

    it('should support period=month', async () => {
      setupEmployeeAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me/by-project?period=month')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.period).toBe('month');
    });

    it('should return 400 for invalid period', async () => {
      setupEmployeeAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me/by-project?period=invalid')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should default to week when no period specified', async () => {
      setupEmployeeAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me/by-project')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.period).toBe('week');
    });

    it('should return projects with correct properties', async () => {
      setupEmployeeAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me/by-project')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      if (response.body.data.breakdown.length > 0) {
        const project = response.body.data.breakdown[0];
        expect(project).toHaveProperty('projectId');
        expect(project).toHaveProperty('projectName');
        expect(project).toHaveProperty('projectCode');
        expect(project).toHaveProperty('hours');
        expect(project).toHaveProperty('percentage');
      }
    });
  });

  // ===========================================
  // GET /dashboard/me/by-category Tests
  // ===========================================
  describe('GET /api/v1/dashboard/me/by-category', () => {
    it('should return 401 without authentication', async () => {
      setupUnauthenticated();

      const response = await request(app)
        .get('/api/v1/dashboard/me/by-category')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should return breakdown by category', async () => {
      setupEmployeeAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me/by-category')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('period');
      expect(response.body.data).toHaveProperty('breakdown');
      expect(response.body.data).toHaveProperty('totalHours');
      expect(Array.isArray(response.body.data.breakdown)).toBe(true);
    });

    it('should support period=week', async () => {
      setupEmployeeAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me/by-category?period=week')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.period).toBe('week');
    });

    it('should support period=month', async () => {
      setupEmployeeAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me/by-category?period=month')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.period).toBe('month');
    });

    it('should return categories with correct properties', async () => {
      setupEmployeeAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me/by-category')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      if (response.body.data.breakdown.length > 0) {
        const category = response.body.data.breakdown[0];
        expect(category).toHaveProperty('categoryId');
        expect(category).toHaveProperty('categoryName');
        expect(category).toHaveProperty('hours');
        expect(category).toHaveProperty('percentage');
      }
    });
  });

  // ===========================================
  // GET /dashboard/me/trend Tests
  // ===========================================
  describe('GET /api/v1/dashboard/me/trend', () => {
    const setupTrendAuth = () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockEmployeeUser },
        error: null
      });

      supabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockEmployeeProfile,
                  error: null
                })
              })
            })
          };
        }
        if (table === 'time_entries') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockResolvedValue({
                    data: mockTrendEntries,
                    error: null
                  })
                })
              })
            })
          };
        }
        return {};
      });
    };

    it('should return 401 without authentication', async () => {
      setupUnauthenticated();

      const response = await request(app)
        .get('/api/v1/dashboard/me/trend')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should return daily trend data', async () => {
      setupTrendAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me/trend')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('period');
      expect(response.body.data).toHaveProperty('dailyTarget');
      expect(response.body.data).toHaveProperty('trend');
      expect(response.body.data).toHaveProperty('average');
      expect(response.body.data).toHaveProperty('total');
      expect(Array.isArray(response.body.data.trend)).toBe(true);
    });

    it('should support days parameter', async () => {
      setupTrendAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me/trend?days=7')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.period.days).toBe(7);
      expect(response.body.data.trend.length).toBe(7);
    });

    it('should default to 30 days', async () => {
      setupTrendAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me/trend')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.period.days).toBe(30);
      expect(response.body.data.trend.length).toBe(30);
    });

    it('should return trend entries with correct properties', async () => {
      setupTrendAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me/trend')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      if (response.body.data.trend.length > 0) {
        const trendEntry = response.body.data.trend[0];
        expect(trendEntry).toHaveProperty('date');
        expect(trendEntry).toHaveProperty('hours');
        expect(trendEntry).toHaveProperty('dayOfWeek');
      }
    });

    it('should return period info', async () => {
      setupTrendAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me/trend?days=7')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.period).toHaveProperty('days');
      expect(response.body.data.period).toHaveProperty('start');
      expect(response.body.data.period).toHaveProperty('end');
    });

    it('should return 400 for invalid days parameter (non-numeric)', async () => {
      setupTrendAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me/trend?days=abc')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for days out of range', async () => {
      setupTrendAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me/trend?days=500')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ===========================================
  // Authorization Tests (AC8)
  // ===========================================
  describe('Authorization (AC8)', () => {
    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/me');

      expect(response.status).toBe(401);
    });

    it('should return 401 when token is invalid', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      const response = await request(app)
        .get('/api/v1/dashboard/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should allow employee to access their own dashboard', async () => {
      setupEmployeeAuth();

      const response = await request(app)
        .get('/api/v1/dashboard/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
    });
  });
});
