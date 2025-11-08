/**
 * Presentation Layer: XPath Manager Presenter
 * Separates UI logic from business logic for future framework migration
 */

import { XPathViewModel } from '../types/XPathViewModel';
import { ViewModelMapper } from '../mappers/ViewModelMapper';
import { LoggerFactory, Logger } from '@/infrastructure/loggers/LoggerFactory';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';
import { container } from '@infrastructure/di/GlobalContainer';
import { TOKENS } from '@infrastructure/di/ServiceTokens';
import { XPathOutputDto } from '@application/dtos/XPathOutputDto';
import { UpdateXPathInput, UpdateXPathUseCase } from '@usecases/xpaths/UpdateXPathUseCase';

// Use Cases (DIコンテナから解決)
import type { GetAllXPathsUseCase } from '@usecases/xpaths/GetAllXPathsUseCase';
import type { SaveXPathUseCase } from '@usecases/xpaths/SaveXPathUseCase';
import type { DeleteXPathUseCase } from '@usecases/xpaths/DeleteXPathUseCase';
// Note: Export/Import use cases not available yet
// import type { ExportXPathUseCase } from '@usecases/xpaths/ExportXPathUseCase';
// import type { ImportXPathUseCase } from '@usecases/xpaths/ImportXPathUseCase';

export interface XPathManagerView {
  showXPaths(xpaths: XPathViewModel[]): void;
  showError(message: string): void;
  showSuccess(message: string): void;
  showLoading(): void;
  hideLoading(): void;
  showEmpty(): void;
  showProgress(status: string, cancellable?: boolean): void;
  updateProgress(percent: number, status?: string): void;
  hideProgress(): void;
}

export class XPathManagerPresenter {
  private logger: Logger;

  // DIコンテナから依存性を解決
  private getAllXPathsUseCase: GetAllXPathsUseCase;
  private saveXPathUseCase: SaveXPathUseCase;
  private updateXPathUseCase: UpdateXPathUseCase;
  private deleteXPathUseCase: DeleteXPathUseCase;
  // Note: Export/Import use cases not available yet
  // private exportXPathUseCase: ExportXPathUseCase;
  // private importXPathUseCase: ImportXPathUseCase;

  constructor(
    private view: XPathManagerView,
    logger?: Logger
  ) {
    this.logger = logger || LoggerFactory.createLogger('XPathManagerPresenter');

    // DIコンテナから依存性を解決
    this.getAllXPathsUseCase = container.resolve(TOKENS.GET_ALL_XPATHS_USE_CASE);
    this.saveXPathUseCase = container.resolve(TOKENS.SAVE_XPATH_USE_CASE);
    this.updateXPathUseCase = container.resolve(TOKENS.UPDATE_XPATH_USE_CASE);
    this.deleteXPathUseCase = container.resolve(TOKENS.DELETE_XPATH_USE_CASE);
    // Note: Export/Import use cases not registered in DI container yet
    // this.exportXPathUseCase = container.resolve(TOKENS.EXPORT_XPATH_USE_CASE);
    // this.importXPathUseCase = container.resolve(TOKENS.IMPORT_XPATH_USE_CASE);
  }

  async loadXPaths(websiteId?: string): Promise<void> {
    try {
      this.view.showLoading();

      // Currently only support loading all XPaths (websiteId filtering not implemented)
      const result = await this.getAllXPathsUseCase.execute();

      if (result.xpaths.length === 0) {
        this.view.showEmpty();
      } else {
        // Filter by websiteId if provided
        const filteredXPaths = websiteId
          ? result.xpaths.filter((xpath) => xpath.websiteId === websiteId)
          : result.xpaths;

        const viewModels = ViewModelMapper.toXPathViewModels(filteredXPaths);
        this.view.showXPaths(viewModels);
      }
    } catch (error) {
      this.logger.error('Failed to load XPaths', error);
      this.view.showError(I18nAdapter.getMessage('xpathLoadFailed'));
    } finally {
      this.view.hideLoading();
    }
  }

  async updateXPath(data: UpdateXPathInput): Promise<void> {
    try {
      await this.updateXPathUseCase.execute(data);
      this.view.showSuccess(I18nAdapter.getMessage('xpathSaved'));
    } catch (error) {
      this.logger.error('Failed to update XPath', error);
      this.view.showError(I18nAdapter.getMessage('saveFailed'));
      throw error;
    }
  }

  async deleteXPath(id: string): Promise<void> {
    try {
      await this.deleteXPathUseCase.execute({ id });
      this.view.showSuccess(I18nAdapter.getMessage('xpathDeleted'));
    } catch (error) {
      this.logger.error('Failed to delete XPath', error);
      this.view.showError(I18nAdapter.getMessage('deleteFailed'));
      throw error;
    }
  }

  async duplicateXPath(id: string): Promise<void> {
    try {
      // Note: DuplicateXPathUseCase not implemented yet
      // Fallback: Get XPath and create a copy with new ID
      const xpath = await this.getXPathById(id);
      if (xpath) {
        const duplicatedXPath = {
          websiteId: xpath.websiteId,
          value: xpath.value || '',
          actionType: xpath.actionType as any, // Type assertion for ActionType
          actionPattern: Number(xpath.actionPattern) || 0, // Convert to number
          pathAbsolute: xpath.pathAbsolute || '',
          pathShort: xpath.pathShort || '',
          pathSmart: xpath.pathSmart || '',
          selectedPathPattern: xpath.selectedPathPattern as any,
          retryType: xpath.retryType as any,
          executionOrder: (xpath.executionOrder || 0) + 1,
          executionTimeoutSeconds: xpath.executionTimeoutSeconds,
          afterWaitSeconds: xpath.afterWaitSeconds,
          url: xpath.url || '',
        };
        await this.saveXPathUseCase.execute(duplicatedXPath);
        this.view.showSuccess(I18nAdapter.getMessage('xpathDuplicated'));
      } else {
        this.view.showError(I18nAdapter.getMessage('xpathNotFound'));
      }
    } catch (error) {
      this.logger.error('Failed to duplicate XPath', error);
      this.view.showError(I18nAdapter.getMessage('duplicateFailed'));
      throw error;
    }
  }

  async exportXPaths(): Promise<string> {
    try {
      // Note: ExportXPathsUseCase not implemented yet
      // Fallback: Return empty CSV for now
      this.view.showError(I18nAdapter.getMessage('exportFailed'));
      throw new Error('Export functionality not implemented yet');
    } catch (error) {
      this.logger.error('Failed to export XPaths', error);
      this.view.showError(I18nAdapter.getMessage('exportFailed'));
      throw error;
    }
  }

  async importXPaths(_csvText: string): Promise<void> {
    try {
      // Note: ImportXPathsUseCase not implemented yet
      // Fallback: Show error for now
      this.view.showError(
        I18nAdapter.format('importFailed', 'Import functionality not implemented yet')
      );
      throw new Error('Import functionality not implemented yet');
    } catch (error) {
      this.logger.error('Failed to import XPaths', error);
      const errorMessage =
        error instanceof Error ? error.message : I18nAdapter.getMessage('unknownError');
      this.view.showError(I18nAdapter.format('importFailed', errorMessage));
      throw error;
    }
  }

  async getXPathById(id: string): Promise<XPathOutputDto | undefined> {
    try {
      const result = await this.getAllXPathsUseCase.execute();
      return result.xpaths.find((x) => x.id === id);
    } catch (error) {
      this.logger.error('Failed to get XPath', error);
      this.view.showError(I18nAdapter.getMessage('xpathGetFailed'));
      return undefined;
    }
  }

  async exportAutomationVariables(): Promise<string> {
    try {
      // Note: ExportAutomationVariablesUseCase not implemented yet
      this.view.showError(I18nAdapter.getMessage('exportFailed'));
      throw new Error('Export functionality not implemented yet');
    } catch (error) {
      this.logger.error('Failed to export AutomationVariables', error);
      this.view.showError(I18nAdapter.getMessage('exportFailed'));
      throw error;
    }
  }

  async importAutomationVariables(_csvText: string): Promise<void> {
    try {
      // Note: ImportAutomationVariablesUseCase not implemented yet
      this.view.showError(
        I18nAdapter.format('importFailed', 'Import functionality not implemented yet')
      );
      throw new Error('Import functionality not implemented yet');
    } catch (error) {
      this.logger.error('Failed to import AutomationVariables', error);
      const errorMessage =
        error instanceof Error ? error.message : I18nAdapter.getMessage('unknownError');
      this.view.showError(I18nAdapter.format('importFailed', errorMessage));
      throw error;
    }
  }

  async exportWebsites(): Promise<string> {
    try {
      // Note: ExportWebsitesUseCase not implemented yet
      this.view.showError(I18nAdapter.getMessage('exportFailed'));
      throw new Error('Export functionality not implemented yet');
    } catch (error) {
      this.logger.error('Failed to export Websites', error);
      this.view.showError(I18nAdapter.getMessage('exportFailed'));
      throw error;
    }
  }

  async importWebsites(_csvText: string): Promise<void> {
    try {
      // Note: ImportWebsitesUseCase not implemented yet
      this.view.showError(
        I18nAdapter.format('importFailed', 'Import functionality not implemented yet')
      );
      throw new Error('Import functionality not implemented yet');
    } catch (error) {
      this.logger.error('Failed to import Websites', error);
      const errorMessage =
        error instanceof Error ? error.message : I18nAdapter.getMessage('unknownError');
      this.view.showError(I18nAdapter.format('importFailed', errorMessage));
      throw error;
    }
  }

  /**
   * Import data based on auto-detected format
   */
  async importData(csvText: string, format: string): Promise<void> {
    switch (format) {
      case 'xpaths':
        await this.importXPaths(csvText);
        break;
      case 'websites':
        await this.importWebsites(csvText);
        break;
      case 'automation_variables':
        await this.importAutomationVariables(csvText);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}
