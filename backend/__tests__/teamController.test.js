// __tests__/teamController.test.js
import { jest } from '@jest/globals'

// Mock du module Supabase avant d'importer le controller
jest.unstable_mockModule('../supabaseClient.js', () => ({
  supabase: {
    from: jest.fn()
  }
}))

// Import du controller et du supabase mocké
const { getAllTeams, createTeam, updateTeam, deleteTeam } = await import('../controllers/teamController.js')
const { supabase } = await import('../supabaseClient.js')

describe('Team Controller - getAllTeams', () => {
  it('should return a list of teams with success true', async () => {
    const mockData = [
      { tid: 'T1', name: 'Team A', manager: 'U1' },
      { tid: 'T2', name: 'Team B', manager: 'U2' }
    ]

    const req = {
      supabase: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: mockData, error: null })
      }
    }
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }

    await getAllTeams(req, res)

    expect(req.supabase.from).toHaveBeenCalledWith('team')
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      count: 2,
      teams: mockData
    })
  })
})

describe('Team Controller - createTeam', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should create a new team successfully', async () => {
    const mockTeam = { tid: 'T1', name: 'Team A', manager: 'U1', description: 'desc' }

    const req = {
      body: { name: 'Team A', description: 'desc', manager: 'U1' },
      supabase: {
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockTeam, error: null })
      }
    }
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }

    await createTeam(req, res)

    expect(req.supabase.from).toHaveBeenCalledWith('team')
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({ success: true, team: mockTeam })
  })

  it('should return 400 if name or manager missing', async () => {
    const req = { body: { description: 'desc' }, supabase: {} }
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }

    await createTeam(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'name et manager obligatoires.'
    })
  })
})

describe('Team Controller - updateTeam', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should return 400 if tid missing', async () => {
    const req = { body: { name: 'Updated' } }
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }

    await updateTeam(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'tid obligatoire.' })
  })

  it('should return 400 if no fields to update', async () => {
    const req = { body: { tid: 'T1' } }
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }

    await updateTeam(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Aucun champ à mettre à jour.' })
  })

  it('should update team successfully', async () => {
    const mockUpdated = [{ tid: 'T1', name: 'Updated Team', manager: 'U5' }]

    const req = {
      body: { tid: 'T1', name: 'Updated Team', manager: 'U5' },
      supabase: {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: mockUpdated, error: null })
      }
    }
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }

    await updateTeam(req, res)

    expect(req.supabase.from).toHaveBeenCalledWith('team')
    expect(res.json).toHaveBeenCalledWith({ success: true, team: mockUpdated[0] })
  })
})

describe('Team Controller - deleteTeam', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should delete team successfully', async () => {
    const maybeSingleMock = jest.fn().mockResolvedValue({ data: { tid: 'T1' }, error: null })
    const deleteMock = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) })

    const req = {
      body: { tid: 'T1' },
      supabase: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: maybeSingleMock,
        delete: deleteMock
      }
    }
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }

    await deleteTeam(req, res)

    expect(req.supabase.from).toHaveBeenCalledWith('team')
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Équipe T1 supprimée.'
    })
  })

  it('should handle delete error', async () => {
    const maybeSingleMock = jest.fn().mockResolvedValue({ data: { tid: 'T1' }, error: null })
    const deleteMock = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: new Error('Delete failed') }) })

    const req = {
      body: { tid: 'T1' },
      supabase: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: maybeSingleMock,
        delete: deleteMock
      }
    }
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }

    await deleteTeam(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Delete failed'
    })
  })

  it('should return 400 if tid missing', async () => {
    const req = { body: {}, supabase: {} }
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }

    await deleteTeam(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'tid obligatoire.'
    })
  })

  it('should return 404 if team not found', async () => {
    const maybeSingleMock = jest.fn().mockResolvedValue({ data: null, error: null })

    const req = {
      body: { tid: 'T404' },
      supabase: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: maybeSingleMock
      }
    }
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }

    await deleteTeam(req, res)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Aucune équipe trouvée pour tid T404.'
    })
  })
})
