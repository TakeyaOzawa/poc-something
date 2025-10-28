/**
 * Unit Tests: RetryPolicyService
 */

import { RetryPolicyService } from '../RetryPolicyService';
import { RETRY_TYPE } from '@domain/constants/RetryType';

describe('RetryPolicyService', () => {
  let service: RetryPolicyService;

  beforeEach(() => {
    service = new RetryPolicyService();
  });

  describe('shouldRetry', () => {
    it('should return true for RETRY_FROM_BEGINNING (10)', () => {
      expect(service.shouldRetry(RETRY_TYPE.RETRY_FROM_BEGINNING)).toBe(true);
    });

    it('should return false for NO_RETRY (0)', () => {
      expect(service.shouldRetry(RETRY_TYPE.NO_RETRY)).toBe(false);
    });

    it('should return false for unknown retry type', () => {
      expect(service.shouldRetry(99)).toBe(false);
    });

    it('should return false for negative retry type', () => {
      expect(service.shouldRetry(-1)).toBe(false);
    });
  });

  describe('calculateWaitTime', () => {
    it('should return min when min equals max', () => {
      expect(service.calculateWaitTime(5, 5)).toBe(5);
      expect(service.calculateWaitTime(10, 10)).toBe(10);
      expect(service.calculateWaitTime(0, 0)).toBe(0);
    });

    it('should return value between min and max when different', () => {
      const min = 5;
      const max = 10;

      // Test multiple times to ensure randomization
      for (let i = 0; i < 100; i++) {
        const waitTime = service.calculateWaitTime(min, max);
        expect(waitTime).toBeGreaterThanOrEqual(min);
        expect(waitTime).toBeLessThanOrEqual(max);
      }
    });

    it('should handle min=0 and max>0', () => {
      const waitTime = service.calculateWaitTime(0, 10);
      expect(waitTime).toBeGreaterThanOrEqual(0);
      expect(waitTime).toBeLessThanOrEqual(10);
    });

    it('should produce different values with randomization', () => {
      const results = new Set<number>();
      for (let i = 0; i < 50; i++) {
        results.add(service.calculateWaitTime(1, 100));
      }
      // With 50 samples from 1-100, we should get multiple different values
      expect(results.size).toBeGreaterThan(10);
    });

    it('should handle large wait times', () => {
      const waitTime = service.calculateWaitTime(100, 200);
      expect(waitTime).toBeGreaterThanOrEqual(100);
      expect(waitTime).toBeLessThanOrEqual(200);
    });

    it('should handle fractional wait times', () => {
      const waitTime = service.calculateWaitTime(0.5, 1.5);
      expect(waitTime).toBeGreaterThanOrEqual(0.5);
      expect(waitTime).toBeLessThanOrEqual(1.5);
    });
  });

  describe('isInfiniteRetry', () => {
    it('should return true for -1 (infinite)', () => {
      expect(service.isInfiniteRetry(-1)).toBe(true);
    });

    it('should return false for 0 (no retry)', () => {
      expect(service.isInfiniteRetry(0)).toBe(false);
    });

    it('should return false for positive numbers', () => {
      expect(service.isInfiniteRetry(1)).toBe(false);
      expect(service.isInfiniteRetry(5)).toBe(false);
      expect(service.isInfiniteRetry(100)).toBe(false);
    });

    it('should return false for other negative numbers', () => {
      expect(service.isInfiniteRetry(-2)).toBe(false);
      expect(service.isInfiniteRetry(-10)).toBe(false);
    });
  });

  describe('canRetry', () => {
    it('should always return true for infinite retry', () => {
      expect(service.canRetry(0, -1)).toBe(true);
      expect(service.canRetry(100, -1)).toBe(true);
      expect(service.canRetry(999999, -1)).toBe(true);
    });

    it('should return true when retry count is within limit', () => {
      expect(service.canRetry(0, 5)).toBe(true);
      expect(service.canRetry(3, 5)).toBe(true);
      expect(service.canRetry(5, 5)).toBe(true);
    });

    it('should return false when retry count exceeds limit', () => {
      expect(service.canRetry(6, 5)).toBe(false);
      expect(service.canRetry(10, 5)).toBe(false);
    });

    it('should handle zero max retries', () => {
      expect(service.canRetry(0, 0)).toBe(true);
      expect(service.canRetry(1, 0)).toBe(false);
    });
  });

  describe('formatRetryInfo', () => {
    it('should format infinite retry info', () => {
      expect(service.formatRetryInfo(1, -1)).toBe('Retry attempt 1 (infinite mode)');
      expect(service.formatRetryInfo(10, -1)).toBe('Retry attempt 10 (infinite mode)');
    });

    it('should format limited retry info', () => {
      expect(service.formatRetryInfo(1, 5)).toBe('Retry attempt 1/5');
      expect(service.formatRetryInfo(3, 5)).toBe('Retry attempt 3/5');
    });

    it('should handle zero retries', () => {
      expect(service.formatRetryInfo(0, 0)).toBe('Retry attempt 0/0');
    });

    it('should handle large retry counts', () => {
      expect(service.formatRetryInfo(100, 1000)).toBe('Retry attempt 100/1000');
    });
  });

  describe('roundWaitTime', () => {
    it('should round to 1 decimal place', () => {
      expect(service.roundWaitTime(5.123)).toBe(5.1);
      expect(service.roundWaitTime(5.167)).toBe(5.2);
      expect(service.roundWaitTime(10.999)).toBe(11.0);
    });

    it('should handle integers', () => {
      expect(service.roundWaitTime(5)).toBe(5.0);
      expect(service.roundWaitTime(10)).toBe(10.0);
    });

    it('should handle zero', () => {
      expect(service.roundWaitTime(0)).toBe(0.0);
      expect(service.roundWaitTime(0.04)).toBe(0.0);
      expect(service.roundWaitTime(0.05)).toBe(0.1);
    });

    it('should handle negative numbers (edge case)', () => {
      expect(service.roundWaitTime(-5.123)).toBe(-5.1);
      expect(service.roundWaitTime(-5.167)).toBe(-5.2);
    });

    it('should handle very small numbers', () => {
      expect(service.roundWaitTime(0.001)).toBe(0.0);
      expect(service.roundWaitTime(0.09)).toBe(0.1);
    });

    it('should handle large numbers', () => {
      expect(service.roundWaitTime(123.456)).toBe(123.5);
      expect(service.roundWaitTime(999.999)).toBe(1000.0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle typical retry scenario', () => {
      const retryType = RETRY_TYPE.RETRY_FROM_BEGINNING;
      const maxRetries = 5;
      const minWait = 30;
      const maxWait = 60;

      // Should retry
      expect(service.shouldRetry(retryType)).toBe(true);

      // Not infinite
      expect(service.isInfiniteRetry(maxRetries)).toBe(false);

      // Can retry up to 5 times
      expect(service.canRetry(0, maxRetries)).toBe(true);
      expect(service.canRetry(5, maxRetries)).toBe(true);
      expect(service.canRetry(6, maxRetries)).toBe(false);

      // Wait time calculation
      const waitTime = service.calculateWaitTime(minWait, maxWait);
      expect(waitTime).toBeGreaterThanOrEqual(minWait);
      expect(waitTime).toBeLessThanOrEqual(maxWait);

      // Format info
      expect(service.formatRetryInfo(1, maxRetries)).toBe('Retry attempt 1/5');
    });

    it('should handle infinite retry scenario', () => {
      const retryType = RETRY_TYPE.RETRY_FROM_BEGINNING;
      const maxRetries = -1;

      // Should retry infinitely
      expect(service.shouldRetry(retryType)).toBe(true);
      expect(service.isInfiniteRetry(maxRetries)).toBe(true);
      expect(service.canRetry(9999, maxRetries)).toBe(true);

      // Format info shows infinite mode
      expect(service.formatRetryInfo(100, maxRetries)).toBe('Retry attempt 100 (infinite mode)');
    });

    it('should handle no retry scenario', () => {
      const retryType = RETRY_TYPE.NO_RETRY;

      // Should not retry
      expect(service.shouldRetry(retryType)).toBe(false);
    });
  });
});
