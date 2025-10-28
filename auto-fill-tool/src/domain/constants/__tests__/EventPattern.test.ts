/**
 * Unit Tests: EventPattern
 * Tests for event pattern constants
 */

import { EVENT_PATTERN, getDefaultEventPattern, normalizeEventPattern } from '../EventPattern';

describe('EventPattern', () => {
  describe('EVENT_PATTERN constants', () => {
    it('should have BASIC pattern', () => {
      expect(EVENT_PATTERN.BASIC).toBe(10);
    });

    it('should have FRAMEWORK_AGNOSTIC pattern', () => {
      expect(EVENT_PATTERN.FRAMEWORK_AGNOSTIC).toBe(20);
    });
  });

  describe('getDefaultEventPattern', () => {
    it('should return FRAMEWORK_AGNOSTIC as default', () => {
      expect(getDefaultEventPattern()).toBe(EVENT_PATTERN.FRAMEWORK_AGNOSTIC);
    });

    it('should always return 20', () => {
      expect(getDefaultEventPattern()).toBe(20);
    });
  });

  describe('normalizeEventPattern', () => {
    it('should return FRAMEWORK_AGNOSTIC for undefined', () => {
      expect(normalizeEventPattern(undefined)).toBe(EVENT_PATTERN.FRAMEWORK_AGNOSTIC);
    });

    it('should return FRAMEWORK_AGNOSTIC for 0', () => {
      expect(normalizeEventPattern(0)).toBe(EVENT_PATTERN.FRAMEWORK_AGNOSTIC);
    });

    it('should return BASIC for 10', () => {
      expect(normalizeEventPattern(10)).toBe(EVENT_PATTERN.BASIC);
    });

    it('should return FRAMEWORK_AGNOSTIC for 20', () => {
      expect(normalizeEventPattern(20)).toBe(EVENT_PATTERN.FRAMEWORK_AGNOSTIC);
    });

    it('should return FRAMEWORK_AGNOSTIC for unknown values', () => {
      expect(normalizeEventPattern(999)).toBe(EVENT_PATTERN.FRAMEWORK_AGNOSTIC);
    });

    it('should handle negative values as default', () => {
      expect(normalizeEventPattern(-1)).toBe(EVENT_PATTERN.FRAMEWORK_AGNOSTIC);
    });

    it('should handle large values as default', () => {
      expect(normalizeEventPattern(1000)).toBe(EVENT_PATTERN.FRAMEWORK_AGNOSTIC);
    });
  });

  describe('type safety', () => {
    it('should enforce EventPattern type', () => {
      const pattern: typeof EVENT_PATTERN.BASIC = 10;
      expect(pattern).toBe(EVENT_PATTERN.BASIC);
    });

    it('should allow union type', () => {
      const patterns: (typeof EVENT_PATTERN)[keyof typeof EVENT_PATTERN][] = [
        EVENT_PATTERN.BASIC,
        EVENT_PATTERN.FRAMEWORK_AGNOSTIC,
      ];
      expect(patterns).toHaveLength(2);
      expect(patterns).toContain(10);
      expect(patterns).toContain(20);
    });
  });
});
