/**
 * Test: SystemSettingsPresenter
 * Tests business logic coordination for system settings
 */

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => key),
    format: jest.fn((key: string, ...args: string[]) => `${key}: ${args.join(', ')}`),
    applyToDOM: jest.fn(),
  },
}));

import { SystemSettingsPresenter, SystemSettingsView } from '../SystemSettingsPresenter';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { GetSystemSettingsUseCase } from '@usecases/system-settings/GetSystemSettingsUseCase';
import { UpdateSystemSettingsUseCase } from '@usecases/system-settings/UpdateSystemSettingsUseCase';
import { ResetSystemSettingsUseCase } from '@usecases/system-settings/ResetSystemSettingsUseCase';
import { ExportSystemSettingsUseCase } from '@usecases/system-settings/ExportSystemSettingsUseCase';
import { ImportSystemSettingsUseCase } from '@usecases/system-settings/ImportSystemSettingsUseCase';
import { ExecuteStorageSyncUseCase } from '@usecases/storage/ExecuteStorageSyncUseCase';
import { GetAllStorageSyncConfigsUseCase } from '@usecases/storage/GetAllStorageSyncConfigsUseCase';
import { Logger } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('SystemSettingsPresenter', () => {
  let presenter: SystemSettingsPresenter;
  let mockView: jest.Mocked<SystemSettingsView>;
  let mockGetSettingsUseCase: jest.Mocked<GetSystemSettingsUseCase>;
  let mockUpdateSettingsUseCase: jest.Mocked<UpdateSystemSettingsUseCase>;
  let mockResetSettingsUseCase: jest.Mocked<ResetSystemSettingsUseCase>;
  let mockExportSettingsUseCase: jest.Mocked<ExportSystemSettingsUseCase>;
  let mockImportSettingsUseCase: jest.Mocked<ImportSystemSettingsUseCase>;
  let mockExecuteSyncUseCase: jest.Mocked<ExecuteStorageSyncUseCase>;
  let mockGetAllSyncConfigsUseCase: jest.Mocked<GetAllStorageSyncConfigsUseCase>;
  let mockLogger: jest.Mocked<Logger>;
  let mockSettings: SystemSettingsCollection;

  beforeEach(() => {
    // Create mock view
    mockView = {
      showSuccess: jest.fn(),
      showError: jest.fn(),
      showLoading: jest.fn(),
      hideLoading: jest.fn(),
      updateGeneralSettings: jest.fn(),
      updateRecordingSettings: jest.fn(),
      updateAppearanceSettings: jest.fn(),
      applyGradientBackground: jest.fn(),
    };

    // Create mock use cases
    mockGetSettingsUseCase = {
      execute: jest.fn(),
    } as any;

    mockUpdateSettingsUseCase = {
      execute: jest.fn(),
    } as any;

    mockResetSettingsUseCase = {
      execute: jest.fn(),
    } as any;

    mockExportSettingsUseCase = {
      execute: jest.fn(),
    } as any;

    mockImportSettingsUseCase = {
      execute: jest.fn(),
    } as any;

    mockExecuteSyncUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetAllSyncConfigsUseCase = {
      execute: jest.fn(),
    } as any;

    // Create mock logger
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    // Create mock settings
    mockSettings = new SystemSettingsCollection({
      retryWaitSecondsMin: 30,
      retryWaitSecondsMax: 60,
      retryCount: 3,
      gradientStartColor: '#667eea',
      gradientEndColor: '#764ba2',
      gradientAngle: 135,
    });

    // Create presenter
    presenter = new SystemSettingsPresenter(
      mockView,
      mockGetSettingsUseCase,
      mockUpdateSettingsUseCase,
      mockResetSettingsUseCase,
      mockExportSettingsUseCase,
      mockImportSettingsUseCase,
      mockExecuteSyncUseCase,
      mockGetAllSyncConfigsUseCase,
      mockLogger
    );
  });

  describe('loadAllSettings', () => {
    it('should load all settings and update views', async () => {
      mockGetSettingsUseCase.execute.mockResolvedValue(Result.success(mockSettings));

      await presenter.loadAllSettings();

      expect(mockView.showLoading).toHaveBeenCalled();
      expect(mockGetSettingsUseCase.execute).toHaveBeenCalled();
      expect(mockView.updateGeneralSettings).toHaveBeenCalledWith(mockSettings);
      expect(mockView.updateRecordingSettings).toHaveBeenCalledWith(mockSettings);
      expect(mockView.updateAppearanceSettings).toHaveBeenCalledWith(mockSettings);
      expect(mockView.applyGradientBackground).toHaveBeenCalledWith('#667eea', '#764ba2', 135);
      expect(mockView.hideLoading).toHaveBeenCalled();
    });

    it('should handle errors when loading settings fails', async () => {
      const error = new Error('Failed to load settings');
      mockGetSettingsUseCase.execute.mockResolvedValue(Result.failure(error));

      await presenter.loadAllSettings();

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to load settings', error);
      expect(mockView.showError).toHaveBeenCalled();
      expect(mockView.hideLoading).toHaveBeenCalled();
    });
  });

  describe('getSettings', () => {
    it('should return null when settings not loaded', () => {
      expect(presenter.getSettings()).toBeNull();
    });

    it('should return settings after loading', async () => {
      mockGetSettingsUseCase.execute.mockResolvedValue(Result.success(mockSettings));
      await presenter.loadAllSettings();

      expect(presenter.getSettings()).toBe(mockSettings);
    });
  });

  describe('saveGeneralSettings', () => {
    beforeEach(async () => {
      mockGetSettingsUseCase.execute.mockResolvedValue(Result.success(mockSettings));
      await presenter.loadAllSettings();
    });

    it('should save general settings successfully', async () => {
      const updates = { retryWaitSecondsMin: 45 };
      mockUpdateSettingsUseCase.execute.mockResolvedValue(Result.success(undefined));

      await presenter.saveGeneralSettings(updates);

      expect(mockUpdateSettingsUseCase.execute).toHaveBeenCalled();
      expect(mockView.showSuccess).toHaveBeenCalled();
    });

    it('should throw error when settings not loaded', async () => {
      const freshPresenter = new SystemSettingsPresenter(
        mockView,
        mockGetSettingsUseCase,
        mockUpdateSettingsUseCase,
        mockResetSettingsUseCase,
        mockExportSettingsUseCase,
        mockImportSettingsUseCase,
        mockExecuteSyncUseCase,
        mockGetAllSyncConfigsUseCase,
        mockLogger
      );

      await expect(freshPresenter.saveGeneralSettings({})).rejects.toThrow('Settings not loaded');
    });

    it('should handle save errors', async () => {
      const error = new Error('Save failed');
      mockUpdateSettingsUseCase.execute.mockResolvedValue(Result.failure(error));

      await expect(presenter.saveGeneralSettings({ retryCount: 5 })).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to save general settings', error);
    });

    it('should handle non-Error exceptions in save', async () => {
      mockUpdateSettingsUseCase.execute.mockRejectedValue('String error');

      try {
        await presenter.saveGeneralSettings({ retryCount: 5 });
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBe('String error');
      }

      expect(mockView.showError).toHaveBeenCalledWith(expect.stringContaining('Unknown error'));
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save general settings',
        'String error'
      );
    });
  });

  describe('saveRecordingSettings', () => {
    beforeEach(async () => {
      mockGetSettingsUseCase.execute.mockResolvedValue(Result.success(mockSettings));
      await presenter.loadAllSettings();
    });

    it('should save recording settings successfully', async () => {
      const updates = { enableAudioRecording: true };
      mockUpdateSettingsUseCase.execute.mockResolvedValue(Result.success(undefined));

      await presenter.saveRecordingSettings(updates);

      expect(mockUpdateSettingsUseCase.execute).toHaveBeenCalled();
      expect(mockView.showSuccess).toHaveBeenCalled();
    });

    it('should throw error when settings not loaded', async () => {
      const freshPresenter = new SystemSettingsPresenter(
        mockView,
        mockGetSettingsUseCase,
        mockUpdateSettingsUseCase,
        mockResetSettingsUseCase,
        mockExportSettingsUseCase,
        mockImportSettingsUseCase,
        mockExecuteSyncUseCase,
        mockGetAllSyncConfigsUseCase,
        mockLogger
      );

      await expect(freshPresenter.saveRecordingSettings({})).rejects.toThrow('Settings not loaded');
    });

    it('should handle save errors', async () => {
      const error = new Error('Save failed');
      mockUpdateSettingsUseCase.execute.mockResolvedValue(Result.failure(error));

      await expect(
        presenter.saveRecordingSettings({ enableAudioRecording: true })
      ).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to save recording settings', error);
    });

    it('should handle non-Error exceptions in save', async () => {
      mockUpdateSettingsUseCase.execute.mockRejectedValue('String error');

      try {
        await presenter.saveRecordingSettings({ enableAudioRecording: true });
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBe('String error');
      }

      expect(mockView.showError).toHaveBeenCalledWith(expect.stringContaining('Unknown error'));
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save recording settings',
        'String error'
      );
    });
  });

  describe('saveAppearanceSettings', () => {
    beforeEach(async () => {
      mockGetSettingsUseCase.execute.mockResolvedValue(Result.success(mockSettings));
      await presenter.loadAllSettings();
    });

    it('should save appearance settings and apply gradient', async () => {
      const updates = { gradientStartColor: '#ff0000' };
      mockUpdateSettingsUseCase.execute.mockResolvedValue(Result.success(undefined));

      await presenter.saveAppearanceSettings(updates);

      expect(mockUpdateSettingsUseCase.execute).toHaveBeenCalled();
      expect(mockView.applyGradientBackground).toHaveBeenCalled();
      expect(mockView.showSuccess).toHaveBeenCalled();
    });

    it('should throw error when settings not loaded', async () => {
      const freshPresenter = new SystemSettingsPresenter(
        mockView,
        mockGetSettingsUseCase,
        mockUpdateSettingsUseCase,
        mockResetSettingsUseCase,
        mockExportSettingsUseCase,
        mockImportSettingsUseCase,
        mockExecuteSyncUseCase,
        mockGetAllSyncConfigsUseCase,
        mockLogger
      );

      await expect(freshPresenter.saveAppearanceSettings({})).rejects.toThrow(
        'Settings not loaded'
      );
    });

    it('should handle save errors', async () => {
      const error = new Error('Save failed');
      mockUpdateSettingsUseCase.execute.mockResolvedValue(Result.failure(error));

      await expect(
        presenter.saveAppearanceSettings({ gradientStartColor: '#ff0000' })
      ).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to save appearance settings', error);
    });

    it('should handle non-Error exceptions in save', async () => {
      mockUpdateSettingsUseCase.execute.mockRejectedValue('String error');

      try {
        await presenter.saveAppearanceSettings({ gradientStartColor: '#ff0000' });
        fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBe('String error');
      }

      expect(mockView.showError).toHaveBeenCalledWith(expect.stringContaining('Unknown error'));
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save appearance settings',
        'String error'
      );
    });
  });

  describe('resetGeneralSettings', () => {
    beforeEach(async () => {
      mockGetSettingsUseCase.execute.mockResolvedValue(Result.success(mockSettings));
      await presenter.loadAllSettings();
      global.confirm = jest.fn(() => true);
    });

    it('should reset general settings when confirmed', async () => {
      const resetSettings = new SystemSettingsCollection();
      mockResetSettingsUseCase.execute.mockResolvedValue(Result.success(resetSettings));

      await presenter.resetGeneralSettings();

      expect(global.confirm).toHaveBeenCalled();
      expect(mockResetSettingsUseCase.execute).toHaveBeenCalledWith({ section: 'general' });
      expect(mockView.updateGeneralSettings).toHaveBeenCalledWith(resetSettings);
      expect(mockView.showSuccess).toHaveBeenCalled();
    });

    it('should not reset when user cancels', async () => {
      (global.confirm as jest.Mock).mockReturnValue(false);

      await presenter.resetGeneralSettings();

      expect(mockResetSettingsUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle reset errors', async () => {
      const error = new Error('Reset failed');
      mockResetSettingsUseCase.execute.mockRejectedValue(error);

      await expect(presenter.resetGeneralSettings()).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalled();
    });
  });

  describe('resetRecordingSettings', () => {
    beforeEach(async () => {
      mockGetSettingsUseCase.execute.mockResolvedValue(Result.success(mockSettings));
      await presenter.loadAllSettings();
      global.confirm = jest.fn(() => true);
    });

    it('should reset recording settings when confirmed', async () => {
      const resetSettings = new SystemSettingsCollection();
      mockResetSettingsUseCase.execute.mockResolvedValue(Result.success(resetSettings));

      await presenter.resetRecordingSettings();

      expect(mockResetSettingsUseCase.execute).toHaveBeenCalledWith({ section: 'recording' });
      expect(mockView.updateRecordingSettings).toHaveBeenCalledWith(resetSettings);
      expect(mockView.showSuccess).toHaveBeenCalled();
    });
  });

  describe('resetAppearanceSettings', () => {
    beforeEach(async () => {
      mockGetSettingsUseCase.execute.mockResolvedValue(Result.success(mockSettings));
      await presenter.loadAllSettings();
      global.confirm = jest.fn(() => true);
    });

    it('should reset appearance settings and apply default gradient', async () => {
      const resetSettings = new SystemSettingsCollection();
      mockResetSettingsUseCase.execute.mockResolvedValue(Result.success(resetSettings));

      await presenter.resetAppearanceSettings();

      expect(mockResetSettingsUseCase.execute).toHaveBeenCalledWith({ section: 'appearance' });
      expect(mockView.updateAppearanceSettings).toHaveBeenCalledWith(resetSettings);
      expect(mockView.applyGradientBackground).toHaveBeenCalled();
      expect(mockView.showSuccess).toHaveBeenCalled();
    });
  });

  describe('executeSingleSync', () => {
    it('should execute sync for existing storage key', async () => {
      const mockConfig = {
        getStorageKey: () => 'testKey',
        getId: () => 'config-1',
      } as any;

      mockGetAllSyncConfigsUseCase.execute.mockResolvedValue([mockConfig]);
      mockExecuteSyncUseCase.execute.mockResolvedValue({
        success: true,
        syncDirection: 'bidirectional' as const,
      });

      const result = await presenter.executeSingleSync('testKey');

      expect(result).toEqual({
        success: true,
        syncDirection: 'bidirectional',
      });
      expect(mockExecuteSyncUseCase.execute).toHaveBeenCalledWith({ storageKey: 'testKey' });
    });

    it('should return null when config not found', async () => {
      mockGetAllSyncConfigsUseCase.execute.mockResolvedValue([]);

      const result = await presenter.executeSingleSync('nonExistentKey');

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle sync errors', async () => {
      const mockConfig = {
        getStorageKey: () => 'testKey',
      } as any;

      mockGetAllSyncConfigsUseCase.execute.mockResolvedValue([mockConfig]);
      const error = new Error('Sync failed');
      mockExecuteSyncUseCase.execute.mockRejectedValue(error);

      await expect(presenter.executeSingleSync('testKey')).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('executeAllSyncs', () => {
    it('should execute all syncs successfully', async () => {
      const mockConfigs = [
        { getStorageKey: () => 'key1' },
        { getStorageKey: () => 'key2' },
      ] as any[];

      mockGetAllSyncConfigsUseCase.execute.mockResolvedValue(mockConfigs);
      mockExecuteSyncUseCase.execute.mockResolvedValue({
        success: true,
        syncDirection: 'bidirectional' as const,
      });

      const result = await presenter.executeAllSyncs();

      expect(result.success).toEqual(['key1', 'key2']);
      expect(result.failed).toEqual([]);
    });

    it('should handle partial failures', async () => {
      const mockConfigs = [
        { getStorageKey: () => 'key1' },
        { getStorageKey: () => 'key2' },
      ] as any[];

      mockGetAllSyncConfigsUseCase.execute.mockResolvedValue(mockConfigs);
      mockExecuteSyncUseCase.execute
        .mockResolvedValueOnce({ success: true, syncDirection: 'bidirectional' as const })
        .mockResolvedValueOnce({ success: false, syncDirection: 'bidirectional' as const });

      const result = await presenter.executeAllSyncs();

      expect(result.success).toEqual(['key1']);
      expect(result.failed).toEqual(['key2']);
    });

    it('should handle errors during sync', async () => {
      const mockConfigs = [{ getStorageKey: () => 'key1' }] as any[];

      mockGetAllSyncConfigsUseCase.execute.mockResolvedValue(mockConfigs);
      mockExecuteSyncUseCase.execute.mockRejectedValue(new Error('Sync error'));

      const result = await presenter.executeAllSyncs();

      expect(result.failed).toEqual(['key1']);
    });
  });

  describe('exportSettings', () => {
    it('should export settings as CSV', async () => {
      const csvData = 'key,value\ntest,123';
      mockExportSettingsUseCase.execute.mockResolvedValue(Result.success(csvData));

      const result = await presenter.exportSettings();

      expect(result).toBe(csvData);
      expect(mockExportSettingsUseCase.execute).toHaveBeenCalled();
    });

    it('should handle export errors', async () => {
      const error = new Error('Export failed');
      mockExportSettingsUseCase.execute.mockResolvedValue(Result.failure(error));

      await expect(presenter.exportSettings()).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalled();
    });
  });

  describe('importSettings', () => {
    it('should import settings from CSV', async () => {
      const csvData = 'key,value\ntest,123';
      mockImportSettingsUseCase.execute.mockResolvedValue(Result.success(undefined));
      mockGetSettingsUseCase.execute.mockResolvedValue(Result.success(mockSettings));

      await presenter.importSettings(csvData);

      expect(mockImportSettingsUseCase.execute).toHaveBeenCalledWith({ csvText: csvData });
      expect(mockView.showSuccess).toHaveBeenCalled();
    });

    it('should handle import errors', async () => {
      const error = new Error('Import failed');
      mockImportSettingsUseCase.execute.mockResolvedValue(Result.failure(error));

      await expect(presenter.importSettings('invalid')).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalled();
    });
  });
});
