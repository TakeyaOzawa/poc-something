/**
 * Unit Tests: AutomationResult Entity
 */

import { AutomationResult, AutomationResultData } from '../AutomationResult';
import { IdGenerator } from '@domain/types/id-generator.types';
// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'test-uuid-1234-5678-90ab-cdef12345678'),
};
import { EXECUTION_STATUS } from '@domain/constants/ExecutionStatus';

describe('AutomationResult Entity', () => {
  const validData: AutomationResultData = {
    id: 'result-id-123',
    automationVariablesId: 'variables-id-456',
    executionStatus: EXECUTION_STATUS.SUCCESS,
    resultDetail: 'Successfully completed all steps',
    startFrom: '2025-10-15T10:00:00.000Z',
    endTo: '2025-10-15T10:05:30.000Z',
    currentStepIndex: 10,
    totalSteps: 20,
    lastExecutedUrl: 'https://example.com/page2',
  };

  describe('constructor', () => {
    it('should create AutomationResult with valid data', () => {
      const result = new AutomationResult(validData);

      expect(result.getId()).toBe('result-id-123');
      expect(result.getAutomationVariablesId()).toBe('variables-id-456');
      expect(result.getExecutionStatus()).toBe(EXECUTION_STATUS.SUCCESS);
      expect(result.getResultDetail()).toBe('Successfully completed all steps');
      expect(result.getStartFrom()).toBe('2025-10-15T10:00:00.000Z');
      expect(result.getEndTo()).toBe('2025-10-15T10:05:30.000Z');
      expect(result.getCurrentStepIndex()).toBe(10);
      expect(result.getTotalSteps()).toBe(20);
      expect(result.getLastExecutedUrl()).toBe('https://example.com/page2');
    });

    it('should throw error if id is missing', () => {
      const invalidData = { ...validData, id: '' };
      expect(() => new AutomationResult(invalidData)).toThrow('ID is required');
    });

    it('should throw error if automationVariablesId is missing', () => {
      const invalidData = { ...validData, automationVariablesId: '' };
      expect(() => new AutomationResult(invalidData)).toThrow('AutomationVariables ID is required');
    });

    it('should throw error if executionStatus is invalid', () => {
      const invalidData = { ...validData, executionStatus: 'invalid' as any };
      expect(() => new AutomationResult(invalidData)).toThrow('Invalid execution status');
    });

    it('should throw error if startFrom is missing', () => {
      const invalidData = { ...validData, startFrom: '' };
      expect(() => new AutomationResult(invalidData)).toThrow('Start time is required');
    });

    it('should accept null endTo', () => {
      const dataWithNullEnd = { ...validData, endTo: null };
      const result = new AutomationResult(dataWithNullEnd);

      expect(result.getEndTo()).toBeNull();
    });
  });

  describe('getters', () => {
    it('should return id', () => {
      const result = new AutomationResult(validData);
      expect(result.getId()).toBe('result-id-123');
    });

    it('should return automationVariablesId', () => {
      const result = new AutomationResult(validData);
      expect(result.getAutomationVariablesId()).toBe('variables-id-456');
    });

    it('should return executionStatus', () => {
      const result = new AutomationResult(validData);
      expect(result.getExecutionStatus()).toBe(EXECUTION_STATUS.SUCCESS);
    });

    it('should return resultDetail', () => {
      const result = new AutomationResult(validData);
      expect(result.getResultDetail()).toBe('Successfully completed all steps');
    });

    it('should return startFrom', () => {
      const result = new AutomationResult(validData);
      expect(result.getStartFrom()).toBe('2025-10-15T10:00:00.000Z');
    });

    it('should return endTo', () => {
      const result = new AutomationResult(validData);
      expect(result.getEndTo()).toBe('2025-10-15T10:05:30.000Z');
    });

    it('should return currentStepIndex', () => {
      const result = new AutomationResult(validData);
      expect(result.getCurrentStepIndex()).toBe(10);
    });

    it('should return totalSteps', () => {
      const result = new AutomationResult(validData);
      expect(result.getTotalSteps()).toBe(20);
    });

    it('should return lastExecutedUrl', () => {
      const result = new AutomationResult(validData);
      expect(result.getLastExecutedUrl()).toBe('https://example.com/page2');
    });
  });

  describe('setExecutionStatus', () => {
    it('should return new instance with updated status', () => {
      const result = new AutomationResult(validData);
      const updated = result.setExecutionStatus(EXECUTION_STATUS.FAILED);

      expect(updated.getExecutionStatus()).toBe(EXECUTION_STATUS.FAILED);
      expect(result.getExecutionStatus()).toBe(EXECUTION_STATUS.SUCCESS); // original unchanged
    });
  });

  describe('setResultDetail', () => {
    it('should return new instance with updated detail', () => {
      const result = new AutomationResult(validData);
      const updated = result.setResultDetail('Failed at step 5');

      expect(updated.getResultDetail()).toBe('Failed at step 5');
      expect(result.getResultDetail()).toBe('Successfully completed all steps'); // original unchanged
    });
  });

  describe('setEndTo', () => {
    it('should return new instance with updated end time', () => {
      const result = new AutomationResult({ ...validData, endTo: null });
      const updated = result.setEndTo('2025-10-15T10:10:00.000Z');

      expect(updated.getEndTo()).toBe('2025-10-15T10:10:00.000Z');
      expect(result.getEndTo()).toBeNull(); // original unchanged
    });
  });

  describe('setCurrentStepIndex', () => {
    it('should return new instance with updated step index', () => {
      const result = new AutomationResult(validData);
      const updated = result.setCurrentStepIndex(15);

      expect(updated.getCurrentStepIndex()).toBe(15);
      expect(result.getCurrentStepIndex()).toBe(10); // original unchanged
    });
  });

  describe('setTotalSteps', () => {
    it('should return new instance with updated total steps', () => {
      const result = new AutomationResult(validData);
      const updated = result.setTotalSteps(30);

      expect(updated.getTotalSteps()).toBe(30);
      expect(result.getTotalSteps()).toBe(20); // original unchanged
    });
  });

  describe('setLastExecutedUrl', () => {
    it('should return new instance with updated URL', () => {
      const result = new AutomationResult(validData);
      const updated = result.setLastExecutedUrl('https://example.com/page3');

      expect(updated.getLastExecutedUrl()).toBe('https://example.com/page3');
      expect(result.getLastExecutedUrl()).toBe('https://example.com/page2'); // original unchanged
    });
  });

  describe('toData', () => {
    it('should return a copy of data', () => {
      const result = new AutomationResult(validData);
      const data = result.toData();

      expect(data).toEqual(validData);
      expect(data).not.toBe(validData); // different reference
    });
  });

  describe('clone', () => {
    it('should return a new instance with same data', () => {
      const result = new AutomationResult(validData);
      const cloned = result.clone();

      expect(cloned.toData()).toEqual(result.toData());
      expect(cloned).not.toBe(result); // different instance
    });
  });

  describe(
    'create static factory',
    () => {
      it(
        'should create with minimal params',
        () => {
          const result = AutomationResult.create(
            {
              automationVariablesId: 'variables-123',
            },
            mockIdGenerator
          );

          expect(result.getAutomationVariablesId()).toBe('variables-123');
          expect(result.getExecutionStatus()).toBe(EXECUTION_STATUS.READY);
          expect(result.getResultDetail()).toBe('');
          expect(result.getStartFrom()).toBeTruthy();
          expect(result.getEndTo()).toBeNull();
          expect(result.getCurrentStepIndex()).toBe(0);
          expect(result.getTotalSteps()).toBe(0);
          expect(result.getLastExecutedUrl()).toBe('');
        },
        mockIdGenerator
      );

      it('should auto-generate UUID for id', () => {
        const result = AutomationResult.create(
          {
            automationVariablesId: 'variables-123',
          },
          mockIdGenerator
        );

        expect(result.getId()).toBeTruthy();
        expect(result.getId()).toMatch(/^test-uuid-\d{4}-5678-90ab-cdef12345678$/);
      });

      it(
        'should create with all params',
        () => {
          const result = AutomationResult.create(
            {
              automationVariablesId: 'variables-123',
              executionStatus: EXECUTION_STATUS.DOING,
              resultDetail: 'Processing step 3',
              currentStepIndex: 3,
              totalSteps: 10,
              lastExecutedUrl: 'https://example.com/step3',
            },
            mockIdGenerator
          );

          expect(result.getAutomationVariablesId()).toBe('variables-123');
          expect(result.getExecutionStatus()).toBe(EXECUTION_STATUS.DOING);
          expect(result.getResultDetail()).toBe('Processing step 3');
          expect(result.getCurrentStepIndex()).toBe(3);
          expect(result.getTotalSteps()).toBe(10);
          expect(result.getLastExecutedUrl()).toBe('https://example.com/step3');
        },
        mockIdGenerator
      );

      it(
        'should generate startFrom timestamp',
        () => {
          const before = new Date().toISOString();
          const result = AutomationResult.create(
            {
              automationVariablesId: 'variables-123',
            },
            mockIdGenerator
          );
          const after = new Date().toISOString();

          const startFrom = result.getStartFrom();
          expect(startFrom >= before && startFrom <= after).toBe(true);
        },
        mockIdGenerator
      );
    },
    mockIdGenerator
  );

  describe('getDurationSeconds', () => {
    it('should calculate duration in seconds', () => {
      const result = new AutomationResult(validData);
      const duration = result.getDurationSeconds();

      expect(duration).toBe(330); // 5 minutes 30 seconds = 330 seconds
    });

    it('should return null if endTo is null', () => {
      const result = new AutomationResult({ ...validData, endTo: null });
      const duration = result.getDurationSeconds();

      expect(duration).toBeNull();
    });
  });

  describe('isInProgress', () => {
    it('should return true if status is DOING', () => {
      const result = new AutomationResult({
        ...validData,
        executionStatus: EXECUTION_STATUS.DOING,
      });

      expect(result.isInProgress()).toBe(true);
    });

    it('should return false if status is not DOING', () => {
      const result = new AutomationResult({
        ...validData,
        executionStatus: EXECUTION_STATUS.SUCCESS,
      });

      expect(result.isInProgress()).toBe(false);
    });
  });

  describe('isSuccess', () => {
    it('should return true if status is SUCCESS', () => {
      const result = new AutomationResult({
        ...validData,
        executionStatus: EXECUTION_STATUS.SUCCESS,
      });

      expect(result.isSuccess()).toBe(true);
    });

    it('should return false if status is not SUCCESS', () => {
      const result = new AutomationResult({
        ...validData,
        executionStatus: EXECUTION_STATUS.FAILED,
      });

      expect(result.isSuccess()).toBe(false);
    });
  });

  describe('isFailed', () => {
    it('should return true if status is FAILED', () => {
      const result = new AutomationResult({
        ...validData,
        executionStatus: EXECUTION_STATUS.FAILED,
      });

      expect(result.isFailed()).toBe(true);
    });

    it('should return false if status is not FAILED', () => {
      const result = new AutomationResult({
        ...validData,
        executionStatus: EXECUTION_STATUS.SUCCESS,
      });

      expect(result.isFailed()).toBe(false);
    });
  });

  describe('getProgressPercentage', () => {
    it('should calculate progress percentage correctly', () => {
      const result = new AutomationResult({
        ...validData,
        currentStepIndex: 5,
        totalSteps: 20,
      });

      expect(result.getProgressPercentage()).toBe(25); // 5/20 * 100 = 25
    });

    it('should return 0 if totalSteps is 0', () => {
      const result = new AutomationResult({
        ...validData,
        currentStepIndex: 0,
        totalSteps: 0,
      });

      expect(result.getProgressPercentage()).toBe(0);
    });

    it('should return 100 when currentStepIndex equals totalSteps', () => {
      const result = new AutomationResult({
        ...validData,
        currentStepIndex: 20,
        totalSteps: 20,
      });

      expect(result.getProgressPercentage()).toBe(100);
    });

    it('should floor the percentage', () => {
      const result = new AutomationResult({
        ...validData,
        currentStepIndex: 7,
        totalSteps: 20,
      });

      expect(result.getProgressPercentage()).toBe(35); // Math.floor(7/20 * 100) = 35
    });
  });
});
