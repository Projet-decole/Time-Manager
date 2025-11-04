import { jest } from '@jest/globals'
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject
} from '../controllers/projectController.js'

describe('Project Controller', () => {
  let req, res, fromMock

  beforeEach(() => {
    fromMock = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      single: jest.fn(),
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
    GET /project
  ================================================================= */

  it('should return 400 if uid is missing', async () => {
    req.body = {}
    await getProjects(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    )
  })

  it('should return projects successfully', async () => {
    req.body = { uid: 'U1' }

    fromMock.eq.mockResolvedValueOnce({
      data: [{ projectid: 1, name: 'Test Project' }],
      error: null,
    })

    await getProjects(req, res)

    expect(req.supabase.from).toHaveBeenCalledWith('project')
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        projects: expect.any(Array),
      })
    )
  })

  it('should handle Supabase error', async () => {
    req.body = { uid: 'U1' }
    fromMock.eq.mockResolvedValueOnce({
      data: null,
      error: new Error('Database error'),
    })

    await getProjects(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })

  /* ================================================================
    POST /project
  ================================================================= */

  it('should return 400 if missing fields', async () => {
    req.body = { name: 'Incomplete Project' } // missing start_at, end_at
    await createProject(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('should create project successfully', async () => {
    req.body = {
      name: 'New Project',
      start_at: '2025-01-01',
      end_at: '2025-02-01',
    }

    fromMock.insert.mockReturnThis()
    fromMock.select.mockReturnThis()
    fromMock.single.mockResolvedValueOnce({
      data: { projectid: 1, name: 'New Project' },
      error: null,
    })

    await createProject(req, res)

    expect(req.supabase.from).toHaveBeenCalledWith('project')
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    )
  })

  it('should handle insert error', async () => {
    req.body = {
      name: 'Fail Project',
      start_at: '2025-01-01',
      end_at: '2025-02-01',
    }

    fromMock.insert.mockReturnThis()
    fromMock.select.mockReturnThis()
    fromMock.single.mockResolvedValueOnce({
      data: null,
      error: new Error('Insert failed'),
    })

    await createProject(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
  })

  /* ================================================================
    PUT /project
  ================================================================= */

  it('should return 400 if projectid missing', async () => {
    req.body = {}
    await updateProject(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('should return 400 if no fields to update', async () => {
    req.body = { projectid: 1 }
    await updateProject(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('should handle project not found', async () => {
    req.body = { projectid: 1, name: 'Updated' }

    // Check ownership → no project found
    fromMock.select.mockReturnThis()
    fromMock.eq.mockReturnThis()
    fromMock.single.mockResolvedValueOnce({ data: null, error: null })

    await updateProject(req, res)
    expect(res.status).toHaveBeenCalledWith(404)
  })

  it('should handle forbidden update', async () => {
    req.body = { projectid: 1, name: 'Updated' }

    // Project belongs to another user
    fromMock.select.mockReturnThis()
    fromMock.eq.mockReturnThis()
    fromMock.single.mockResolvedValueOnce({ data: { uid: 'OTHER' }, error: null })

    await updateProject(req, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('should update project successfully', async () => {
    req.body = { projectid: 1, name: 'Updated' }

    // Mock le premier .from() pour le check
    const fromCheck = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { uid: 'U1' }, error: null }),
    }

    // Mock le second .from() pour la mise à jour
    const fromUpdate = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { projectid: 1, name: 'Updated' },
        error: null,
      }),
    }

    req.supabase.from = jest
      .fn()
      .mockReturnValueOnce(fromCheck)
      .mockReturnValueOnce(fromUpdate)

    await updateProject(req, res)

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        project: expect.objectContaining({ name: 'Updated' }),
      })
    )
  })

  /* ================================================================
    DELETE /project
  ================================================================= */

  it('should return 400 if projectid missing', async () => {
    req.body = {}
    await deleteProject(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('should delete project successfully', async () => {
    req.body = { projectid: 1 }
    fromMock.delete.mockReturnThis()
    fromMock.eq.mockResolvedValueOnce({ error: null })

    await deleteProject(req, res)

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    )
  })

  it('should handle delete error', async () => {
    req.body = { projectid: 1 }
    fromMock.delete.mockReturnThis()
    fromMock.eq.mockResolvedValueOnce({ error: new Error('Delete failed') })

    await deleteProject(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})
