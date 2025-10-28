/**
 * Unit Tests: SessionConfig
 */

import { SESSION_CONFIG, minutesToMs, msToMinutes } from '../SessionConfig';

describe('SessionConfig', () => {
  describe('SESSION_CONFIG', () => {
    it('should have correct duration in minutes', () => {
      expect(SESSION_CONFIG.DURATION_MINUTES).toBe(15);
    });

    it('should have correct duration in milliseconds', () => {
      expect(SESSION_CONFIG.DURATION_MS).toBe(15 * 60 * 1000);
      expect(SESSION_CONFIG.DURATION_MS).toBe(900000);
    });

    it('should be a frozen object', () => {
      expect(Object.isFrozen(SESSION_CONFIG)).toBe(true);
    });

    it('should have consistent minute and millisecond values', () => {
      const expectedMs = SESSION_CONFIG.DURATION_MINUTES * 60 * 1000;
      expect(SESSION_CONFIG.DURATION_MS).toBe(expectedMs);
    });
  });

  describe('minutesToMs', () => {
    it('should convert minutes to milliseconds', () => {
      expect(minutesToMs(15)).toBe(900000);
      expect(minutesToMs(1)).toBe(60000);
      expect(minutesToMs(0)).toBe(0);
    });

    it('should handle fractional minutes', () => {
      expect(minutesToMs(0.5)).toBe(30000);
      expect(minutesToMs(1.5)).toBe(90000);
    });

    it('should handle large values', () => {
      expect(minutesToMs(60)).toBe(3600000); // 1 hour
      expect(minutesToMs(1440)).toBe(86400000); // 24 hours
    });

    it('should handle negative values (edge case)', () => {
      expect(minutesToMs(-15)).toBe(-900000);
    });
  });

  describe('msToMinutes', () => {
    it('should convert milliseconds to minutes', () => {
      expect(msToMinutes(900000)).toBe(15);
      expect(msToMinutes(60000)).toBe(1);
      expect(msToMinutes(0)).toBe(0);
    });

    it('should handle fractional results', () => {
      expect(msToMinutes(30000)).toBe(0.5);
      expect(msToMinutes(90000)).toBe(1.5);
    });

    it('should handle large values', () => {
      expect(msToMinutes(3600000)).toBe(60); // 1 hour
      expect(msToMinutes(86400000)).toBe(1440); // 24 hours
    });

    it('should handle negative values (edge case)', () => {
      expect(msToMinutes(-900000)).toBe(-15);
    });
  });

  describe('conversion consistency', () => {
    it('should have reversible conversions', () => {
      const minutes = 15;
      const ms = minutesToMs(minutes);
      expect(msToMinutes(ms)).toBe(minutes);
    });

    it('should work with SESSION_CONFIG values', () => {
      const ms = minutesToMs(SESSION_CONFIG.DURATION_MINUTES);
      expect(ms).toBe(SESSION_CONFIG.DURATION_MS);

      const minutes = msToMinutes(SESSION_CONFIG.DURATION_MS);
      expect(minutes).toBe(SESSION_CONFIG.DURATION_MINUTES);
    });

    it('should handle multiple round-trip conversions', () => {
      let value = 10;
      value = minutesToMs(value);
      value = msToMinutes(value);
      value = minutesToMs(value);
      value = msToMinutes(value);
      expect(value).toBe(10);
    });
  });

  describe('business rule validation', () => {
    it('should enforce 15 minute session timeout', () => {
      // Business rule: 15 minutes is security/convenience balance
      expect(SESSION_CONFIG.DURATION_MINUTES).toBe(15);
    });

    it('should provide millisecond value for JavaScript timers', () => {
      // Verify millisecond value is suitable for setTimeout/setInterval
      expect(SESSION_CONFIG.DURATION_MS).toBeGreaterThan(0);
      expect(Number.isFinite(SESSION_CONFIG.DURATION_MS)).toBe(true);
    });

    it('should have reasonable timeout duration', () => {
      // Security consideration: Not too short (< 5 min) or too long (> 30 min)
      expect(SESSION_CONFIG.DURATION_MINUTES).toBeGreaterThanOrEqual(5);
      expect(SESSION_CONFIG.DURATION_MINUTES).toBeLessThanOrEqual(30);
    });
  });
});
