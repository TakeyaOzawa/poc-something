/**
 * Unit Tests: RetryType
 */

import { RETRY_TYPE, RetryType, isRetryType } from '../RetryType';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('RetryType', () => {
  describe('RETRY_TYPE constants', () => {
    it('should define NO_RETRY as 0', () => {
      expect(RETRY_TYPE.NO_RETRY).toBe(0);
    });

    it('should define RETRY_FROM_BEGINNING as 10', () => {
      expect(RETRY_TYPE.RETRY_FROM_BEGINNING).toBe(10);
    });

    it('should have all unique values', () => {
      const values = Object.values(RETRY_TYPE);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it('should have exactly 2 retry types', () => {
      const values = Object.values(RETRY_TYPE);
      expect(values.length).toBe(2);
    });
  });

  describe('RetryType type', () => {
    it('should accept valid retry type values', () => {
      const noRetry: RetryType = RETRY_TYPE.NO_RETRY;
      const retryFromBeginning: RetryType = RETRY_TYPE.RETRY_FROM_BEGINNING;

      expect(noRetry).toBe(0);
      expect(retryFromBeginning).toBe(10);
    });
  });

  describe('isRetryType', () => {
    it('should return true for NO_RETRY (0)', () => {
      expect(isRetryType(0)).toBe(true);
    });

    it('should return true for RETRY_FROM_BEGINNING (10)', () => {
      expect(isRetryType(10)).toBe(true);
    });

    it('should return false for invalid type (1)', () => {
      expect(isRetryType(1)).toBe(false);
    });

    it('should return false for invalid type (5)', () => {
      expect(isRetryType(5)).toBe(false);
    });

    it('should return false for invalid type (20)', () => {
      expect(isRetryType(20)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(isRetryType(-10)).toBe(false);
    });

    it('should return false for decimal numbers', () => {
      expect(isRetryType(10.5)).toBe(false);
    });

    it('should work with constant values', () => {
      expect(isRetryType(RETRY_TYPE.NO_RETRY)).toBe(true);
      expect(isRetryType(RETRY_TYPE.RETRY_FROM_BEGINNING)).toBe(true);
    });

    it('should handle all valid retry types in a loop', () => {
      const validTypes = Object.values(RETRY_TYPE);
      validTypes.forEach((type) => {
        expect(isRetryType(type)).toBe(true);
      });
    });

    it('should be used for conditional logic', () => {
      const retryType = 10;

      if (isRetryType(retryType) && retryType === RETRY_TYPE.RETRY_FROM_BEGINNING) {
        expect(retryType).toBe(10);
      } else {
        fail('Should match RETRY_FROM_BEGINNING');
      }
    });
  });
});
