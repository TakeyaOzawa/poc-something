/**
 * Unit Tests: ChromeStorageAutomationResultRepository
 */

import browser from 'webextension-polyfill';
import { ChromeStorageAutomationResultRepository } from '../ChromeStorageAutomationResultRepository';
import { IdGenerator } from '@domain/types/id-generator.types';
import { AutomationResult } from '@domain/entities/AutomationResult';
import { Logger } from '@domain/types/logger.types';
import { EXECUTION_STATUS } from '@domain/constants/ExecutionStatus';
import { STORAGE_KEYS } from '@domain/constants/StorageKeys';
import { Result } from '@domain/values/result.value';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(),
};

describe('ChromeStorageAutomationResultRepository', () => {
  let repository: ChromeStorageAutomationResultRepository;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mockIdGenerator with fresh IDs for each test
    (mockIdGenerator.generate as jest.Mock)
      .mockReturnValueOnce('result-1')
      .mockReturnValueOnce('result-2')
      .mockReturnValueOnce('result-3')
      .mockReturnValueOnce('result-4')
      .mockReturnValueOnce('result-5')
      .mockReturnValueOnce('result-6')
      .mockReturnValueOnce('result-7')
      .mockReturnValueOnce('result-8')
      .mockReturnValueOnce('result-9')
      .mockReturnValueOnce('result-10')
      .mockReturnValue('mock-result-id');

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    repository = new ChromeStorageAutomationResultRepository(mockLogger);
  });

  describe('save', () => {
    it('should save new automation result to storage', async () => {
      const result = AutomationResult.create(
        {
          automationVariablesId: 'variables-123',
          executionStatus: EXECUTION_STATUS.SUCCESS,
          resultDetail: 'Completed successfully',
        },
        mockIdGenerator
      );

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEYS.AUTOMATION_RESULTS]: [],
      });
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      const saveResult = await repository.save(result);

      expect(saveResult.isSuccess).toBe(true);
      expect(browser.storage.local.set).toHaveBeenCalledWith({
        [STORAGE_KEYS.AUTOMATION_RESULTS]: [result.toData()],
      });
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('created'));
    });

    it(
      'should update existing automation result',
      async () => {
        const result = AutomationResult.create(
          {
            automationVariablesId: 'variables-123',
            executionStatus: EXECUTION_STATUS.DOING,
          },
          mockIdGenerator
        );

        const existingData = [result.toData()];

        (browser.storage.local.get as jest.Mock).mockResolvedValue({
          [STORAGE_KEYS.AUTOMATION_RESULTS]: existingData,
        });
        (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

        const updated = result.setExecutionStatus(EXECUTION_STATUS.SUCCESS);
        const saveResult = await repository.save(updated);

        expect(saveResult.isSuccess).toBe(true);
        const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0][
          STORAGE_KEYS.AUTOMATION_RESULTS
        ];
        expect(savedData).toHaveLength(1);
        expect(savedData[0].id).toBe(result.getId());
        expect(savedData[0].executionStatus).toBe(EXECUTION_STATUS.SUCCESS);
        expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('updated'));
      },
      mockIdGenerator
    );

    it(
      'should append to existing storage',
      async () => {
        const existingResult = AutomationResult.create(
          {
            automationVariablesId: 'variables-001',
          },
          mockIdGenerator
        );

        const newResult = AutomationResult.create(
          {
            automationVariablesId: 'variables-002',
          },
          mockIdGenerator
        );

        (browser.storage.local.get as jest.Mock).mockResolvedValue({
          [STORAGE_KEYS.AUTOMATION_RESULTS]: [existingResult.toData()],
        });
        (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

        const saveResult = await repository.save(newResult);

        expect(saveResult.isSuccess).toBe(true);
        const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0][
          STORAGE_KEYS.AUTOMATION_RESULTS
        ];
        expect(savedData).toHaveLength(2);
        expect(savedData[0].id).toBe(existingResult.getId());
        expect(savedData[1].id).toBe(newResult.getId());
      },
      mockIdGenerator
    );

    it(
      'should return failure if save fails',
      async () => {
        const result = AutomationResult.create(
          {
            automationVariablesId: 'variables-123',
          },
          mockIdGenerator
        );

        (browser.storage.local.get as jest.Mock).mockResolvedValue({});
        (browser.storage.local.set as jest.Mock).mockRejectedValue(new Error('Storage error'));

        const saveResult = await repository.save(result);

        expect(saveResult.isFailure).toBe(true);
        expect(saveResult.error).toBeInstanceOf(Error);
        expect(saveResult.error!.message).toBe('Storage error');
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to save automation result',
          expect.any(Error)
        );
      },
      mockIdGenerator
    );
  });

  describe('load', () => {
    it(
      'should load automation result by id',
      async () => {
        const result = AutomationResult.create(
          {
            automationVariablesId: 'variables-123',
            executionStatus: EXECUTION_STATUS.SUCCESS,
          },
          mockIdGenerator
        );

        (browser.storage.local.get as jest.Mock).mockResolvedValue({
          [STORAGE_KEYS.AUTOMATION_RESULTS]: [result.toData()],
        });

        const loadResult = await repository.load(result.getId());

        expect(loadResult.isSuccess).toBe(true);
        const loaded = loadResult.value!;
        expect(loaded).toBeInstanceOf(AutomationResult);
        expect(loaded?.getId()).toBe(result.getId());
        expect(loaded?.getAutomationVariablesId()).toBe('variables-123');
        expect(loaded?.getExecutionStatus()).toBe(EXECUTION_STATUS.SUCCESS);
      },
      mockIdGenerator
    );

    it('should return null if automation result not found', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEYS.AUTOMATION_RESULTS]: [],
      });

      const loadResult = await repository.load('nonexistent');

      expect(loadResult.isSuccess).toBe(true);
      expect(loadResult.value).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('No automation result found')
      );
    });

    it('should return failure if load fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const loadResult = await repository.load('result-123');

      expect(loadResult.isFailure).toBe(true);
      expect(loadResult.error).toBeInstanceOf(Error);
      expect(loadResult.error!.message).toBe('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load automation result',
        expect.any(Error)
      );
    });
  });

  describe('loadAll', () => {
    it(
      'should load all automation results',
      async () => {
        const result1 = AutomationResult.create(
          {
            automationVariablesId: 'variables-001',
            executionStatus: EXECUTION_STATUS.SUCCESS,
          },
          mockIdGenerator
        );

        const result2 = AutomationResult.create(
          {
            automationVariablesId: 'variables-002',
            executionStatus: EXECUTION_STATUS.FAILED,
          },
          mockIdGenerator
        );

        (browser.storage.local.get as jest.Mock).mockResolvedValue({
          [STORAGE_KEYS.AUTOMATION_RESULTS]: [result1.toData(), result2.toData()],
        });

        const loadResult = await repository.loadAll();

        expect(loadResult.isSuccess).toBe(true);
        const results = loadResult.value!;
        expect(results).toHaveLength(2);
        expect(results[0].getId()).toBe(result1.getId());
        expect(results[1].getId()).toBe(result2.getId());
        expect(mockLogger.info).toHaveBeenCalledWith('Loading all automation results');
      },
      mockIdGenerator
    );

    it('should return empty array if no automation results exist', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      const loadResult = await repository.loadAll();

      expect(loadResult.isSuccess).toBe(true);
      expect(loadResult.value).toEqual([]);
    });

    it('should return failure if loadAll fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const loadResult = await repository.loadAll();

      expect(loadResult.isFailure).toBe(true);
      expect(loadResult.error).toBeInstanceOf(Error);
      expect(loadResult.error!.message).toBe('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load all automation results',
        expect.any(Error)
      );
    });
  });

  describe('loadByAutomationVariablesId', () => {
    it('should load results for specific automation variables', async () => {
      const result1 = AutomationResult.create(
        {
          automationVariablesId: 'variables-123',
        },
        mockIdGenerator
      );

      const result2 = AutomationResult.create(
        {
          automationVariablesId: 'variables-123',
        },
        mockIdGenerator
      );

      const result3 = AutomationResult.create(
        {
          automationVariablesId: 'variables-456',
        },
        mockIdGenerator
      );

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEYS.AUTOMATION_RESULTS]: [result1.toData(), result2.toData(), result3.toData()],
      });

      const loadResult = await repository.loadByAutomationVariablesId('variables-123');

      expect(loadResult.isSuccess).toBe(true);
      const results = loadResult.value!;
      expect(results).toHaveLength(2);
      expect(results[0].getAutomationVariablesId()).toBe('variables-123');
      expect(results[1].getAutomationVariablesId()).toBe('variables-123');
    });

    it('should sort results by startFrom descending', async () => {
      // Create results with different start times (oldest to newest)
      const oldResult = new AutomationResult({
        id: 'result-1',
        automationVariablesId: 'variables-123',
        executionStatus: EXECUTION_STATUS.SUCCESS,
        resultDetail: 'Old',
        startFrom: '2025-10-15T09:00:00.000Z',
        endTo: null,
        currentStepIndex: 0,
        totalSteps: 1,
        lastExecutedUrl: 'https://example.com',
      });

      const newResult = new AutomationResult({
        id: 'result-2',
        automationVariablesId: 'variables-123',
        executionStatus: EXECUTION_STATUS.SUCCESS,
        resultDetail: 'New',
        startFrom: '2025-10-15T11:00:00.000Z',
        endTo: null,
        currentStepIndex: 0,
        totalSteps: 1,
        lastExecutedUrl: 'https://example.com',
      });

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEYS.AUTOMATION_RESULTS]: [oldResult.toData(), newResult.toData()],
      });

      const loadResult = await repository.loadByAutomationVariablesId('variables-123');

      expect(loadResult.isSuccess).toBe(true);
      const results = loadResult.value!;
      // Should be sorted newest first
      expect(results[0].getResultDetail()).toBe('New');
      expect(results[1].getResultDetail()).toBe('Old');
    });

    it('should return empty array if no results found', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEYS.AUTOMATION_RESULTS]: [],
      });

      const loadResult = await repository.loadByAutomationVariablesId('variables-123');

      expect(loadResult.isSuccess).toBe(true);
      expect(loadResult.value).toEqual([]);
    });

    it('should return failure if load fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const loadResult = await repository.loadByAutomationVariablesId('variables-123');

      expect(loadResult.isFailure).toBe(true);
      expect(loadResult.error).toBeInstanceOf(Error);
      expect(loadResult.error!.message).toBe('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load automation results by variables ID',
        expect.any(Error)
      );
    });
  });

  describe('loadLatestByAutomationVariablesId', () => {
    it('should load latest result for specific automation variables', async () => {
      const oldResult = new AutomationResult({
        id: 'result-1',
        automationVariablesId: 'variables-123',
        executionStatus: EXECUTION_STATUS.SUCCESS,
        resultDetail: 'Old',
        startFrom: '2025-10-15T09:00:00.000Z',
        endTo: null,
        currentStepIndex: 0,
        totalSteps: 1,
        lastExecutedUrl: 'https://example.com',
      });

      const newResult = new AutomationResult({
        id: 'result-2',
        automationVariablesId: 'variables-123',
        executionStatus: EXECUTION_STATUS.SUCCESS,
        resultDetail: 'Latest',
        startFrom: '2025-10-15T11:00:00.000Z',
        endTo: null,
        currentStepIndex: 0,
        totalSteps: 1,
        lastExecutedUrl: 'https://example.com',
      });

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEYS.AUTOMATION_RESULTS]: [oldResult.toData(), newResult.toData()],
      });

      const loadResult = await repository.loadLatestByAutomationVariablesId('variables-123');

      expect(loadResult.isSuccess).toBe(true);
      const result = loadResult.value!;
      expect(result).toBeInstanceOf(AutomationResult);
      expect(result?.getResultDetail()).toBe('Latest');
    });

    it('should return null if no results found', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEYS.AUTOMATION_RESULTS]: [],
      });

      const loadResult = await repository.loadLatestByAutomationVariablesId('variables-123');

      expect(loadResult.isSuccess).toBe(true);
      expect(loadResult.value).toBeNull();
    });

    it('should return failure if load fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const loadResult = await repository.loadLatestByAutomationVariablesId('variables-123');

      expect(loadResult.isFailure).toBe(true);
      expect(loadResult.error).toBeInstanceOf(Error);
      expect(loadResult.error!.message).toBe('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load automation results by variables ID',
        expect.any(Error)
      );
    });
  });

  describe('delete', () => {
    it('should delete automation result by id', async () => {
      const result1 = AutomationResult.create(
        {
          automationVariablesId: 'variables-001',
        },
        mockIdGenerator
      );
      const result2 = AutomationResult.create(
        {
          automationVariablesId: 'variables-002',
        },
        mockIdGenerator
      );

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEYS.AUTOMATION_RESULTS]: [result1.toData(), result2.toData()],
      });
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      const deleteResult = await repository.delete(result1.getId());

      expect(deleteResult.isSuccess).toBe(true);
      const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0][
        STORAGE_KEYS.AUTOMATION_RESULTS
      ];
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe(result2.getId());
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('deleted'));
    });

    it('should warn if automation result not found to delete', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEYS.AUTOMATION_RESULTS]: [],
      });

      const deleteResult = await repository.delete('nonexistent');

      expect(deleteResult.isSuccess).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('No automation result found to delete')
      );
      expect(browser.storage.local.set).not.toHaveBeenCalled();
    });

    it('should return failure if delete operation fails', async () => {
      const result = AutomationResult.create(
        {
          automationVariablesId: 'variables-123',
        },
        mockIdGenerator
      );

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEYS.AUTOMATION_RESULTS]: [result.toData()],
      });
      (browser.storage.local.set as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const deleteResult = await repository.delete(result.getId());

      expect(deleteResult.isFailure).toBe(true);
      expect(deleteResult.error).toBeInstanceOf(Error);
      expect(deleteResult.error!.message).toBe('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to delete automation result',
        expect.any(Error)
      );
    });
  });

  describe('deleteByAutomationVariablesId', () => {
    it('should delete all results for specific automation variables', async () => {
      const result1 = AutomationResult.create(
        {
          automationVariablesId: 'variables-123',
        },
        mockIdGenerator
      );
      const result2 = AutomationResult.create(
        {
          automationVariablesId: 'variables-123',
        },
        mockIdGenerator
      );
      const result3 = AutomationResult.create(
        {
          automationVariablesId: 'variables-456',
        },
        mockIdGenerator
      );

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEYS.AUTOMATION_RESULTS]: [result1.toData(), result2.toData(), result3.toData()],
      });
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      const deleteResult = await repository.deleteByAutomationVariablesId('variables-123');

      expect(deleteResult.isSuccess).toBe(true);
      const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0][
        STORAGE_KEYS.AUTOMATION_RESULTS
      ];
      expect(savedData).toHaveLength(1);
      expect(savedData[0].automationVariablesId).toBe('variables-456');
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Automation results deleted for variables')
      );
    });

    it('should return failure if delete operation fails', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEYS.AUTOMATION_RESULTS]: [],
      });
      (browser.storage.local.set as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const deleteResult = await repository.deleteByAutomationVariablesId('variables-123');

      expect(deleteResult.isFailure).toBe(true);
      expect(deleteResult.error).toBeInstanceOf(Error);
      expect(deleteResult.error!.message).toBe('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to delete automation results by variables ID',
        expect.any(Error)
      );
    });
  });
});
