/**
 * Unit Tests: ExecuteScheduledSyncUseCase
 */

import { ExecuteScheduledSyncUseCase } from '../ExecuteScheduledSyncUseCase';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { SchedulerPort } from '@domain/types/scheduler-port.types';
import { ExecuteManualSyncUseCase } from '../ExecuteManualSyncUseCase';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import { Result } from '@domain/values/result.value';

describe('ExecuteScheduledSyncUseCase', () => {
  let useCase: ExecuteScheduledSyncUseCase;
  let mockRepository: jest.Mocked<StorageSyncConfigRepository>;
  let mockScheduler: jest.Mocked<SchedulerPort>;
  let mockManualSyncUseCase: jest.Mocked<ExecuteManualSyncUseCase>;
  let logger: NoOpLogger;

  beforeEach(() => {
    mockRepository = {
      loadAllEnabledPeriodic: jest.fn(),
      save: jest.fn(),
      load: jest.fn(),
      loadByStorageKey: jest.fn(),
      loadAll: jest.fn(),
      delete: jest.fn(),
      deleteByStorageKey: jest.fn(),
      exists: jest.fn(),
      existsByStorageKey: jest.fn(),
    } as any;

    mockScheduler = {
      scheduleRepeating: jest.fn(),
      cancel: jest.fn(),
      cancelAll: jest.fn(),
    } as any;

    mockManualSyncUseCase = {
      execute: jest.fn(),
    } as any;

    logger = new NoOpLogger();

    useCase = new ExecuteScheduledSyncUseCase(
      mockRepository,
      mockScheduler,
      mockManualSyncUseCase,
      logger
    );
  });

  describe('scheduleAllPeriodicSyncs', () => {
    it('should schedule all enabled periodic sync configurations', async () => {
      const config1 = StorageSyncConfig.create({
        storageKey: 'data1',
        syncMethod: 'notion',
        syncTiming: 'periodic',
        syncDirection: 'bidirectional',
        syncIntervalSeconds: 300,
        inputs: [{ key: 'apiKey', value: 'test-token' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      const config2 = StorageSyncConfig.create({
        storageKey: 'data2',
        syncMethod: 'notion',
        syncTiming: 'periodic',
        syncDirection: 'receive_only',
        syncIntervalSeconds: 600,
        inputs: [{ key: 'apiKey', value: 'test-token-2' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      mockRepository.loadAllEnabledPeriodic.mockResolvedValue(Result.success([config1, config2]));
      mockScheduler.scheduleRepeating.mockResolvedValue();

      const result = await useCase.scheduleAllPeriodicSyncs({});

      expect(result.success).toBe(true);
      expect(result.scheduledCount).toBe(2);
      expect(mockScheduler.scheduleRepeating).toHaveBeenCalledTimes(2);
      expect(useCase.getActiveScheduleCount()).toBe(2);
    });

    it('should return success with zero count when no configs found', async () => {
      mockRepository.loadAllEnabledPeriodic.mockResolvedValue(Result.success([]));

      const result = await useCase.scheduleAllPeriodicSyncs({});

      expect(result.success).toBe(true);
      expect(result.scheduledCount).toBe(0);
    });

    it('should skip already scheduled configs', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'data1',
        syncMethod: 'notion',
        syncTiming: 'periodic',
        syncDirection: 'receive_only',
        syncIntervalSeconds: 300,
        inputs: [{ key: 'apiKey', value: 'test-token' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      mockRepository.loadAllEnabledPeriodic.mockResolvedValue(Result.success([config]));
      mockScheduler.scheduleRepeating.mockResolvedValue();

      await useCase.scheduleAllPeriodicSyncs({});
      expect(mockScheduler.scheduleRepeating).toHaveBeenCalledTimes(1);

      await useCase.scheduleAllPeriodicSyncs({});
      expect(mockScheduler.scheduleRepeating).toHaveBeenCalledTimes(1);
    });

    it('should execute manual sync when scheduled callback is invoked', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'data1',
        syncMethod: 'notion',
        syncTiming: 'periodic',
        syncDirection: 'receive_only',
        syncIntervalSeconds: 300,
        inputs: [{ key: 'apiKey', value: 'test-token' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      mockRepository.loadAllEnabledPeriodic.mockResolvedValue(Result.success([config]));

      let scheduledCallback: (() => void | Promise<void>) | null = null;
      mockScheduler.scheduleRepeating.mockImplementation(async (_name, _interval, callback) => {
        scheduledCallback = callback;
      });

      mockManualSyncUseCase.execute.mockResolvedValue({
        success: true,
        syncDirection: 'receive_only',
        receiveResult: {
          success: true,
          receivedCount: 10,
        },
      });

      await useCase.scheduleAllPeriodicSyncs({});

      expect(scheduledCallback).not.toBeNull();
      await scheduledCallback!();
      expect(mockManualSyncUseCase.execute).toHaveBeenCalledWith({ config });
    });

    it('should handle repository errors', async () => {
      mockRepository.loadAllEnabledPeriodic.mockResolvedValue(
        Result.failure(new Error('Database error'))
      );

      const result = await useCase.scheduleAllPeriodicSyncs({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });

    it('should skip configs with invalid interval (mocked config with bad interval)', async () => {
      // Mock config directly to bypass entity validation
      const invalidConfig = {
        getId: jest.fn(() => 'config1'),
        getSyncIntervalSeconds: jest.fn(() => 30), // Invalid: less than 60
        getStorageKey: jest.fn(() => 'data1'),
      };

      mockRepository.loadAllEnabledPeriodic.mockResolvedValue(
        Result.success([invalidConfig as any])
      );

      const result = await useCase.scheduleAllPeriodicSyncs({});

      expect(result.success).toBe(true);
      expect(result.scheduledCount).toBe(0);
      expect(mockScheduler.scheduleRepeating).not.toHaveBeenCalled();
    });

    it('should skip configs with undefined interval', async () => {
      // Mock config directly with undefined interval
      const undefinedIntervalConfig = {
        getId: jest.fn(() => 'config2'),
        getSyncIntervalSeconds: jest.fn(() => undefined),
        getStorageKey: jest.fn(() => 'data2'),
      };

      mockRepository.loadAllEnabledPeriodic.mockResolvedValue(
        Result.success([undefinedIntervalConfig as any])
      );

      const result = await useCase.scheduleAllPeriodicSyncs({});

      expect(result.success).toBe(true);
      expect(result.scheduledCount).toBe(0);
      expect(mockScheduler.scheduleRepeating).not.toHaveBeenCalled();
    });

    it('should handle failed sync execution in scheduled callback', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'data1',
        syncMethod: 'notion',
        syncTiming: 'periodic',
        syncDirection: 'receive_only',
        syncIntervalSeconds: 300,
        inputs: [{ key: 'apiKey', value: 'test-token' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      mockRepository.loadAllEnabledPeriodic.mockResolvedValue(Result.success([config]));

      let scheduledCallback: (() => void | Promise<void>) | null = null;
      mockScheduler.scheduleRepeating.mockImplementation(async (_name, _interval, callback) => {
        scheduledCallback = callback;
      });

      mockManualSyncUseCase.execute.mockResolvedValue({
        success: false,
        syncDirection: 'receive_only',
        error: 'Network timeout',
      });

      await useCase.scheduleAllPeriodicSyncs({});

      expect(scheduledCallback).not.toBeNull();
      await scheduledCallback!();
      expect(mockManualSyncUseCase.execute).toHaveBeenCalledWith({ config });
    });

    it('should handle exceptions during scheduled sync execution', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'data1',
        syncMethod: 'notion',
        syncTiming: 'periodic',
        syncDirection: 'receive_only',
        syncIntervalSeconds: 300,
        inputs: [{ key: 'apiKey', value: 'test-token' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      mockRepository.loadAllEnabledPeriodic.mockResolvedValue(Result.success([config]));

      let scheduledCallback: (() => void | Promise<void>) | null = null;
      mockScheduler.scheduleRepeating.mockImplementation(async (_name, _interval, callback) => {
        scheduledCallback = callback;
      });

      mockManualSyncUseCase.execute.mockRejectedValue(new Error('Unexpected error'));

      await useCase.scheduleAllPeriodicSyncs({});

      expect(scheduledCallback).not.toBeNull();
      // Should not throw, error should be caught internally
      await expect(scheduledCallback!()).resolves.toBeUndefined();
    });
  });

  describe('stopAllScheduledSyncs', () => {
    it('should stop all scheduled syncs', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'data1',
        syncMethod: 'notion',
        syncTiming: 'periodic',
        syncDirection: 'receive_only',
        syncIntervalSeconds: 300,
        inputs: [{ key: 'apiKey', value: 'test-token' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      mockRepository.loadAllEnabledPeriodic.mockResolvedValue(Result.success([config]));
      mockScheduler.scheduleRepeating.mockResolvedValue();

      await useCase.scheduleAllPeriodicSyncs({});
      expect(useCase.getActiveScheduleCount()).toBe(1);

      mockScheduler.cancelAll.mockResolvedValue();
      const result = await useCase.stopAllScheduledSyncs({});

      expect(result.success).toBe(true);
      expect(useCase.getActiveScheduleCount()).toBe(0);
    });

    it('should handle errors when stopping scheduled syncs', async () => {
      mockScheduler.cancelAll.mockRejectedValue(new Error('Cancel failed'));

      const result = await useCase.stopAllScheduledSyncs({});

      expect(result.success).toBe(false);
    });
  });

  describe('stopScheduledSync', () => {
    it('should stop a specific scheduled sync', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'data1',
        syncMethod: 'notion',
        syncTiming: 'periodic',
        syncDirection: 'receive_only',
        syncIntervalSeconds: 300,
        inputs: [{ key: 'apiKey', value: 'test-token' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      mockRepository.loadAllEnabledPeriodic.mockResolvedValue(Result.success([config]));
      mockScheduler.scheduleRepeating.mockResolvedValue();

      await useCase.scheduleAllPeriodicSyncs({});
      const configId = config.getId();

      mockScheduler.cancel.mockResolvedValue();
      const result = await useCase.stopScheduledSync(configId);

      expect(result).toBe(true);
      expect(useCase.isScheduled(configId)).toBe(false);
    });

    it('should return false for non-existent schedule', async () => {
      const result = await useCase.stopScheduledSync('non-existent-id');
      expect(result).toBe(false);
    });

    it('should handle errors when stopping a specific scheduled sync', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'data1',
        syncMethod: 'notion',
        syncTiming: 'periodic',
        syncDirection: 'receive_only',
        syncIntervalSeconds: 300,
        inputs: [{ key: 'apiKey', value: 'test-token' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      mockRepository.loadAllEnabledPeriodic.mockResolvedValue(Result.success([config]));
      mockScheduler.scheduleRepeating.mockResolvedValue();

      await useCase.scheduleAllPeriodicSyncs({});
      const configId = config.getId();

      mockScheduler.cancel.mockRejectedValue(new Error('Cancel failed'));
      const result = await useCase.stopScheduledSync(configId);

      expect(result).toBe(false);
    });
  });

  describe('getActiveScheduleCount', () => {
    it('should return zero initially', () => {
      expect(useCase.getActiveScheduleCount()).toBe(0);
    });

    it('should return correct count after scheduling', async () => {
      const config1 = StorageSyncConfig.create({
        storageKey: 'data1',
        syncMethod: 'notion',
        syncTiming: 'periodic',
        syncDirection: 'receive_only',
        syncIntervalSeconds: 300,
        inputs: [{ key: 'apiKey', value: 'test-token' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      const config2 = StorageSyncConfig.create({
        storageKey: 'data2',
        syncMethod: 'notion',
        syncTiming: 'periodic',
        syncDirection: 'receive_only',
        syncIntervalSeconds: 600,
        inputs: [{ key: 'apiKey', value: 'test-token-2' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      mockRepository.loadAllEnabledPeriodic.mockResolvedValue(Result.success([config1, config2]));
      mockScheduler.scheduleRepeating.mockResolvedValue();

      await useCase.scheduleAllPeriodicSyncs({});
      expect(useCase.getActiveScheduleCount()).toBe(2);
    });
  });

  describe('isScheduled', () => {
    it('should return false for non-scheduled config', () => {
      expect(useCase.isScheduled('non-existent')).toBe(false);
    });

    it('should return true for scheduled config', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'data1',
        syncMethod: 'notion',
        syncTiming: 'periodic',
        syncDirection: 'receive_only',
        syncIntervalSeconds: 300,
        inputs: [{ key: 'apiKey', value: 'test-token' }],
        outputs: [{ key: 'data', defaultValue: [] }],
      });

      mockRepository.loadAllEnabledPeriodic.mockResolvedValue(Result.success([config]));
      mockScheduler.scheduleRepeating.mockResolvedValue();

      await useCase.scheduleAllPeriodicSyncs({});
      expect(useCase.isScheduled(config.getId())).toBe(true);
    });
  });
});
