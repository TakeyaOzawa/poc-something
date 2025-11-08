/**
 * Presentation Layer: XPath Manager Presenter
 * Separates UI logic from business logic for future framework migration
 */

import { GetAllXPathsUseCase } from '@usecases/xpaths/GetAllXPathsUseCase';
import { GetXPathsByWebsiteIdUseCase } from '@usecases/xpaths/GetXPathsByWebsiteIdUseCase';
import { UpdateXPathUseCase } from '@usecases/xpaths/UpdateXPathUseCase';
import { UpdateXPathInput } from '@usecases/xpaths/UpdateXPathUseCase';
import { DeleteXPathUseCase } from '@usecases/xpaths/DeleteXPathUseCase';
import { ExportXPathsUseCase } from '@usecases/xpaths/ExportXPathsUseCase';
import { ImportXPathsUseCase } from '@usecases/xpaths/ImportXPathsUseCase';
import { ExportWebsitesUseCase } from '@usecases/websites/ExportWebsitesUseCase';
import { ImportWebsitesUseCase } from '@usecases/websites/ImportWebsitesUseCase';
import { ExportAutomationVariablesUseCase } from '@usecases/automation-variables/ExportAutomationVariablesUseCase';
import { ImportAutomationVariablesUseCase } from '@usecases/automation-variables/ImportAutomationVariablesUseCase';
import { DuplicateXPathUseCase } from '@usecases/xpaths/DuplicateXPathUseCase';
import { XPathViewModel } from '../types/XPathViewModel';
import { ViewModelMapper } from '../mappers/ViewModelMapper';
import { LoggerFactory, Logger } from '@/infrastructure/loggers/LoggerFactory';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';

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

  // eslint-disable-next-line max-params
  constructor(
    private view: XPathManagerView,
    private getAllXPathsUseCase: GetAllXPathsUseCase,
    private getXPathsByWebsiteIdUseCase: GetXPathsByWebsiteIdUseCase,
    private updateXPathUseCase: UpdateXPathUseCase,
    private deleteXPathUseCase: DeleteXPathUseCase,
    private exportXPathsUseCase: ExportXPathsUseCase,
    private importXPathsUseCase: ImportXPathsUseCase,
    private exportWebsitesUseCase: ExportWebsitesUseCase,
    private importWebsitesUseCase: ImportWebsitesUseCase,
    private exportAutomationVariablesUseCase: ExportAutomationVariablesUseCase,
    private importAutomationVariablesUseCase: ImportAutomationVariablesUseCase,
    private duplicateXPathUseCase: DuplicateXPathUseCase,
    logger?: Logger
  ) {
    this.logger = logger || LoggerFactory.createLogger('XPathManagerPresenter');
  }

  async loadXPaths(websiteId?: string): Promise<void> {
    try {
      this.view.showLoading();

      // Use appropriate UseCase based on whether websiteId is provided
      const result = websiteId
        ? await this.getXPathsByWebsiteIdUseCase.execute({ websiteId })
        : await this.getAllXPathsUseCase.execute();

      if (result.xpaths.length === 0) {
        this.view.showEmpty();
      } else {
        const viewModels = ViewModelMapper.toXPathViewModels(result.xpaths);
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
      this.logger.error('Failed to save XPath', error);
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
      const result = await this.duplicateXPathUseCase.execute({ id });
      if (result.xpath) {
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
      const result = await this.exportXPathsUseCase.execute();
      return result.csv;
    } catch (error) {
      this.logger.error('Failed to export XPaths', error);
      this.view.showError(I18nAdapter.getMessage('exportFailed'));
      throw error;
    }
  }

  async importXPaths(csvText: string): Promise<void> {
    try {
      await this.importXPathsUseCase.execute({ csvText });
      this.view.showSuccess(I18nAdapter.getMessage('importCompleted'));
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

  async exportWebsites(): Promise<string> {
    try {
      const { csvText } = await this.exportWebsitesUseCase.execute();
      return csvText || '';
    } catch (error) {
      this.logger.error('Failed to export Websites', error);
      this.view.showError(I18nAdapter.getMessage('exportFailed'));
      throw error;
    }
  }

  async importWebsites(csvText: string): Promise<void> {
    try {
      await this.importWebsitesUseCase.execute({ csvText });
      this.view.showSuccess(I18nAdapter.getMessage('importCompleted'));
    } catch (error) {
      this.logger.error('Failed to import Websites', error);
      const errorMessage =
        error instanceof Error ? error.message : I18nAdapter.getMessage('unknownError');
      this.view.showError(I18nAdapter.format('importFailed', errorMessage));
      throw error;
    }
  }

  async exportAutomationVariables(): Promise<string> {
    try {
      const { csvText } = await this.exportAutomationVariablesUseCase.execute();
      return csvText;
    } catch (error) {
      this.logger.error('Failed to export Automation Variables', error);
      this.view.showError(I18nAdapter.getMessage('exportFailed'));
      throw error;
    }
  }

  async importAutomationVariables(csvText: string): Promise<void> {
    try {
      await this.importAutomationVariablesUseCase.execute({ csvText });
      this.view.showSuccess(I18nAdapter.getMessage('importCompleted'));
    } catch (error) {
      this.logger.error('Failed to import Automation Variables', error);
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
