/**
 * Presentation Layer: AutomationVariables Manager Presenter
 * Separates UI logic from business logic for future framework migration
 */

import { GetAllAutomationVariablesUseCase } from '@usecases/automation-variables/GetAllAutomationVariablesUseCase';
import { GetAutomationVariablesByIdUseCase } from '@usecases/automation-variables/GetAutomationVariablesByIdUseCase';
import { GetAutomationVariablesByWebsiteIdUseCase } from '@usecases/automation-variables/GetAutomationVariablesByWebsiteIdUseCase';
import { SaveAutomationVariablesUseCase } from '@usecases/automation-variables/SaveAutomationVariablesUseCase';
import { DeleteAutomationVariablesUseCase } from '@usecases/automation-variables/DeleteAutomationVariablesUseCase';
import { DuplicateAutomationVariablesUseCase } from '@usecases/automation-variables/DuplicateAutomationVariablesUseCase';
import { ExportAutomationVariablesUseCase } from '@usecases/automation-variables/ExportAutomationVariablesUseCase';
import { ImportAutomationVariablesUseCase } from '@usecases/automation-variables/ImportAutomationVariablesUseCase';
import { GetLatestAutomationResultUseCase } from '@usecases/automation-variables/GetLatestAutomationResultUseCase';
import { GetAutomationResultHistoryUseCase } from '@usecases/automation-variables/GetAutomationResultHistoryUseCase';
import { GetAllWebsitesUseCase } from '@usecases/websites/GetAllWebsitesUseCase';
import { GetLatestRecordingByVariablesIdUseCase } from '@usecases/recording/GetLatestRecordingByVariablesIdUseCase';
import {
  AutomationVariablesOutputDto,
  AutomationResultOutputDto,
} from '@application/dtos/AutomationVariablesOutputDto';
import { WebsiteOutputDto } from '@application/dtos/WebsiteOutputDto';
import {
  AutomationVariablesViewModel,
  AutomationResultViewModel,
} from '../types/AutomationVariablesViewModel';
import { LoggerFactory } from '@/infrastructure/loggers/LoggerFactory';
import { Logger } from '@domain/types/logger.types';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';

/**
 * ViewModel for displaying AutomationVariables with latest result
 */
export interface AutomationVariablesViewModelWithResult extends AutomationVariablesViewModel {
  latestResult?: AutomationResultOutputDto | null;
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
  showRecordingPreview(recordingData: any): void;
  showNoRecordingMessage(): void;
}

/**
 * Presenter for AutomationVariables Manager
 */
export class AutomationVariablesManagerPresenter {
  private logger: Logger;

  // eslint-disable-next-line max-params
  constructor(
    private view: AutomationVariablesManagerView,
    private getAllAutomationVariablesUseCase: GetAllAutomationVariablesUseCase,
    private getAutomationVariablesByIdUseCase: GetAutomationVariablesByIdUseCase,
    private getAutomationVariablesByWebsiteIdUseCase: GetAutomationVariablesByWebsiteIdUseCase,
    private saveAutomationVariablesUseCase: SaveAutomationVariablesUseCase,
    private deleteAutomationVariablesUseCase: DeleteAutomationVariablesUseCase,
    private duplicateAutomationVariablesUseCase: DuplicateAutomationVariablesUseCase,
    private exportAutomationVariablesUseCase: ExportAutomationVariablesUseCase,
    private importAutomationVariablesUseCase: ImportAutomationVariablesUseCase,
    private getLatestAutomationResultUseCase: GetLatestAutomationResultUseCase,
    private getAutomationResultHistoryUseCase: GetAutomationResultHistoryUseCase,
    private getAllWebsitesUseCase: GetAllWebsitesUseCase,
    private getLatestRecordingByVariablesIdUseCase: GetLatestRecordingByVariablesIdUseCase,
    logger?: Logger
  ) {
    this.logger = logger || LoggerFactory.createLogger('AutomationVariablesManagerPresenter');
  }

  /**
   * AutomationVariablesOutputDto → AutomationVariablesViewModelWithResult 変換
   */
  private toAutomationVariablesViewModel(
    dto: AutomationVariablesOutputDto,
    latestResult?: AutomationResultOutputDto | null,
    websiteName?: string
  ): AutomationVariablesViewModelWithResult {
    return {
      ...dto,
      // 表示用プロパティ
      displayName: `変数セット ${dto.id.substring(0, 8)}`,
      websiteName: websiteName || dto.websiteId,
      variableCount: Object.keys(dto.variables).length,
      lastUpdatedFormatted: this.formatDate(dto.updatedAt),

      // 関連データ
      latestResult: latestResult || null,

      // UI操作
      canEdit: true,
      canDelete: true,
      canDuplicate: true,
      canExecute: true,
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

      const variables = websiteId
        ? variablesResult.automationVariables
          ? [variablesResult.automationVariables]
          : []
        : variablesResult.automationVariables || [];

      if (!variables || variables.length === 0) {
        this.view.showEmpty();
        return;
      }

      // Load all websites for name lookup
      const { websites } = await this.getAllWebsitesUseCase.execute();
      const websiteMap = new Map((websites || []).map((w) => [w.id, w.name]));

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
  async saveVariables(variables: AutomationVariables): Promise<void> {
    try {
      await this.saveAutomationVariablesUseCase.execute({ automationVariables: variables });
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
  async getVariablesById(id: string): Promise<AutomationVariablesData | null> {
    try {
      const { automationVariables: variables } =
        await this.getAutomationVariablesByIdUseCase.execute({ id });
      return variables?.toData() || null;
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
  async loadResultHistory(variablesId: string): Promise<AutomationResultData[]> {
    try {
      const { results } = await this.getAutomationResultHistoryUseCase.execute({
        automationVariablesId: variablesId,
      });
      return results.map((r) => r.toData());
    } catch (error) {
      this.logger.error('Failed to load automation result history', error);
      this.view.showError(I18nAdapter.getMessage('resultHistoryLoadFailed'));
      return [];
    }
  }

  /**
   * Get latest recording for automation variables
   */
  async getLatestRecording(variablesId: string): Promise<TabRecording | null> {
    try {
      const recording = await this.getLatestRecordingByVariablesIdUseCase.execute({
        automationVariablesId: variablesId,
      });
      return recording;
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
