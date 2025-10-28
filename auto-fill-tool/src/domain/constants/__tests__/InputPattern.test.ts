/**
 * Unit Tests: Input Pattern Constants
 */

import { InputPattern, isInputPattern, getAllInputPatterns } from '../InputPattern';

describe('InputPattern', () => {
  describe('enum values', () => {
    it('should have BASIC pattern with value 10', () => {
      expect(InputPattern.BASIC).toBe(10);
    });

    it('should have FRAMEWORK_AGNOSTIC pattern with value 20', () => {
      expect(InputPattern.FRAMEWORK_AGNOSTIC).toBe(20);
    });

    it('should have exactly 2 enum values', () => {
      const values = Object.values(InputPattern).filter((v) => typeof v === 'number');
      expect(values).toHaveLength(2);
    });
  });

  describe('isInputPattern', () => {
    it('should return true for BASIC pattern (10)', () => {
      expect(isInputPattern(InputPattern.BASIC)).toBe(true);
      expect(isInputPattern(10)).toBe(true);
    });

    it('should return true for FRAMEWORK_AGNOSTIC pattern (20)', () => {
      expect(isInputPattern(InputPattern.FRAMEWORK_AGNOSTIC)).toBe(true);
      expect(isInputPattern(20)).toBe(true);
    });

    it('should return false for invalid patterns', () => {
      expect(isInputPattern(0)).toBe(false);
      expect(isInputPattern(5)).toBe(false);
      expect(isInputPattern(15)).toBe(false);
      expect(isInputPattern(25)).toBe(false);
      expect(isInputPattern(30)).toBe(false);
      expect(isInputPattern(100)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(isInputPattern(-1)).toBe(false);
      expect(isInputPattern(-10)).toBe(false);
    });

    it('should return false for non-integer numbers', () => {
      expect(isInputPattern(10.5)).toBe(false);
      expect(isInputPattern(20.1)).toBe(false);
    });
  });

  describe('getAllInputPatterns', () => {
    it('should return all input patterns', () => {
      const patterns = getAllInputPatterns();
      expect(patterns).toHaveLength(2);
      expect(patterns).toContain(InputPattern.BASIC);
      expect(patterns).toContain(InputPattern.FRAMEWORK_AGNOSTIC);
    });

    it('should return patterns in correct order', () => {
      const patterns = getAllInputPatterns();
      expect(patterns[0]).toBe(InputPattern.BASIC);
      expect(patterns[1]).toBe(InputPattern.FRAMEWORK_AGNOSTIC);
    });

    it('should return a new array each time', () => {
      const patterns1 = getAllInputPatterns();
      const patterns2 = getAllInputPatterns();
      expect(patterns1).not.toBe(patterns2);
      expect(patterns1).toEqual(patterns2);
    });
  });

  describe('business rules consistency', () => {
    it('should have sequential pattern values', () => {
      expect(InputPattern.FRAMEWORK_AGNOSTIC - InputPattern.BASIC).toBe(10);
    });

    it('should have pattern values that are multiples of 10', () => {
      const patterns = getAllInputPatterns();
      patterns.forEach((pattern) => {
        expect(pattern % 10).toBe(0);
      });
    });
  });
});
