/**
 * Presentation Layer: AutomationVariables Manager Presenter
 * Separates UI logic from business logic for future framework migration
 */

import {
  AutomationVariablesViewModel,
  AutomationResultViewModel,
} from '../types/AutomationVariablesViewModel';
import { TabRecordingViewModel } from '../types/TabRecordingViewModel';
import { ViewModelMapper } from '../mappers/ViewModelMapper';
import { container } from '@infrastructure/di/GlobalContainer';
import { TOKENS } from '@infrastructure/di/ServiceTokens';
import { AutomationVariablesOutputDto } from '@application/dtos/AutomationVariablesOutputDto';
import { AutomationResultOutputDto } from '@application/dtos/AutomationResultOutputDto';

// Use Cases (DIコンテナから解決)
import type { GetAllAutomationVariablesUseCase } from '@usecases/automation-variables/GetAllAutomationVariablesUseCase';
import type { GetAutomationVariablesByIdUseCase } from '@usecases/automation-variables/GetAutomationVariablesByIdUseCase';
import type { GetAutomationVariablesByWebsiteIdUseCase } from '@usecases/automation-variables/GetAutomationVariablesByWebsiteIdUseCase';
import type { SaveAutomationVariablesUseCase } from '@usecases/automation-variables/SaveAutomationVariablesUseCase';
import type { DeleteAutomationVariablesUseCase } from '@usecases/automation-variables/DeleteAutomationVariablesUseCase';
import type { DuplicateAutomationVariablesUseCase } from '@usecases/automation-variables/DuplicateAutomationVariablesUseCase';
import type { ExportAutomationVariablesUseCase } from '@usecases/automation-variables/ExportAutomationVariablesUseCase';
import type { ImportAutomationVariablesUseCase } from '@usecases/automation-variables/ImportAutomationVariablesUseCase';
import type { GetLatestAutomationResultUseCase } from '@usecases/automation-variables/GetLatestAutomationResultUseCase';
import type { GetAutomationResultHistoryUseCase } from '@usecases/automation-variables/GetAutomationResultHistoryUseCase';
import type { GetAllWebsitesUseCase } from '@usecases/websites/GetAllWebsitesUseCase';
import type { GetLatestRecordingByVariablesIdUseCase } from '@usecases/recording/GetLatestRecordingByVariablesIdUseCase';

// Re-export for external use
export { AutomationVariablesViewModel, AutomationResultViewModel };
import { LoggerFactory, Logger } from '@/infrastructure/loggers/LoggerFactory';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';

/**
 * ViewModel for displaying AutomationVariables with latest result
 */
export interface AutomationVariablesViewModelWithResult extends AutomationVariablesViewModel {
  latestResult?: AutomationResultViewModel | null;
  websiteName?: string;
}

/**
 * View interface for AutomationVariables Manager
 */
export interface AutomationVariablesManagerView {
  showVariables(variables: AutomationVariablesViewModelWithResult[]): void;
  showError(message: string): void;
  showSuccess(message: string): void;
  showLoading(): void;
  hideLoading(): void;
  showEmpty(): void;
  showRecordingPreview(recordingData: Blob): void;
  showNoRecordingMessage(): void;
}

/**
 * Presenter for AutomationVariables Manager
 */
export class AutomationVariablesManagerPresenter {
  private logger: Logger;

  // DIコンテナから依存性を解決
  private getAllAutomationVariablesUseCase: GetAllAutomationVariablesUseCase;
  private getAutomationVariablesByIdUseCase: GetAutomationVariablesByIdUseCase;
  private getAutomationVariablesByWebsiteIdUseCase: GetAutomationVariablesByWebsiteIdUseCase;
  private saveAutomationVariablesUseCase: SaveAutomationVariablesUseCase;
  private deleteAutomationVariablesUseCase: DeleteAutomationVariablesUseCase;
  private duplicateAutomationVariablesUseCase: DuplicateAutomationVariablesUseCase;
  private exportAutomationVariablesUseCase: ExportAutomationVariablesUseCase;
  private importAutomationVariablesUseCase: ImportAutomationVariablesUseCase;
  private getLatestAutomationResultUseCase: GetLatestAutomationResultUseCase;
  private getAutomationResultHistoryUseCase: GetAutomationResultHistoryUseCase;
  private getAllWebsitesUseCase: GetAllWebsitesUseCase;
  private getLatestRecordingByVariablesIdUseCase: GetLatestRecordingByVariablesIdUseCase;

  constructor(
    private view: AutomationVariablesManagerView,
    logger?: Logger
  ) {
    this.logger = logger || LoggerFactory.createLogger('AutomationVariablesManagerPresenter');

    // DIコンテナから依存性を解決
    this.getAllAutomationVariablesUseCase = container.resolve(
      TOKENS.GET_ALL_AUTOMATION_VARIABLES_USE_CASE
    );
    this.getAutomationVariablesByIdUseCase = container.resolve(
      TOKENS.GET_AUTOMATION_VARIABLES_BY_ID_USE_CASE
    );
    this.getAutomationVariablesByWebsiteIdUseCase = container.resolve(
      TOKENS.GET_AUTOMATION_VARIABLES_BY_WEBSITE_ID_USE_CASE
    );
    this.saveAutomationVariablesUseCase = container.resolve(
      TOKENS.SAVE_AUTOMATION_VARIABLES_USE_CASE
    );
    this.deleteAutomationVariablesUseCase = container.resolve(
      TOKENS.DELETE_AUTOMATION_VARIABLES_USE_CASE
    );
    this.duplicateAutomationVariablesUseCase = container.resolve(
      TOKENS.DUPLICATE_AUTOMATION_VARIABLES_USE_CASE
    );
    this.exportAutomationVariablesUseCase = container.resolve(
      TOKENS.EXPORT_AUTOMATION_VARIABLES_USE_CASE
    );
    this.importAutomationVariablesUseCase = container.resolve(
      TOKENS.IMPORT_AUTOMATION_VARIABLES_USE_CASE
    );
    this.getLatestAutomationResultUseCase = container.resolve(
      TOKENS.GET_LATEST_AUTOMATION_RESULT_USE_CASE
    );
    this.getAutomationResultHistoryUseCase = container.resolve(
      TOKENS.GET_AUTOMATION_RESULT_HISTORY_USE_CASE
    );
    this.getAllWebsitesUseCase = container.resolve(TOKENS.GET_ALL_WEBSITES_USE_CASE);
    this.getLatestRecordingByVariablesIdUseCase = container.resolve(
      TOKENS.GET_LATEST_RECORDING_BY_VARIABLES_ID_USE_CASE
    );
  }

  /**
   * AutomationVariablesOutputDto → AutomationVariablesViewModelWithResult 変換
   */
  private toAutomationVariablesViewModel(
    dto: AutomationVariablesOutputDto,
    latestResult?: AutomationResultOutputDto | null,
    websiteName?: string
  ): AutomationVariablesViewModelWithResult {
    const baseViewModel = ViewModelMapper.toAutomationVariablesViewModel(dto);
    return {
      ...baseViewModel,
      websiteName: websiteName || dto.websiteId,
      latestResult: latestResult ? ViewModelMapper.toAutomationResultViewModel(latestResult) : null,
    };
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ja-JP');
    } catch {
      return dateString;
    }
  }

  /**
   * Load automation variables with their latest execution results
   */
  async loadVariables(websiteId?: string): Promise<void> {
    try {
      this.view.showLoading();

      // Load automation variables
      const variablesResult = websiteId
        ? await this.getAutomationVariablesByWebsiteIdUseCase.execute({ websiteId })
        : await this.getAllAutomationVariablesUseCase.execute();

      let variables: AutomationVariablesOutputDto[] = [];

      if (websiteId) {
        // Single result for specific website
        const singleResult =
          variablesResult.automationVariables as AutomationVariablesOutputDto | null;
        if (singleResult) {
          variables = [singleResult];
        }
      } else {
        // Array result for all variables
        const arrayResult = variablesResult.automationVariables as
          | AutomationVariablesOutputDto[]
          | null;
        variables = arrayResult || [];
      }

      if (!variables || variables.length === 0) {
        this.view.showEmpty();
        return;
      }

      // Load all websites for name lookup
      const { websites } = await this.getAllWebsitesUseCase.execute();
      const websiteViewModels = ViewModelMapper.toWebsiteViewModels(websites || []);
      const websiteMap = new Map(websiteViewModels.map((w) => [w.id, w.name]));

      // Load latest result for each automation variables
      const viewModels = await Promise.all(
        variables.map(async (variableDto: AutomationVariablesOutputDto) => {
          const { result: latestResult } = await this.getLatestAutomationResultUseCase.execute({
            automationVariablesId: variableDto.id,
          });

          return this.toAutomationVariablesViewModel(
            variableDto,
            latestResult || null,
            websiteMap.get(variableDto.websiteId)
          );
        })
      );

      this.view.showVariables(viewModels);
    } catch (error) {
      this.logger.error('Failed to load automation variables', error);
      this.view.showError(I18nAdapter.getMessage('automationVariablesLoadFailed'));
    } finally {
      this.view.hideLoading();
    }
  }

  /**
   * Save automation variables
   */
  async saveVariables(variablesData: AutomationVariablesOutputDto): Promise<void> {
    try {
      // Convert DTO to entity data format
      const automationVariablesData = {
        id: variablesData.id,
        websiteId: variablesData.websiteId,
        variables: variablesData.variables,
        status: (variablesData.status as 'enabled' | 'disabled' | 'once') || 'enabled',
        updatedAt: variablesData.updatedAt,
      };

      // Create entity from data
      const { AutomationVariables } = await import('@domain/entities/AutomationVariables');
      const automationVariables = new AutomationVariables(automationVariablesData);

      await this.saveAutomationVariablesUseCase.execute({ automationVariables });
      this.view.showSuccess(I18nAdapter.getMessage('automationVariablesSaved'));
    } catch (error) {
      this.logger.error('Failed to save automation variables', error);
      this.view.showError(I18nAdapter.getMessage('saveFailed'));
      throw error;
    }
  }

  /**
   * Delete automation variables and associated results
   */
  async deleteVariables(id: string): Promise<void> {
    try {
      await this.deleteAutomationVariablesUseCase.execute({ id });
      this.view.showSuccess(I18nAdapter.getMessage('automationVariablesDeleted'));
    } catch (error) {
      this.logger.error('Failed to delete automation variables', error);
      this.view.showError(I18nAdapter.getMessage('deleteFailed'));
      throw error;
    }
  }

  /**
   * Duplicate automation variables
   */
  async duplicateVariables(id: string): Promise<void> {
    try {
      const { automationVariables: duplicate } =
        await this.duplicateAutomationVariablesUseCase.execute({ id });
      if (duplicate) {
        this.view.showSuccess(I18nAdapter.getMessage('automationVariablesDuplicated'));
      } else {
        this.view.showError(I18nAdapter.getMessage('automationVariablesNotFound'));
      }
    } catch (error) {
      this.logger.error('Failed to duplicate automation variables', error);
      this.view.showError(I18nAdapter.getMessage('duplicateFailed'));
      throw error;
    }
  }

  /**
   * Get automation variables by ID
   */
  async getVariablesById(id: string): Promise<AutomationVariablesViewModel | null> {
    try {
      const { automationVariables: variables } =
        await this.getAutomationVariablesByIdUseCase.execute({ id });
      return variables ? ViewModelMapper.toAutomationVariablesViewModel(variables) : null;
    } catch (error) {
      this.logger.error('Failed to get automation variables', error);
      this.view.showError(I18nAdapter.getMessage('automationVariablesGetFailed'));
      return null;
    }
  }

  /**
   * Export automation variables to CSV
   */
  async exportVariables(): Promise<string> {
    try {
      const { csvText } = await this.exportAutomationVariablesUseCase.execute();
      return csvText;
    } catch (error) {
      this.logger.error('Failed to export automation variables', error);
      this.view.showError(I18nAdapter.getMessage('exportFailed'));
      throw error;
    }
  }

  /**
   * Import automation variables from CSV
   */
  async importVariables(csvText: string): Promise<void> {
    try {
      await this.importAutomationVariablesUseCase.execute({ csvText });
      this.view.showSuccess(I18nAdapter.getMessage('importCompleted'));
    } catch (error) {
      this.logger.error('Failed to import automation variables', error);
      const errorMessage =
        error instanceof Error ? error.message : I18nAdapter.getMessage('unknownError');
      this.view.showError(I18nAdapter.format('importFailed', errorMessage));
      throw error;
    }
  }

  /**
   * Load execution history for specific automation variables
   */
  async loadResultHistory(variablesId: string): Promise<AutomationResultOutputDto[]> {
    try {
      const { results } = await this.getAutomationResultHistoryUseCase.execute({
        automationVariablesId: variablesId,
      });
      return results;
    } catch (error) {
      this.logger.error('Failed to load automation result history', error);
      this.view.showError(I18nAdapter.getMessage('resultHistoryLoadFailed'));
      return [];
    }
  }

  /**
   * Get latest recording for automation variables
   */
  async getLatestRecording(variablesId: string): Promise<TabRecordingViewModel | null> {
    try {
      const recording = await this.getLatestRecordingByVariablesIdUseCase.execute({
        automationVariablesId: variablesId,
      });

      if (!recording) {
        return null;
      }

      // TabRecordingOutputDtoからViewModelに変換
      const recordingDto = {
        id: recording.id,
        automationResultId: recording.automationResultId,
        tabId: 0, // デフォルト値
        bitrate: 2500000, // デフォルト値
        state: 'completed', // デフォルト値
        startedAt: recording.startedAt,
        stoppedAt: recording.stoppedAt,
        duration: recording.duration,
        fileSize: recording.fileSize,
        size: recording.fileSize,
        mimeType: 'video/webm', // デフォルト値
      };

      return ViewModelMapper.toTabRecordingViewModel(recordingDto);
    } catch (error) {
      this.logger.error('Failed to get latest recording', error);
      this.view.showError(I18nAdapter.getMessage('recordingLoadFailed'));
      return null;
    }
  }

  /**
   * Get view instance
   */
  getView(): AutomationVariablesManagerView {
    return this.view;
  }
}
