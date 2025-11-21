/**
 * Presentation Layer: Auto Fill Executor
 * Handles execution of auto-fill from XPath Manager
 */

import browser from 'webextension-polyfill';
import { Logger } from '@domain/types/logger.types';
import { MessageDispatcher } from '@infrastructure/messaging/MessageDispatcher';
import { WebsiteSelectManager } from './WebsiteSelectManager';
import { ChromeStorageAutomationVariablesRepository } from '@infrastructure/repositories/ChromeStorageAutomationVariablesRepository';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';
import { XPathManagerView } from './XPathManagerPresenter';

export class AutoFillExecutor {
  private messageDispatcher: MessageDispatcher;
  private automationVariablesRepository: ChromeStorageAutomationVariablesRepository;

  constructor(
    private websiteSelectManager: WebsiteSelectManager,
    private logger: Logger,
    private view: XPathManagerView
  ) {
    this.messageDispatcher = new MessageDispatcher();
    this.automationVariablesRepository = new ChromeStorageAutomationVariablesRepository(
      logger.createChild('AutomationVariables')
    );
  }

  /**
   * Execute auto-fill for the currently selected website
   */
  async executeAutoFill(): Promise<void> {
    try {
      const currentWebsiteId = this.websiteSelectManager.getCurrentWebsiteId();
      this.logger.debug('[XPath Manager handleExecuteAutoFill] Called', { currentWebsiteId });

      if (!currentWebsiteId) {
        this.view.showError(I18nAdapter.getMessage('selectWebsitePrompt'));
        return;
      }

      const selectedWebsite = await this.validateAndGetWebsite(currentWebsiteId);
      if (!selectedWebsite) return;

      const tabId = await this.createTabForAutoFill(selectedWebsite);
      if (!tabId) return;

      // Show progress indicator
      this.view.showProgress(I18nAdapter.getMessage('autoFillInProgress'));

      try {
        await this.executeAndNotify(tabId, currentWebsiteId, selectedWebsite.name);
      } finally {
        // Hide progress indicator
        this.view.hideProgress();
      }
    } catch (error) {
      this.handleExecutionError(error);
      this.view.hideProgress();
    }
  }

  private async validateAndGetWebsite(websiteId: string) {
    const selectedWebsite = await this.websiteSelectManager.getWebsiteById(websiteId);
    this.logger.debug('[XPath Manager handleExecuteAutoFill] Selected website:', {
      selectedWebsite,
    });

    if (!selectedWebsite) {
      this.view.showError(I18nAdapter.getMessage('websiteNotFound'));
      return null;
    }

    const startUrl = selectedWebsite.startUrl;
    this.logger.debug('[XPath Manager handleExecuteAutoFill] startUrl value:', { startUrl });

    if (!startUrl) {
      this.view.showError(I18nAdapter.getMessage('startUrlNotSet'));
      return null;
    }

    return selectedWebsite;
  }

  private async createTabForAutoFill(website: Record<string, unknown>): Promise<number | null> {
    this.logger.info(
      `[XPath Manager] Executing auto-fill for website: ${website.name}, Start URL: ${website.startUrl}`
    );

    const newTab = await browser.tabs.create({ url: website.startUrl, active: true });

    if (!newTab?.id) {
      this.view.showError(I18nAdapter.getMessage('tabCreationFailed'));
      return null;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    return newTab.id;
  }

  private async executeAndNotify(tabId: number, websiteId: string, _websiteName: string) {
    const result = await this.automationVariablesRepository.load(websiteId);
    const automationVariables = result.isSuccess ? result.value : null;

    const response = await this.messageDispatcher.executeAutoFill({
      tabId,
      websiteId,
      websiteVariables: automationVariables?.getVariables() || {},
    });

    if (response.success) {
      this.view.showSuccess(
        I18nAdapter.format('autoFillCompleted', String(response.data?.processedSteps || 0))
      );
    } else {
      this.view.showError(
        I18nAdapter.format(
          'autoFillFailed',
          response.data?.error || I18nAdapter.getMessage('unknownError')
        )
      );
    }
  }

  private handleExecutionError(error: unknown) {
    this.logger.error('Failed to execute auto-fill', error);
    this.view.showError(
      I18nAdapter.format(
        'autoFillExecutionFailed',
        error instanceof Error ? error.message : I18nAdapter.getMessage('unknownError')
      )
    );
  }
}
