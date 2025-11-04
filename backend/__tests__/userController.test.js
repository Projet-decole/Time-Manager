// __tests__/userController.test.js
import { jest } from '@jest/globals'

// IMPORTANT : mocker le module Supabase AVANT d’importer le contrôleur
jest.unstable_mockModule('../supabaseClient.js', () => ({
  supabase: {
    auth: {
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
        updateUserById: jest.fn()
      }
    }
  }
}))

// Maintenant qu’il est mocké, on peut importer le contrôleur
const { getAllUsers, createUser, updateUser, deleteUser } = await import('../controllers/userController.js')
const { supabase } = await import('../supabaseClient.js')

// ============================================================================
// TEST GET ALL USERS
// ============================================================================
describe('User Controller - getAllUsers', () => {
  it('should return a list of users with success true', async () => {
    const mockData = [
      { uid: '1', firstname: 'Alice', lastname: 'Doe', role: 'manager', tid: 'T1' },
      { uid: '2', firstname: 'Bob', lastname: 'Smith', role: 'seller', tid: 'T2' }
    ]

    const req = {
      supabase: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: mockData, error: null })
      }
    }

    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }

    await getAllUsers(req, res)
    expect(req.supabase.from).toHaveBeenCalledWith('employees_role')
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      count: 2,
      employees: mockData
    })
  })

  it('should return 500 if there is an error', async () => {
    const req = {
      supabase: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') })
      }
    }

    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }

    await getAllUsers(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'DB error'
    })
  })
})

// ============================================================================
// TEST CREATE USER
// ============================================================================
describe('User Controller - createUser', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should create a new user successfully', async () => {
    supabase.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'uid123', email: 'test@example.com' } },
      error: null
    })

    const req = {
      body: {
        email: 'test@example.com',
        password: 'secret123',
        role: 'manager',
        tid: 'team001',
        firstname: 'Alice',
        lastname: 'Doe'
      },
      supabase: {
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            uid: 'uid123',
            role: 'manager',
            tid: 'team001',
            firstname: 'Alice',
            lastname: 'Doe'
          },
          error: null
        })
      }
    }

    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }

    await createUser(req, res)

    expect(supabase.auth.admin.createUser).toHaveBeenCalled()
    expect(req.supabase.from).toHaveBeenCalledWith('employees_role')
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: {
        auth: { id: 'uid123', email: 'test@example.com' },
        profile: {
          uid: 'uid123',
          role: 'manager',
          tid: 'team001',
          firstname: 'Alice',
          lastname: 'Doe'
        }
      }
    })
  })

  it('should rollback and return 500 if insert fails', async () => {
    supabase.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: 'uid123', email: 'test@example.com' } },
      error: null
    })
    supabase.auth.admin.deleteUser.mockResolvedValue({ error: null })

    const req = {
      body: {
        email: 'test@example.com',
        password: 'secret123',
        role: 'manager',
        tid: 'team001',
        firstname: 'Alice',
        lastname: 'Doe'
      },
      supabase: {
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Insert failed')
        })
      }
    }

    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }

    await createUser(req, res)

    expect(supabase.auth.admin.deleteUser).toHaveBeenCalledWith('uid123')
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Insert failed'
    })
  })
})

// ============================================================================
// TEST UPDATE USER
// ============================================================================
describe('User Controller - updateUser', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should return 400 if uid is missing', async () => {
    const req = { body: {} }
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }

    await updateUser(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Le champ uid est obligatoire.'
    })
  })

  it('should update user auth and profile successfully', async () => {
    supabase.auth.admin.updateUserById.mockResolvedValue({
      data: { user: { id: 'uid123', email: 'new@example.com' } },
      error: null
    })

    const req = {
      body: {
        uid: 'uid123',
        email: 'new@example.com',
        firstname: 'Alice',
        lastname: 'Updated'
      },
      supabase: {
        from: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { uid: 'uid123', firstname: 'Alice', lastname: 'Updated' },
          error: null
        })
      }
    }

    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }

    await updateUser(req, res)

    expect(supabase.auth.admin.updateUserById).toHaveBeenCalledWith('uid123', {
      email: 'new@example.com'
    })
    expect(req.supabase.from).toHaveBeenCalledWith('employees_role')
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      user: {
        auth: { id: 'uid123', email: 'new@example.com' },
        profile: { uid: 'uid123', firstname: 'Alice', lastname: 'Updated' }
      }
    })
  })

  it('should return 500 if auth update fails', async () => {
    supabase.auth.admin.updateUserById.mockResolvedValue({
      data: null,
      error: new Error('Auth error')
    })

    const req = {
      body: { uid: 'uid123', email: 'fail@example.com' },
      supabase: {}
    }

    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }

    await updateUser(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Auth error'
    })
  })
})

// ============================================================================
// TEST DELETE USER
// ============================================================================
describe('User Controller - deleteUser', () => {
  beforeEach(() => jest.clearAllMocks())

  it('should return 400 if uid is missing', async () => {
    const req = { body: {} }
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }

    await deleteUser(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Le champ uid est obligatoire.'
    })
  })

  it('should delete user successfully', async () => {
    supabase.auth.admin.deleteUser.mockResolvedValue({ error: null })

    const req = {
      body: { uid: 'uid123' },
      supabase: {
        from: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      }
    }

    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }

    await deleteUser(req, res)

    expect(req.supabase.from).toHaveBeenCalledWith('employees_role')
    expect(supabase.auth.admin.deleteUser).toHaveBeenCalledWith('uid123')
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Utilisateur uid123 supprimé avec succès (employees_role + auth).'
    })
  })

  it('should return 500 if deletion from employees_role fails', async () => {
    const req = {
      body: { uid: 'uid123' },
      supabase: {
        from: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: new Error('DB delete failed') })
      }
    }

    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() }

    await deleteUser(req, res)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'DB delete failed'
    })
  })
})
