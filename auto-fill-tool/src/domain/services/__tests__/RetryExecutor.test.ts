/**
 * Domain Service Test: Retry Executor
 * Tests for retry execution logic with configurable retry policies
 */

import { RetryExecutor, RetryResult } from '../RetryExecutor';
import { RetryPolicy } from '@domain/entities/RetryPolicy';
import { Logger, LogLevel } from '@domain/types/logger.types';

describe('RetryExecutor Service', () => {
  let retryExecutor: RetryExecutor;
  let mockLogger: jest.Mocked<Logger>;
  let mockRetryPolicy: jest.Mocked<RetryPolicy>;

  beforeEach(() => {
    // Mock Logger
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setLevel: jest.fn(),
      getLevel: jest.fn().mockReturnValue(LogLevel.DEBUG),
      createChild: jest.fn(),
    } as jest.Mocked<Logger>;

    // Create RetryExecutor with mocked logger
    retryExecutor = new RetryExecutor(mockLogger);

    // Mock RetryPolicy
    mockRetryPolicy = {
      shouldRetry: jest.fn(),
      calculateDelay: jest.fn(),
      getMaxAttempts: jest.fn().mockReturnValue(3),
      getInitialDelayMs: jest.fn().mockReturnValue(1000),
      getMaxDelayMs: jest.fn().mockReturnValue(30000),
      getBackoffMultiplier: jest.fn().mockReturnValue(2),
      getRetryableErrors: jest.fn().mockReturnValue([]),
      toData: jest.fn(),
      clone: jest.fn(),
    } as unknown as jest.Mocked<RetryPolicy>;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('method: execute', () => {
    describe('successful operations', () => {
      it('should succeed on first attempt', async () => {
        const operation = jest.fn().mockResolvedValue('success');

        const result = await retryExecutor.execute(operation, mockRetryPolicy, 'testOp');

        expect(result).toEqual({
          success: true,
          result: 'success',
          attemptsMade: 1,
          totalDelayMs: 0,
        });
        expect(operation).toHaveBeenCalledTimes(1);
        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Executing testOp (attempt 1)',
          expect.any(Object)
        );
        expect(mockLogger.debug).toHaveBeenCalledWith('testOp succeeded', expect.any(Object));
      });

      it('should succeed after one retry', async () => {
        const operation = jest
          .fn()
          .mockRejectedValueOnce(new Error('timeout'))
          .mockResolvedValueOnce('success');

        mockRetryPolicy.shouldRetry.mockReturnValueOnce(true);
        mockRetryPolicy.calculateDelay.mockReturnValueOnce(0); // No delay for faster test

        const result = await retryExecutor.execute(operation, mockRetryPolicy, 'testOp');

        expect(result).toEqual({
          success: true,
          result: 'success',
          attemptsMade: 2,
          totalDelayMs: 0,
        });
        expect(operation).toHaveBeenCalledTimes(2);
        expect(mockRetryPolicy.shouldRetry).toHaveBeenCalledTimes(1);
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'testOp failed (attempt 1)',
          expect.any(Object)
        );
      });

      it('should succeed after multiple retries', async () => {
        const operation = jest
          .fn()
          .mockRejectedValueOnce(new Error('error 1'))
          .mockRejectedValueOnce(new Error('error 2'))
          .mockRejectedValueOnce(new Error('error 3'))
          .mockResolvedValueOnce('success');

        mockRetryPolicy.shouldRetry.mockReturnValue(true);
        mockRetryPolicy.calculateDelay.mockReturnValue(0);

        const result = await retryExecutor.execute(operation, mockRetryPolicy, 'testOp');

        expect(result).toEqual({
          success: true,
          result: 'success',
          attemptsMade: 4,
          totalDelayMs: 0,
        });
        expect(operation).toHaveBeenCalledTimes(4);
        expect(mockRetryPolicy.shouldRetry).toHaveBeenCalledTimes(3);
      });

      it('should return complex result types', async () => {
        const complexResult = { id: 123, name: 'test', nested: { value: true } };
        const operation = jest.fn().mockResolvedValue(complexResult);

        const result = await retryExecutor.execute(operation, mockRetryPolicy);

        expect(result.success).toBe(true);
        expect(result.result).toEqual(complexResult);
      });
    });

    describe('failed operations', () => {
      it('should fail when max attempts reached', async () => {
        const error = new Error('persistent error');
        const operation = jest.fn().mockRejectedValue(error);

        mockRetryPolicy.shouldRetry
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(false);
        mockRetryPolicy.calculateDelay.mockReturnValue(0);

        const result = await retryExecutor.execute(operation, mockRetryPolicy, 'testOp');

        expect(result).toEqual({
          success: false,
          error,
          attemptsMade: 3,
          totalDelayMs: 0,
        });
        expect(operation).toHaveBeenCalledTimes(3);
        expect(mockLogger.error).toHaveBeenCalledWith(
          'testOp exhausted all retries or error not retryable',
          expect.any(Object)
        );
      });

      it('should fail immediately on non-retryable error', async () => {
        const error = new Error('authentication failed');
        const operation = jest.fn().mockRejectedValue(error);

        mockRetryPolicy.shouldRetry.mockReturnValue(false);

        const result = await retryExecutor.execute(operation, mockRetryPolicy, 'testOp');

        expect(result).toEqual({
          success: false,
          error,
          attemptsMade: 1,
          totalDelayMs: 0,
        });
        expect(operation).toHaveBeenCalledTimes(1);
        expect(mockRetryPolicy.shouldRetry).toHaveBeenCalledWith(error, 1);
      });

      it('should convert non-Error throws to Error', async () => {
        const operation = jest.fn().mockRejectedValue('string error');

        mockRetryPolicy.shouldRetry.mockReturnValue(false);

        const result = await retryExecutor.execute(operation, mockRetryPolicy);

        expect(result.success).toBe(false);
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error?.message).toBe('string error');
      });

      it('should handle thrown objects as errors', async () => {
        const operation = jest.fn().mockRejectedValue({ code: 500, message: 'Server error' });

        mockRetryPolicy.shouldRetry.mockReturnValue(false);

        const result = await retryExecutor.execute(operation, mockRetryPolicy);

        expect(result.success).toBe(false);
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error?.message).toBe('[object Object]');
      });
    });

    describe('retry delays', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should apply delay between retries', async () => {
        const operation = jest
          .fn()
          .mockRejectedValueOnce(new Error('error'))
          .mockResolvedValueOnce('success');

        mockRetryPolicy.shouldRetry.mockReturnValue(true);
        mockRetryPolicy.calculateDelay.mockReturnValueOnce(1000);

        const resultPromise = retryExecutor.execute(operation, mockRetryPolicy, 'testOp');

        // Fast-forward time
        await jest.advanceTimersByTimeAsync(1000);

        const result = await resultPromise;

        expect(result).toEqual({
          success: true,
          result: 'success',
          attemptsMade: 2,
          totalDelayMs: 1000,
        });
        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Waiting 1000ms before retry',
          expect.any(Object)
        );
      });

      it('should accumulate total delay correctly', async () => {
        const operation = jest
          .fn()
          .mockRejectedValueOnce(new Error('error 1'))
          .mockRejectedValueOnce(new Error('error 2'))
          .mockResolvedValueOnce('success');

        mockRetryPolicy.shouldRetry.mockReturnValue(true);
        mockRetryPolicy.calculateDelay.mockReturnValueOnce(1000).mockReturnValueOnce(2000);

        const resultPromise = retryExecutor.execute(operation, mockRetryPolicy);

        await jest.advanceTimersByTimeAsync(1000);
        await jest.advanceTimersByTimeAsync(2000);

        const result = await resultPromise;

        expect(result.totalDelayMs).toBe(3000);
      });

      it('should skip delay when calculateDelay returns 0', async () => {
        const operation = jest
          .fn()
          .mockRejectedValueOnce(new Error('error'))
          .mockResolvedValueOnce('success');

        mockRetryPolicy.shouldRetry.mockReturnValue(true);
        mockRetryPolicy.calculateDelay.mockReturnValue(0);

        const result = await retryExecutor.execute(operation, mockRetryPolicy);

        expect(result.totalDelayMs).toBe(0);
        expect(mockLogger.debug).not.toHaveBeenCalledWith(
          expect.stringContaining('Waiting'),
          expect.any(Object)
        );
      });

      it('should handle different delays for each retry', async () => {
        const operation = jest
          .fn()
          .mockRejectedValueOnce(new Error('error 1'))
          .mockRejectedValueOnce(new Error('error 2'))
          .mockRejectedValueOnce(new Error('error 3'))
          .mockResolvedValueOnce('success');

        mockRetryPolicy.shouldRetry.mockReturnValue(true);
        mockRetryPolicy.calculateDelay
          .mockReturnValueOnce(1000)
          .mockReturnValueOnce(2000)
          .mockReturnValueOnce(4000);

        const resultPromise = retryExecutor.execute(operation, mockRetryPolicy);

        await jest.advanceTimersByTimeAsync(1000);
        await jest.advanceTimersByTimeAsync(2000);
        await jest.advanceTimersByTimeAsync(4000);

        const result = await resultPromise;

        expect(result.totalDelayMs).toBe(7000);
      });
    });

    describe('logging behavior', () => {
      it('should log attempt information', async () => {
        const operation = jest.fn().mockResolvedValue('success');

        await retryExecutor.execute(operation, mockRetryPolicy, 'myOperation');

        expect(mockLogger.debug).toHaveBeenCalledWith('Executing myOperation (attempt 1)', {
          attemptNumber: 1,
          maxAttempts: 3,
        });
      });

      it('should log success with attempt details', async () => {
        const operation = jest.fn().mockResolvedValue('success');

        await retryExecutor.execute(operation, mockRetryPolicy, 'myOperation');

        expect(mockLogger.debug).toHaveBeenCalledWith('myOperation succeeded', {
          attemptNumber: 1,
          totalDelayMs: 0,
        });
      });

      it('should log warning on failure', async () => {
        const error = new Error('test error');
        const operation = jest.fn().mockRejectedValue(error);

        mockRetryPolicy.shouldRetry.mockReturnValue(false);

        await retryExecutor.execute(operation, mockRetryPolicy, 'myOperation');

        expect(mockLogger.warn).toHaveBeenCalledWith('myOperation failed (attempt 1)', {
          attemptNumber: 1,
          error: 'test error',
        });
      });

      it('should log error when retries exhausted', async () => {
        const error = new Error('persistent error');
        const operation = jest.fn().mockRejectedValue(error);

        mockRetryPolicy.shouldRetry.mockReturnValue(false);

        await retryExecutor.execute(operation, mockRetryPolicy, 'myOperation');

        expect(mockLogger.error).toHaveBeenCalledWith(
          'myOperation exhausted all retries or error not retryable',
          {
            attemptNumber: 1,
            maxAttempts: 3,
            error: 'persistent error',
          }
        );
      });

      it('should use default operation name when not provided', async () => {
        const operation = jest.fn().mockResolvedValue('success');

        await retryExecutor.execute(operation, mockRetryPolicy);

        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Executing operation (attempt 1)',
          expect.any(Object)
        );
      });
    });

    describe('retry policy integration', () => {
      it('should call shouldRetry with correct error and attempt', async () => {
        const error = new Error('timeout');
        const operation = jest.fn().mockRejectedValue(error);

        mockRetryPolicy.shouldRetry.mockReturnValue(false);

        await retryExecutor.execute(operation, mockRetryPolicy);

        expect(mockRetryPolicy.shouldRetry).toHaveBeenCalledWith(error, 1);
      });

      it('should call calculateDelay with correct attempt number', async () => {
        const operation = jest
          .fn()
          .mockRejectedValueOnce(new Error('error'))
          .mockResolvedValueOnce('success');

        mockRetryPolicy.shouldRetry.mockReturnValue(true);
        mockRetryPolicy.calculateDelay.mockReturnValue(0);

        await retryExecutor.execute(operation, mockRetryPolicy);

        expect(mockRetryPolicy.calculateDelay).toHaveBeenCalledWith(1);
      });

      it('should respect retry policy max attempts', async () => {
        const operation = jest.fn().mockRejectedValue(new Error('error'));

        mockRetryPolicy.shouldRetry
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(false);
        mockRetryPolicy.calculateDelay.mockReturnValue(0);

        const result = await retryExecutor.execute(operation, mockRetryPolicy);

        expect(result.attemptsMade).toBe(3);
        expect(mockRetryPolicy.shouldRetry).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('method: executeWithAttempt', () => {
    describe('successful operations', () => {
      it('should pass attempt number to operation', async () => {
        const operation = jest.fn().mockResolvedValue('success');

        await retryExecutor.executeWithAttempt(operation, mockRetryPolicy, 'testOp');

        expect(operation).toHaveBeenCalledWith(1);
      });

      it('should succeed on first attempt', async () => {
        const operation = jest.fn().mockResolvedValue('success');

        const result = await retryExecutor.executeWithAttempt(operation, mockRetryPolicy);

        expect(result).toEqual({
          success: true,
          result: 'success',
          attemptsMade: 1,
          totalDelayMs: 0,
        });
      });

      it('should pass correct attempt number on retries', async () => {
        const operation = jest
          .fn()
          .mockRejectedValueOnce(new Error('error'))
          .mockRejectedValueOnce(new Error('error'))
          .mockResolvedValueOnce('success');

        mockRetryPolicy.shouldRetry.mockReturnValue(true);
        mockRetryPolicy.calculateDelay.mockReturnValue(0);

        await retryExecutor.executeWithAttempt(operation, mockRetryPolicy);

        expect(operation).toHaveBeenCalledWith(1);
        expect(operation).toHaveBeenCalledWith(2);
        expect(operation).toHaveBeenCalledWith(3);
      });

      it('should allow operation to use attempt number in logic', async () => {
        const operation = jest.fn((attempt) => {
          if (attempt < 3) {
            throw new Error('Not ready yet');
          }
          return Promise.resolve(`Success on attempt ${attempt}`);
        });

        mockRetryPolicy.shouldRetry.mockReturnValue(true);
        mockRetryPolicy.calculateDelay.mockReturnValue(0);

        const result = await retryExecutor.executeWithAttempt(operation, mockRetryPolicy);

        expect(result.success).toBe(true);
        expect(result.result).toBe('Success on attempt 3');
        expect(result.attemptsMade).toBe(3);
      });
    });

    describe('failed operations', () => {
      it('should fail when max attempts reached', async () => {
        const error = new Error('persistent error');
        const operation = jest.fn().mockRejectedValue(error);

        mockRetryPolicy.shouldRetry
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(true)
          .mockReturnValueOnce(false);
        mockRetryPolicy.calculateDelay.mockReturnValue(0);

        const result = await retryExecutor.executeWithAttempt(operation, mockRetryPolicy);

        expect(result).toEqual({
          success: false,
          error,
          attemptsMade: 3,
          totalDelayMs: 0,
        });
        expect(operation).toHaveBeenCalledTimes(3);
      });

      it('should fail immediately on non-retryable error', async () => {
        const error = new Error('authentication failed');
        const operation = jest.fn().mockRejectedValue(error);

        mockRetryPolicy.shouldRetry.mockReturnValue(false);

        const result = await retryExecutor.executeWithAttempt(operation, mockRetryPolicy);

        expect(result).toEqual({
          success: false,
          error,
          attemptsMade: 1,
          totalDelayMs: 0,
        });
      });
    });

    describe('retry delays', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should apply delay between retries', async () => {
        const operation = jest
          .fn()
          .mockRejectedValueOnce(new Error('error'))
          .mockResolvedValueOnce('success');

        mockRetryPolicy.shouldRetry.mockReturnValue(true);
        mockRetryPolicy.calculateDelay.mockReturnValueOnce(1000);

        const resultPromise = retryExecutor.executeWithAttempt(operation, mockRetryPolicy);

        await jest.advanceTimersByTimeAsync(1000);

        const result = await resultPromise;

        expect(result.totalDelayMs).toBe(1000);
      });

      it('should accumulate total delay correctly', async () => {
        const operation = jest
          .fn()
          .mockRejectedValueOnce(new Error('error 1'))
          .mockRejectedValueOnce(new Error('error 2'))
          .mockResolvedValueOnce('success');

        mockRetryPolicy.shouldRetry.mockReturnValue(true);
        mockRetryPolicy.calculateDelay.mockReturnValueOnce(1000).mockReturnValueOnce(2000);

        const resultPromise = retryExecutor.executeWithAttempt(operation, mockRetryPolicy);

        await jest.advanceTimersByTimeAsync(1000);
        await jest.advanceTimersByTimeAsync(2000);

        const result = await resultPromise;

        expect(result.totalDelayMs).toBe(3000);
      });
    });

    describe('logging behavior', () => {
      it('should log attempt information', async () => {
        const operation = jest.fn().mockResolvedValue('success');

        await retryExecutor.executeWithAttempt(operation, mockRetryPolicy, 'myOperation');

        expect(mockLogger.debug).toHaveBeenCalledWith('Executing myOperation (attempt 1)', {
          attemptNumber: 1,
          maxAttempts: 3,
        });
      });

      it('should log success with attempt details', async () => {
        const operation = jest.fn().mockResolvedValue('success');

        await retryExecutor.executeWithAttempt(operation, mockRetryPolicy, 'myOperation');

        expect(mockLogger.debug).toHaveBeenCalledWith('myOperation succeeded', {
          attemptNumber: 1,
          totalDelayMs: 0,
        });
      });
    });
  });

  describe('edge cases', () => {
    it('should handle operation that returns undefined', async () => {
      const operation = jest.fn().mockResolvedValue(undefined);

      const result = await retryExecutor.execute(operation, mockRetryPolicy);

      expect(result.success).toBe(true);
      expect(result.result).toBeUndefined();
    });

    it('should handle operation that returns null', async () => {
      const operation = jest.fn().mockResolvedValue(null);

      const result = await retryExecutor.execute(operation, mockRetryPolicy);

      expect(result.success).toBe(true);
      expect(result.result).toBeNull();
    });

    it('should handle operation that returns 0', async () => {
      const operation = jest.fn().mockResolvedValue(0);

      const result = await retryExecutor.execute(operation, mockRetryPolicy);

      expect(result.success).toBe(true);
      expect(result.result).toBe(0);
    });

    it('should handle operation that returns false', async () => {
      const operation = jest.fn().mockResolvedValue(false);

      const result = await retryExecutor.execute(operation, mockRetryPolicy);

      expect(result.success).toBe(true);
      expect(result.result).toBe(false);
    });

    it('should handle operation that returns empty string', async () => {
      const operation = jest.fn().mockResolvedValue('');

      const result = await retryExecutor.execute(operation, mockRetryPolicy);

      expect(result.success).toBe(true);
      expect(result.result).toBe('');
    });

    it('should handle operation that returns empty array', async () => {
      const operation = jest.fn().mockResolvedValue([]);

      const result = await retryExecutor.execute(operation, mockRetryPolicy);

      expect(result.success).toBe(true);
      expect(result.result).toEqual([]);
    });

    it('should handle operation that returns empty object', async () => {
      const operation = jest.fn().mockResolvedValue({});

      const result = await retryExecutor.execute(operation, mockRetryPolicy);

      expect(result.success).toBe(true);
      expect(result.result).toEqual({});
    });

    it('should handle very long operation names', async () => {
      const longName = 'a'.repeat(500);
      const operation = jest.fn().mockResolvedValue('success');

      await retryExecutor.execute(operation, mockRetryPolicy, longName);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Executing ${longName} (attempt 1)`,
        expect.any(Object)
      );
    });

    it('should handle operation name with special characters', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      await retryExecutor.execute(operation, mockRetryPolicy, 'op:with@special#chars!');

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Executing op:with@special#chars! (attempt 1)',
        expect.any(Object)
      );
    });

    it('should handle thrown Error without message', async () => {
      const operation = jest.fn().mockRejectedValue(new Error());

      mockRetryPolicy.shouldRetry.mockReturnValue(false);

      const result = await retryExecutor.execute(operation, mockRetryPolicy);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('');
    });
  });

  describe('performance and stress tests', () => {
    it('should handle many retries efficiently', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('error'));

      mockRetryPolicy.shouldRetry.mockImplementation((_, attempt) => attempt < 100);
      mockRetryPolicy.calculateDelay.mockReturnValue(0);

      const result = await retryExecutor.execute(operation, mockRetryPolicy);

      expect(result.attemptsMade).toBe(100);
      expect(operation).toHaveBeenCalledTimes(100);
    });

    it('should handle rapid success/fail cycles', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('1'))
        .mockResolvedValueOnce('success')
        .mockRejectedValueOnce(new Error('2'))
        .mockResolvedValueOnce('success');

      mockRetryPolicy.shouldRetry.mockReturnValue(true);
      mockRetryPolicy.calculateDelay.mockReturnValue(0);

      const result1 = await retryExecutor.execute(operation, mockRetryPolicy);
      const result2 = await retryExecutor.execute(operation, mockRetryPolicy);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });
});
