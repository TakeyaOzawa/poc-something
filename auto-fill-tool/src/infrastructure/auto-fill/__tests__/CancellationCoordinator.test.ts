/**
 * Unit tests for CancellationCoordinator
 */

import { CancellationCoordinator } from '../CancellationCoordinator';
import { Logger } from '@domain/types/logger.types';

// Mock dependencies
jest.mock('@domain/types/logger.types');

describe('CancellationCoordinator', () => {
  let cancellationCoordinator: CancellationCoordinator;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setLevel: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    // Clear all cancellation flags before each test
    // Access the private static Map and clear it
    (CancellationCoordinator as any).cancellationFlags.clear();

    cancellationCoordinator = new CancellationCoordinator(mockLogger);
  });

  describe('requestCancellation', () => {
    it('should set cancellation flag for a tab', () => {
      CancellationCoordinator.requestCancellation(123);

      expect(cancellationCoordinator.isCancelled(123)).toBe(true);
    });

    it('should set cancellation flag for multiple tabs independently', () => {
      CancellationCoordinator.requestCancellation(123);
      CancellationCoordinator.requestCancellation(456);

      expect(cancellationCoordinator.isCancelled(123)).toBe(true);
      expect(cancellationCoordinator.isCancelled(456)).toBe(true);
    });
  });

  describe('clearCancellationFlag', () => {
    it('should clear cancellation flag for a tab', () => {
      CancellationCoordinator.requestCancellation(123);
      expect(cancellationCoordinator.isCancelled(123)).toBe(true);

      cancellationCoordinator.clearCancellationFlag(123);

      expect(cancellationCoordinator.isCancelled(123)).toBe(false);
      expect(mockLogger.debug).toHaveBeenCalledWith('Cancellation flag cleared for tab 123');
    });

    it('should not affect other tabs when clearing a specific tab', () => {
      CancellationCoordinator.requestCancellation(123);
      CancellationCoordinator.requestCancellation(456);

      cancellationCoordinator.clearCancellationFlag(123);

      expect(cancellationCoordinator.isCancelled(123)).toBe(false);
      expect(cancellationCoordinator.isCancelled(456)).toBe(true);
    });

    it('should safely clear a non-existent cancellation flag', () => {
      expect(() => {
        cancellationCoordinator.clearCancellationFlag(999);
      }).not.toThrow();

      expect(mockLogger.debug).toHaveBeenCalledWith('Cancellation flag cleared for tab 999');
    });
  });

  describe('isCancelled', () => {
    it('should return true when cancellation is requested', () => {
      CancellationCoordinator.requestCancellation(123);

      expect(cancellationCoordinator.isCancelled(123)).toBe(true);
    });

    it('should return false when cancellation is not requested', () => {
      expect(cancellationCoordinator.isCancelled(123)).toBe(false);
    });

    it('should return false after cancellation flag is cleared', () => {
      CancellationCoordinator.requestCancellation(123);
      cancellationCoordinator.clearCancellationFlag(123);

      expect(cancellationCoordinator.isCancelled(123)).toBe(false);
    });
  });

  describe('checkAndLogCancellation', () => {
    it('should return true and log when cancelled', () => {
      CancellationCoordinator.requestCancellation(123);

      const result = cancellationCoordinator.checkAndLogCancellation(123, 'during test');

      expect(result).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('Auto-fill cancelled by user during test');
    });

    it('should return false and not log when not cancelled', () => {
      const result = cancellationCoordinator.checkAndLogCancellation(123, 'during test');

      expect(result).toBe(false);
      expect(mockLogger.info).not.toHaveBeenCalled();
    });
  });

  describe('handleCancellation', () => {
    it('should log, clear flag, and return error result', () => {
      CancellationCoordinator.requestCancellation(123);

      const errorFactory = (message: string) => ({
        success: false,
        error: message,
      });

      const result = cancellationCoordinator.handleCancellation(123, 'during retry', errorFactory);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Auto-fill cancelled by user');
      expect(mockLogger.info).toHaveBeenCalledWith('Auto-fill cancelled by user during retry');
      expect(cancellationCoordinator.isCancelled(123)).toBe(false);
    });

    it('should work with custom error factory', () => {
      CancellationCoordinator.requestCancellation(456);

      const errorFactory = (message: string) => ({
        success: false,
        error: message,
        customField: 'custom value',
      });

      const result = cancellationCoordinator.handleCancellation(
        456,
        'at step 5',
        errorFactory as any
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Auto-fill cancelled by user');
      expect((result as any).customField).toBe('custom value');
    });
  });

  describe('sleepWithCancellationCheck', () => {
    it('should complete normally when not cancelled', async () => {
      const startTime = Date.now();

      const cancelled = await cancellationCoordinator.sleepWithCancellationCheck(123, 200);

      const elapsed = Date.now() - startTime;
      expect(cancelled).toBe(false);
      expect(elapsed).toBeGreaterThanOrEqual(150); // Allow some margin
    });

    it('should return true when cancelled during sleep', async () => {
      // Cancel after 100ms
      setTimeout(() => {
        CancellationCoordinator.requestCancellation(123);
      }, 100);

      const startTime = Date.now();
      const cancelled = await cancellationCoordinator.sleepWithCancellationCheck(123, 500);
      const elapsed = Date.now() - startTime;

      expect(cancelled).toBe(true);
      expect(elapsed).toBeLessThan(600); // Should complete before full sleep, allow timing variance for CI/slow machines
      expect(mockLogger.debug).toHaveBeenCalledWith('Sleep interrupted by cancellation');
    });

    it('should handle very short sleep durations', async () => {
      const cancelled = await cancellationCoordinator.sleepWithCancellationCheck(123, 10);

      expect(cancelled).toBe(false);
    });
  });

  describe('initializeExecution', () => {
    it('should clear cancellation flag and log', () => {
      CancellationCoordinator.requestCancellation(123);
      expect(cancellationCoordinator.isCancelled(123)).toBe(true);

      cancellationCoordinator.initializeExecution(123);

      expect(cancellationCoordinator.isCancelled(123)).toBe(false);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Initialized execution for tab 123, cancellation flag cleared'
      );
    });
  });

  describe('checkCancellationAtRetryStart', () => {
    it('should return null when not cancelled', () => {
      const errorFactory = (message: string) => ({
        success: false,
        error: message,
      });

      const result = cancellationCoordinator.checkCancellationAtRetryStart(123, errorFactory);

      expect(result).toBeNull();
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should return error result when cancelled', () => {
      CancellationCoordinator.requestCancellation(123);

      const errorFactory = (message: string) => ({
        success: false,
        error: message,
      });

      const result = cancellationCoordinator.checkCancellationAtRetryStart(123, errorFactory);

      expect(result).not.toBeNull();
      expect(result?.success).toBe(false);
      expect(result?.error).toBe('Auto-fill cancelled by user');
      expect(mockLogger.info).toHaveBeenCalledWith('Auto-fill cancelled by user during retry loop');
      expect(cancellationCoordinator.isCancelled(123)).toBe(false); // Should be cleared
    });
  });

  describe('checkCancellationAtStep', () => {
    it('should return null when not cancelled', () => {
      const errorFactory = (message: string, failedStep: number) => ({
        success: false,
        error: message,
        failedStep,
      });

      const result = cancellationCoordinator.checkCancellationAtStep(123, 5, errorFactory);

      expect(result).toBeNull();
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should return error result with failed step when cancelled', () => {
      CancellationCoordinator.requestCancellation(123);

      const errorFactory = (message: string, failedStep: number) => ({
        success: false,
        error: message,
        failedStep,
      });

      const result = cancellationCoordinator.checkCancellationAtStep(123, 7, errorFactory);

      expect(result).not.toBeNull();
      expect(result?.success).toBe(false);
      expect(result?.error).toBe('Auto-fill cancelled by user');
      expect(result?.failedStep).toBe(7);
      expect(mockLogger.info).toHaveBeenCalledWith('Auto-fill cancelled by user at step 7');
      expect(cancellationCoordinator.isCancelled(123)).toBe(false); // Should be cleared
    });
  });

  describe('checkCancellationDuringWait', () => {
    it('should return null when not cancelled', () => {
      const errorFactory = (message: string, failedStep: number) => ({
        success: false,
        error: message,
        failedStep,
      });

      const result = cancellationCoordinator.checkCancellationDuringWait(
        123,
        5,
        false,
        errorFactory
      );

      expect(result).toBeNull();
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should return error result when cancelled during wait', () => {
      CancellationCoordinator.requestCancellation(123);

      const errorFactory = (message: string, failedStep: number) => ({
        success: false,
        error: message,
        failedStep,
      });

      const result = cancellationCoordinator.checkCancellationDuringWait(
        123,
        8,
        true,
        errorFactory
      );

      expect(result).not.toBeNull();
      expect(result?.success).toBe(false);
      expect(result?.error).toBe('Auto-fill cancelled by user');
      expect(result?.failedStep).toBe(8);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Auto-fill cancelled by user during wait after step 8'
      );
      expect(cancellationCoordinator.isCancelled(123)).toBe(false); // Should be cleared
    });
  });

  describe('static shared state', () => {
    it('should share cancellation flags across instances', () => {
      const coordinator1 = new CancellationCoordinator(mockLogger);
      const coordinator2 = new CancellationCoordinator(mockLogger);

      CancellationCoordinator.requestCancellation(123);

      expect(coordinator1.isCancelled(123)).toBe(true);
      expect(coordinator2.isCancelled(123)).toBe(true);
    });

    it('should allow one instance to clear flag set by another', () => {
      const coordinator1 = new CancellationCoordinator(mockLogger);
      const coordinator2 = new CancellationCoordinator(mockLogger);

      CancellationCoordinator.requestCancellation(123);
      coordinator1.clearCancellationFlag(123);

      expect(coordinator2.isCancelled(123)).toBe(false);
    });
  });
});
