/**
 * Unit Tests: ExecuteAutoFillUseCase
 */

import { ExecuteAutoFillUseCase } from '../ExecuteAutoFillUseCase';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { AutoFillPort, AutoFillResult } from '@domain/types/auto-fill-port.types';
import { XPathCollection } from '@domain/entities/XPathCollection';
import { VariableCollection } from '@domain/entities/Variable';
import { createTestXPathData } from '@tests/helpers/testHelpers';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AUTOMATION_STATUS } from '@domain/constants/AutomationStatus';
import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';
import { StartTabRecordingUseCase } from '../../recording/StartTabRecordingUseCase';
import { StopTabRecordingUseCase } from '../../recording/StopTabRecordingUseCase';
import { DeleteOldRecordingsUseCase } from '../../recording/DeleteOldRecordingsUseCase';
import { Result } from '@domain/values/result.value';

// Mock chrome.tabs API
global.chrome = {
  ...global.chrome,
  tabs: {
    ...global.chrome?.tabs,
    onRemoved: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
} as any;

describe('ExecuteAutoFillUseCase', () => {
  let mockRepository: jest.Mocked<XPathRepository>;
  let mockAutoFillPort: jest.Mocked<AutoFillPort>;
  let mockAutomationVariablesRepository: jest.Mocked<AutomationVariablesRepository>;
  let mockAutomationResultRepository: jest.Mocked<AutomationResultRepository>;
  let mockStartRecordingUseCase: jest.Mocked<StartTabRecordingUseCase>;
  let mockStopRecordingUseCase: jest.Mocked<StopTabRecordingUseCase>;
  let mockDeleteOldRecordingsUseCase: jest.Mocked<DeleteOldRecordingsUseCase>;
  let useCase: ExecuteAutoFillUseCase;

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn(),
      loadByWebsiteId: jest.fn(),
      loadFromBatch: jest.fn(),
    };

    mockAutoFillPort = {
      executeAutoFill: jest.fn(),
      executeAutoFillWithProgress: jest.fn(),
    };

    mockAutomationVariablesRepository = {
      load: jest.fn(),
      save: jest.fn(),
      loadAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      loadFromBatch: jest.fn(),
    };

    mockAutomationResultRepository = {
      save: jest.fn(),
      load: jest.fn(),
      loadAll: jest.fn(),
      loadByStatus: jest.fn(),
      loadInProgress: jest.fn(),
      loadByAutomationVariablesId: jest.fn(),
      loadLatestByAutomationVariablesId: jest.fn(),
      delete: jest.fn(),
      deleteByAutomationVariablesId: jest.fn(),
      loadInProgressFromBatch: jest.fn(),
    };

    mockStartRecordingUseCase = {
      execute: jest.fn().mockResolvedValue(null),
    } as any;

    mockStopRecordingUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockDeleteOldRecordingsUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as any;

    useCase = new ExecuteAutoFillUseCase(
      mockRepository,
      mockAutoFillPort,
      mockAutomationVariablesRepository,
      mockAutomationResultRepository,
      mockStartRecordingUseCase,
      mockStopRecordingUseCase,
      mockDeleteOldRecordingsUseCase
    );
  });

  describe('execute', () => {
    it('should execute auto-fill with all XPaths when no websiteId provided', async () => {
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData({ value: 'test1', websiteId: 'site1' }));
      collection = collection.add(createTestXPathData({ value: 'test2', websiteId: 'site2' }));

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockAutomationResultRepository.loadInProgress.mockResolvedValue(Result.success([]));
      const mockResult: AutoFillResult = { success: true, processedSteps: 2 };
      mockAutoFillPort.executeAutoFill.mockResolvedValue(mockResult);

      const result = await useCase.execute({
        tabId: 123,
        url: 'https://example.com',
      });

      expect(result).toEqual(mockResult);
      expect(mockAutoFillPort.executeAutoFill).toHaveBeenCalledWith(
        123,
        expect.any(Array),
        'https://example.com',
        expect.any(VariableCollection)
      );
      expect(mockAutoFillPort.executeAutoFill).toHaveBeenCalledWith(
        123,
        expect.arrayContaining([
          expect.objectContaining({ value: 'test1' }),
          expect.objectContaining({ value: 'test2' }),
        ]),
        'https://example.com',
        expect.any(VariableCollection)
      );
    });

    it('should execute auto-fill with filtered XPaths when websiteId provided', async () => {
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData({ value: 'test1', websiteId: 'site1' }));
      collection = collection.add(createTestXPathData({ value: 'test2', websiteId: 'site2' }));

      const automationVariables = AutomationVariables.create({
        websiteId: 'site1',
        status: AUTOMATION_STATUS.ENABLED,
      });

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.loadByWebsiteId.mockResolvedValue(
        Result.success(collection.getByWebsiteId('site1'))
      );
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(automationVariables));
      mockAutomationResultRepository.loadInProgress.mockResolvedValue(Result.success([]));
      mockAutomationResultRepository.save.mockResolvedValue(Result.success(undefined));
      const mockResult: AutoFillResult = { success: true, processedSteps: 1 };
      mockAutoFillPort.executeAutoFill.mockResolvedValue(mockResult);
      mockAutoFillPort.executeAutoFillWithProgress.mockResolvedValue(mockResult);

      const result = await useCase.execute({
        tabId: 123,
        url: 'https://example.com',
        websiteId: 'site1',
      });

      expect(result).toEqual(mockResult);
      // Should use executeAutoFillWithProgress when automationVariables exist
      expect(mockAutoFillPort.executeAutoFillWithProgress).toHaveBeenCalledWith(
        123,
        expect.arrayContaining([expect.objectContaining({ value: 'test1', websiteId: 'site1' })]),
        'https://example.com',
        expect.any(VariableCollection),
        expect.any(Object), // AutomationResult
        0 // startOffset
      );
      const calledXPaths = (mockAutoFillPort.executeAutoFillWithProgress as jest.Mock).mock
        .calls[0][1];
      expect(calledXPaths).toHaveLength(1);
    });

    it('should return error when no XPaths configured', async () => {
      const collection = new XPathCollection();
      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockAutomationResultRepository.loadInProgress.mockResolvedValue(Result.success([]));

      const result = await useCase.execute({
        tabId: 123,
        url: 'https://example.com',
      });

      expect(result).toEqual({
        success: false,
        processedSteps: 0,
        error: 'No XPaths configured',
      });
      expect(mockAutoFillPort.executeAutoFill).not.toHaveBeenCalled();
    });

    it('should return specific error when no XPaths for websiteId', async () => {
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData({ value: 'test1', websiteId: 'site1' }));
      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.loadByWebsiteId.mockResolvedValue(Result.success([]));
      mockAutomationResultRepository.loadInProgress.mockResolvedValue(Result.success([]));
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(null));

      const result = await useCase.execute({
        tabId: 123,
        url: 'https://example.com',
        websiteId: 'site2',
      });

      expect(result).toEqual({
        success: false,
        processedSteps: 0,
        error: 'No XPaths configured for this website',
      });
      expect(mockAutoFillPort.executeAutoFill).not.toHaveBeenCalled();
    });

    it('should use provided variables', async () => {
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData({ value: '{{userName}}' }));

      const variables = new VariableCollection();
      variables.add({ name: 'userName', value: 'testUser' });

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockAutomationResultRepository.loadInProgress.mockResolvedValue(Result.success([]));
      const mockResult: AutoFillResult = { success: true, processedSteps: 1 };
      mockAutoFillPort.executeAutoFill.mockResolvedValue(mockResult);

      const result = await useCase.execute({
        tabId: 123,
        url: 'https://example.com',
        variables,
      });

      expect(result).toEqual(mockResult);
      expect(mockAutoFillPort.executeAutoFill).toHaveBeenCalledWith(
        123,
        expect.any(Array),
        'https://example.com',
        variables
      );
    });

    it('should use empty variable collection when not provided', async () => {
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData({ value: 'test' }));

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockAutomationResultRepository.loadInProgress.mockResolvedValue(Result.success([]));
      const mockResult: AutoFillResult = { success: true, processedSteps: 1 };
      mockAutoFillPort.executeAutoFill.mockResolvedValue(mockResult);

      await useCase.execute({
        tabId: 123,
        url: 'https://example.com',
      });

      const calledVariables = (mockAutoFillPort.executeAutoFill as jest.Mock).mock.calls[0][3];
      expect(calledVariables).toBeInstanceOf(VariableCollection);
      expect(calledVariables.getAll()).toHaveLength(0);
    });
  });

  describe('AutomationResult Tracking', () => {
    it('should create and save AutomationResult on successful execution', async () => {
      const websiteId = 'test-website';
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData({ value: 'test', websiteId }));

      const automationVariables = AutomationVariables.create({
        websiteId,
        status: AUTOMATION_STATUS.ENABLED,
      });

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.loadByWebsiteId.mockResolvedValue(
        Result.success(collection.getByWebsiteId(websiteId))
      );
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(automationVariables));
      mockAutomationResultRepository.loadInProgress.mockResolvedValue(Result.success([]));
      mockAutomationResultRepository.save.mockResolvedValue(Result.success(undefined));
      mockAutomationResultRepository.load.mockResolvedValue(Result.success(null));
      const mockResult: AutoFillResult = { success: true, processedSteps: 5 };
      mockAutoFillPort.executeAutoFill.mockResolvedValue(mockResult);
      mockAutoFillPort.executeAutoFillWithProgress.mockResolvedValue(mockResult);

      await useCase.execute({
        tabId: 123,
        url: 'https://example.com',
        websiteId,
      });

      // Should save AutomationResult twice (start and end)
      expect(mockAutomationResultRepository.save).toHaveBeenCalledTimes(2);

      // First save: DOING state
      const firstSave = (mockAutomationResultRepository.save as jest.Mock).mock.calls[0][0];
      expect(firstSave.getExecutionStatus()).toBe('doing');
      expect(firstSave.getAutomationVariablesId()).toBe(automationVariables.getWebsiteId());

      // Second save: SUCCESS state
      const secondSave = (mockAutomationResultRepository.save as jest.Mock).mock.calls[1][0];
      expect(secondSave.getExecutionStatus()).toBe('success');
      expect(secondSave.getResultDetail()).toContain('Successfully processed 5 steps');
    });

    it('should create and save AutomationResult on failed execution', async () => {
      const websiteId = 'test-website';
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData({ value: 'test', websiteId }));

      const automationVariables = AutomationVariables.create({
        websiteId,
        status: AUTOMATION_STATUS.ENABLED,
      });

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.loadByWebsiteId.mockResolvedValue(
        Result.success(collection.getByWebsiteId(websiteId))
      );
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(automationVariables));
      mockAutomationResultRepository.loadInProgress.mockResolvedValue(Result.success([]));
      mockAutomationResultRepository.save.mockResolvedValue(Result.success(undefined));
      mockAutomationResultRepository.load.mockResolvedValue(Result.success(null));
      const mockResult: AutoFillResult = {
        success: false,
        processedSteps: 2,
        failedStep: 3,
        error: 'Element not found',
      };
      mockAutoFillPort.executeAutoFill.mockResolvedValue(mockResult);
      mockAutoFillPort.executeAutoFillWithProgress.mockResolvedValue(mockResult);

      await useCase.execute({
        tabId: 123,
        url: 'https://example.com',
        websiteId,
      });

      // Should save AutomationResult twice (start and end)
      expect(mockAutomationResultRepository.save).toHaveBeenCalledTimes(2);

      // Second save: FAILED state
      const secondSave = (mockAutomationResultRepository.save as jest.Mock).mock.calls[1][0];
      expect(secondSave.getExecutionStatus()).toBe('failed');
      expect(secondSave.getResultDetail()).toBe('Element not found');
    });

    it('should not create AutomationResult when no websiteId provided', async () => {
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData({ value: 'test' }));

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockAutomationResultRepository.loadInProgress.mockResolvedValue(Result.success([]));
      const mockResult: AutoFillResult = { success: true, processedSteps: 1 };
      mockAutoFillPort.executeAutoFill.mockResolvedValue(mockResult);

      await useCase.execute({
        tabId: 123,
        url: 'https://example.com',
      });

      // Should not save AutomationResult when no websiteId
      expect(mockAutomationResultRepository.save).not.toHaveBeenCalled();
    });

    it('should not create AutomationResult when automationVariables do not exist', async () => {
      const websiteId = 'test-website';
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData({ value: 'test', websiteId }));

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.loadByWebsiteId.mockResolvedValue(
        Result.success(collection.getByWebsiteId(websiteId))
      );
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(null));
      mockAutomationResultRepository.loadInProgress.mockResolvedValue(Result.success([]));
      const mockResult: AutoFillResult = { success: true, processedSteps: 1 };
      mockAutoFillPort.executeAutoFill.mockResolvedValue(mockResult);

      await useCase.execute({
        tabId: 123,
        url: 'https://example.com',
        websiteId,
      });

      // Should not save AutomationResult when automationVariables don't exist
      expect(mockAutomationResultRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Status Management (Business Rule)', () => {
    it('should change status from "once" to "disabled" after successful execution', async () => {
      const websiteId = 'test-website';
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData({ value: 'test', websiteId }));

      const automationVariables = AutomationVariables.create({
        websiteId,
        status: AUTOMATION_STATUS.ONCE,
      });

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.loadByWebsiteId.mockResolvedValue(
        Result.success(collection.getByWebsiteId(websiteId))
      );
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(automationVariables));
      mockAutomationVariablesRepository.save.mockResolvedValue(Result.success(undefined));
      mockAutomationResultRepository.loadInProgress.mockResolvedValue(Result.success([]));
      mockAutomationResultRepository.save.mockResolvedValue(Result.success(undefined));
      mockAutomationResultRepository.load.mockResolvedValue(Result.success(null));
      const mockResult: AutoFillResult = { success: true, processedSteps: 1 };
      mockAutoFillPort.executeAutoFill.mockResolvedValue(mockResult);
      mockAutoFillPort.executeAutoFillWithProgress.mockResolvedValue(mockResult);

      await useCase.execute({
        tabId: 123,
        url: 'https://example.com',
        websiteId,
      });

      // Should load automation variables twice (once for AutomationResult, once for status change)
      expect(mockAutomationVariablesRepository.load).toHaveBeenCalledWith(websiteId);
      expect(mockAutomationVariablesRepository.load).toHaveBeenCalledTimes(2);

      // Should save with status changed to disabled (first save is AutomationResult)
      expect(mockAutomationVariablesRepository.save).toHaveBeenCalledTimes(1);

      const savedAv = (mockAutomationVariablesRepository.save as jest.Mock).mock.calls[0][0];
      expect(savedAv).toBeInstanceOf(AutomationVariables);
      expect(savedAv.getStatus()).toBe(AUTOMATION_STATUS.DISABLED);
      expect(savedAv.data.websiteId).toBe(websiteId);
    });

    it('should not change status when status is not "once"', async () => {
      const websiteId = 'test-website';
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData({ value: 'test', websiteId }));

      const automationVariables = AutomationVariables.create({
        websiteId,
        status: AUTOMATION_STATUS.ENABLED,
      });

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.loadByWebsiteId.mockResolvedValue(
        Result.success(collection.getByWebsiteId(websiteId))
      );
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(automationVariables));
      mockAutomationResultRepository.loadInProgress.mockResolvedValue(Result.success([]));
      mockAutomationResultRepository.save.mockResolvedValue(Result.success(undefined));
      mockAutomationResultRepository.load.mockResolvedValue(Result.success(null));
      const mockResult: AutoFillResult = { success: true, processedSteps: 1 };
      mockAutoFillPort.executeAutoFill.mockResolvedValue(mockResult);
      mockAutoFillPort.executeAutoFillWithProgress.mockResolvedValue(mockResult);

      await useCase.execute({
        tabId: 123,
        url: 'https://example.com',
        websiteId,
      });

      // Should load automation variables (for AutomationResult and status check)
      expect(mockAutomationVariablesRepository.load).toHaveBeenCalledWith(websiteId);

      // Should not save automationVariables because status is not 'once'
      expect(mockAutomationVariablesRepository.save).not.toHaveBeenCalled();
    });

    it('should not change status when execution fails', async () => {
      const websiteId = 'test-website';
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData({ value: 'test', websiteId }));

      const automationVariables = AutomationVariables.create({
        websiteId,
        status: AUTOMATION_STATUS.ONCE,
      });

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.loadByWebsiteId.mockResolvedValue(
        Result.success(collection.getByWebsiteId(websiteId))
      );
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(automationVariables));
      mockAutomationResultRepository.loadInProgress.mockResolvedValue(Result.success([]));
      mockAutomationResultRepository.save.mockResolvedValue(Result.success(undefined));
      mockAutomationResultRepository.load.mockResolvedValue(Result.success(null));
      const mockResult: AutoFillResult = { success: false, processedSteps: 0, error: 'Test error' };
      mockAutoFillPort.executeAutoFill.mockResolvedValue(mockResult);
      mockAutoFillPort.executeAutoFillWithProgress.mockResolvedValue(mockResult);

      await useCase.execute({
        tabId: 123,
        url: 'https://example.com',
        websiteId,
      });

      // Should load automation variables for AutomationResult creation
      expect(mockAutomationVariablesRepository.load).toHaveBeenCalledWith(websiteId);

      // Should not save automationVariables when execution fails (status change only on success)
      expect(mockAutomationVariablesRepository.save).not.toHaveBeenCalled();
    });

    it('should not change status when no websiteId provided', async () => {
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData({ value: 'test' }));

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockAutomationResultRepository.loadInProgress.mockResolvedValue(Result.success([]));
      const mockResult: AutoFillResult = { success: true, processedSteps: 1 };
      mockAutoFillPort.executeAutoFill.mockResolvedValue(mockResult);

      await useCase.execute({
        tabId: 123,
        url: 'https://example.com',
      });

      // Should not attempt to load or save automation variables when no websiteId
      expect(mockAutomationVariablesRepository.load).not.toHaveBeenCalled();
      expect(mockAutomationVariablesRepository.save).not.toHaveBeenCalled();
    });

    it('should not throw error when automation variables do not exist', async () => {
      const websiteId = 'test-website';
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData({ value: 'test', websiteId }));

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.loadByWebsiteId.mockResolvedValue(
        Result.success(collection.getByWebsiteId(websiteId))
      );
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(null));
      mockAutomationResultRepository.loadInProgress.mockResolvedValue(Result.success([]));
      const mockResult: AutoFillResult = { success: true, processedSteps: 1 };
      mockAutoFillPort.executeAutoFill.mockResolvedValue(mockResult);

      const result = await useCase.execute({
        tabId: 123,
        url: 'https://example.com',
        websiteId,
      });

      // Should complete successfully
      expect(result).toEqual(mockResult);
      expect(mockAutomationVariablesRepository.load).toHaveBeenCalledWith(websiteId);
      expect(mockAutomationVariablesRepository.save).not.toHaveBeenCalled();
    });

    it('should not fail overall execution if status update fails', async () => {
      const websiteId = 'test-website';
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData({ value: 'test', websiteId }));

      const automationVariables = AutomationVariables.create({
        websiteId,
        status: AUTOMATION_STATUS.ONCE,
      });

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.loadByWebsiteId.mockResolvedValue(
        Result.success(collection.getByWebsiteId(websiteId))
      );
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(automationVariables));
      mockAutomationVariablesRepository.save.mockResolvedValue(
        Result.failure(new Error('Save failed'))
      );
      mockAutomationResultRepository.loadInProgress.mockResolvedValue(Result.success([]));
      mockAutomationResultRepository.save.mockResolvedValue(Result.success(undefined));
      mockAutomationResultRepository.load.mockResolvedValue(Result.success(null));
      const mockResult: AutoFillResult = { success: true, processedSteps: 1 };
      mockAutoFillPort.executeAutoFill.mockResolvedValue(mockResult);
      mockAutoFillPort.executeAutoFillWithProgress.mockResolvedValue(mockResult);

      const result = await useCase.execute({
        tabId: 123,
        url: 'https://example.com',
        websiteId,
      });

      // Should still return success result even if status update fails
      expect(result).toEqual(mockResult);
    });

    it('should not fail overall execution if AutomationResult save fails', async () => {
      const websiteId = 'test-website';
      let collection = new XPathCollection();
      collection = collection.add(createTestXPathData({ value: 'test', websiteId }));

      const automationVariables = AutomationVariables.create({
        websiteId,
        status: AUTOMATION_STATUS.ENABLED,
      });

      mockRepository.load.mockResolvedValue(Result.success(collection));
      mockRepository.loadByWebsiteId.mockResolvedValue(
        Result.success(collection.getByWebsiteId(websiteId))
      );
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(automationVariables));
      mockAutomationResultRepository.loadInProgress.mockResolvedValue(Result.success([]));

      // First save succeeds, second save fails
      mockAutomationResultRepository.save
        .mockResolvedValueOnce(Result.success(undefined))
        .mockResolvedValueOnce(Result.failure(new Error('Save failed')));

      mockAutomationResultRepository.load.mockResolvedValue(Result.success(null));

      const mockResult: AutoFillResult = { success: true, processedSteps: 1 };
      mockAutoFillPort.executeAutoFill.mockResolvedValue(mockResult);
      mockAutoFillPort.executeAutoFillWithProgress.mockResolvedValue(mockResult);

      const result = await useCase.execute({
        tabId: 123,
        url: 'https://example.com',
        websiteId,
      });

      // Should still return success result even if AutomationResult save fails
      expect(result).toEqual(mockResult);
    });
  });
});
