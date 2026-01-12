// frontend/src/__tests__/components/charts/chartUtils.test.js
// Story 6.2: Reusable Chart Components - chartUtils Tests

import { describe, it, expect } from 'vitest';
import {
  CHART_COLORS,
  formatNumber,
  formatPercentage,
  getProgressColor,
  getTrendIndicator,
  formatHours,
  calculatePercentage
} from '../../../components/charts/chartUtils';

describe('chartUtils', () => {
  describe('CHART_COLORS', () => {
    it('should have all required color keys', () => {
      expect(CHART_COLORS.primary).toBe('#3B82F6');
      expect(CHART_COLORS.success).toBe('#22C55E');
      expect(CHART_COLORS.warning).toBe('#F59E0B');
      expect(CHART_COLORS.danger).toBe('#EF4444');
      expect(CHART_COLORS.neutral).toBe('#6B7280');
    });

    it('should have series array with at least 10 colors', () => {
      expect(CHART_COLORS.series).toHaveLength(10);
      expect(CHART_COLORS.series[0]).toBe('#3B82F6');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with French locale', () => {
      expect(formatNumber(1234.56)).toBe('1\u202f234,6');
    });

    it('should format whole numbers without decimals', () => {
      expect(formatNumber(100)).toBe('100');
    });

    it('should handle null/undefined values', () => {
      expect(formatNumber(null)).toBe('0');
      expect(formatNumber(undefined)).toBe('0');
    });

    it('should handle NaN', () => {
      expect(formatNumber(NaN)).toBe('0');
    });

    it('should respect decimals parameter', () => {
      expect(formatNumber(10.123, 2)).toBe('10,12');
      expect(formatNumber(10.1, 0)).toBe('10');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with % symbol', () => {
      expect(formatPercentage(75)).toBe('75%');
      expect(formatPercentage(100)).toBe('100%');
    });

    it('should handle decimal percentages', () => {
      expect(formatPercentage(33.3)).toBe('33,3%');
    });

    it('should handle null/undefined', () => {
      expect(formatPercentage(null)).toBe('0%');
      expect(formatPercentage(undefined)).toBe('0%');
    });
  });

  describe('getProgressColor', () => {
    it('should return green for >= 80%', () => {
      expect(getProgressColor(80, 100)).toBe(CHART_COLORS.success);
      expect(getProgressColor(100, 100)).toBe(CHART_COLORS.success);
      expect(getProgressColor(90, 100)).toBe(CHART_COLORS.success);
    });

    it('should return yellow for 50-79%', () => {
      expect(getProgressColor(50, 100)).toBe(CHART_COLORS.warning);
      expect(getProgressColor(79, 100)).toBe(CHART_COLORS.warning);
      expect(getProgressColor(65, 100)).toBe(CHART_COLORS.warning);
    });

    it('should return red for < 50%', () => {
      expect(getProgressColor(49, 100)).toBe(CHART_COLORS.danger);
      expect(getProgressColor(0, 100)).toBe(CHART_COLORS.danger);
      expect(getProgressColor(25, 100)).toBe(CHART_COLORS.danger);
    });

    it('should return neutral for zero max', () => {
      expect(getProgressColor(50, 0)).toBe(CHART_COLORS.neutral);
    });

    it('should return neutral for null max', () => {
      expect(getProgressColor(50, null)).toBe(CHART_COLORS.neutral);
    });
  });

  describe('getTrendIndicator', () => {
    it('should return up indicator for positive values', () => {
      const result = getTrendIndicator(5);
      expect(result.icon).toBe('\u2191');
      expect(result.color).toBe(CHART_COLORS.success);
      expect(result.label).toBe('En hausse');
    });

    it('should return down indicator for negative values', () => {
      const result = getTrendIndicator(-3);
      expect(result.icon).toBe('\u2193');
      expect(result.color).toBe(CHART_COLORS.danger);
      expect(result.label).toBe('En baisse');
    });

    it('should return stable indicator for zero', () => {
      const result = getTrendIndicator(0);
      expect(result.icon).toBe('\u2192');
      expect(result.color).toBe(CHART_COLORS.neutral);
      expect(result.label).toBe('Stable');
    });
  });

  describe('formatHours', () => {
    it('should format hours with h suffix', () => {
      expect(formatHours(8)).toBe('8h');
      expect(formatHours(40)).toBe('40h');
    });

    it('should format decimal hours', () => {
      expect(formatHours(7.5)).toBe('7,5h');
    });

    it('should handle null/undefined', () => {
      expect(formatHours(null)).toBe('0h');
      expect(formatHours(undefined)).toBe('0h');
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(50, 100)).toBe(50);
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(100, 100)).toBe(100);
    });

    it('should return 0 for zero total', () => {
      expect(calculatePercentage(50, 0)).toBe(0);
    });

    it('should return 0 for null total', () => {
      expect(calculatePercentage(50, null)).toBe(0);
    });

    it('should handle values over 100%', () => {
      expect(calculatePercentage(150, 100)).toBe(150);
    });
  });
});
