import { jest } from '@jest/globals'
import {
  addActivity,
  getUserActivities,
  getTeamAverage,
  getEmployeeAverage,
} from '../controllers/activityController.js'

/* =======================================================================
   Mock complet Supabase
   ======================================================================= */
const createSupabaseMock = ({ activities = [], employees = [], manager = {}, team = {} } = {}) => ({
  from: jest.fn((table) => {
    // ---- TABLE activity ----
    if (table === 'activity') {
      return {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: activities[0] || null, error: null }),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: activities, error: null }),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({ data: activities, error: null }),
      }
    }

    // ---- TABLE employees_role ----
    if (table === 'employees_role') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockImplementation((field, value) => {
          // manager lookup
          if (field === 'uid' && value === 'manager1') {
            return {
              maybeSingle: jest.fn().mockResolvedValue({
                data: manager,
                error: null,
              }),
            }
          }

          // team employees lookup
          if (field === 'tid') {
            return {
              then: (resolve) => resolve({ data: employees, error: null }),
            }
          }

          // default (fallback)
          return {
            maybeSingle: jest.fn().mockResolvedValue({ data: employees[0] || null, error: null }),
          }
        }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      }
    }

    // ---- TABLE team ----
    if (table === 'team') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: team, error: null }),
      }
    }

    return { select: jest.fn().mockReturnThis() }
  }),
})

/* =======================================================================
   Utilitaires
   ======================================================================= */
const createMockRes = () => {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

/* =======================================================================
   TESTS
   ======================================================================= */
describe('Activity Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  /* ============================== addActivity ============================== */
  describe('addActivity', () => {
    it('should return 400 if missing fields', async () => {
      const req = { body: {}, user: { id: 'u1' }, supabase: createSupabaseMock() }
      const res = createMockRes()

      await addActivity(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
      )
    })

    it('should create an activity successfully', async () => {
      const mockActivity = {
        id: 1,
        uid: 'u1',
        arrival_time: '2025-11-03T08:00:00Z',
        departure_time: '2025-11-03T16:00:00Z',
      }
      const supabaseMock = createSupabaseMock({ activities: [mockActivity] })
      const req = {
        body: {
          arrival_time: mockActivity.arrival_time,
          departure_time: mockActivity.departure_time,
        },
        user: { id: 'u1' },
        supabase: supabaseMock,
      }
      const res = createMockRes()

      await addActivity(req, res)

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, activity: mockActivity }),
      )
    })

    it('should handle Supabase insert error', async () => {
      const supabaseMock = createSupabaseMock()
      supabaseMock.from = jest.fn(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
      }))

      const req = {
        body: { arrival_time: '08:00', departure_time: '16:00' },
        user: { id: 'u1' },
        supabase: supabaseMock,
      }
      const res = createMockRes()

      await addActivity(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false }),
      )
    })
  })

  /* ============================ getUserActivities ============================ */
  describe('getUserActivities', () => {
    it('should return 400 if uid missing', async () => {
      const req = { body: {}, supabase: createSupabaseMock() }
      const res = createMockRes()

      await getUserActivities(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return activities successfully', async () => {
      const mockActivities = [
        { id: 1, uid: 'u1', arrival_time: '08:00', departure_time: '16:00' },
      ]
      const supabaseMock = createSupabaseMock({ activities: mockActivities })
      const req = { body: { uid: 'u1' }, supabase: supabaseMock }
      const res = createMockRes()

      await getUserActivities(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: mockActivities.length,
          activities: mockActivities,
        }),
      )
    })
  })

  /* ============================ getTeamAverage ============================ */
  describe('getTeamAverage', () => {
    it('should return 400 if missing parameters', async () => {
      const req = { body: {}, user: { id: 'manager1' }, supabase: createSupabaseMock() }
      const res = createMockRes()
      await getTeamAverage(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should handle team averages successfully', async () => {
      const mockEmployees = [
        { uid: 'e1', firstname: 'Alice', lastname: 'Doe' },
        { uid: 'e2', firstname: 'Bob', lastname: 'Smith' },
      ]
      const mockActivities = [
        { uid: 'e1', arrival_time: '2025-11-01T08:00:00Z', departure_time: '2025-11-01T16:00:00Z' },
        { uid: 'e2', arrival_time: '2025-11-01T09:00:00Z', departure_time: '2025-11-01T17:00:00Z' },
      ]
      const mockManager = { firstname: 'John', lastname: 'Manager' }
      const mockTeam = { tid: 'T1', name: 'DreamTeam' }

      const supabaseMock = createSupabaseMock({
        employees: mockEmployees,
        activities: mockActivities,
        manager: mockManager,
        team: mockTeam,
      })

      const req = {
        body: { start_date: '2025-11-01', end_date: '2025-11-03' },
        user: { id: 'manager1' },
        supabase: supabaseMock,
      }
      const res = createMockRes()

      await getTeamAverage(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          team: 'DreamTeam',
          averages: expect.any(Object),
          details: expect.any(Array),
        }),
      )
    })
  })

  /* ============================ getEmployeeAverage ============================ */
  describe('getEmployeeAverage', () => {
    it('should return 400 if missing parameters', async () => {
      const req = { body: {}, supabase: createSupabaseMock() }
      const res = createMockRes()

      await getEmployeeAverage(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should compute averages successfully', async () => {
      const mockActivities = [
        {
          arrival_time: '2025-11-01T08:00:00Z',
          departure_time: '2025-11-01T16:00:00Z',
        },
        {
          arrival_time: '2025-11-02T08:00:00Z',
          departure_time: '2025-11-02T15:00:00Z',
        },
      ]
      const supabaseMock = createSupabaseMock({ activities: mockActivities })
      const req = {
        body: {
          uid: 'e1',
          start_date: '2025-11-01',
          end_date: '2025-11-03',
        },
        supabase: supabaseMock,
      }
      const res = createMockRes()

      await getEmployeeAverage(req, res)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          averages: expect.any(Object),
        }),
      )
    })
  })
})
