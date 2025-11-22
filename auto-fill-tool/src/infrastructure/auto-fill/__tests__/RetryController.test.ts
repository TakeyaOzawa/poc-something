/**
 * Unit tests for RetryController
 */

import { RetryController, RetryConfig } from '../RetryController';
import { Logger } from '@domain/types/logger.types';
import { XPathData } from '@domain/entities/XPathCollection';
import { AutoFillResult } from '@domain/ports/AutoFillPort';
import { RetryPolicyService } from '@domain/services/RetryPolicyService';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock dependencies
jest.mock('@domain/types/logger.types');

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('RetryController', () => {
  let retryController: RetryController;
  let mockLogger: jest.Mocked<Logger>;
  let mockRetryPolicyService: jest.Mocked<RetryPolicyService>;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setLevel: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    mockRetryPolicyService = {
      shouldRetry: jest.fn(),
      calculateWaitTime: jest.fn(),
      roundWaitTime: jest.fn(),
      isInfiniteRetry: jest.fn(),
    } as unknown as jest.Mocked<RetryPolicyService>;

    retryController = new RetryController(mockLogger);
    // Replace the internal retryPolicyService with our mock
    (retryController as any).retryPolicyService = mockRetryPolicyService;
  });

  describe('shouldRetryStep', () => {
    it('should return true when failed XPath has RETRY_FROM_BEGINNING retry type', () => {
      const xpaths: XPathData[] = [
        { executionOrder: 1, retryType: 10 } as XPathData,
        { executionOrder: 2, retryType: 0 } as XPathData,
      ];

      mockRetryPolicyService.shouldRetry.mockReturnValue(true);
      const result = retryController.shouldRetryStep(xpaths, 1);

      expect(result).toBe(true);
      expect(mockLogger.debug).toHaveBeenCalledWith('Failed step retry_type: 10');
      expect(mockRetryPolicyService.shouldRetry).toHaveBeenCalledWith(10);
    });

    it('should return false when failed XPath is not found', () => {
      const xpaths: XPathData[] = [{ executionOrder: 1, retryType: 10 } as XPathData];

      mockRetryPolicyService.shouldRetry.mockReturnValue(false);
      const result = retryController.shouldRetryStep(xpaths, 999);

      expect(result).toBe(false);
      expect(mockLogger.debug).toHaveBeenCalledWith('Failed step retry_type: undefined');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Not retrying (retry_type is not RETRY_FROM_BEGINNING). Returning error.'
      );
    });

    it('should return false when failed XPath has NO_RETRY retry type', () => {
      const xpaths: XPathData[] = [{ executionOrder: 1, retryType: 0 } as XPathData];

      mockRetryPolicyService.shouldRetry.mockReturnValue(false);
      const result = retryController.shouldRetryStep(xpaths, 1);

      expect(result).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Not retrying (retry_type is not RETRY_FROM_BEGINNING). Returning error.'
      );
    });
  });

  describe('calculateWaitTime', () => {
    it('should calculate wait time within configured bounds', () => {
      const config: RetryConfig = {
        min: 1,
        max: 5,
        maxRetries: 3,
        isInfinite: false,
      };

      mockRetryPolicyService.calculateWaitTime.mockReturnValue(3.5);
      const waitTime = retryController.calculateWaitTime(config);

      expect(waitTime).toBe(3.5);
      expect(mockRetryPolicyService.calculateWaitTime).toHaveBeenCalledWith(1, 5);
    });
  });

  describe('roundWaitTime', () => {
    it('should round wait time to nearest integer', () => {
      mockRetryPolicyService.roundWaitTime.mockReturnValue(4);
      expect(retryController.roundWaitTime(3.7)).toBe(4);

      mockRetryPolicyService.roundWaitTime.mockReturnValue(2);
      expect(retryController.roundWaitTime(2.3)).toBe(2);

      mockRetryPolicyService.roundWaitTime.mockReturnValue(6);
      expect(retryController.roundWaitTime(5.5)).toBe(6);
    });
  });

  describe('logRetryAttempt', () => {
    it('should log retry attempt in finite mode', () => {
      const config: RetryConfig = {
        min: 1,
        max: 5,
        maxRetries: 3,
        isInfinite: false,
      };

      retryController.logRetryAttempt(2, config);

      expect(mockLogger.info).toHaveBeenCalledWith('Retry attempt 2/3');
    });

    it('should log retry attempt in infinite mode', () => {
      const config: RetryConfig = {
        min: 1,
        max: 5,
        maxRetries: 0,
        isInfinite: true,
      };

      retryController.logRetryAttempt(5, config);

      expect(mockLogger.info).toHaveBeenCalledWith('Retry attempt 5 (infinite mode)');
    });
  });

  describe('logSuccess', () => {
    it('should log success on first attempt', () => {
      retryController.logSuccess(0);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Auto-fill completed successfully on first attempt'
      );
    });

    it('should log success after 1 retry attempt', () => {
      retryController.logSuccess(1);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Auto-fill completed successfully after 1 retry attempt'
      );
    });

    it('should log success after multiple retry attempts', () => {
      retryController.logSuccess(3);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Auto-fill completed successfully after 3 retry attempts'
      );
    });
  });

  describe('createMaxRetriesError', () => {
    it('should create error message with retry count', () => {
      const result: AutoFillResult = {
        success: false,
        processedSteps: 5,
        error: 'Step 5 failed',
      };

      const errorResult = retryController.createMaxRetriesError(result, 3);

      expect(errorResult.success).toBe(false);
      expect(errorResult.error).toBe('Step 5 failed (Failed after 3 retry attempts)');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Maximum retry attempts (3) reached. Giving up.'
      );
    });

    it('should preserve original result properties', () => {
      const result: AutoFillResult = {
        success: false,
        processedSteps: 10,
        failedStep: 8,
        error: 'Original error',
      };

      const errorResult = retryController.createMaxRetriesError(result, 5);

      expect(errorResult.processedSteps).toBe(10);
      expect(errorResult.failedStep).toBe(8);
      expect(errorResult.error).toBe('Original error (Failed after 5 retry attempts)');
    });
  });

  describe('logWaitBeforeRetry', () => {
    it('should log wait information in finite mode', () => {
      const config: RetryConfig = {
        min: 1,
        max: 5,
        maxRetries: 3,
        isInfinite: false,
      };

      retryController.logWaitBeforeRetry(5, 3, 3.2, 1, config);

      expect(mockLogger.info).toHaveBeenCalledWith('Step 5 failed with retry_type=10.');
      expect(mockLogger.info).toHaveBeenCalledWith('Waiting 3 seconds (3200ms) before retry...');
      expect(mockLogger.info).toHaveBeenCalledWith('Retry attempt 1/3 will start');
    });

    it('should log wait information in infinite mode', () => {
      const config: RetryConfig = {
        min: 1,
        max: 5,
        maxRetries: 0,
        isInfinite: true,
      };

      retryController.logWaitBeforeRetry(3, 2, 2.5, 2, config);

      expect(mockLogger.info).toHaveBeenCalledWith('Step 3 failed with retry_type=10.');
      expect(mockLogger.info).toHaveBeenCalledWith('Waiting 2 seconds (2500ms) before retry...');
      expect(mockLogger.info).toHaveBeenCalledWith('Retry attempt 2 will start');
    });
  });

  describe('logWaitCompleted', () => {
    it('should log wait completion information', () => {
      retryController.logWaitCompleted(3.15, 3);

      expect(mockLogger.info).toHaveBeenCalledWith('Wait completed (actual: 3.15s, expected: 3s).');
    });
  });

  describe('logWaitCancelled', () => {
    it('should log wait cancellation information', () => {
      retryController.logWaitCancelled(1.5, 3);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Wait interrupted by cancellation after 1.50s (expected: 3s)'
      );
    });
  });

  describe('logRetryConfig', () => {
    it('should log retry configuration in finite mode', () => {
      const config: RetryConfig = {
        min: 2,
        max: 8,
        maxRetries: 5,
        isInfinite: false,
      };

      retryController.logRetryConfig(config);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Retry configuration - Max attempts: 5, Wait time: 2-8 seconds (random)'
      );
    });

    it('should log retry configuration in infinite mode', () => {
      const config: RetryConfig = {
        min: 1,
        max: 3,
        maxRetries: 0,
        isInfinite: true,
      };

      retryController.logRetryConfig(config);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Retry configuration - Max attempts: infinite, Wait time: 1-3 seconds (random)'
      );
    });
  });
});
