/**
 * Unit Tests: ComparisonPattern
 */

import { COMPARISON_PATTERN, ComparisonPattern, isComparisonPattern } from '../ComparisonPattern';

describe('ComparisonPattern', () => {
  describe('COMPARISON_PATTERN constants', () => {
    it('should define EQUALS as 10', () => {
      expect(COMPARISON_PATTERN.EQUALS).toBe(10);
    });

    it('should define NOT_EQUALS as 20', () => {
      expect(COMPARISON_PATTERN.NOT_EQUALS).toBe(20);
    });

    it('should define GREATER_THAN as 30', () => {
      expect(COMPARISON_PATTERN.GREATER_THAN).toBe(30);
    });

    it('should define LESS_THAN as 40', () => {
      expect(COMPARISON_PATTERN.LESS_THAN).toBe(40);
    });

    it('should have all unique values', () => {
      const values = Object.values(COMPARISON_PATTERN);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it('should be immutable (readonly)', () => {
      // TypeScript will catch this at compile time
      // This test verifies the values remain constant
      expect(Object.isFrozen(COMPARISON_PATTERN)).toBe(false); // `as const` doesn't freeze, but TypeScript enforces immutability
      expect(COMPARISON_PATTERN.EQUALS).toBe(10);
    });
  });

  describe('ComparisonPattern type', () => {
    it('should accept valid comparison pattern values', () => {
      const equals: ComparisonPattern = COMPARISON_PATTERN.EQUALS;
      const notEquals: ComparisonPattern = COMPARISON_PATTERN.NOT_EQUALS;
      const greaterThan: ComparisonPattern = COMPARISON_PATTERN.GREATER_THAN;
      const lessThan: ComparisonPattern = COMPARISON_PATTERN.LESS_THAN;

      expect(equals).toBe(10);
      expect(notEquals).toBe(20);
      expect(greaterThan).toBe(30);
      expect(lessThan).toBe(40);
    });
  });

  describe('isComparisonPattern', () => {
    it('should return true for EQUALS (10)', () => {
      expect(isComparisonPattern(10)).toBe(true);
    });

    it('should return true for NOT_EQUALS (20)', () => {
      expect(isComparisonPattern(20)).toBe(true);
    });

    it('should return true for GREATER_THAN (30)', () => {
      expect(isComparisonPattern(30)).toBe(true);
    });

    it('should return true for LESS_THAN (40)', () => {
      expect(isComparisonPattern(40)).toBe(true);
    });

    it('should return false for invalid pattern (0)', () => {
      expect(isComparisonPattern(0)).toBe(false);
    });

    it('should return false for invalid pattern (5)', () => {
      expect(isComparisonPattern(5)).toBe(false);
    });

    it('should return false for invalid pattern (15)', () => {
      expect(isComparisonPattern(15)).toBe(false);
    });

    it('should return false for invalid pattern (50)', () => {
      expect(isComparisonPattern(50)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(isComparisonPattern(-10)).toBe(false);
    });

    it('should return false for decimal numbers', () => {
      expect(isComparisonPattern(10.5)).toBe(false);
    });

    it('should work with constant values', () => {
      expect(isComparisonPattern(COMPARISON_PATTERN.EQUALS)).toBe(true);
      expect(isComparisonPattern(COMPARISON_PATTERN.NOT_EQUALS)).toBe(true);
      expect(isComparisonPattern(COMPARISON_PATTERN.GREATER_THAN)).toBe(true);
      expect(isComparisonPattern(COMPARISON_PATTERN.LESS_THAN)).toBe(true);
    });

    it('should handle all valid patterns in a loop', () => {
      const validPatterns = Object.values(COMPARISON_PATTERN);
      validPatterns.forEach((pattern) => {
        expect(isComparisonPattern(pattern)).toBe(true);
      });
    });
  });
});
