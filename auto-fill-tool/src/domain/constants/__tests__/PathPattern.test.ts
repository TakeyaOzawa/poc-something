/**
 * Unit Tests: PathPattern
 */

import { PATH_PATTERN, PathPattern, isPathPattern } from '../PathPattern';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('PathPattern', () => {
  describe('PATH_PATTERN constants', () => {
    it('should define SMART as "smart"', () => {
      expect(PATH_PATTERN.SMART).toBe('smart');
    });

    it('should define SHORT as "short"', () => {
      expect(PATH_PATTERN.SHORT).toBe('short');
    });

    it('should define ABSOLUTE as "absolute"', () => {
      expect(PATH_PATTERN.ABSOLUTE).toBe('absolute');
    });

    it('should define NONE as empty string', () => {
      expect(PATH_PATTERN.NONE).toBe('');
    });

    it('should have all unique values', () => {
      const values = Object.values(PATH_PATTERN);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it('should have exactly 4 path patterns', () => {
      const values = Object.values(PATH_PATTERN);
      expect(values.length).toBe(4);
    });
  });

  describe('PathPattern type', () => {
    it('should accept valid path pattern values', () => {
      const smart: PathPattern = PATH_PATTERN.SMART;
      const short: PathPattern = PATH_PATTERN.SHORT;
      const absolute: PathPattern = PATH_PATTERN.ABSOLUTE;
      const none: PathPattern = PATH_PATTERN.NONE;

      expect(smart).toBe('smart');
      expect(short).toBe('short');
      expect(absolute).toBe('absolute');
      expect(none).toBe('');
    });
  });

  describe('isPathPattern', () => {
    it('should return true for SMART', () => {
      expect(isPathPattern('smart')).toBe(true);
    });

    it('should return true for SHORT', () => {
      expect(isPathPattern('short')).toBe(true);
    });

    it('should return true for ABSOLUTE', () => {
      expect(isPathPattern('absolute')).toBe(true);
    });

    it('should return true for NONE (empty string)', () => {
      expect(isPathPattern('')).toBe(true);
    });

    it('should return false for invalid pattern', () => {
      expect(isPathPattern('invalid')).toBe(false);
    });

    it('should return false for similar but incorrect patterns', () => {
      expect(isPathPattern('Smart')).toBe(false); // Capital S
      expect(isPathPattern('SHORT')).toBe(false); // All caps
      expect(isPathPattern('Absolute')).toBe(false); // Capital A
    });

    it('should return false for partial matches', () => {
      expect(isPathPattern('smar')).toBe(false);
      expect(isPathPattern('smarts')).toBe(false);
      expect(isPathPattern('shorts')).toBe(false);
    });

    it('should work with constant values', () => {
      expect(isPathPattern(PATH_PATTERN.SMART)).toBe(true);
      expect(isPathPattern(PATH_PATTERN.SHORT)).toBe(true);
      expect(isPathPattern(PATH_PATTERN.ABSOLUTE)).toBe(true);
      expect(isPathPattern(PATH_PATTERN.NONE)).toBe(true);
    });

    it('should handle all valid patterns in a loop', () => {
      const validPatterns = Object.values(PATH_PATTERN);
      validPatterns.forEach((pattern) => {
        expect(isPathPattern(pattern)).toBe(true);
      });
    });

    it('should be used for runtime validation', () => {
      const pattern = 'smart';

      if (isPathPattern(pattern)) {
        expect(pattern).toBe(PATH_PATTERN.SMART);
      } else {
        fail('Should be a valid path pattern');
      }
    });

    it('should validate patterns from external sources', () => {
      const externalPatterns = ['smart', 'invalid', 'short', '', 'unknown'];

      const validPatterns = externalPatterns.filter(isPathPattern);

      expect(validPatterns).toHaveLength(3);
      expect(validPatterns).toContain('smart');
      expect(validPatterns).toContain('short');
      expect(validPatterns).toContain('');
      expect(validPatterns).not.toContain('invalid');
      expect(validPatterns).not.toContain('unknown');
    });
  });

  describe('usage scenarios', () => {
    it('should be used for change_url actionType with NONE pattern', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const actionType = 'change_url';
      const pathPattern = PATH_PATTERN.NONE;

      expect(pathPattern).toBe('');
      expect(isPathPattern(pathPattern)).toBe(true);
    });

    it('should be used for input actionType with SMART pattern (recommended)', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const actionType = 'type';
      const pathPattern = PATH_PATTERN.SMART;

      expect(pathPattern).toBe('smart');
      expect(isPathPattern(pathPattern)).toBe(true);
    });

    it('should support all non-NONE patterns for XPath-based actions', () => {
      const xpathPatterns = [PATH_PATTERN.SMART, PATH_PATTERN.SHORT, PATH_PATTERN.ABSOLUTE];

      xpathPatterns.forEach((pattern) => {
        expect(pattern).not.toBe('');
        expect(isPathPattern(pattern)).toBe(true);
      });
    });
  });
});
