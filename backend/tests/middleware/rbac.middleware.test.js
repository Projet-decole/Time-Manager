// backend/tests/middleware/rbac.middleware.test.js

const AppError = require('../../utils/AppError');
const { rbac, ROLE_HIERARCHY } = require('../../middleware/rbac.middleware');

describe('RBAC Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('ROLE_HIERARCHY', () => {
    it('should define employee role with only employee permissions', () => {
      expect(ROLE_HIERARCHY.employee).toEqual(['employee']);
    });

    it('should define manager role with manager and employee permissions', () => {
      expect(ROLE_HIERARCHY.manager).toEqual(['manager', 'employee']);
    });
  });

  describe('rbac factory function', () => {
    it('should return a middleware function', () => {
      const middleware = rbac('manager');
      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(3); // (req, res, next)
    });

    it('should accept multiple roles as arguments', () => {
      const middleware = rbac('manager', 'employee');
      expect(typeof middleware).toBe('function');
    });
  });

  describe('AC#1: Manager accesses manager-protected route', () => {
    it('should grant access when manager accesses route with rbac("manager")', () => {
      mockReq.user = { id: 'user-123', email: 'manager@test.com', role: 'manager' };

      const middleware = rbac('manager');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next() without error for authorized manager', () => {
      mockReq.user = { id: 'user-456', email: 'boss@test.com', role: 'manager' };

      const middleware = rbac('manager');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext.mock.calls[0][0]).toBeUndefined();
    });
  });

  describe('AC#2: Employee accesses manager-protected route', () => {
    it('should return 403 Forbidden when employee accesses route with rbac("manager")', () => {
      mockReq.user = { id: 'user-789', email: 'employee@test.com', role: 'employee' };

      const middleware = rbac('manager');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should return error with code "FORBIDDEN" for unauthorized access', () => {
      mockReq.user = { id: 'user-111', email: 'worker@test.com', role: 'employee' };

      const middleware = rbac('manager');
      middleware(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toContain('permission');
    });
  });

  describe('AC#3: Role inheritance - Manager inherits Employee permissions', () => {
    it('should grant access when manager accesses route with rbac("employee")', () => {
      mockReq.user = { id: 'user-222', email: 'manager@test.com', role: 'manager' };

      const middleware = rbac('employee');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should grant employee access to employee-protected routes', () => {
      mockReq.user = { id: 'user-333', email: 'emp@test.com', role: 'employee' };

      const middleware = rbac('employee');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow manager to access routes requiring either role', () => {
      mockReq.user = { id: 'user-444', email: 'mgr@test.com', role: 'manager' };

      const middleware = rbac('employee', 'manager');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('AC#4: RBAC without prior authentication (no req.user)', () => {
    it('should return 401 Unauthorized when req.user is not populated', () => {
      // No req.user set

      const middleware = rbac('manager');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when req.user is null', () => {
      mockReq.user = null;

      const middleware = rbac('employee');
      middleware(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when req.user is undefined', () => {
      mockReq.user = undefined;

      const middleware = rbac('manager');
      middleware(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(401);
    });
  });

  describe('Edge cases', () => {
    it('should handle unknown role by treating as having only that role', () => {
      mockReq.user = { id: 'user-555', email: 'unknown@test.com', role: 'guest' };

      // Guest trying to access employee route - should fail
      const middleware = rbac('employee');
      middleware(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
    });

    it('should allow access if user has the unknown role being checked', () => {
      mockReq.user = { id: 'user-666', email: 'guest@test.com', role: 'guest' };

      // Guest trying to access guest route - should pass
      const middleware = rbac('guest');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle user with no role property', () => {
      mockReq.user = { id: 'user-777', email: 'norole@test.com' };

      const middleware = rbac('employee');
      middleware(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(403);
    });

    it('should work with multiple allowed roles', () => {
      mockReq.user = { id: 'user-888', email: 'emp@test.com', role: 'employee' };

      const middleware = rbac('manager', 'employee');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Integration: authenticate + rbac middleware chain', () => {
    // Simulates real usage: authenticate populates req.user, then rbac checks role

    it('should grant access when authenticated manager accesses manager route', () => {
      // Simulating what authenticate middleware would populate
      mockReq.user = {
        id: 'user-123',
        email: 'manager@test.com',
        role: 'manager',
        firstName: 'John',
        lastName: 'Doe'
      };

      const middleware = rbac('manager');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access when authenticated employee accesses manager route', () => {
      mockReq.user = {
        id: 'user-456',
        email: 'employee@test.com',
        role: 'employee',
        firstName: 'Jane',
        lastName: 'Doe'
      };

      const middleware = rbac('manager');
      middleware(mockReq, mockRes, mockNext);

      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should allow manager to access employee routes via inheritance', () => {
      mockReq.user = {
        id: 'user-789',
        email: 'manager@test.com',
        role: 'manager'
      };

      const middleware = rbac('employee');
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
