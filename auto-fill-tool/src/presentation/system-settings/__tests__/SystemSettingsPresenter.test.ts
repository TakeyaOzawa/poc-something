/**
 * Test: SystemSettingsPresenter
 * Tests business logic coordination for system settings
 */

import { SystemSettingsPresenter, SystemSettingsView } from '../SystemSettingsPresenter';
import { GetSystemSettingsUseCase } from '@application/usecases/system-settings/GetSystemSettingsUseCase';
import { UpdateSystemSettingsUseCase } from '@application/usecases/system-settings/UpdateSystemSettingsUseCase';
import { ResetSystemSettingsUseCase } from '@application/usecases/system-settings/ResetSystemSettingsUseCase';
import { ExportSystemSettingsUseCase } from '@application/usecases/system-settings/ExportSystemSettingsUseCase';
import { ImportSystemSettingsUseCase } from '@application/usecases/system-settings/ImportSystemSettingsUseCase';
import { ExecuteStorageSyncUseCase } from '@application/usecases/storage/ExecuteStorageSyncUseCase';
import { ListSyncConfigsUseCase } from '@application/usecases/sync/ListSyncConfigsUseCase';
import { Logger } from '@domain/types/logger.types';

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => {
      const messages: Record<string, string> = {
        settingsLoadFailed: 'Failed to load settings: {0}',
        generalSettingsSaved: 'General settings saved',
        recordingSettingsSaved: 'Recording settings saved',
        appearanceSettingsSaved: 'Appearance settings saved',
        confirmResetSettings: 'Are you sure you want to reset settings?',
        settingsResetCompleted: 'Settings reset successfully',
        settingsResetFailed: 'Failed to reset settings: {0}',
        settingsSaveFailed: 'Failed to save settings: {0}',
        exportSuccess: 'Settings exported successfully',
        exportFailed: 'Failed to export settings: {0}',
        importSuccess: 'Settings imported successfully',
        importFailed: 'Failed to import settings: {0}',
        syncFailed: 'Data sync failed: {0}',
      };
      return messages[key] || key;
    }),
    format: jest.fn((key: string, ...args: any[]) => {
      const messages: Record<string, string> = {
        settingsLoadFailed: `Failed to load settings: ${args[0]}`,
        settingsSaveFailed: `Failed to save settings: ${args[0]}`,
        settingsResetFailed: `Failed to reset settings: ${args[0]}`,
        exportFailed: `Failed to export settings: ${args[0]}`,
        importFailed: `Failed to import settings: ${args[0]}`,
        syncFailed: `Data sync failed: ${args[0]}`,
      };
      return messages[key] || `${key}: ${args.join(', ')}`;
    }),
  },
}));

describe('SystemSettingsPresenter', () => {
  let presenter: SystemSettingsPresenter;
  let mockView: jest.Mocked<SystemSettingsView>;
  let mockGetSystemSettingsUseCase: jest.Mocked<GetSystemSettingsUseCase>;
  let mockUpdateSystemSettingsUseCase: jest.Mocked<UpdateSystemSettingsUseCase>;
  let mockResetSystemSettingsUseCase: jest.Mocked<ResetSystemSettingsUseCase>;
  let mockExportSystemSettingsUseCase: jest.Mocked<ExportSystemSettingsUseCase>;
  let mockImportSystemSettingsUseCase: jest.Mocked<ImportSystemSettingsUseCase>;
  let mockExecuteStorageSyncUseCase: jest.Mocked<ExecuteStorageSyncUseCase>;
  let mockListSyncConfigsUseCase: jest.Mocked<ListSyncConfigsUseCase>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockView = {
      showLoading: jest.fn(),
      hideLoading: jest.fn(),
      showError: jest.fn(),
      showSuccess: jest.fn(),
      updateGeneralSettings: jest.fn(),
      updateRecordingSettings: jest.fn(),
      updateAppearanceSettings: jest.fn(),
      applyGradientBackground: jest.fn(),
    };

    mockGetSystemSettingsUseCase = {
      execute: jest.fn(),
    } as any;

    mockUpdateSystemSettingsUseCase = {
      execute: jest.fn(),
    } as any;

    mockResetSystemSettingsUseCase = {
      execute: jest.fn(),
    } as any;

    mockExportSystemSettingsUseCase = {
      execute: jest.fn(),
    } as any;

    mockImportSystemSettingsUseCase = {
      execute: jest.fn(),
    } as any;

    mockExecuteStorageSyncUseCase = {
      execute: jest.fn(),
    } as any;

    mockListSyncConfigsUseCase = {
      execute: jest.fn(),
    } as any;

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setLevel: jest.fn(),
      getLevel: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    presenter = new SystemSettingsPresenter(
      mockView,
      mockGetSystemSettingsUseCase,
      mockUpdateSystemSettingsUseCase,
      mockResetSystemSettingsUseCase,
      mockExportSystemSettingsUseCase,
      mockImportSystemSettingsUseCase,
      mockExecuteStorageSyncUseCase,
      mockListSyncConfigsUseCase,
      mockLogger
    );

    jest.clearAllMocks();
  });

  describe('loadAllSettings', () => {
    it('should load and display system settings successfully', async () => {
      const mockSettingsDto = {
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 3,
        recordingEnabled: true,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        enabledLogSources: ['background', 'popup'],
        securityEventsOnly: false,
        maxStoredLogs: 100,
        logRetentionDays: 7,
      };

      mockGetSystemSettingsUseCase.execute.mockResolvedValue({
        isFailure: false,
        value: mockSettingsDto,
      });

      await presenter.loadAllSettings();

      expect(mockView.showLoading).toHaveBeenCalled();
      expect(mockGetSystemSettingsUseCase.execute).toHaveBeenCalled();
      expect(mockView.updateGeneralSettings).toHaveBeenCalled();
      expect(mockView.updateRecordingSettings).toHaveBeenCalled();
      expect(mockView.updateAppearanceSettings).toHaveBeenCalled();
      expect(mockView.hideLoading).toHaveBeenCalled();
    });

    it('should handle load error', async () => {
      const error = new Error('Load failed');
      mockGetSystemSettingsUseCase.execute.mockResolvedValue({
        isFailure: true,
        error: error,
      });

      await expect(presenter.loadAllSettings()).rejects.toThrow('Load failed');

      expect(mockView.showLoading).toHaveBeenCalled();
      expect(mockView.hideLoading).toHaveBeenCalled();
      expect(mockView.showError).toHaveBeenCalled();
    });
  });

  describe('resetSettings', () => {
    it('should reset settings successfully', async () => {
      // Mock confirm dialog
      global.confirm = jest.fn(() => true);

      mockResetSystemSettingsUseCase.execute.mockResolvedValue({
        isFailure: false,
        value: {},
      });

      const mockSettingsDto = {
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 3,
        recordingEnabled: true,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        enabledLogSources: ['background', 'popup'],
        securityEventsOnly: false,
        maxStoredLogs: 100,
        logRetentionDays: 7,
      };

      mockGetSystemSettingsUseCase.execute.mockResolvedValue({
        isFailure: false,
        value: mockSettingsDto,
      });

      await presenter.resetSettings();

      expect(mockResetSystemSettingsUseCase.execute).toHaveBeenCalled();
      expect(mockView.showSuccess).toHaveBeenCalledWith('Settings reset successfully');
    });

    it('should handle reset cancellation', async () => {
      // Mock confirm dialog to return false
      global.confirm = jest.fn(() => false);

      await presenter.resetSettings();

      expect(mockResetSystemSettingsUseCase.execute).not.toHaveBeenCalled();
      expect(mockView.showSuccess).not.toHaveBeenCalled();
    });
  });

  describe('saveGeneralSettings', () => {
    beforeEach(async () => {
      // Load settings first
      const mockSettingsDto = {
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 3,
        recordingEnabled: true,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        enabledLogSources: ['background', 'popup'],
        securityEventsOnly: false,
        maxStoredLogs: 100,
        logRetentionDays: 7,
      };

      mockGetSystemSettingsUseCase.execute.mockResolvedValue({
        isFailure: false,
        value: mockSettingsDto,
      });

      await presenter.loadSettings();
      jest.clearAllMocks();
    });

    it('should build DTO correctly and pass it to UseCase', async () => {
      mockUpdateSystemSettingsUseCase.execute.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: undefined,
      });

      const mockSettingsDto = {
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 5,
        recordingEnabled: true,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        enabledLogSources: ['background', 'popup'],
        securityEventsOnly: false,
        maxStoredLogs: 100,
        logRetentionDays: 7,
      };

      mockGetSystemSettingsUseCase.execute.mockResolvedValue({
        isFailure: false,
        value: mockSettingsDto,
      });

      await presenter.saveGeneralSettings({ retryCount: 5 });

      expect(mockUpdateSystemSettingsUseCase.execute).toHaveBeenCalledWith({
        settings: expect.objectContaining({
          retryCount: 5,
        }),
      });
      expect(mockView.showSuccess).toHaveBeenCalledWith('General settings saved');
    });

    it('should handle UseCase Result correctly on success', async () => {
      mockUpdateSystemSettingsUseCase.execute.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: undefined,
      });

      const mockSettingsDto = {
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 3,
        recordingEnabled: true,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        enabledLogSources: ['background', 'popup'],
        securityEventsOnly: false,
        maxStoredLogs: 100,
        logRetentionDays: 7,
      };

      mockGetSystemSettingsUseCase.execute.mockResolvedValue({
        isFailure: false,
        value: mockSettingsDto,
      });

      await presenter.saveGeneralSettings({ retryCount: 5 });

      expect(mockView.showSuccess).toHaveBeenCalledWith('General settings saved');
      expect(mockView.showError).not.toHaveBeenCalled();
    });

    it('should display error message when UseCase fails', async () => {
      const error = new Error('Validation failed');
      mockUpdateSystemSettingsUseCase.execute.mockResolvedValue({
        isSuccess: false,
        isFailure: true,
        error: error,
      });

      await expect(presenter.saveGeneralSettings({ retryCount: 5 })).rejects.toThrow(
        'Validation failed'
      );

      expect(mockView.showError).toHaveBeenCalledWith('Failed to save settings: Validation failed');
      expect(mockView.showSuccess).not.toHaveBeenCalled();
    });
  });

  describe('saveRecordingSettings', () => {
    beforeEach(async () => {
      // Load settings first
      const mockSettingsDto = {
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 3,
        recordingEnabled: true,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        enabledLogSources: ['background', 'popup'],
        securityEventsOnly: false,
        maxStoredLogs: 100,
        logRetentionDays: 7,
      };

      mockGetSystemSettingsUseCase.execute.mockResolvedValue({
        isFailure: false,
        value: mockSettingsDto,
      });

      await presenter.loadSettings();
      jest.clearAllMocks();
    });

    it('should build DTO correctly and pass it to UseCase', async () => {
      mockUpdateSystemSettingsUseCase.execute.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: undefined,
      });

      const mockSettingsDto = {
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 3,
        recordingEnabled: false,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        enabledLogSources: ['background', 'popup'],
        securityEventsOnly: false,
        maxStoredLogs: 100,
        logRetentionDays: 7,
      };

      mockGetSystemSettingsUseCase.execute.mockResolvedValue({
        isFailure: false,
        value: mockSettingsDto,
      });

      await presenter.saveRecordingSettings({ recordingEnabled: false });

      expect(mockUpdateSystemSettingsUseCase.execute).toHaveBeenCalledWith({
        settings: expect.objectContaining({
          enableTabRecording: false,
        }),
      });
      expect(mockView.showSuccess).toHaveBeenCalledWith('Recording settings saved');
    });

    it('should handle UseCase failure with proper error message', async () => {
      const error = new Error('Recording validation failed');
      mockUpdateSystemSettingsUseCase.execute.mockResolvedValue({
        isSuccess: false,
        isFailure: true,
        error: error,
      });

      await expect(presenter.saveRecordingSettings({ recordingEnabled: false })).rejects.toThrow(
        'Recording validation failed'
      );

      expect(mockView.showError).toHaveBeenCalledWith('Failed to save settings: Recording validation failed');
      expect(mockView.showSuccess).not.toHaveBeenCalled();
    });

    it('should handle settings not loaded error', async () => {
      // Create a new presenter without loading settings
      const freshPresenter = new SystemSettingsPresenter(
        mockView,
        mockGetSystemSettingsUseCase,
        mockUpdateSystemSettingsUseCase,
        mockResetSystemSettingsUseCase,
        mockExportSystemSettingsUseCase,
        mockImportSystemSettingsUseCase,
        mockExecuteStorageSyncUseCase,
        mockListSyncConfigsUseCase,
        mockLogger
      );

      await expect(freshPresenter.saveRecordingSettings({ recordingEnabled: false })).rejects.toThrow(
        'Settings not loaded'
      );

      expect(mockView.showError).toHaveBeenCalledWith('Failed to save settings: Settings not loaded');
    });
  });

  describe('saveAppearanceSettings', () => {
    beforeEach(async () => {
      // Load settings first
      const mockSettingsDto = {
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 3,
        recordingEnabled: true,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        enabledLogSources: ['background', 'popup'],
        securityEventsOnly: false,
        maxStoredLogs: 100,
        logRetentionDays: 7,
      };

      mockGetSystemSettingsUseCase.execute.mockResolvedValue({
        isFailure: false,
        value: mockSettingsDto,
      });

      await presenter.loadSettings();
      jest.clearAllMocks();
    });

    it('should build DTO correctly and pass it to UseCase', async () => {
      mockUpdateSystemSettingsUseCase.execute.mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: undefined,
      });

      const mockSettingsDto = {
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 3,
        recordingEnabled: true,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        enabledLogSources: ['background', 'popup'],
        securityEventsOnly: false,
        maxStoredLogs: 100,
        logRetentionDays: 7,
      };

      mockGetSystemSettingsUseCase.execute.mockResolvedValue({
        isFailure: false,
        value: mockSettingsDto,
      });

      await presenter.saveAppearanceSettings({ gradientStartColor: '#ff0000' });

      expect(mockUpdateSystemSettingsUseCase.execute).toHaveBeenCalledWith({
        settings: expect.objectContaining({
          gradientStartColor: '#ff0000',
        }),
      });
      expect(mockView.showSuccess).toHaveBeenCalledWith('Appearance settings saved');
    });

    it('should handle UseCase failure with proper error message', async () => {
      const error = new Error('Appearance validation failed');
      mockUpdateSystemSettingsUseCase.execute.mockResolvedValue({
        isSuccess: false,
        isFailure: true,
        error: error,
      });

      await expect(presenter.saveAppearanceSettings({ gradientStartColor: '#ff0000' })).rejects.toThrow(
        'Appearance validation failed'
      );

      expect(mockView.showError).toHaveBeenCalledWith('Failed to save settings: Appearance validation failed');
      expect(mockView.showSuccess).not.toHaveBeenCalled();
    });

    it('should handle settings not loaded error', async () => {
      // Create a new presenter without loading settings
      const freshPresenter = new SystemSettingsPresenter(
        mockView,
        mockGetSystemSettingsUseCase,
        mockUpdateSystemSettingsUseCase,
        mockResetSystemSettingsUseCase,
        mockExportSystemSettingsUseCase,
        mockImportSystemSettingsUseCase,
        mockExecuteStorageSyncUseCase,
        mockListSyncConfigsUseCase,
        mockLogger
      );

      await expect(freshPresenter.saveAppearanceSettings({ gradientStartColor: '#ff0000' })).rejects.toThrow(
        'Settings not loaded'
      );

      expect(mockView.showError).toHaveBeenCalledWith('Failed to save settings: Settings not loaded');
    });
  });

  describe('Error Handling - Additional Coverage', () => {
    it('should handle reset settings failure', async () => {
      global.confirm = jest.fn(() => true);
      const error = new Error('Reset operation failed');

      mockResetSystemSettingsUseCase.execute.mockResolvedValue({
        isFailure: true,
        error: error,
      });

      await expect(presenter.resetSettings()).rejects.toThrow('Reset operation failed');

      expect(mockView.showError).toHaveBeenCalledWith('Failed to reset settings: Reset operation failed');
      expect(mockView.showSuccess).not.toHaveBeenCalled();
    });

    it('should handle export settings failure', async () => {
      const error = new Error('Export operation failed');

      mockExportSystemSettingsUseCase.execute.mockResolvedValue({
        isFailure: true,
        error: error,
      });

      await expect(presenter.exportSettings()).rejects.toThrow('Export operation failed');

      expect(mockView.showError).toHaveBeenCalledWith('Failed to export settings: Export operation failed');
    });

    it('should handle import settings failure', async () => {
      const error = new Error('Import operation failed');
      // Create a proper mock File object with text() method
      const mockFile = {
        text: jest.fn().mockResolvedValue('invalid content'),
        name: 'test.json',
        type: 'application/json'
      } as any;

      mockImportSystemSettingsUseCase.execute.mockResolvedValue({
        isFailure: true,
        error: error,
      });

      await expect(presenter.importSettings(mockFile)).rejects.toThrow('Import operation failed');

      expect(mockView.showError).toHaveBeenCalledWith('Failed to import settings: Import operation failed');
    });

    it('should handle data sync failure', async () => {
      const error = new Error('Sync operation failed');

      mockExecuteStorageSyncUseCase.execute.mockResolvedValue({
        success: false,
        error: error.message,
      });

      await expect(presenter.executeDataSync()).rejects.toThrow('Sync operation failed');

      expect(mockView.showError).toHaveBeenCalledWith('Data sync failed: Sync operation failed');
    });

    it('should handle unknown errors gracefully', async () => {
      mockGetSystemSettingsUseCase.execute.mockResolvedValue({
        isFailure: true,
        error: null, // Unknown error
      });

      await expect(presenter.loadSettings()).rejects.toThrow('Failed to load settings: null');

      expect(mockView.showError).toHaveBeenCalledWith('Failed to load settings: Failed to load settings: null');
    });

    it('should handle non-Error objects thrown', async () => {
      mockGetSystemSettingsUseCase.execute.mockRejectedValue('String error');

      await expect(presenter.loadSettings()).rejects.toBe('String error');

      expect(mockView.showError).toHaveBeenCalledWith('Failed to load settings: Unknown error');
    });
  });
});
