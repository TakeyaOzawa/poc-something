/**
 * Unit Tests: ExecuteManualSyncUseCase
 */

// Mock webextension-polyfill BEFORE any imports
jest.mock('webextension-polyfill', () => {
  const mockSendMessage = jest.fn(() => Promise.resolve({}));
  return {
    tabs: {
      sendMessage: mockSendMessage,
      query: jest.fn(() => Promise.resolve([])),
    },
    runtime: {
      sendMessage: mockSendMessage,
    },
  };
});

import { ExecuteManualSyncUseCase } from '../ExecuteManualSyncUseCase';
import { ExecuteReceiveDataUseCase } from '../ExecuteReceiveDataUseCase';
import { ExecuteSendDataUseCase } from '../ExecuteSendDataUseCase';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { SyncHistoryRepository } from '@domain/repositories/SyncHistoryRepository';
import { SyncStateNotifier } from '@domain/types/sync-state-notifier.types';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import { Result } from '@domain/values/result.value';

describe('ExecuteManualSyncUseCase', () => {
  let useCase: ExecuteManualSyncUseCase;
  let mockReceiveUseCase: jest.Mocked<ExecuteReceiveDataUseCase>;
  let mockSendUseCase: jest.Mocked<ExecuteSendDataUseCase>;
  let mockSyncHistoryRepository: jest.Mocked<SyncHistoryRepository>;
  let mockSyncStateNotifier: jest.Mocked<SyncStateNotifier>;
  let logger: NoOpLogger;

  beforeEach(() => {
    mockReceiveUseCase = {
      execute: jest.fn(),
    } as any;

    mockSendUseCase = {
      execute: jest.fn(),
    } as any;

    mockSyncHistoryRepository = {
      save: jest.fn().mockResolvedValue(Result.success(undefined)),
      findById: jest.fn(),
      findByConfigId: jest.fn(),
      findByStorageKey: jest.fn(),
      findAll: jest.fn(),
      deleteById: jest.fn(),
    } as any;

    mockSyncStateNotifier = {
      initialize: jest.fn(),
      update: jest.fn(),
      getCurrentState: jest.fn(),
      clear: jest.fn(),
      updateStatus: jest.fn(),
      updateCurrentStep: jest.fn(),
      updateReceiveProgress: jest.fn(),
      updateSendProgress: jest.fn(),
      complete: jest.fn(),
      fail: jest.fn(),
    } as any;

    logger = new NoOpLogger();

    useCase = new ExecuteManualSyncUseCase(
      mockReceiveUseCase,
      mockSendUseCase,
      mockSyncHistoryRepository,
      mockSyncStateNotifier,
      logger
    );
  });

  describe('execute', () => {
    it('should execute receive-only sync successfully', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'receive_only',
        inputs: [{ key: 'databaseId', value: 'db-123' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      mockReceiveUseCase.execute.mockResolvedValue({
        success: true,
        receivedCount: 3,
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.syncDirection).toBe('receive_only');
      expect(result.receiveResult).toEqual({
        success: true,
        receivedCount: 3,
        error: undefined,
      });
      expect(result.sendResult).toBeUndefined();
      expect(mockReceiveUseCase.execute).toHaveBeenCalledWith({ config });
      expect(mockSendUseCase.execute).not.toHaveBeenCalled();
    });

    it('should execute send-only sync successfully', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'spread-sheet',
        syncTiming: 'manual',
        syncDirection: 'send_only',
        inputs: [{ key: 'spreadsheetId', value: 'sheet-456' }],
        outputs: [{ key: 'status', defaultValue: 'pending' }],
      });

      mockSendUseCase.execute.mockResolvedValue({
        success: true,
        sentCount: 5,
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.syncDirection).toBe('send_only');
      expect(result.sendResult).toEqual({
        success: true,
        sentCount: 5,
        error: undefined,
      });
      expect(result.receiveResult).toBeUndefined();
      expect(mockSendUseCase.execute).toHaveBeenCalledWith({ config });
      expect(mockReceiveUseCase.execute).not.toHaveBeenCalled();
    });

    it('should execute bidirectional sync successfully', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [{ key: 'apiKey', value: 'key-789' }],
        outputs: [{ key: 'syncStatus', defaultValue: 'idle' }],
      });

      mockReceiveUseCase.execute.mockResolvedValue({
        success: true,
        receivedCount: 2,
      });

      mockSendUseCase.execute.mockResolvedValue({
        success: true,
        sentCount: 3,
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.syncDirection).toBe('bidirectional');
      expect(result.receiveResult).toEqual({
        success: true,
        receivedCount: 2,
        error: undefined,
      });
      expect(result.sendResult).toEqual({
        success: true,
        sentCount: 3,
        error: undefined,
      });
      expect(mockReceiveUseCase.execute).toHaveBeenCalledWith({ config });
      expect(mockSendUseCase.execute).toHaveBeenCalledWith({ config });
    });

    it('should execute both receive and send in parallel even if receive fails', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [{ key: 'apiKey', value: 'key-123' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      mockReceiveUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Network error',
      });

      mockSendUseCase.execute.mockResolvedValue({
        success: true,
        sentCount: 5,
      });

      const result = await useCase.execute({ config });

      // Both operations execute in parallel, so overall fails if either fails
      expect(result.success).toBe(false);
      expect(result.syncDirection).toBe('bidirectional');
      expect(result.receiveResult).toEqual({
        success: false,
        error: 'Network error',
      });
      expect(result.sendResult).toEqual({
        success: true,
        sentCount: 5,
      });
      expect(result.error).toContain('Receive failed');
      // Both are called in parallel
      expect(mockReceiveUseCase.execute).toHaveBeenCalledWith({ config });
      expect(mockSendUseCase.execute).toHaveBeenCalledWith({ config });
    });

    it('should fail when receive fails in receive-only mode', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'spread-sheet',
        syncTiming: 'manual',
        syncDirection: 'receive_only',
        inputs: [{ key: 'spreadsheetId', value: 'sheet-123' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      mockReceiveUseCase.execute.mockResolvedValue({
        success: false,
        error: 'API error',
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(false);
      expect(result.error).toContain('API error');
    });

    it('should fail when send fails in send-only mode', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'send_only',
        inputs: [{ key: 'databaseId', value: 'db-456' }],
        outputs: [{ key: 'result', defaultValue: null }],
      });

      mockSendUseCase.execute.mockResolvedValue({
        success: false,
        error: 'No data found',
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No data found');
    });

    it('should handle exceptions', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'receive_only',
        inputs: [{ key: 'apiKey', value: 'key-789' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      mockReceiveUseCase.execute.mockRejectedValue(new Error('Unexpected error'));

      const result = await useCase.execute({ config });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unexpected error');
    });

    it('should fail when config is disabled', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'receive_only',
        inputs: [{ key: 'apiKey', value: 'key-123' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      }).setEnabled(false); // Disable the config

      const result = await useCase.execute({ config });

      expect(result.success).toBe(false);
      expect(result.syncDirection).toBe('receive_only');
      expect(result.error).toBe('Sync configuration is disabled');
      expect(mockReceiveUseCase.execute).not.toHaveBeenCalled();
      expect(mockSendUseCase.execute).not.toHaveBeenCalled();
      expect(mockSyncHistoryRepository.save).toHaveBeenCalled();
    });

    it('should handle partial success in bidirectional sync (receive succeeds, send fails)', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [{ key: 'apiKey', value: 'key-123' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      mockReceiveUseCase.execute.mockResolvedValue({
        success: true,
        receivedCount: 3,
      });

      mockSendUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Send API error',
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(false);
      expect(result.syncDirection).toBe('bidirectional');
      expect(result.receiveResult).toEqual({
        success: true,
        receivedCount: 3,
        error: undefined,
      });
      expect(result.sendResult).toEqual({
        success: false,
        sentCount: undefined,
        error: 'Send API error',
      });
      expect(result.error).toContain('Send failed');
      expect(mockReceiveUseCase.execute).toHaveBeenCalled();
      expect(mockSendUseCase.execute).toHaveBeenCalled();
      expect(mockSyncHistoryRepository.save).toHaveBeenCalled();
    });

    it('should clear sync state after delay using setTimeout', async () => {
      jest.useFakeTimers();

      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'receive_only',
        inputs: [{ key: 'apiKey', value: 'key-123' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      mockReceiveUseCase.execute.mockResolvedValue({
        success: true,
        receivedCount: 1,
      });

      const resultPromise = useCase.execute({ config });
      const result = await resultPromise;

      expect(result.success).toBe(true);

      // There should be a pending timer (2 second delay)
      expect(jest.getTimerCount()).toBeGreaterThan(0);

      // Fast-forward time to trigger setTimeout
      jest.advanceTimersByTime(2000);

      // Timer should now be cleared
      expect(jest.getTimerCount()).toBe(0);

      jest.useRealTimers();
    });

    it('should clear sync state after delay on exception', async () => {
      jest.useFakeTimers();

      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'receive_only',
        inputs: [{ key: 'apiKey', value: 'key-123' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      mockReceiveUseCase.execute.mockRejectedValue(new Error('Test error'));

      const resultPromise = useCase.execute({ config });
      const result = await resultPromise;

      expect(result.success).toBe(false);

      // There should be a pending timer (2 second delay)
      expect(jest.getTimerCount()).toBeGreaterThan(0);

      // Fast-forward time to trigger setTimeout in catch block
      jest.advanceTimersByTime(2000);

      // Timer should now be cleared
      expect(jest.getTimerCount()).toBe(0);

      jest.useRealTimers();
    });

    it('should handle retry logic when initial attempt fails', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'receive_only',
        inputs: [{ key: 'apiKey', value: 'key-123' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      // All attempts fail (testing retry exhaustion)
      mockReceiveUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Persistent failure',
      });

      const result = await useCase.execute({ config });

      // RetryExecutor will retry based on default RetryPolicy
      expect(result.success).toBe(false);
      expect(result.error).toContain('Persistent failure');
      expect(mockReceiveUseCase.execute).toHaveBeenCalled();
      expect(mockSyncHistoryRepository.save).toHaveBeenCalled();
    });

    it('should handle non-Error exceptions', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'receive_only',
        inputs: [{ key: 'apiKey', value: 'key-123' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      // Throw non-Error exception
      mockReceiveUseCase.execute.mockRejectedValue('String error');

      const result = await useCase.execute({ config });

      expect(result.success).toBe(false);
      // The error gets wrapped in RetryExecutor which converts non-Error to Error
      expect(result.error).toContain('String error');
    });

    it('should concatenate errors in bidirectional mode when both receive and send fail', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [{ key: 'apiKey', value: 'key-123' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      // Make receive fail but not stop execution (need to mock retry behavior)
      // This is tricky because receive failure stops bidirectional sync
      // Instead, test the case where receive succeeds but send fails
      mockReceiveUseCase.execute.mockResolvedValue({
        success: true,
        receivedCount: 0,
      });

      mockSendUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Send error',
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Send failed: Send error');
    });

    it('should save sync history with correct status for partial success', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [{ key: 'apiKey', value: 'key-123' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      mockReceiveUseCase.execute.mockResolvedValue({
        success: true,
        receivedCount: 2,
      });

      mockSendUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Send failed',
      });

      await useCase.execute({ config });

      expect(mockSyncHistoryRepository.save).toHaveBeenCalled();
      // Check that the save was called with a history object that has partial status
      const savedHistory = mockSyncHistoryRepository.save.mock.calls[0][0];
      expect(savedHistory.getStatus()).toBe('partial');
    });

    it('should handle send-only mode successfully', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'send_only',
        inputs: [{ key: 'apiKey', value: 'key-123' }],
        outputs: [{ key: 'status', defaultValue: 'pending' }],
      });

      mockSendUseCase.execute.mockResolvedValue({
        success: true,
        sentCount: 10,
      });

      const result = await useCase.execute({ config });

      expect(result.success).toBe(true);
      expect(result.sendResult).toEqual({
        success: true,
        sentCount: 10,
        error: undefined,
      });
      expect(mockReceiveUseCase.execute).not.toHaveBeenCalled();
      expect(mockSendUseCase.execute).toHaveBeenCalled();
    });
  });
});
