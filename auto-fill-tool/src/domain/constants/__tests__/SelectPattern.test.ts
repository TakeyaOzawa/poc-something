/**
 * Unit Tests: SelectPattern
 */

import {
  SELECT_PATTERN,
  SELECT_PATTERN_FLAGS,
  SelectPattern,
  isSelectPattern,
  parseSelectPattern,
} from '../SelectPattern';

describe('SelectPattern', () => {
  describe('SELECT_PATTERN constants', () => {
    it('should define NATIVE_SINGLE as 10', () => {
      expect(SELECT_PATTERN.NATIVE_SINGLE).toBe(10);
    });

    it('should define CUSTOM_SINGLE as 20', () => {
      expect(SELECT_PATTERN.CUSTOM_SINGLE).toBe(20);
    });

    it('should define JQUERY_SINGLE as 30', () => {
      expect(SELECT_PATTERN.JQUERY_SINGLE).toBe(30);
    });

    it('should define NATIVE_MULTIPLE as 110', () => {
      expect(SELECT_PATTERN.NATIVE_MULTIPLE).toBe(110);
    });

    it('should define CUSTOM_MULTIPLE as 120', () => {
      expect(SELECT_PATTERN.CUSTOM_MULTIPLE).toBe(120);
    });

    it('should define JQUERY_MULTIPLE as 130', () => {
      expect(SELECT_PATTERN.JQUERY_MULTIPLE).toBe(130);
    });

    it('should have all unique values', () => {
      const values = Object.values(SELECT_PATTERN);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it('should have exactly 6 select patterns', () => {
      const values = Object.values(SELECT_PATTERN);
      expect(values.length).toBe(6);
    });
  });

  describe('SELECT_PATTERN_FLAGS constants', () => {
    it('should define MULTIPLE_FLAG as 100', () => {
      expect(SELECT_PATTERN_FLAGS.MULTIPLE_FLAG).toBe(100);
    });

    it('should define TYPE_MULTIPLIER as 10', () => {
      expect(SELECT_PATTERN_FLAGS.TYPE_MULTIPLIER).toBe(10);
    });
  });

  describe('SelectPattern type', () => {
    it('should accept valid select pattern values', () => {
      const nativeSingle: SelectPattern = SELECT_PATTERN.NATIVE_SINGLE;
      const customSingle: SelectPattern = SELECT_PATTERN.CUSTOM_SINGLE;
      const jquerySingle: SelectPattern = SELECT_PATTERN.JQUERY_SINGLE;
      const nativeMultiple: SelectPattern = SELECT_PATTERN.NATIVE_MULTIPLE;
      const customMultiple: SelectPattern = SELECT_PATTERN.CUSTOM_MULTIPLE;
      const jqueryMultiple: SelectPattern = SELECT_PATTERN.JQUERY_MULTIPLE;

      expect(nativeSingle).toBe(10);
      expect(customSingle).toBe(20);
      expect(jquerySingle).toBe(30);
      expect(nativeMultiple).toBe(110);
      expect(customMultiple).toBe(120);
      expect(jqueryMultiple).toBe(130);
    });
  });

  describe('isSelectPattern', () => {
    it('should return true for all single selection patterns', () => {
      expect(isSelectPattern(SELECT_PATTERN.NATIVE_SINGLE)).toBe(true);
      expect(isSelectPattern(SELECT_PATTERN.CUSTOM_SINGLE)).toBe(true);
      expect(isSelectPattern(SELECT_PATTERN.JQUERY_SINGLE)).toBe(true);
    });

    it('should return true for all multiple selection patterns', () => {
      expect(isSelectPattern(SELECT_PATTERN.NATIVE_MULTIPLE)).toBe(true);
      expect(isSelectPattern(SELECT_PATTERN.CUSTOM_MULTIPLE)).toBe(true);
      expect(isSelectPattern(SELECT_PATTERN.JQUERY_MULTIPLE)).toBe(true);
    });

    it('should return false for invalid patterns', () => {
      expect(isSelectPattern(0)).toBe(false);
      expect(isSelectPattern(5)).toBe(false);
      expect(isSelectPattern(15)).toBe(false);
      expect(isSelectPattern(40)).toBe(false);
      expect(isSelectPattern(100)).toBe(false);
      expect(isSelectPattern(140)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(isSelectPattern(-10)).toBe(false);
    });

    it('should handle all valid patterns in a loop', () => {
      const validPatterns = Object.values(SELECT_PATTERN);
      validPatterns.forEach((pattern) => {
        expect(isSelectPattern(pattern)).toBe(true);
      });
    });
  });

  describe('parseSelectPattern', () => {
    describe('single selection patterns', () => {
      it('should parse NATIVE_SINGLE (10)', () => {
        const result = parseSelectPattern(SELECT_PATTERN.NATIVE_SINGLE);
        expect(result.isMultiple).toBe(false);
        expect(result.customType).toBe('native');
      });

      it('should parse CUSTOM_SINGLE (20)', () => {
        const result = parseSelectPattern(SELECT_PATTERN.CUSTOM_SINGLE);
        expect(result.isMultiple).toBe(false);
        expect(result.customType).toBe('custom');
      });

      it('should parse JQUERY_SINGLE (30)', () => {
        const result = parseSelectPattern(SELECT_PATTERN.JQUERY_SINGLE);
        expect(result.isMultiple).toBe(false);
        expect(result.customType).toBe('jquery');
      });
    });

    describe('multiple selection patterns', () => {
      it('should parse NATIVE_MULTIPLE (110)', () => {
        const result = parseSelectPattern(SELECT_PATTERN.NATIVE_MULTIPLE);
        expect(result.isMultiple).toBe(true);
        expect(result.customType).toBe('native');
      });

      it('should parse CUSTOM_MULTIPLE (120)', () => {
        const result = parseSelectPattern(SELECT_PATTERN.CUSTOM_MULTIPLE);
        expect(result.isMultiple).toBe(true);
        expect(result.customType).toBe('custom');
      });

      it('should parse JQUERY_MULTIPLE (130)', () => {
        const result = parseSelectPattern(SELECT_PATTERN.JQUERY_MULTIPLE);
        expect(result.isMultiple).toBe(true);
        expect(result.customType).toBe('jquery');
      });
    });

    describe('default value', () => {
      it('should handle pattern 0 as default (native single)', () => {
        const result = parseSelectPattern(0);
        expect(result.isMultiple).toBe(false);
        expect(result.customType).toBe('native');
      });
    });

    describe('edge cases', () => {
      it('should handle pattern with invalid type digit gracefully', () => {
        // Pattern 40: 100の位=0 (single), 10の位=4 (invalid)
        const result = parseSelectPattern(40);
        expect(result.isMultiple).toBe(false);
        expect(result.customType).toBe('native'); // フォールバック
      });

      it('should handle pattern with invalid type digit for multiple', () => {
        // Pattern 140: 100の位=1 (multiple), 10の位=4 (invalid)
        const result = parseSelectPattern(140);
        expect(result.isMultiple).toBe(true);
        expect(result.customType).toBe('native'); // フォールバック
      });

      it('should correctly identify multiple flag', () => {
        // Any pattern >= 100 should be multiple
        const result1 = parseSelectPattern(100);
        expect(result1.isMultiple).toBe(true);

        const result2 = parseSelectPattern(99);
        expect(result2.isMultiple).toBe(false);
      });

      it('should extract type digit correctly', () => {
        // Type digit is (pattern % 100) / 10
        // 115: (115 % 100) / 10 = 15 / 10 = 1 (native)
        const result = parseSelectPattern(115);
        expect(result.customType).toBe('native');
      });
    });

    describe('encoding scheme verification', () => {
      it('should verify 100の位 represents multiple flag', () => {
        // Single: < 100, Multiple: >= 100
        const single10 = parseSelectPattern(10);
        const multiple110 = parseSelectPattern(110);

        expect(single10.isMultiple).toBe(false);
        expect(multiple110.isMultiple).toBe(true);
        expect(Math.floor(10 / 100)).toBe(0);
        expect(Math.floor(110 / 100)).toBe(1);
      });

      it('should verify 10の位 represents custom type', () => {
        // 1x: native, 2x: custom, 3x: jquery
        expect(parseSelectPattern(10).customType).toBe('native');
        expect(parseSelectPattern(20).customType).toBe('custom');
        expect(parseSelectPattern(30).customType).toBe('jquery');
        expect(parseSelectPattern(110).customType).toBe('native');
        expect(parseSelectPattern(120).customType).toBe('custom');
        expect(parseSelectPattern(130).customType).toBe('jquery');
      });
    });
  });
});
