/**
 * Unit tests for TimeoutManager
 */

import { TimeoutManager, CancellationChecker } from '../TimeoutManager';
import { Logger } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock dependencies
jest.mock('@domain/types/logger.types');

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('TimeoutManager', () => {
  let timeoutManager: TimeoutManager;
  let mockLogger: jest.Mocked<Logger>;
  let mockCancellationChecker: jest.MockedFunction<CancellationChecker>;

  beforeEach(() => {
    jest.useFakeTimers();

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setLevel: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    mockCancellationChecker = jest.fn().mockReturnValue(false);

    timeoutManager = new TimeoutManager(mockLogger);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('executeWithTimeout - no timeout', () => {
    it('should execute operation without timeout when timeout is 0', async () => {
      const operation = jest.fn().mockResolvedValue({ data: 'test' });

      const result = await timeoutManager.executeWithTimeout(
        operation,
        0,
        123,
        1,
        mockCancellationChecker
      );

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ data: 'test' });
      expect(operation).toHaveBeenCalled();
      expect(mockLogger.debug).not.toHaveBeenCalledWith(expect.stringContaining('with timeout'));
    });

    it('should execute operation without timeout when timeout is negative', async () => {
      const operation = jest.fn().mockResolvedValue({ data: 'test' });

      const result = await timeoutManager.executeWithTimeout(
        operation,
        -5,
        123,
        1,
        mockCancellationChecker
      );

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ data: 'test' });
      expect(operation).toHaveBeenCalled();
    });

    it('should handle operation error without timeout', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));

      const result = await timeoutManager.executeWithTimeout(
        operation,
        0,
        123,
        1,
        mockCancellationChecker
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Operation failed');
    });
  });

  describe('executeWithTimeout - with timeout', () => {
    it('should complete successfully when operation finishes before timeout', async () => {
      const operation = jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { data: 'success' };
      });

      const resultPromise = timeoutManager.executeWithTimeout(
        operation,
        1, // 1 second timeout
        123,
        1,
        mockCancellationChecker
      );

      await jest.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ data: 'success' });
      expect(mockLogger.debug).toHaveBeenCalledWith('Executing step 1 with timeout of 1s');
    });

    it('should timeout when operation takes too long', async () => {
      const operation = jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { data: 'should not reach here' };
      });

      const resultPromise = timeoutManager.executeWithTimeout(
        operation,
        0.1, // 100ms timeout
        123,
        5,
        mockCancellationChecker
      );

      await jest.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Step 5 timed out after 0.1s');
      expect(mockLogger.debug).toHaveBeenCalledWith('Executing step 5 with timeout of 0.1s');
    });

    it('should handle operation error within timeout', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Operation error'));

      const result = await timeoutManager.executeWithTimeout(
        operation,
        1,
        123,
        3,
        mockCancellationChecker
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Operation error');
    });
  });

  describe('executeWithTimeout - cancellation', () => {
    it('should cancel operation when cancellationChecker returns true', async () => {
      // Mock cancellation checker to return true after first check
      let checkCount = 0;
      const cancellationChecker = jest.fn(() => {
        checkCount++;
        return checkCount > 1; // Cancel after first check
      });

      const operation = jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return { data: 'should not reach here' };
      });

      const resultPromise = timeoutManager.executeWithTimeout(
        operation,
        1,
        123,
        2,
        cancellationChecker
      );

      await jest.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Auto-fill cancelled by user');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Step 2 cancelled by user during execution (with timeout)'
      );
    });

    it('should not cancel when cancellationChecker always returns false', async () => {
      const operation = jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { data: 'success' };
      });

      const resultPromise = timeoutManager.executeWithTimeout(
        operation,
        1,
        123,
        1,
        mockCancellationChecker
      );

      await jest.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ data: 'success' });
      expect(mockCancellationChecker).toHaveBeenCalled();
    });
  });

  describe('logTimeoutConfig', () => {
    it('should log timeout configuration when timeout is positive', () => {
      timeoutManager.logTimeoutConfig(5, 10);

      expect(mockLogger.debug).toHaveBeenCalledWith('Step 5 will timeout after 10s');
    });

    it('should log no timeout when timeout is 0', () => {
      timeoutManager.logTimeoutConfig(3, 0);

      expect(mockLogger.debug).toHaveBeenCalledWith('Step 3 has no timeout limit');
    });

    it('should log no timeout when timeout is negative', () => {
      timeoutManager.logTimeoutConfig(7, -5);

      expect(mockLogger.debug).toHaveBeenCalledWith('Step 7 has no timeout limit');
    });
  });

  describe('race condition behavior', () => {
    it('should return first completed promise (execution wins)', async () => {
      const operation = jest.fn().mockResolvedValue({ data: 'fast' });

      const result = await timeoutManager.executeWithTimeout(
        operation,
        10, // Long timeout
        123,
        1,
        mockCancellationChecker
      );

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ data: 'fast' });
    });

    it('should return first completed promise (timeout wins)', async () => {
      const operation = jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { data: 'slow' };
      });

      const resultPromise = timeoutManager.executeWithTimeout(
        operation,
        0.05, // Very short timeout
        123,
        1,
        mockCancellationChecker
      );

      await jest.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    });

    it('should return first completed promise (cancellation wins)', async () => {
      let callCount = 0;
      const cancellationChecker = jest.fn(() => {
        callCount++;
        return callCount > 1; // Cancel after first check
      });

      const operation = jest.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return { data: 'slow' };
      });

      const resultPromise = timeoutManager.executeWithTimeout(
        operation,
        10, // Long timeout
        123,
        1,
        cancellationChecker
      );

      await jest.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('Auto-fill cancelled by user');
    });
  });
});
