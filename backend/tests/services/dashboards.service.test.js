// backend/tests/services/dashboards.service.test.js

const dashboardsService = require('../../services/dashboards.service');
const AppError = require('../../utils/AppError');

// Mock Supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn()
  },
  validateEnvVars: jest.fn()
}));

const { supabase } = require('../../utils/supabase');

describe('Dashboards Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockProjectId1 = '550e8400-e29b-41d4-a716-446655440200';
  const mockProjectId2 = '550e8400-e29b-41d4-a716-446655440201';
  const mockCategoryId1 = '550e8400-e29b-41d4-a716-446655440300';
  const mockCategoryId2 = '550e8400-e29b-41d4-a716-446655440301';

  const mockProfile = {
    id: mockUserId,
    weekly_hours_target: 35
  };

  const mockTimeEntries = [
    {
      duration_minutes: 120, // 2 hours
      projects: { id: mockProjectId1, name: 'Time Manager', code: 'TM-001' },
      categories: { id: mockCategoryId1, name: 'Development' }
    },
    {
      duration_minutes: 180, // 3 hours
      projects: { id: mockProjectId1, name: 'Time Manager', code: 'TM-001' },
      categories: { id: mockCategoryId1, name: 'Development' }
    },
    {
      duration_minutes: 60, // 1 hour
      projects: { id: mockProjectId2, name: 'Client Portal', code: 'CP-002' },
      categories: { id: mockCategoryId2, name: 'Meeting' }
    },
    {
      duration_minutes: 90, // 1.5 hours
      projects: null,
      categories: null
    }
  ];

  const mockTimesheets = [
    { status: 'draft', week_start: dashboardsService.getCurrentWeekStart() },
    { status: 'validated', week_start: '2025-12-29' },
    { status: 'validated', week_start: '2025-12-22' },
    { status: 'submitted', week_start: '2026-01-06' },
    { status: 'rejected', week_start: '2025-12-15' }
  ];

  // ===========================================
  // Helper Functions Tests
  // ===========================================
  describe('Helper Functions', () => {
    describe('getCurrentWeekStart', () => {
      it('should return a valid date string in YYYY-MM-DD format', () => {
        const weekStart = dashboardsService.getCurrentWeekStart();
        expect(weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });

      it('should return a Monday', () => {
        const weekStart = dashboardsService.getCurrentWeekStart();
        const [year, month, day] = weekStart.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        // Monday is 1 in JS Date (0 = Sunday)
        expect(date.getDay()).toBe(1);
      });
    });

    describe('getCurrentWeekEnd', () => {
      it('should return a date 6 days after week start', () => {
        const weekStart = dashboardsService.getCurrentWeekStart();
        const weekEnd = dashboardsService.getCurrentWeekEnd();

        const [y1, m1, d1] = weekStart.split('-').map(Number);
        const [y2, m2, d2] = weekEnd.split('-').map(Number);
        const start = new Date(y1, m1 - 1, d1);
        const end = new Date(y2, m2 - 1, d2);
        const diffDays = (end - start) / (1000 * 60 * 60 * 24);

        expect(diffDays).toBe(6);
      });

      it('should return a Sunday', () => {
        const weekEnd = dashboardsService.getCurrentWeekEnd();
        const [year, month, day] = weekEnd.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        expect(date.getDay()).toBe(0);
      });
    });

    describe('getCurrentMonthStart', () => {
      it('should return the first day of current month', () => {
        const monthStart = dashboardsService.getCurrentMonthStart();
        const day = parseInt(monthStart.split('-')[2], 10);
        expect(day).toBe(1);
      });
    });

    describe('getCurrentMonthEnd', () => {
      it('should return the last day of current month', () => {
        const monthEnd = dashboardsService.getCurrentMonthEnd();
        const [year, month, day] = monthEnd.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        // Check that adding one day would give day 1 of next month
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        expect(nextDay.getDate()).toBe(1);
      });
    });

    describe('getPreviousWeekStart', () => {
      it('should return date 7 days before current week start', () => {
        const currentWeekStart = dashboardsService.getCurrentWeekStart();
        const prevWeekStart = dashboardsService.getPreviousWeekStart();

        const [y1, m1, d1] = currentWeekStart.split('-').map(Number);
        const [y2, m2, d2] = prevWeekStart.split('-').map(Number);
        const current = new Date(y1, m1 - 1, d1);
        const prev = new Date(y2, m2 - 1, d2);
        const diffDays = (current - prev) / (1000 * 60 * 60 * 24);

        expect(diffDays).toBe(7);
      });
    });

    describe('getPreviousMonthStart', () => {
      it('should return the first day of previous month', () => {
        const prevMonthStart = dashboardsService.getPreviousMonthStart();
        const day = parseInt(prevMonthStart.split('-')[2], 10);
        expect(day).toBe(1);
      });
    });

    describe('getPeriodDates', () => {
      it('should return week dates for period=week', () => {
        const { startDate, endDate } = dashboardsService.getPeriodDates('week');
        expect(startDate).toBe(dashboardsService.getCurrentWeekStart());
        expect(endDate).toBe(dashboardsService.getCurrentWeekEnd());
      });

      it('should return month dates for period=month', () => {
        const { startDate, endDate } = dashboardsService.getPeriodDates('month');
        expect(startDate).toBe(dashboardsService.getCurrentMonthStart());
        expect(endDate).toBe(dashboardsService.getCurrentMonthEnd());
      });

      it('should throw error for invalid period', () => {
        expect(() => dashboardsService.getPeriodDates('invalid')).toThrow(AppError);
      });
    });
  });

  // ===========================================
  // getEmployeeDashboard Tests
  // ===========================================
  describe('getEmployeeDashboard', () => {
    const setupMocks = (options = {}) => {
      const {
        profile = mockProfile,
        timeEntriesThisWeek = mockTimeEntries,
        timeEntriesThisMonth = mockTimeEntries,
        timeEntriesLastWeek = [],
        timeEntriesLastMonth = [],
        timesheets = mockTimesheets
      } = options;

      let callCount = 0;

      supabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: profile,
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
                data: timesheets,
                error: null
              })
            })
          };
        }
        if (table === 'time_entries') {
          callCount++;
          // Simulate different responses for different calls
          let data;
          if (callCount === 1) data = timeEntriesThisWeek;
          else if (callCount === 2) data = timeEntriesThisMonth;
          else if (callCount === 3) data = timeEntriesLastWeek;
          else data = timeEntriesLastMonth;

          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockReturnValue({
                  lte: jest.fn().mockResolvedValue({
                    data,
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

    it('should return correct hours for current week', async () => {
      setupMocks({
        timeEntriesThisWeek: [
          { duration_minutes: 420 }, // 7 hours
          { duration_minutes: 300 }  // 5 hours
        ]
      });

      const result = await dashboardsService.getEmployeeDashboard(mockUserId);

      expect(result.summary.hoursThisWeek).toBe(12); // 720 minutes = 12 hours
    });

    it('should return correct hours for current month', async () => {
      setupMocks({
        timeEntriesThisWeek: [{ duration_minutes: 120 }],
        timeEntriesThisMonth: [
          { duration_minutes: 600 },
          { duration_minutes: 600 }
        ]
      });

      const result = await dashboardsService.getEmployeeDashboard(mockUserId);

      expect(result.summary.hoursThisMonth).toBe(20); // 1200 minutes = 20 hours
    });

    it('should calculate weekly progress correctly', async () => {
      setupMocks({
        profile: { weekly_hours_target: 40 },
        timeEntriesThisWeek: [{ duration_minutes: 1200 }] // 20 hours
      });

      const result = await dashboardsService.getEmployeeDashboard(mockUserId);

      expect(result.summary.weeklyProgress).toBe(50); // 20/40 * 100 = 50%
    });

    it('should calculate month-over-month comparison', async () => {
      setupMocks({
        timeEntriesThisWeek: [{ duration_minutes: 120 }],
        timeEntriesThisMonth: [{ duration_minutes: 1200 }], // 20 hours
        timeEntriesLastWeek: [{ duration_minutes: 60 }],
        timeEntriesLastMonth: [{ duration_minutes: 600 }]  // 10 hours
      });

      const result = await dashboardsService.getEmployeeDashboard(mockUserId);

      // (20 - 10) / 10 * 100 = 100%
      expect(result.comparison.monthOverMonth).toBe(100);
    });

    it('should return 0 comparison when no previous data', async () => {
      setupMocks({
        timeEntriesThisWeek: [{ duration_minutes: 600 }],
        timeEntriesThisMonth: [{ duration_minutes: 600 }],
        timeEntriesLastWeek: [],
        timeEntriesLastMonth: []
      });

      const result = await dashboardsService.getEmployeeDashboard(mockUserId);

      expect(result.comparison.weekOverWeek).toBe(0);
      expect(result.comparison.monthOverMonth).toBe(0);
    });

    it('should return correct timesheet status counts', async () => {
      setupMocks({
        timesheets: [
          { status: 'submitted', week_start: '2026-01-06' },
          { status: 'validated', week_start: '2025-12-29' },
          { status: 'validated', week_start: '2025-12-22' },
          { status: 'rejected', week_start: '2025-12-15' }
        ]
      });

      const result = await dashboardsService.getEmployeeDashboard(mockUserId);

      expect(result.timesheetStatus.pending).toBe(1);
      expect(result.timesheetStatus.validated).toBe(2);
      expect(result.timesheetStatus.rejected).toBe(1);
    });

    it('should use default weekly target of 35 when profile has none', async () => {
      setupMocks({
        profile: null,
        timeEntriesThisWeek: [{ duration_minutes: 2100 }] // 35 hours
      });

      const result = await dashboardsService.getEmployeeDashboard(mockUserId);

      expect(result.summary.weeklyTarget).toBe(35);
      expect(result.summary.weeklyProgress).toBe(100);
    });

    it('should calculate monthly target as weeklyTarget * 4', async () => {
      setupMocks({
        profile: { weekly_hours_target: 40 }
      });

      const result = await dashboardsService.getEmployeeDashboard(mockUserId);

      expect(result.summary.monthlyTarget).toBe(160); // 40 * 4
    });
  });

  // ===========================================
  // getByProject Tests
  // ===========================================
  describe('getByProject', () => {
    const setupProjectMocks = (timeEntries = mockTimeEntries) => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({
                data: timeEntries,
                error: null
              })
            })
          })
        })
      });
    };

    it('should group hours by project correctly', async () => {
      setupProjectMocks();

      const result = await dashboardsService.getByProject(mockUserId, 'week');

      // Should have 3 entries: Time Manager, Client Portal, Sans projet
      expect(result.breakdown.length).toBe(3);

      const timeManagerProject = result.breakdown.find(p => p.projectName === 'Time Manager');
      expect(timeManagerProject.hours).toBe(5); // 120 + 180 = 300 minutes = 5 hours
    });

    it('should calculate percentages correctly', async () => {
      setupProjectMocks([
        { duration_minutes: 300, projects: { id: 'p1', name: 'Project A', code: 'A' } },
        { duration_minutes: 300, projects: { id: 'p2', name: 'Project B', code: 'B' } }
      ]);

      const result = await dashboardsService.getByProject(mockUserId, 'week');

      // Each project should be 50%
      expect(result.breakdown[0].percentage).toBe(50);
      expect(result.breakdown[1].percentage).toBe(50);
    });

    it('should handle entries with no project', async () => {
      setupProjectMocks([
        { duration_minutes: 120, projects: null }
      ]);

      const result = await dashboardsService.getByProject(mockUserId, 'week');

      expect(result.breakdown.length).toBe(1);
      expect(result.breakdown[0].projectId).toBe('no-project');
      expect(result.breakdown[0].projectName).toBe('Sans projet');
    });

    it('should filter by week period', async () => {
      setupProjectMocks();

      const result = await dashboardsService.getByProject(mockUserId, 'week');

      expect(result.period).toBe('week');
      expect(result.periodStart).toBe(dashboardsService.getCurrentWeekStart());
      expect(result.periodEnd).toBe(dashboardsService.getCurrentWeekEnd());
    });

    it('should filter by month period', async () => {
      setupProjectMocks();

      const result = await dashboardsService.getByProject(mockUserId, 'month');

      expect(result.period).toBe('month');
      expect(result.periodStart).toBe(dashboardsService.getCurrentMonthStart());
      expect(result.periodEnd).toBe(dashboardsService.getCurrentMonthEnd());
    });

    it('should throw error for invalid period', async () => {
      await expect(dashboardsService.getByProject(mockUserId, 'invalid'))
        .rejects.toThrow(AppError);
    });

    it('should return totalHours correctly', async () => {
      setupProjectMocks([
        { duration_minutes: 60, projects: { id: 'p1', name: 'A', code: 'A' } },
        { duration_minutes: 120, projects: { id: 'p2', name: 'B', code: 'B' } }
      ]);

      const result = await dashboardsService.getByProject(mockUserId, 'week');

      expect(result.totalHours).toBe(3); // 180 minutes = 3 hours
    });

    it('should sort projects by hours descending', async () => {
      setupProjectMocks([
        { duration_minutes: 60, projects: { id: 'p1', name: 'Small', code: 'S' } },
        { duration_minutes: 180, projects: { id: 'p2', name: 'Large', code: 'L' } }
      ]);

      const result = await dashboardsService.getByProject(mockUserId, 'week');

      expect(result.breakdown[0].projectName).toBe('Large');
      expect(result.breakdown[1].projectName).toBe('Small');
    });
  });

  // ===========================================
  // getByCategory Tests
  // ===========================================
  describe('getByCategory', () => {
    const setupCategoryMocks = (timeEntries = mockTimeEntries) => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({
                data: timeEntries,
                error: null
              })
            })
          })
        })
      });
    };

    it('should group hours by category correctly', async () => {
      setupCategoryMocks();

      const result = await dashboardsService.getByCategory(mockUserId, 'week');

      // Should have 3 entries: Development, Meeting, Sans categorie
      expect(result.breakdown.length).toBe(3);

      const devCategory = result.breakdown.find(c => c.categoryName === 'Development');
      expect(devCategory.hours).toBe(5); // 120 + 180 = 300 minutes = 5 hours
    });

    it('should handle entries with no category', async () => {
      setupCategoryMocks([
        { duration_minutes: 120, categories: null }
      ]);

      const result = await dashboardsService.getByCategory(mockUserId, 'week');

      expect(result.breakdown.length).toBe(1);
      expect(result.breakdown[0].categoryId).toBe('no-category');
      expect(result.breakdown[0].categoryName).toBe('Sans categorie');
    });

    it('should calculate percentages correctly', async () => {
      setupCategoryMocks([
        { duration_minutes: 600, categories: { id: 'c1', name: 'Development' } },
        { duration_minutes: 200, categories: { id: 'c2', name: 'Meeting' } }
      ]);

      const result = await dashboardsService.getByCategory(mockUserId, 'week');

      const devCategory = result.breakdown.find(c => c.categoryName === 'Development');
      const meetingCategory = result.breakdown.find(c => c.categoryName === 'Meeting');

      expect(devCategory.percentage).toBe(75); // 600/800 * 100
      expect(meetingCategory.percentage).toBe(25); // 200/800 * 100
    });
  });

  // ===========================================
  // getTrend Tests
  // ===========================================
  describe('getTrend', () => {
    const setupTrendMocks = (timeEntries = [], profile = mockProfile) => {
      supabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: profile,
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
                    data: timeEntries,
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

    it('should return correct number of days', async () => {
      setupTrendMocks();

      const result = await dashboardsService.getTrend(mockUserId, 7);

      expect(result.trend.length).toBe(7);
      expect(result.period.days).toBe(7);
    });

    it('should calculate daily hours correctly', async () => {
      // Get today's date in local format YYYY-MM-DD
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      setupTrendMocks([
        { start_time: `${today}T09:00:00.000Z`, duration_minutes: 240 },
        { start_time: `${today}T14:00:00.000Z`, duration_minutes: 180 }
      ]);

      const result = await dashboardsService.getTrend(mockUserId, 7);

      const todayEntry = result.trend.find(t => t.date === today);
      expect(todayEntry.hours).toBe(7); // 420 minutes = 7 hours
    });

    it('should return correct day of week', async () => {
      setupTrendMocks();

      const result = await dashboardsService.getTrend(mockUserId, 7);

      // Check that each entry has a valid dayOfWeek
      const validDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      result.trend.forEach(t => {
        expect(validDays).toContain(t.dayOfWeek);
      });
    });

    it('should calculate average excluding weekends', async () => {
      // Create entries for 7 days: Mon-Sun, only with work on weekdays
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }

      // Assuming weekdays have entries
      const entries = dates
        .filter(date => {
          const day = new Date(date).getDay();
          return day !== 0 && day !== 6; // not weekend
        })
        .map(date => ({
          start_time: `${date}T09:00:00.000Z`,
          duration_minutes: 420 // 7 hours
        }));

      setupTrendMocks(entries);

      const result = await dashboardsService.getTrend(mockUserId, 7);

      // Average should be based on weekdays only
      expect(result.average).toBeGreaterThan(0);
    });

    it('should handle days with no entries (returns 0)', async () => {
      setupTrendMocks([]); // No entries

      const result = await dashboardsService.getTrend(mockUserId, 7);

      // All days should have 0 hours
      result.trend.forEach(t => {
        expect(t.hours).toBe(0);
      });
    });

    it('should return dailyTarget from profile', async () => {
      setupTrendMocks([], { weekly_hours_target: 40 });

      const result = await dashboardsService.getTrend(mockUserId, 30);

      expect(result.dailyTarget).toBe(8); // 40 / 5 = 8
    });

    it('should use default weekly target of 35 when profile has none', async () => {
      setupTrendMocks([], null);

      const result = await dashboardsService.getTrend(mockUserId, 30);

      expect(result.dailyTarget).toBe(7); // 35 / 5 = 7
    });

    it('should support days=7 for weekly view', async () => {
      setupTrendMocks();

      const result = await dashboardsService.getTrend(mockUserId, 7);

      expect(result.period.days).toBe(7);
      expect(result.trend.length).toBe(7);
    });

    it('should support days=90 for quarterly view', async () => {
      setupTrendMocks();

      const result = await dashboardsService.getTrend(mockUserId, 90);

      expect(result.period.days).toBe(90);
      expect(result.trend.length).toBe(90);
    });

    it('should calculate total hours correctly', async () => {
      // Get today's date in local format YYYY-MM-DD
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // Get yesterday's date in local format
      const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

      setupTrendMocks([
        { start_time: `${today}T09:00:00.000Z`, duration_minutes: 420 },
        { start_time: `${yesterdayStr}T09:00:00.000Z`, duration_minutes: 480 }
      ]);

      const result = await dashboardsService.getTrend(mockUserId, 7);

      expect(result.total).toBe(15); // 420 + 480 = 900 minutes = 15 hours
    });
  });

  // ===========================================
  // Error Handling Tests
  // ===========================================
  describe('Error Handling', () => {
    it('should throw AppError when calculateHours fails', async () => {
      supabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
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
                    data: null,
                    error: { message: 'Database error' }
                  })
                })
              })
            })
          };
        }
        return {};
      });

      await expect(dashboardsService.getEmployeeDashboard(mockUserId))
        .rejects.toThrow(AppError);
    });

    it('should throw AppError when getByProject database query fails', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' }
              })
            })
          })
        })
      });

      await expect(dashboardsService.getByProject(mockUserId, 'week'))
        .rejects.toThrow(AppError);
    });

    it('should throw AppError when getByCategory database query fails', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' }
              })
            })
          })
        })
      });

      await expect(dashboardsService.getByCategory(mockUserId, 'week'))
        .rejects.toThrow(AppError);
    });

    it('should throw AppError when getTrend database query fails', async () => {
      supabase.from.mockImplementation((table) => {
        if (table === 'profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
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
                    data: null,
                    error: { message: 'Database error' }
                  })
                })
              })
            })
          };
        }
        return {};
      });

      await expect(dashboardsService.getTrend(mockUserId, 30))
        .rejects.toThrow(AppError);
    });
  });
});
