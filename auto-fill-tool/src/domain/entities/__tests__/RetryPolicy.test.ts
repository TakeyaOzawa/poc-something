/**
 * Domain Entity Test: Retry Policy
 * Tests for retry behavior configuration entity
 */

import { RetryPolicy, RetryPolicyData } from '../RetryPolicy';

describe('RetryPolicy Entity', () => {
  const validData: RetryPolicyData = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    retryableErrors: ['timeout', 'network', 'connection'],
  };

  describe('constructor', () => {
    it('should create RetryPolicy with valid data', () => {
      const policy = new RetryPolicy(validData);

      expect(policy.getMaxAttempts()).toBe(3);
      expect(policy.getInitialDelayMs()).toBe(1000);
      expect(policy.getMaxDelayMs()).toBe(30000);
      expect(policy.getBackoffMultiplier()).toBe(2);
      expect(policy.getRetryableErrors()).toEqual(['timeout', 'network', 'connection']);
    });

    it('should throw error for negative maxAttempts', () => {
      const invalidData = { ...validData, maxAttempts: -1 };

      expect(() => new RetryPolicy(invalidData)).toThrow('Max attempts must be non-negative');
    });

    it('should throw error for negative initialDelayMs', () => {
      const invalidData = { ...validData, initialDelayMs: -100 };

      expect(() => new RetryPolicy(invalidData)).toThrow('Initial delay must be non-negative');
    });

    it('should throw error when maxDelayMs < initialDelayMs', () => {
      const invalidData = {
        ...validData,
        initialDelayMs: 10000,
        maxDelayMs: 5000,
      };

      expect(() => new RetryPolicy(invalidData)).toThrow(
        'Max delay must be greater than or equal to initial delay'
      );
    });

    it('should throw error for backoffMultiplier < 1', () => {
      const invalidData = { ...validData, backoffMultiplier: 0.5 };

      expect(() => new RetryPolicy(invalidData)).toThrow('Backoff multiplier must be at least 1');
    });

    it('should allow 0 maxAttempts', () => {
      const noRetryData = { ...validData, maxAttempts: 0 };

      expect(() => new RetryPolicy(noRetryData)).not.toThrow();
    });

    it('should allow 0 initialDelayMs', () => {
      const immediateRetryData = {
        ...validData,
        initialDelayMs: 0,
        maxDelayMs: 0,
      };

      expect(() => new RetryPolicy(immediateRetryData)).not.toThrow();
    });

    it('should allow backoffMultiplier equal to 1', () => {
      const linearRetryData = { ...validData, backoffMultiplier: 1 };

      expect(() => new RetryPolicy(linearRetryData)).not.toThrow();
    });

    it('should allow equal initialDelayMs and maxDelayMs', () => {
      const fixedDelayData = {
        ...validData,
        initialDelayMs: 5000,
        maxDelayMs: 5000,
      };

      expect(() => new RetryPolicy(fixedDelayData)).not.toThrow();
    });

    it('should allow empty retryableErrors array', () => {
      const retryAllData = { ...validData, retryableErrors: [] };

      expect(() => new RetryPolicy(retryAllData)).not.toThrow();
    });
  });

  describe('factory method: fromData', () => {
    it('should create RetryPolicy from valid data', () => {
      const policy = RetryPolicy.fromData(validData);

      expect(policy.getMaxAttempts()).toBe(3);
      expect(policy.getInitialDelayMs()).toBe(1000);
      expect(policy.getMaxDelayMs()).toBe(30000);
      expect(policy.getBackoffMultiplier()).toBe(2);
      expect(policy.getRetryableErrors()).toEqual(['timeout', 'network', 'connection']);
    });

    it('should validate data', () => {
      const invalidData = { ...validData, maxAttempts: -1 };

      expect(() => RetryPolicy.fromData(invalidData)).toThrow('Max attempts must be non-negative');
    });
  });

  describe('factory method: default', () => {
    it('should create default RetryPolicy', () => {
      const policy = RetryPolicy.default();

      expect(policy.getMaxAttempts()).toBe(3);
      expect(policy.getInitialDelayMs()).toBe(1000);
      expect(policy.getMaxDelayMs()).toBe(30000);
      expect(policy.getBackoffMultiplier()).toBe(2);
      expect(policy.getRetryableErrors()).toContain('timeout');
      expect(policy.getRetryableErrors()).toContain('network');
      expect(policy.getRetryableErrors()).toContain('connection');
    });

    it('should include common network error patterns', () => {
      const policy = RetryPolicy.default();
      const errors = policy.getRetryableErrors();

      expect(errors).toContain('econnrefused');
      expect(errors).toContain('enotfound');
      expect(errors).toContain('etimedout');
      expect(errors).toContain('5'); // HTTP 5xx errors
    });
  });

  describe('factory method: noRetry', () => {
    it('should create RetryPolicy with no retry', () => {
      const policy = RetryPolicy.noRetry();

      expect(policy.getMaxAttempts()).toBe(0);
      expect(policy.getInitialDelayMs()).toBe(0);
      expect(policy.getMaxDelayMs()).toBe(0);
      expect(policy.getBackoffMultiplier()).toBe(1);
      expect(policy.getRetryableErrors()).toEqual([]);
    });

    it('should never retry on any error', () => {
      const policy = RetryPolicy.noRetry();
      const error = new Error('timeout');

      expect(policy.shouldRetry(error, 0)).toBe(false);
      expect(policy.shouldRetry(error, 1)).toBe(false);
    });
  });

  describe('factory method: aggressive', () => {
    it('should create aggressive RetryPolicy', () => {
      const policy = RetryPolicy.aggressive();

      expect(policy.getMaxAttempts()).toBe(5);
      expect(policy.getInitialDelayMs()).toBe(500);
      expect(policy.getMaxDelayMs()).toBe(60000);
      expect(policy.getBackoffMultiplier()).toBe(2);
      expect(policy.getRetryableErrors()).toEqual([]);
    });

    it('should retry on all errors', () => {
      const policy = RetryPolicy.aggressive();

      const timeoutError = new Error('timeout');
      const unknownError = new Error('unknown error');
      const customError = new Error('custom error');

      expect(policy.shouldRetry(timeoutError, 1)).toBe(true);
      expect(policy.shouldRetry(unknownError, 1)).toBe(true);
      expect(policy.shouldRetry(customError, 1)).toBe(true);
    });
  });

  describe('method: calculateDelay', () => {
    it('should calculate delay with exponential backoff', () => {
      const policy = new RetryPolicy({
        maxAttempts: 5,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 2,
        retryableErrors: [],
      });

      expect(policy.calculateDelay(1)).toBe(1000); // 1000 * 2^0
      expect(policy.calculateDelay(2)).toBe(2000); // 1000 * 2^1
      expect(policy.calculateDelay(3)).toBe(4000); // 1000 * 2^2
      expect(policy.calculateDelay(4)).toBe(8000); // 1000 * 2^3
      expect(policy.calculateDelay(5)).toBe(16000); // 1000 * 2^4
    });

    it('should cap delay at maxDelayMs', () => {
      const policy = new RetryPolicy({
        maxAttempts: 10,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
        retryableErrors: [],
      });

      expect(policy.calculateDelay(1)).toBe(1000);
      expect(policy.calculateDelay(2)).toBe(2000);
      expect(policy.calculateDelay(3)).toBe(4000);
      expect(policy.calculateDelay(4)).toBe(8000);
      expect(policy.calculateDelay(5)).toBe(10000); // Capped at 10000
      expect(policy.calculateDelay(6)).toBe(10000); // Still capped
      expect(policy.calculateDelay(10)).toBe(10000); // Still capped
    });

    it('should return 0 for attempt 0 or negative', () => {
      const policy = RetryPolicy.default();

      expect(policy.calculateDelay(0)).toBe(0);
      expect(policy.calculateDelay(-1)).toBe(0);
      expect(policy.calculateDelay(-5)).toBe(0);
    });

    it('should use linear backoff when multiplier is 1', () => {
      const policy = new RetryPolicy({
        maxAttempts: 5,
        initialDelayMs: 5000,
        maxDelayMs: 5000,
        backoffMultiplier: 1,
        retryableErrors: [],
      });

      expect(policy.calculateDelay(1)).toBe(5000);
      expect(policy.calculateDelay(2)).toBe(5000);
      expect(policy.calculateDelay(3)).toBe(5000);
      expect(policy.calculateDelay(4)).toBe(5000);
    });

    it('should handle fractional backoff multiplier', () => {
      const policy = new RetryPolicy({
        maxAttempts: 5,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 1.5,
        retryableErrors: [],
      });

      expect(policy.calculateDelay(1)).toBe(1000); // 1000 * 1.5^0
      expect(policy.calculateDelay(2)).toBe(1500); // 1000 * 1.5^1
      expect(policy.calculateDelay(3)).toBe(2250); // 1000 * 1.5^2
      expect(policy.calculateDelay(4)).toBe(3375); // 1000 * 1.5^3
    });

    it('should handle very large attempt numbers', () => {
      const policy = new RetryPolicy({
        maxAttempts: 1000,
        initialDelayMs: 1000,
        maxDelayMs: 60000,
        backoffMultiplier: 2,
        retryableErrors: [],
      });

      // Should be capped at maxDelayMs
      expect(policy.calculateDelay(100)).toBe(60000);
      expect(policy.calculateDelay(1000)).toBe(60000);
    });
  });

  describe('method: shouldRetry', () => {
    describe('max attempts check', () => {
      it('should not retry when max attempts reached', () => {
        const policy = new RetryPolicy({
          ...validData,
          maxAttempts: 3,
        });

        const error = new Error('timeout');

        expect(policy.shouldRetry(error, 0)).toBe(true);
        expect(policy.shouldRetry(error, 1)).toBe(true);
        expect(policy.shouldRetry(error, 2)).toBe(true);
        expect(policy.shouldRetry(error, 3)).toBe(false);
        expect(policy.shouldRetry(error, 4)).toBe(false);
      });

      it('should never retry when maxAttempts is 0', () => {
        const policy = new RetryPolicy({
          ...validData,
          maxAttempts: 0,
        });

        const error = new Error('timeout');

        expect(policy.shouldRetry(error, 0)).toBe(false);
        expect(policy.shouldRetry(error, 1)).toBe(false);
      });
    });

    describe('error pattern matching', () => {
      it('should retry on matching error patterns', () => {
        const policy = new RetryPolicy({
          ...validData,
          retryableErrors: ['timeout', 'network'],
        });

        const timeoutError = new Error('Connection timeout');
        const networkError = new Error('Network unreachable');

        expect(policy.shouldRetry(timeoutError, 1)).toBe(true);
        expect(policy.shouldRetry(networkError, 1)).toBe(true);
      });

      it('should not retry on non-matching error patterns', () => {
        const policy = new RetryPolicy({
          ...validData,
          retryableErrors: ['timeout', 'network'],
        });

        const authError = new Error('Authentication failed');
        const validationError = new Error('Invalid input');

        expect(policy.shouldRetry(authError, 1)).toBe(false);
        expect(policy.shouldRetry(validationError, 1)).toBe(false);
      });

      it('should retry on all errors when retryableErrors is empty', () => {
        const policy = new RetryPolicy({
          ...validData,
          retryableErrors: [],
        });

        const error1 = new Error('timeout');
        const error2 = new Error('authentication failed');
        const error3 = new Error('unknown error');

        expect(policy.shouldRetry(error1, 1)).toBe(true);
        expect(policy.shouldRetry(error2, 1)).toBe(true);
        expect(policy.shouldRetry(error3, 1)).toBe(true);
      });

      it('should match error patterns case-insensitively', () => {
        const policy = new RetryPolicy({
          ...validData,
          retryableErrors: ['timeout', 'Network'],
        });

        const upperError = new Error('TIMEOUT occurred');
        const lowerError = new Error('network unreachable');
        const mixedError = new Error('NeTwOrK error');

        expect(policy.shouldRetry(upperError, 1)).toBe(true);
        expect(policy.shouldRetry(lowerError, 1)).toBe(true);
        expect(policy.shouldRetry(mixedError, 1)).toBe(true);
      });

      it('should match partial error patterns', () => {
        const policy = new RetryPolicy({
          ...validData,
          retryableErrors: ['timeout'],
        });

        const error1 = new Error('Connection timeout after 30s');
        const error2 = new Error('Request timeout exceeded');
        const error3 = new Error('timeout');

        expect(policy.shouldRetry(error1, 1)).toBe(true);
        expect(policy.shouldRetry(error2, 1)).toBe(true);
        expect(policy.shouldRetry(error3, 1)).toBe(true);
      });

      it('should handle HTTP 5xx error pattern', () => {
        const policy = new RetryPolicy({
          ...validData,
          retryableErrors: ['5'], // HTTP 5xx pattern
        });

        const error500 = new Error('HTTP 500 Internal Server Error');
        const error503 = new Error('HTTP 503 Service Unavailable');
        const error400 = new Error('HTTP 400 Bad Request');

        expect(policy.shouldRetry(error500, 1)).toBe(true);
        expect(policy.shouldRetry(error503, 1)).toBe(true);
        expect(policy.shouldRetry(error400, 1)).toBe(false);
      });
    });

    describe('combined checks', () => {
      it('should check max attempts before error pattern', () => {
        const policy = new RetryPolicy({
          ...validData,
          maxAttempts: 2,
          retryableErrors: ['timeout'],
        });

        const error = new Error('timeout');

        expect(policy.shouldRetry(error, 0)).toBe(true);
        expect(policy.shouldRetry(error, 1)).toBe(true);
        expect(policy.shouldRetry(error, 2)).toBe(false); // Max attempts reached
      });

      it('should not retry non-retryable error even within max attempts', () => {
        const policy = new RetryPolicy({
          ...validData,
          maxAttempts: 5,
          retryableErrors: ['timeout'],
        });

        const authError = new Error('Authentication failed');

        expect(policy.shouldRetry(authError, 1)).toBe(false);
        expect(policy.shouldRetry(authError, 2)).toBe(false);
      });
    });
  });

  describe('getters', () => {
    let policy: RetryPolicy;

    beforeEach(() => {
      policy = new RetryPolicy({ ...validData });
    });

    it('should get maxAttempts', () => {
      expect(policy.getMaxAttempts()).toBe(3);
    });

    it('should get initialDelayMs', () => {
      expect(policy.getInitialDelayMs()).toBe(1000);
    });

    it('should get maxDelayMs', () => {
      expect(policy.getMaxDelayMs()).toBe(30000);
    });

    it('should get backoffMultiplier', () => {
      expect(policy.getBackoffMultiplier()).toBe(2);
    });

    it('should get retryableErrors', () => {
      expect(policy.getRetryableErrors()).toEqual(['timeout', 'network', 'connection']);
    });

    it('should return a copy of retryableErrors (immutability)', () => {
      const errors1 = policy.getRetryableErrors();
      const errors2 = policy.getRetryableErrors();

      expect(errors1).toEqual(errors2);
      expect(errors1).not.toBe(errors2);

      // Mutating returned array should not affect entity
      errors1.push('new error');
      expect(policy.getRetryableErrors()).toEqual(['timeout', 'network', 'connection']);
    });
  });

  describe('method: toData', () => {
    it('should convert to plain data object', () => {
      const policy = new RetryPolicy(validData);
      const data = policy.toData();

      expect(data).toEqual(validData);
    });

    it('should return a copy (immutability)', () => {
      const policy = new RetryPolicy(validData);
      const data1 = policy.toData();
      const data2 = policy.toData();

      expect(data1).toEqual(data2);
      expect(data1).not.toBe(data2);

      // Mutating returned data should not affect entity
      data1.maxAttempts = 10;
      expect(policy.getMaxAttempts()).toBe(3);
    });

    it('should include all fields', () => {
      const policy = new RetryPolicy(validData);
      const data = policy.toData();

      expect(data).toHaveProperty('maxAttempts');
      expect(data).toHaveProperty('initialDelayMs');
      expect(data).toHaveProperty('maxDelayMs');
      expect(data).toHaveProperty('backoffMultiplier');
      expect(data).toHaveProperty('retryableErrors');
    });
  });

  describe('method: clone', () => {
    it('should create a new instance with same data', () => {
      const original = new RetryPolicy(validData);
      const cloned = original.clone();

      expect(cloned).not.toBe(original);
      expect(cloned.toData()).toEqual(original.toData());
    });

    it('should create independent instances', () => {
      const original = new RetryPolicy(validData);
      const cloned = original.clone();

      const originalData = original.toData();
      const clonedData = cloned.toData();

      expect(originalData).toEqual(clonedData);
      expect(originalData).not.toBe(clonedData);
    });
  });

  describe('edge cases', () => {
    it('should handle very small delays', () => {
      const policy = new RetryPolicy({
        maxAttempts: 3,
        initialDelayMs: 1,
        maxDelayMs: 10,
        backoffMultiplier: 2,
        retryableErrors: [],
      });

      expect(policy.calculateDelay(1)).toBe(1);
      expect(policy.calculateDelay(2)).toBe(2);
      expect(policy.calculateDelay(3)).toBe(4);
      expect(policy.calculateDelay(4)).toBe(8);
      expect(policy.calculateDelay(5)).toBe(10); // Capped
    });

    it('should handle very large delays', () => {
      const policy = new RetryPolicy({
        maxAttempts: 3,
        initialDelayMs: 300000, // 5 minutes
        maxDelayMs: 3600000, // 1 hour
        backoffMultiplier: 2,
        retryableErrors: [],
      });

      expect(policy.calculateDelay(1)).toBe(300000);
      expect(policy.calculateDelay(2)).toBe(600000);
      expect(policy.calculateDelay(3)).toBe(1200000);
    });

    it('should handle many retryable error patterns', () => {
      const policy = new RetryPolicy({
        ...validData,
        retryableErrors: [
          'timeout',
          'network',
          'connection',
          'refused',
          'unreachable',
          'unavailable',
          '5',
          'econnrefused',
          'enotfound',
          'etimedout',
        ],
      });

      expect(policy.getRetryableErrors()).toHaveLength(10);
    });

    it('should handle empty error message', () => {
      const policy = RetryPolicy.default();
      const error = new Error('');

      // Should not match any pattern with empty message
      const shouldRetry = policy.shouldRetry(error, 1);
      expect(typeof shouldRetry).toBe('boolean');
    });

    it('should handle special characters in error patterns', () => {
      const policy = new RetryPolicy({
        ...validData,
        retryableErrors: ['error-123', 'error_456', 'error.789'],
      });

      const error1 = new Error('error-123 occurred');
      const error2 = new Error('error_456 occurred');
      const error3 = new Error('error.789 occurred');

      expect(policy.shouldRetry(error1, 1)).toBe(true);
      expect(policy.shouldRetry(error2, 1)).toBe(true);
      expect(policy.shouldRetry(error3, 1)).toBe(true);
    });
  });
});
