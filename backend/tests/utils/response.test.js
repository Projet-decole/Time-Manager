// backend/tests/utils/response.test.js

const { successResponse, errorResponse, paginatedResponse } = require('../../utils/response');
const AppError = require('../../utils/AppError');

// Mock Express response object
const createMockRes = () => {
  const res = {
    statusCode: 200,
    jsonData: null,
  };
  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((data) => {
    res.jsonData = data;
    return res;
  });
  return res;
};

describe('response helpers', () => {
  describe('successResponse', () => {
    it('should return success response with data only', () => {
      const res = createMockRes();
      const data = { id: 1, name: 'Test' };

      successResponse(res, data);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1, name: 'Test' }
      });
    });

    it('should return success response with data and meta', () => {
      const res = createMockRes();
      const data = [{ id: 1 }, { id: 2 }];
      const meta = { pagination: { page: 1, limit: 10 } };

      successResponse(res, data, meta);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 1 }, { id: 2 }],
        meta: { pagination: { page: 1, limit: 10 } }
      });
    });

    it('should return success response with null data', () => {
      const res = createMockRes();

      successResponse(res, null);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: null
      });
    });

    it('should return success response with empty array', () => {
      const res = createMockRes();

      successResponse(res, []);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: []
      });
    });

    it('should not include meta when null', () => {
      const res = createMockRes();
      const data = { id: 1 };

      successResponse(res, data, null);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1 }
      });
    });
  });

  describe('errorResponse', () => {
    it('should return error response with AppError', () => {
      const res = createMockRes();
      const error = new AppError('Not found', 404, 'NOT_FOUND');

      errorResponse(res, error);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Not found',
          details: null
        }
      });
    });

    it('should return error response with validation details', () => {
      const res = createMockRes();
      const details = [{ field: 'email', message: 'Invalid email' }];
      const error = new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);

      errorResponse(res, error);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [{ field: 'email', message: 'Invalid email' }]
        }
      });
    });

    it('should default to 500 status code if not provided', () => {
      const res = createMockRes();
      const error = new Error('Something went wrong');

      errorResponse(res, error);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong',
          details: null
        }
      });
    });

    it('should default to INTERNAL_ERROR code if not provided', () => {
      const res = createMockRes();
      const error = { message: 'Unknown error', statusCode: 503 };

      errorResponse(res, error);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Unknown error',
          details: null
        }
      });
    });

    it('should handle 401 Unauthorized errors', () => {
      const res = createMockRes();
      const error = new AppError('Unauthorized', 401, 'UNAUTHORIZED');

      errorResponse(res, error);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
          details: null
        }
      });
    });

    it('should handle 403 Forbidden errors', () => {
      const res = createMockRes();
      const error = new AppError('Forbidden', 403, 'FORBIDDEN');

      errorResponse(res, error);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Forbidden',
          details: null
        }
      });
    });
  });

  describe('paginatedResponse', () => {
    it('should return paginated response with data and pagination meta', () => {
      const res = createMockRes();
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false
      };

      paginatedResponse(res, data, pagination);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 1 }, { id: 2 }],
        meta: {
          pagination: {
            page: 1,
            limit: 10,
            total: 100,
            totalPages: 10,
            hasNext: true,
            hasPrev: false
          }
        }
      });
    });

    it('should return paginated response with empty data', () => {
      const res = createMockRes();
      const data = [];
      const pagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      };

      paginatedResponse(res, data, pagination);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        meta: {
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        }
      });
    });

    it('should handle last page pagination', () => {
      const res = createMockRes();
      const data = [{ id: 91 }, { id: 92 }];
      const pagination = {
        page: 10,
        limit: 10,
        total: 92,
        totalPages: 10,
        hasNext: false,
        hasPrev: true
      };

      paginatedResponse(res, data, pagination);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [{ id: 91 }, { id: 92 }],
        meta: {
          pagination: {
            page: 10,
            limit: 10,
            total: 92,
            totalPages: 10,
            hasNext: false,
            hasPrev: true
          }
        }
      });
    });
  });
});
