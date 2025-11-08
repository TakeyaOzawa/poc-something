/**
 * Test: SystemSettingsPresenter
 * Tests business logic coordination for system settings
 */

import { SystemSettingsPresenter, SystemSettingsView } from '../SystemSettingsPresenter';
import { GetSystemSettingsUseCase } from '@usecases/system-settings/GetSystemSettingsUseCase';
import { UpdateSystemSettingsUseCase } from '@usecases/system-settings/UpdateSystemSettingsUseCase';
import { ResetSystemSettingsUseCase } from '@usecases/system-settings/ResetSystemSettingsUseCase';
import { ExportSystemSettingsUseCase } from '@usecases/system-settings/ExportSystemSettingsUseCase';
import { ImportSystemSettingsUseCase } from '@usecases/system-settings/ImportSystemSettingsUseCase';
import { ExecuteStorageSyncUseCase } from '@usecases/storage/ExecuteStorageSyncUseCase';
import { ListSyncConfigsUseCase } from '@usecases/sync/ListSyncConfigsUseCase';
import { SystemSettingsOutputDto } from '@application/dtos/SystemSettingsOutputDto';
import { Logger } from '@domain/types/logger.types';

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => {
      const messages: { [key: string]: string } = {
        settingsLoadFailed: 'Failed to load settings',
      };
      return messages[key] || key;
    }),
  },
}));

// Mock dependencies
const mockView: jest.Mocked<SystemSettingsView> = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  updateGeneralSettings: jest.fn(),
  updateRecordingSettings: jest.fn(),
  updateAppearanceSettings: jest.fn(),
  applyGradientBackground: jest.fn(),
};

const mockGetSystemSettingsUseCase: jest.Mocked<GetSystemSettingsUseCase> = {
  execute: jest.fn(),
};

const mockUpdateSystemSettingsUseCase: jest.Mocked<UpdateSystemSettingsUseCase> = {
  execute: jest.fn(),
};

const mockResetSystemSettingsUseCase: jest.Mocked<ResetSystemSettingsUseCase> = {
  execute: jest.fn(),
};

const mockExportSystemSettingsUseCase: jest.Mocked<ExportSystemSettingsUseCase> = {
  execute: jest.fn(),
};

const mockImportSystemSettingsUseCase: jest.Mocked<ImportSystemSettingsUseCase> = {
  execute: jest.fn(),
};

const mockExecuteStorageSyncUseCase: jest.Mocked<ExecuteStorageSyncUseCase> = {
  execute: jest.fn(),
};

const mockListSyncConfigsUseCase: jest.Mocked<ListSyncConfigsUseCase> = {
  execute: jest.fn(),
};

const mockLogger: jest.Mocked<Logger> = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  createChild: jest.fn().mockReturnThis(),
};

describe('SystemSettingsPresenter', () => {
  let presenter: SystemSettingsPresenter;

  beforeEach(() => {
    jest.clearAllMocks();

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
  });

  describe('loadAllSettings', () => {
    it('should load and display system settings successfully', async () => {
      const mockSettingsDto: SystemSettingsOutputDto = {
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 3,
        waitForOptionsMilliseconds: 100,
        autoFillProgressDialogMode: 'withCancel',
        logLevel: 1,
        enableTabRecording: true,
        enableAudioRecording: false,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        gradientStartColor: '#667eea',
        gradientEndColor: '#764ba2',
        gradientAngle: 135,
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
      expect(mockView.applyGradientBackground).toHaveBeenCalledWith('#4F46E5', '#7C3AED', 135);
      expect(mockView.hideLoading).toHaveBeenCalled();
    });

    it('should handle load error', async () => {
      const error = new Error('Load failed');
      mockGetSystemSettingsUseCase.execute.mockRejectedValue(error);

      await presenter.loadAllSettings();

      expect(mockView.showLoading).toHaveBeenCalled();
      expect(mockView.showError).toHaveBeenCalled();
      expect(mockView.hideLoading).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to load settings', error);
    });
  });

  describe('constructor', () => {
    it('should create presenter instance', () => {
      expect(presenter).toBeInstanceOf(SystemSettingsPresenter);
    });
  });
});
