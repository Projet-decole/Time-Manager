import { jest } from '@jest/globals'
import { getKPI } from '../controllers/kpiController.js'

describe('KPI Controller', () => {
  let req, res, fromMock

  beforeEach(() => {
    fromMock = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
    }

    req = {
      body: {},
      user: { id: 'U1' },
      supabase: { from: jest.fn().mockReturnValue(fromMock) },
    }

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  /* ================================================================
    GET /kpi
  ================================================================= */

  it('should return 400 if start_date or end_date missing', async () => {
    req.body = {}
    await getKPI(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }))
  })

  it('should return KPI successfully with no delays', async () => {
    req.body = { start_date: '2025-01-01', end_date: '2025-01-31' }

    // Mock planning
    fromMock.select.mockReturnValueOnce(fromMock)
    fromMock.eq.mockReturnValueOnce(fromMock)
    fromMock.gte.mockReturnValueOnce(fromMock)
    fromMock.lte.mockResolvedValueOnce({
      data: [
        { pid: 1, start_at: '2025-01-10T09:00:00', end_at: '2025-01-10T17:00:00' }
      ],
      error: null
    })

    // Mock activities
    fromMock.lte.mockResolvedValueOnce({
      data: [
        { arrival_time: '2025-01-10T09:05:00', departure_time: '2025-01-10T17:00:00' }
      ],
      error: null
    })

    // Mock projects
    fromMock.lte.mockResolvedValueOnce({
      data: [
        { name: 'Project A', start_at: '2025-01-02T09:00:00', end_at: '2025-01-04T17:00:00' },
        { name: 'Project B', start_at: '2025-01-05T09:00:00', end_at: '2025-01-06T12:00:00' }
      ],
      error: null
    })

    await getKPI(req, res)

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        uid: 'U1',
        kpis: expect.objectContaining({
          late_count: expect.any(Number),
          hours_per_project: expect.any(Array)
        })
      })
    )
  })

  it('should calculate late_count correctly', async () => {
    req.body = { start_date: '2025-01-01', end_date: '2025-01-31' }

    // Planning with one day
    fromMock.select.mockReturnValueOnce(fromMock)
    fromMock.lte.mockResolvedValueOnce({
      data: [{ pid: 1, start_at: '2025-01-10T09:00:00', end_at: '2025-01-10T17:00:00' }],
      error: null
    })

    // Activities arriving late
    fromMock.lte.mockResolvedValueOnce({
      data: [{ arrival_time: '2025-01-10T09:20:00', departure_time: '2025-01-10T17:00:00' }],
      error: null
    })

    // Projects empty
    fromMock.lte.mockResolvedValueOnce({ data: [], error: null })

    await getKPI(req, res)

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        kpis: expect.objectContaining({ late_count: 1 })
      })
    )
  })

  it('should handle empty activities or projects gracefully', async () => {
    req.body = { start_date: '2025-01-01', end_date: '2025-01-31' }

    // Planning empty
    fromMock.select.mockReturnValueOnce(fromMock)
    fromMock.lte.mockResolvedValueOnce({ data: [], error: null })

    // Activities empty
    fromMock.lte.mockResolvedValueOnce({ data: [], error: null })

    // Projects empty
    fromMock.lte.mockResolvedValueOnce({ data: [], error: null })

    await getKPI(req, res)

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        kpis: expect.objectContaining({ late_count: 0, hours_per_project: [] })
      })
    )
  })

  it('should handle planning error', async () => {
    req.body = { start_date: '2025-01-01', end_date: '2025-01-31' }

    fromMock.select.mockReturnValueOnce(fromMock)
    fromMock.lte.mockResolvedValueOnce({ data: null, error: new Error('Planning failed') })

    await getKPI(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('should handle activity error', async () => {
    req.body = { start_date: '2025-01-01', end_date: '2025-01-31' }

    // Planning OK
    fromMock.select.mockReturnValueOnce(fromMock)
    fromMock.lte.mockResolvedValueOnce({ data: [], error: null })

    // Activities fail
    fromMock.lte.mockResolvedValueOnce({ data: null, error: new Error('Activity failed') })

    await getKPI(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('should handle project error', async () => {
    req.body = { start_date: '2025-01-01', end_date: '2025-01-31' }

    // Planning OK
    fromMock.select.mockReturnValueOnce(fromMock)
    fromMock.lte.mockResolvedValueOnce({ data: [], error: null })

    // Activities OK
    fromMock.lte.mockResolvedValueOnce({ data: [], error: null })

    // Projects fail
    fromMock.lte.mockResolvedValueOnce({ data: null, error: new Error('Project failed') })

    await getKPI(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})
