/**
 * Unit Tests: StorageSyncManagerPresenter
 */

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string, ...args: any[]) => {
      if (args.length > 0) {
        // Return key with parameters for testing
        return args.length === 1 && typeof args[0] === 'string'
          ? `${key}: ${args[0]}`
          : `${key}: ${args.join(', ')}`;
      }
      return key;
    }),
  },
}));

import {
  StorageSyncManagerPresenter,
  StorageSyncManagerView,
} from '../StorageSyncManagerPresenter';
import { CreateSyncConfigUseCase } from '@usecases/sync/CreateSyncConfigUseCase';
import { UpdateSyncConfigUseCase } from '@usecases/sync/UpdateSyncConfigUseCase';
import { DeleteSyncConfigUseCase } from '@usecases/sync/DeleteSyncConfigUseCase';
import { ListSyncConfigsUseCase } from '@usecases/sync/ListSyncConfigsUseCase';
import { ImportCSVUseCase } from '@usecases/sync/ImportCSVUseCase';
import { ExportCSVUseCase } from '@usecases/sync/ExportCSVUseCase';
import { ValidateSyncConfigUseCase } from '@usecases/sync/ValidateSyncConfigUseCase';
import { TestConnectionUseCase } from '@usecases/sync/TestConnectionUseCase';
import { GetSyncHistoriesUseCase } from '@usecases/sync/GetSyncHistoriesUseCase';
import { CleanupSyncHistoriesUseCase } from '@usecases/sync/CleanupSyncHistoriesUseCase';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { NoOpLogger } from '@domain/services/NoOpLogger';

describe('StorageSyncManagerPresenter', () => {
  let presenter: StorageSyncManagerPresenter;
  let mockView: jest.Mocked<StorageSyncManagerView>;
  let mockCreateUseCase: jest.Mocked<CreateSyncConfigUseCase>;
  let mockUpdateUseCase: jest.Mocked<UpdateSyncConfigUseCase>;
  let mockDeleteUseCase: jest.Mocked<DeleteSyncConfigUseCase>;
  let mockListUseCase: jest.Mocked<ListSyncConfigsUseCase>;
  let mockImportUseCase: jest.Mocked<ImportCSVUseCase>;
  let mockExportUseCase: jest.Mocked<ExportCSVUseCase>;
  let mockValidateUseCase: jest.Mocked<ValidateSyncConfigUseCase>;
  let mockTestConnectionUseCase: jest.Mocked<TestConnectionUseCase>;
  let mockGetHistoriesUseCase: jest.Mocked<GetSyncHistoriesUseCase>;
  let mockCleanupHistoriesUseCase: jest.Mocked<CleanupSyncHistoriesUseCase>;

  beforeEach(() => {
    mockView = {
      showConfigs: jest.fn(),
      showError: jest.fn(),
      showSuccess: jest.fn(),
      showLoading: jest.fn(),
      hideLoading: jest.fn(),
      showEmpty: jest.fn(),
      showConnectionTestResult: jest.fn(),
      showValidationResult: jest.fn(),
      showSyncHistories: jest.fn(),
      showHistoryEmpty: jest.fn(),
      showHistoryDetail: jest.fn(),
      showConflictResolutionDialog: jest.fn(),
      showProgress: jest.fn(),
      updateProgress: jest.fn(),
      hideProgress: jest.fn(),
    };

    mockCreateUseCase = { execute: jest.fn() } as any;
    mockUpdateUseCase = { execute: jest.fn() } as any;
    mockDeleteUseCase = { execute: jest.fn() } as any;
    mockListUseCase = { execute: jest.fn() } as any;
    mockImportUseCase = { execute: jest.fn() } as any;
    mockExportUseCase = { execute: jest.fn() } as any;
    mockValidateUseCase = { execute: jest.fn() } as any;
    mockTestConnectionUseCase = { execute: jest.fn() } as any;
    mockGetHistoriesUseCase = { execute: jest.fn() } as any;
    mockCleanupHistoriesUseCase = { execute: jest.fn() } as any;

    presenter = new StorageSyncManagerPresenter(
      mockView,
      mockCreateUseCase,
      mockUpdateUseCase,
      mockDeleteUseCase,
      mockListUseCase,
      mockImportUseCase,
      mockExportUseCase,
      mockValidateUseCase,
      mockTestConnectionUseCase,
      mockGetHistoriesUseCase,
      mockCleanupHistoriesUseCase,
      new NoOpLogger()
    );
  });

  describe('loadConfigs', () => {
    it('should load and display all sync configurations', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'spread-sheet',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [],
        outputs: [{ key: 'data', defaultValue: null }],
      });

      mockListUseCase.execute.mockResolvedValue({
        success: true,
        configs: [config],
      });

      await presenter.loadConfigs();

      expect(mockView.showLoading).toHaveBeenCalled();
      expect(mockListUseCase.execute).toHaveBeenCalledWith({});
      expect(mockView.showConfigs).toHaveBeenCalledWith([config.toData()]);
      expect(mockView.hideLoading).toHaveBeenCalled();
    });

    it('should show empty when no configurations found', async () => {
      mockListUseCase.execute.mockResolvedValue({
        success: true,
        configs: [],
      });

      await presenter.loadConfigs();

      expect(mockView.showEmpty).toHaveBeenCalled();
      expect(mockView.hideLoading).toHaveBeenCalled();
    });

    it('should handle errors and show error message', async () => {
      mockListUseCase.execute.mockResolvedValue({
        success: false,
        error:
          '同期設定の読み込み中に予期しないエラーが発生しました。ページを更新して再度お試しください。問題が解決しない場合は、Chrome拡張機能の再インストールをご検討ください。',
      });

      await presenter.loadConfigs();

      expect(mockView.showError).toHaveBeenCalledWith(
        '同期設定の読み込み中に予期しないエラーが発生しました。ページを更新して再度お試しください。問題が解決しない場合は、Chrome拡張機能の再インストールをご検討ください。'
      );
      expect(mockView.hideLoading).toHaveBeenCalled();
    });

    it('should handle exceptions', async () => {
      mockListUseCase.execute.mockRejectedValue(new Error('Network error'));

      await presenter.loadConfigs();

      expect(mockView.showError).toHaveBeenCalledWith('syncConfigLoadError');
      expect(mockView.hideLoading).toHaveBeenCalled();
    });
  });

  describe('createConfig', () => {
    it('should create configuration and show success', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'spread-sheet',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [],
        outputs: [{ key: 'data', defaultValue: null }],
      });

      mockCreateUseCase.execute.mockResolvedValue({
        success: true,
        config,
      });

      await presenter.createConfig(config);

      expect(mockCreateUseCase.execute).toHaveBeenCalled();
      expect(mockView.showSuccess).toHaveBeenCalledWith('syncConfigCreated');
    });

    it('should handle errors and show error message', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'spread-sheet',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [],
        outputs: [{ key: 'data', defaultValue: null }],
      });

      mockCreateUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Config already exists',
      });

      await expect(presenter.createConfig(config)).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalledWith('Config already exists');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration and show success', async () => {
      mockUpdateUseCase.execute.mockResolvedValue({
        success: true,
      });

      await presenter.updateConfig('config-1', { enabled: false });

      expect(mockUpdateUseCase.execute).toHaveBeenCalledWith({
        id: 'config-1',
        enabled: false,
      });
      expect(mockView.showSuccess).toHaveBeenCalledWith('syncConfigUpdated');
    });

    it('should handle errors and show error message', async () => {
      mockUpdateUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Config not found',
      });

      await expect(presenter.updateConfig('config-1', {})).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalledWith('Config not found');
    });
  });

  describe('deleteConfig', () => {
    it('should delete configuration and show success', async () => {
      mockDeleteUseCase.execute.mockResolvedValue({
        success: true,
      });

      await presenter.deleteConfig('config-1');

      expect(mockDeleteUseCase.execute).toHaveBeenCalledWith({ id: 'config-1' });
      expect(mockView.showSuccess).toHaveBeenCalledWith('syncConfigDeleted');
    });

    it('should handle errors and show error message', async () => {
      mockDeleteUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Config not found',
      });

      await expect(presenter.deleteConfig('config-1')).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalledWith('Config not found');
    });
  });

  describe('getConfigById', () => {
    it('should return configuration when found', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'spread-sheet',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [],
        outputs: [{ key: 'data', defaultValue: null }],
      });

      mockListUseCase.execute.mockResolvedValue({
        success: true,
        configs: [config],
      });

      const result = await presenter.getConfigById(config.getId());

      expect(result).toEqual(config.toData());
    });

    it('should return null when configuration not found', async () => {
      mockListUseCase.execute.mockResolvedValue({
        success: true,
        configs: [],
      });

      const result = await presenter.getConfigById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle errors and return null', async () => {
      mockListUseCase.execute.mockRejectedValue(new Error('Failed'));

      const result = await presenter.getConfigById('config-1');

      expect(result).toBeNull();
      expect(mockView.showError).toHaveBeenCalledWith('syncConfigGetFailed');
    });
  });

  describe('exportConfigsToCSV', () => {
    it('should export configurations as CSV and show success', async () => {
      const csvData = 'key,value\ntestData,test';
      mockExportUseCase.execute.mockResolvedValue({
        success: true,
        csvData,
        exportedCount: 10,
      });

      const result = await presenter.exportConfigsToCSV('testData');

      expect(mockExportUseCase.execute).toHaveBeenCalledWith({ storageKey: 'testData' });
      expect(result).toBe(csvData);
      expect(mockView.showSuccess).toHaveBeenCalledWith('syncConfigExported: 10');
    });

    it('should handle errors and show error message', async () => {
      mockExportUseCase.execute.mockResolvedValue({
        success: false,
        error: 'No data found',
      });

      await expect(presenter.exportConfigsToCSV('testData')).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalledWith('syncConfigExportFailed');
    });
  });

  describe('importConfigsFromCSV', () => {
    it('should import configurations from CSV and show success', async () => {
      mockImportUseCase.execute.mockResolvedValue({
        success: true,
        importedCount: 5,
      });

      await presenter.importConfigsFromCSV('csv-data', 'testData', false);

      expect(mockImportUseCase.execute).toHaveBeenCalledWith({
        csvData: 'csv-data',
        storageKey: 'testData',
        mergeWithExisting: false,
      });
      expect(mockView.showSuccess).toHaveBeenCalledWith('syncConfigImported: 5');
    });

    it('should show merge message when merging', async () => {
      mockImportUseCase.execute.mockResolvedValue({
        success: true,
        importedCount: 5,
        mergedCount: 3,
      });

      await presenter.importConfigsFromCSV('csv-data', 'testData', true);

      expect(mockView.showSuccess).toHaveBeenCalledWith('syncConfigImportedWithMerge: 5,3');
    });

    it('should handle errors and show error message', async () => {
      mockImportUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Invalid CSV format',
      });

      await expect(presenter.importConfigsFromCSV('invalid', 'testData')).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalledWith('Invalid CSV format');
    });
  });

  describe('validateConfig', () => {
    it('should validate configuration and show results', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'spread-sheet',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [],
        outputs: [{ key: 'data', defaultValue: null }],
      });

      mockValidateUseCase.execute.mockResolvedValue({
        success: true,
        isValid: true,
        errors: [],
        warnings: [],
      });

      await presenter.validateConfig(config);

      expect(mockValidateUseCase.execute).toHaveBeenCalledWith({
        config,
        deepValidation: false,
      });
      expect(mockView.showValidationResult).toHaveBeenCalledWith({
        isValid: true,
        errors: [],
        warnings: [],
      });
      expect(mockView.showSuccess).toHaveBeenCalledWith('syncConfigValid');
    });

    it('should show validation errors', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'spread-sheet',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [],
        outputs: [{ key: 'data', defaultValue: null }],
      });

      mockValidateUseCase.execute.mockResolvedValue({
        success: true,
        isValid: false,
        errors: [{ field: 'storageKey', message: 'Invalid storage key', severity: 'error' }],
        warnings: [],
      });

      await presenter.validateConfig(config);

      expect(mockView.showError).toHaveBeenCalledWith('syncConfigInvalid: 1');
    });

    it('should handle validation failure', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'spread-sheet',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [],
        outputs: [{ key: 'data', defaultValue: null }],
      });

      mockValidateUseCase.execute.mockResolvedValue({
        success: false,
        isValid: false,
        errors: [],
        warnings: [],
      });

      await presenter.validateConfig(config);

      expect(mockView.showError).toHaveBeenCalledWith('syncConfigValidateFailed');
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully and show results', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [{ key: 'data', value: 'test' }],
        outputs: [{ key: 'result', defaultValue: null }],
      });

      mockTestConnectionUseCase.execute.mockResolvedValue({
        success: true,
        isConnectable: true,
        statusCode: 200,
        responseTime: 150,
      });

      await presenter.testConnection(config);

      expect(mockTestConnectionUseCase.execute).toHaveBeenCalledWith({
        config,
        timeout: undefined,
      });
      expect(mockView.showConnectionTestResult).toHaveBeenCalledWith({
        isConnectable: true,
        statusCode: 200,
        responseTime: 150,
        error: undefined,
      });
      expect(mockView.showSuccess).toHaveBeenCalledWith('syncConfigConnectionSuccess: 200,150');
    });

    it('should show connection failure', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [{ key: 'data', value: 'test' }],
        outputs: [{ key: 'result', defaultValue: null }],
      });

      mockTestConnectionUseCase.execute.mockResolvedValue({
        success: true,
        isConnectable: false,
        statusCode: 404,
        error: 'Not Found',
      });

      await presenter.testConnection(config);

      expect(mockView.showError).toHaveBeenCalledWith(
        'syncConfigConnectionFailedDetail: Not Found'
      );
    });

    it('should handle connection test error', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [{ key: 'data', value: 'test' }],
        outputs: [{ key: 'result', defaultValue: null }],
      });

      mockTestConnectionUseCase.execute.mockResolvedValue({
        success: false,
        isConnectable: false,
        error: 'Network error',
      });

      await presenter.testConnection(config);

      expect(mockView.showError).toHaveBeenCalledWith('Network error');
    });
  });

  describe('getView', () => {
    it('should return the view instance', () => {
      const view = presenter.getView();
      expect(view).toBe(mockView);
    });
  });

  describe('loadHistories', () => {
    it('should load and display sync histories', async () => {
      const history = {
        id: 'history-1',
        configId: 'config-1',
        storageKey: 'testData',
        syncDirection: 'bidirectional' as const,
        startTime: Date.now(),
        endTime: Date.now() + 1000,
        status: 'success' as const,
        retryCount: 0,
        createdAt: Date.now(),
      };

      const mockHistory = {
        getId: () => history.id,
        toData: () => history,
      };

      mockGetHistoriesUseCase.execute.mockResolvedValue({
        success: true,
        histories: [mockHistory as any],
      });

      await presenter.loadHistories('config-1', 50);

      expect(mockView.showLoading).toHaveBeenCalled();
      expect(mockGetHistoriesUseCase.execute).toHaveBeenCalledWith({
        configId: 'config-1',
        limit: 50,
      });
      expect(mockView.showSyncHistories).toHaveBeenCalledWith([history], 'config-1');
      expect(mockView.hideLoading).toHaveBeenCalled();
    });

    it('should show empty when no histories found', async () => {
      mockGetHistoriesUseCase.execute.mockResolvedValue({
        success: true,
        histories: [],
      });

      await presenter.loadHistories();

      expect(mockView.showHistoryEmpty).toHaveBeenCalled();
      expect(mockView.hideLoading).toHaveBeenCalled();
    });

    it('should handle errors and show error message', async () => {
      mockGetHistoriesUseCase.execute.mockResolvedValue({
        success: false,
        error: '同期履歴の読み込みに失敗しました',
      });

      await presenter.loadHistories();

      expect(mockView.showError).toHaveBeenCalledWith('同期履歴の読み込みに失敗しました');
      expect(mockView.hideLoading).toHaveBeenCalled();
    });

    it('should handle exceptions', async () => {
      mockGetHistoriesUseCase.execute.mockRejectedValue(new Error('Network error'));

      await presenter.loadHistories();

      expect(mockView.showError).toHaveBeenCalledWith('syncConfigHistoriesLoadError');
      expect(mockView.hideLoading).toHaveBeenCalled();
    });
  });

  describe('showHistoryDetail', () => {
    it('should show history detail when found', async () => {
      const history = {
        id: 'history-1',
        configId: 'config-1',
        storageKey: 'testData',
        syncDirection: 'bidirectional' as const,
        startTime: Date.now(),
        endTime: Date.now() + 1000,
        status: 'success' as const,
        retryCount: 0,
        createdAt: Date.now(),
      };

      const mockHistory = {
        getId: () => history.id,
        toData: () => history,
      };

      mockGetHistoriesUseCase.execute.mockResolvedValue({
        success: true,
        histories: [mockHistory as any],
      });

      await presenter.showHistoryDetail('history-1');

      expect(mockView.showHistoryDetail).toHaveBeenCalledWith(history);
    });

    it('should show error when history not found', async () => {
      mockGetHistoriesUseCase.execute.mockResolvedValue({
        success: true,
        histories: [],
      });

      await presenter.showHistoryDetail('non-existent');

      expect(mockView.showError).toHaveBeenCalledWith('syncConfigHistoryNotFound');
    });

    it('should handle errors and show error message', async () => {
      mockGetHistoriesUseCase.execute.mockResolvedValue({
        success: false,
        error: '同期履歴の読み込みに失敗しました',
      });

      await presenter.showHistoryDetail('history-1');

      expect(mockView.showError).toHaveBeenCalledWith('syncConfigHistoryDetailFailed');
    });

    it('should handle exceptions', async () => {
      mockGetHistoriesUseCase.execute.mockRejectedValue(new Error('Network error'));

      await presenter.showHistoryDetail('history-1');

      expect(mockView.showError).toHaveBeenCalledWith('syncConfigHistoryDetailLoadError');
    });
  });

  describe('cleanupHistories', () => {
    it('should cleanup old histories and show success', async () => {
      mockCleanupHistoriesUseCase.execute.mockResolvedValue({
        success: true,
        deletedCount: 5,
      });

      await presenter.cleanupHistories(30);

      expect(mockCleanupHistoriesUseCase.execute).toHaveBeenCalledWith({ olderThanDays: 30 });
      expect(mockView.showSuccess).toHaveBeenCalledWith('syncConfigCleanupSuccess: 5');
    });

    it('should handle zero deleted count', async () => {
      mockCleanupHistoriesUseCase.execute.mockResolvedValue({
        success: true,
        deletedCount: 0,
      });

      await presenter.cleanupHistories(30);

      expect(mockView.showSuccess).toHaveBeenCalledWith('syncConfigCleanupSuccess: 0');
    });

    it('should handle errors and show error message', async () => {
      mockCleanupHistoriesUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Failed to cleanup',
      });

      await presenter.cleanupHistories(30);

      expect(mockView.showError).toHaveBeenCalledWith('Failed to cleanup');
    });

    it('should handle exceptions', async () => {
      mockCleanupHistoriesUseCase.execute.mockRejectedValue(new Error('Database error'));

      await presenter.cleanupHistories(30);

      expect(mockView.showError).toHaveBeenCalledWith('syncConfigCleanupError');
    });
  });

  describe('edge cases', () => {
    it('should handle create config exception', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'spread-sheet',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [],
        outputs: [{ key: 'data', defaultValue: null }],
      });

      mockCreateUseCase.execute.mockRejectedValue(new Error('Network error'));

      await expect(presenter.createConfig(config)).rejects.toThrow();
    });

    it('should handle update config exception', async () => {
      mockUpdateUseCase.execute.mockRejectedValue(new Error('Network error'));

      await expect(presenter.updateConfig('config-1', {})).rejects.toThrow();
    });

    it('should handle delete config exception', async () => {
      mockDeleteUseCase.execute.mockRejectedValue(new Error('Network error'));

      await expect(presenter.deleteConfig('config-1')).rejects.toThrow();
    });

    it('should handle export CSV exception', async () => {
      mockExportUseCase.execute.mockRejectedValue(new Error('Network error'));

      await expect(presenter.exportConfigsToCSV('testData')).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalledWith('syncConfigExportFailed');
    });

    it('should handle import CSV exception', async () => {
      mockImportUseCase.execute.mockRejectedValue(new Error('Network error'));

      await expect(presenter.importConfigsFromCSV('invalid', 'testData')).rejects.toThrow();
      expect(mockView.showError).toHaveBeenCalledWith('Network error');
    });

    it('should handle validate config exception', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'spread-sheet',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [],
        outputs: [{ key: 'data', defaultValue: null }],
      });

      mockValidateUseCase.execute.mockRejectedValue(new Error('Network error'));

      await presenter.validateConfig(config);

      expect(mockView.showError).toHaveBeenCalledWith('syncConfigValidationError');
    });

    it('should validate config with deep validation', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'spread-sheet',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [],
        outputs: [{ key: 'data', defaultValue: null }],
      });

      mockValidateUseCase.execute.mockResolvedValue({
        success: true,
        isValid: true,
        errors: [],
        warnings: [],
      });

      await presenter.validateConfig(config, true);

      expect(mockValidateUseCase.execute).toHaveBeenCalledWith({
        config,
        deepValidation: true,
      });
    });

    it('should test connection with timeout', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [{ key: 'data', value: 'test' }],
        outputs: [{ key: 'result', defaultValue: null }],
      });

      mockTestConnectionUseCase.execute.mockResolvedValue({
        success: true,
        isConnectable: true,
        statusCode: 200,
        responseTime: 100,
      });

      await presenter.testConnection(config, 5000);

      expect(mockTestConnectionUseCase.execute).toHaveBeenCalledWith({
        config,
        timeout: 5000,
      });
    });

    it('should handle test connection exception', async () => {
      const config = StorageSyncConfig.create({
        storageKey: 'testData',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        inputs: [{ key: 'data', value: 'test' }],
        outputs: [{ key: 'result', defaultValue: null }],
      });

      mockTestConnectionUseCase.execute.mockRejectedValue(new Error('Network error'));

      await presenter.testConnection(config);

      expect(mockView.showError).toHaveBeenCalledWith('syncConfigConnectionTestError');
    });

    it('should handle getConfigById with failed list result', async () => {
      mockListUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Failed to list',
      });

      const result = await presenter.getConfigById('config-1');

      expect(result).toBeNull();
    });
  });
});
