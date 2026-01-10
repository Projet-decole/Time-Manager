// backend/tests/utils/pagination.test.js

const {
  parsePaginationParams,
  buildPaginationMeta,
  DEFAULT_LIMIT,
  MAX_LIMIT
} = require('../../utils/pagination');

describe('pagination helpers', () => {
  describe('constants', () => {
    it('should have DEFAULT_LIMIT of 20', () => {
      expect(DEFAULT_LIMIT).toBe(20);
    });

    it('should have MAX_LIMIT of 100', () => {
      expect(MAX_LIMIT).toBe(100);
    });
  });

  describe('parsePaginationParams', () => {
    it('should parse valid page and limit', () => {
      const query = { page: '2', limit: '10' };
      const result = parsePaginationParams(query);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(10);
    });

    it('should use default values when not provided', () => {
      const query = {};
      const result = parsePaginationParams(query);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('should use default page when only limit is provided', () => {
      const query = { limit: '15' };
      const result = parsePaginationParams(query);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(15);
      expect(result.offset).toBe(0);
    });

    it('should use default limit when only page is provided', () => {
      const query = { page: '3' };
      const result = parsePaginationParams(query);

      expect(result.page).toBe(3);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(40);
    });

    it('should enforce minimum page of 1', () => {
      const query = { page: '0', limit: '10' };
      const result = parsePaginationParams(query);

      expect(result.page).toBe(1);
      expect(result.offset).toBe(0);
    });

    it('should enforce minimum page of 1 for negative values', () => {
      const query = { page: '-5', limit: '10' };
      const result = parsePaginationParams(query);

      expect(result.page).toBe(1);
      expect(result.offset).toBe(0);
    });

    it('should enforce maximum limit', () => {
      const query = { page: '1', limit: '500' };
      const result = parsePaginationParams(query);

      expect(result.limit).toBe(100);
    });

    it('should enforce minimum limit of 1', () => {
      const query = { page: '1', limit: '0' };
      const result = parsePaginationParams(query);

      expect(result.limit).toBe(1);
    });

    it('should enforce minimum limit of 1 for negative values', () => {
      const query = { page: '1', limit: '-10' };
      const result = parsePaginationParams(query);

      expect(result.limit).toBe(1);
    });

    it('should handle non-numeric page values', () => {
      const query = { page: 'abc', limit: '10' };
      const result = parsePaginationParams(query);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should handle non-numeric limit values', () => {
      const query = { page: '2', limit: 'xyz' };
      const result = parsePaginationParams(query);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
    });

    it('should calculate correct offset for various pages', () => {
      expect(parsePaginationParams({ page: '1', limit: '10' }).offset).toBe(0);
      expect(parsePaginationParams({ page: '2', limit: '10' }).offset).toBe(10);
      expect(parsePaginationParams({ page: '3', limit: '10' }).offset).toBe(20);
      expect(parsePaginationParams({ page: '5', limit: '20' }).offset).toBe(80);
    });

    it('should handle float values by parsing as integer', () => {
      const query = { page: '2.7', limit: '10.5' };
      const result = parsePaginationParams(query);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });
  });

  describe('buildPaginationMeta', () => {
    it('should build correct pagination metadata', () => {
      const result = buildPaginationMeta(1, 10, 100);

      expect(result).toEqual({
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false
      });
    });

    it('should handle first page', () => {
      const result = buildPaginationMeta(1, 20, 50);

      expect(result.page).toBe(1);
      expect(result.hasPrev).toBe(false);
      expect(result.hasNext).toBe(true);
    });

    it('should handle last page', () => {
      const result = buildPaginationMeta(5, 10, 50);

      expect(result.page).toBe(5);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
    });

    it('should handle middle page', () => {
      const result = buildPaginationMeta(3, 10, 50);

      expect(result.page).toBe(3);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
    });

    it('should handle single page', () => {
      const result = buildPaginationMeta(1, 20, 10);

      expect(result.totalPages).toBe(1);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
    });

    it('should handle empty results', () => {
      const result = buildPaginationMeta(1, 20, 0);

      expect(result).toEqual({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      });
    });

    it('should calculate totalPages correctly', () => {
      expect(buildPaginationMeta(1, 10, 25).totalPages).toBe(3);
      expect(buildPaginationMeta(1, 10, 30).totalPages).toBe(3);
      expect(buildPaginationMeta(1, 10, 31).totalPages).toBe(4);
      expect(buildPaginationMeta(1, 20, 1).totalPages).toBe(1);
    });

    it('should handle exact page boundaries', () => {
      const result = buildPaginationMeta(5, 10, 50);

      expect(result.totalPages).toBe(5);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
    });

    it('should guard against limit of 0 to prevent Infinity', () => {
      const result = buildPaginationMeta(1, 0, 100);

      expect(result.limit).toBe(1);
      expect(result.totalPages).toBe(100);
      expect(Number.isFinite(result.totalPages)).toBe(true);
    });

    it('should guard against negative limit', () => {
      const result = buildPaginationMeta(1, -5, 100);

      expect(result.limit).toBe(1);
      expect(result.totalPages).toBe(100);
      expect(Number.isFinite(result.totalPages)).toBe(true);
    });
  });
});
