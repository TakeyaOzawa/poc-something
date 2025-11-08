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
      const mockSettingsCollection = {
        getRetryWaitSecondsMin: jest.fn(() => 30),
        getRetryWaitSecondsMax: jest.fn(() => 60),
        getRetryCount: jest.fn(() => 3),
        getWaitForOptionsMilliseconds: jest.fn(() => 100),
        getAutoFillProgressDialogMode: jest.fn(() => 'withCancel'),
        getLogLevel: jest.fn(() => 1),
        getEnableTabRecording: jest.fn(() => true),
        getEnableAudioRecording: jest.fn(() => false),
        getRecordingBitrate: jest.fn(() => 2500000),
        getRecordingRetentionDays: jest.fn(() => 10),
        getGradientStartColor: jest.fn(() => '#667eea'),
        getGradientEndColor: jest.fn(() => '#764ba2'),
        getGradientAngle: jest.fn(() => 135),
        getEnabledLogSources: jest.fn(() => ['background', 'popup']),
        getSecurityEventsOnly: jest.fn(() => false),
        getMaxStoredLogs: jest.fn(() => 100),
        getLogRetentionDays: jest.fn(() => 7),
      };

      mockGetSystemSettingsUseCase.execute.mockResolvedValue({
        isFailure: false,
        value: mockSettingsCollection,
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

      mockGetSystemSettingsUseCase.execute.mockResolvedValue({
        isFailure: false,
        value: {
          getRetryWaitSecondsMin: jest.fn(() => 30),
          getRetryWaitSecondsMax: jest.fn(() => 60),
          getRetryCount: jest.fn(() => 3),
          getWaitForOptionsMilliseconds: jest.fn(() => 100),
          getAutoFillProgressDialogMode: jest.fn(() => 'withCancel'),
          getLogLevel: jest.fn(() => 1),
          getEnableTabRecording: jest.fn(() => true),
          getEnableAudioRecording: jest.fn(() => false),
          getRecordingBitrate: jest.fn(() => 2500000),
          getRecordingRetentionDays: jest.fn(() => 10),
          getGradientStartColor: jest.fn(() => '#667eea'),
          getGradientEndColor: jest.fn(() => '#764ba2'),
          getGradientAngle: jest.fn(() => 135),
          getEnabledLogSources: jest.fn(() => ['background', 'popup']),
          getSecurityEventsOnly: jest.fn(() => false),
          getMaxStoredLogs: jest.fn(() => 100),
          getLogRetentionDays: jest.fn(() => 7),
        },
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
});
