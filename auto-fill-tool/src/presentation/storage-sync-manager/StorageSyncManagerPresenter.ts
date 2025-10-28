/* eslint-disable max-lines */
/**
 * Presentation Layer: Storage Sync Manager Presenter
 * Separates UI logic from business logic for future framework migration
 *
 * This file contains the presenter layer for Storage Sync Manager UI,
 * handling all user interactions, data transformations, and coordinating
 * between use cases and views. The file length exceeds 300 lines due to
 * comprehensive error message improvements in Phase 7, providing detailed,
 * user-friendly error messages in Japanese for all 14 sync operations
 * (create, update, delete, list, import, export, validate, test connection,
 * load histories, show detail, cleanup).
 *
 * @coverage 0%
 * @reason テストカバレッジが低い理由:
 * - Presenterレイヤーのテストは、Viewとの連携が必要であり、モック化が複雑
 * - 各Use Caseは既に十分にテストされており、Presenterは薄いラッパー層として機能
 * - エラーハンドリングとメッセージ変換が主な責務で、ビジネスロジックは含まれない
 */

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
import { StorageSyncConfig, StorageSyncConfigData } from '@domain/entities/StorageSyncConfig';
import { SyncHistoryData } from '@domain/entities/SyncHistory';
import { LoggerFactory } from '@/infrastructure/loggers/LoggerFactory';
import { Logger } from '@domain/types/logger.types';
import { I18nAdapter } from '@infrastructure/adapters/I18nAdapter';

/**
 * View interface for Storage Sync Manager
 */
export interface StorageSyncManagerView {
  showConfigs(configs: StorageSyncConfigData[]): void;
  showError(message: string): void;
  showSuccess(message: string): void;
  showLoading(): void;
  hideLoading(): void;
  showEmpty(): void;
  showConnectionTestResult(result: {
    isConnectable: boolean;
    statusCode?: number;
    responseTime?: number;
    error?: string;
  }): void;
  showValidationResult(result: {
    isValid: boolean;
    errors: Array<{ field: string; message: string }>;
    warnings: Array<{ field: string; message: string }>;
  }): void;
  showSyncHistories(histories: SyncHistoryData[], configId?: string): void;
  showHistoryEmpty(): void;
  showHistoryDetail(history: SyncHistoryData): void;
  showConflictResolutionDialog(conflict: {
    storageKey: string;
    localData: any;
    localTimestamp: string;
    remoteData: any;
    remoteTimestamp: string;
    remoteSource: 'notion' | 'spread-sheet';
  }): Promise<'local' | 'remote' | 'cancel'>;
  // Progress indicator methods
  showProgress(status: string, cancellable?: boolean): void;
  updateProgress(percent: number, status?: string): void;
  hideProgress(): void;
}

/**
 * Presenter for Storage Sync Manager
 */
export class StorageSyncManagerPresenter {
  private logger: Logger;

  // eslint-disable-next-line max-params
  constructor(
    private view: StorageSyncManagerView,
    private createSyncConfigUseCase: CreateSyncConfigUseCase,
    private updateSyncConfigUseCase: UpdateSyncConfigUseCase,
    private deleteSyncConfigUseCase: DeleteSyncConfigUseCase,
    private listSyncConfigsUseCase: ListSyncConfigsUseCase,
    private importCSVUseCase: ImportCSVUseCase,
    private exportCSVUseCase: ExportCSVUseCase,
    private validateSyncConfigUseCase: ValidateSyncConfigUseCase,
    private testConnectionUseCase: TestConnectionUseCase,
    private getSyncHistoriesUseCase: GetSyncHistoriesUseCase,
    private cleanupSyncHistoriesUseCase: CleanupSyncHistoriesUseCase,
    logger?: Logger
  ) {
    this.logger = logger || LoggerFactory.createLogger('StorageSyncManagerPresenter');
  }

  /**
   * Load all sync configurations
   */
  async loadConfigs(): Promise<void> {
    try {
      this.view.showLoading();

      const result = await this.listSyncConfigsUseCase.execute({});

      if (!result.success) {
        this.view.showError(result.error || I18nAdapter.getMessage('syncConfigLoadFailed'));
        return;
      }

      if (!result.configs || result.configs.length === 0) {
        this.view.showEmpty();
        return;
      }

      const configData = result.configs.map((c) => c.toData());
      this.view.showConfigs(configData);
    } catch (error) {
      this.logger.error('Failed to load sync configurations', error);
      this.view.showError(I18nAdapter.getMessage('syncConfigLoadError'));
    } finally {
      this.view.hideLoading();
    }
  }

  /**
   * Create new sync configuration
   */
  async createConfig(config: StorageSyncConfig): Promise<void> {
    try {
      const result = await this.createSyncConfigUseCase.execute({
        storageKey: config.getStorageKey(),
        enabled: config.isEnabled(),
        syncMethod: config.getSyncMethod(),
        syncTiming: config.getSyncTiming(),
        syncDirection: config.getSyncDirection(),
        syncIntervalSeconds: config.getSyncIntervalSeconds(),
        inputs: config.getInputs(),
        outputs: config.getOutputs(),
      });

      if (!result.success) {
        this.view.showError(result.error || I18nAdapter.getMessage('syncConfigCreateFailed'));
        throw new Error(result.error);
      }

      this.view.showSuccess(I18nAdapter.getMessage('syncConfigCreated'));
    } catch (error) {
      this.logger.error('Failed to create sync configuration', error);
      throw error;
    }
  }

  /**
   * Update existing sync configuration
   */
  async updateConfig(id: string, updates: Partial<StorageSyncConfigData>): Promise<void> {
    try {
      const result = await this.updateSyncConfigUseCase.execute({
        id,
        ...updates,
      });

      if (!result.success) {
        this.view.showError(result.error || I18nAdapter.getMessage('syncConfigUpdateFailed'));
        throw new Error(result.error);
      }

      this.view.showSuccess(I18nAdapter.getMessage('syncConfigUpdated'));
    } catch (error) {
      this.logger.error('Failed to update sync configuration', error);
      throw error;
    }
  }

  /**
   * Delete sync configuration
   */
  async deleteConfig(id: string): Promise<void> {
    try {
      const result = await this.deleteSyncConfigUseCase.execute({ id });

      if (!result.success) {
        this.view.showError(result.error || I18nAdapter.getMessage('syncConfigDeleteFailed'));
        throw new Error(result.error);
      }

      this.view.showSuccess(I18nAdapter.getMessage('syncConfigDeleted'));
    } catch (error) {
      this.logger.error('Failed to delete sync configuration', error);
      throw error;
    }
  }

  /**
   * Get sync configuration by ID
   */
  async getConfigById(id: string): Promise<StorageSyncConfigData | null> {
    try {
      const result = await this.listSyncConfigsUseCase.execute({});

      if (!result.success || !result.configs) {
        return null;
      }

      const config = result.configs.find((c) => c.getId() === id);
      return config?.toData() || null;
    } catch (error) {
      this.logger.error('Failed to get sync configuration', error);
      this.view.showError(I18nAdapter.getMessage('syncConfigGetFailed'));
      return null;
    }
  }

  /**
   * Export configurations to CSV
   */
  async exportConfigsToCSV(storageKey: string): Promise<string> {
    try {
      const result = await this.exportCSVUseCase.execute({ storageKey });

      if (!result.success || !result.csvData) {
        throw new Error(result.error || I18nAdapter.getMessage('syncConfigExportFailed'));
      }

      this.view.showSuccess(
        I18nAdapter.getMessage('syncConfigExported', String(result.exportedCount))
      );
      return result.csvData;
    } catch (error) {
      this.logger.error('Failed to export CSV', error);
      this.view.showError(I18nAdapter.getMessage('syncConfigExportFailed'));
      throw error;
    }
  }

  /**
   * Import configurations from CSV
   */
  async importConfigsFromCSV(
    csvData: string,
    storageKey: string,
    mergeWithExisting = false
  ): Promise<void> {
    try {
      const result = await this.importCSVUseCase.execute({
        csvData,
        storageKey,
        mergeWithExisting,
      });

      if (!result.success) {
        throw new Error(result.error || I18nAdapter.getMessage('syncConfigImportFailed'));
      }

      const message = result.mergedCount
        ? I18nAdapter.getMessage('syncConfigImportedWithMerge', [
            String(result.importedCount),
            String(result.mergedCount),
          ])
        : I18nAdapter.getMessage('syncConfigImported', String(result.importedCount));

      this.view.showSuccess(message);
    } catch (error) {
      this.logger.error('Failed to import CSV', error);
      this.view.showError(
        error instanceof Error ? error.message : I18nAdapter.getMessage('syncConfigImportFailed')
      );
      throw error;
    }
  }

  /**
   * Validate sync configuration
   */
  async validateConfig(config: StorageSyncConfig, deepValidation = false): Promise<void> {
    try {
      const result = await this.validateSyncConfigUseCase.execute({
        config,
        deepValidation,
      });

      if (!result.success) {
        this.view.showError(I18nAdapter.getMessage('syncConfigValidateFailed'));
        return;
      }

      this.view.showValidationResult({
        isValid: result.isValid,
        errors: result.errors || [],
        warnings: result.warnings || [],
      });

      if (result.isValid) {
        this.view.showSuccess(I18nAdapter.getMessage('syncConfigValid'));
      } else {
        this.view.showError(
          I18nAdapter.getMessage('syncConfigInvalid', String(result.errors?.length || 0))
        );
      }
    } catch (error) {
      this.logger.error('Failed to validate configuration', error);
      this.view.showError(I18nAdapter.getMessage('syncConfigValidationError'));
    }
  }

  /**
   * Test connection for sync configuration
   */
  async testConnection(config: StorageSyncConfig, timeout?: number): Promise<void> {
    try {
      const result = await this.testConnectionUseCase.execute({
        config,
        timeout,
      });

      if (!result.success) {
        this.view.showError(
          result.error || I18nAdapter.getMessage('syncConfigConnectionTestFailed')
        );
        return;
      }

      this.view.showConnectionTestResult({
        isConnectable: result.isConnectable,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        error: result.error,
      });

      if (result.isConnectable) {
        this.view.showSuccess(
          I18nAdapter.getMessage('syncConfigConnectionSuccess', [
            String(result.statusCode),
            String(result.responseTime),
          ])
        );
      } else {
        this.view.showError(
          I18nAdapter.getMessage(
            'syncConfigConnectionFailedDetail',
            result.error || I18nAdapter.getMessage('error_generic')
          )
        );
      }
    } catch (error) {
      this.logger.error('Failed to test connection', error);
      this.view.showError(I18nAdapter.getMessage('syncConfigConnectionTestError'));
    }
  }

  /**
   * Load sync histories
   */
  async loadHistories(configId?: string, limit = 50): Promise<void> {
    try {
      this.view.showLoading();

      const result = await this.getSyncHistoriesUseCase.execute({
        configId,
        limit,
      });

      if (!result.success) {
        this.view.showError(
          result.error || I18nAdapter.getMessage('syncConfigHistoriesLoadFailed')
        );
        return;
      }

      if (!result.histories || result.histories.length === 0) {
        this.view.showHistoryEmpty();
        return;
      }

      const historyData = result.histories.map((h) => h.toData());
      this.view.showSyncHistories(historyData, configId);
    } catch (error) {
      this.logger.error('Failed to load sync histories', error);
      this.view.showError(I18nAdapter.getMessage('syncConfigHistoriesLoadError'));
    } finally {
      this.view.hideLoading();
    }
  }

  /**
   * Show history detail
   */
  async showHistoryDetail(historyId: string): Promise<void> {
    try {
      const result = await this.getSyncHistoriesUseCase.execute({ limit: 1000 });

      if (!result.success || !result.histories) {
        this.view.showError(I18nAdapter.getMessage('syncConfigHistoryDetailFailed'));
        return;
      }

      const history = result.histories.find((h) => h.getId() === historyId);
      if (!history) {
        this.view.showError(I18nAdapter.getMessage('syncConfigHistoryNotFound'));
        return;
      }

      this.view.showHistoryDetail(history.toData());
    } catch (error) {
      this.logger.error('Failed to load history details', error);
      this.view.showError(I18nAdapter.getMessage('syncConfigHistoryDetailLoadError'));
    }
  }

  /**
   * Cleanup old histories
   */
  async cleanupHistories(olderThanDays: number): Promise<void> {
    try {
      const result = await this.cleanupSyncHistoriesUseCase.execute({ olderThanDays });

      if (!result.success) {
        this.view.showError(result.error || I18nAdapter.getMessage('syncConfigCleanupFailed'));
        return;
      }

      this.view.showSuccess(
        I18nAdapter.getMessage('syncConfigCleanupSuccess', String(result.deletedCount || 0))
      );
    } catch (error) {
      this.logger.error('Failed to cleanup histories', error);
      this.view.showError(I18nAdapter.getMessage('syncConfigCleanupError'));
    }
  }

  /**
   * Get view instance
   */
  getView(): StorageSyncManagerView {
    return this.view;
  }
}
