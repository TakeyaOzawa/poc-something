/**
 * Presentation Layer: XPath Context Menu Handler
 * Handles XPath extraction and display from context menu actions
 */

import browser from 'webextension-polyfill';
import { Logger } from '@domain/types/logger.types';
import { NotificationPort } from '@domain/ports/NotificationPort';
import { SaveXPathUseCase } from '@application/usecases/xpaths/SaveXPathUseCase';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { MessageDispatcher } from '@infrastructure/messaging/MessageDispatcher';
import { SaveWebsiteUseCase } from '@application/usecases/websites/SaveWebsiteUseCase';
import { GetWebsiteByIdUseCase } from '@application/usecases/websites/GetWebsiteByIdUseCase';
import { UpdateWebsiteUseCase } from '@application/usecases/websites/UpdateWebsiteUseCase';
import { ActionTypeDetectorService } from '@domain/services/ActionTypeDetectorService';
import { CONTEXT_MENU_IDS } from '@domain/constants/ContextMenuIds';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';
import { ActionType } from '@domain/constants/ActionType';

export class XPathContextMenuHandler {
  private messageDispatcher: MessageDispatcher;

  // eslint-disable-next-line max-params
  constructor(
    private saveXPathUseCase: SaveXPathUseCase,
    private xpathRepository: XPathRepository,
    private notificationService: NotificationPort,
    private logger: Logger,
    private saveWebsiteUseCase: SaveWebsiteUseCase,
    private getWebsiteByIdUseCase: GetWebsiteByIdUseCase,
    private updateWebsiteUseCase: UpdateWebsiteUseCase
  ) {
    this.messageDispatcher = new MessageDispatcher();
  }

  /**
   * Handle XPath extraction and saving
   */
  async handleGetXPath(tab: browser.Tabs.Tab, websiteId: string): Promise<void> {
    if (!tab.id) return;

    try {
      const effectiveWebsiteId = await this.ensureWebsiteExists(websiteId, tab);
      const response = await this.messageDispatcher.getXPath(tab.id);

      if (response && response.success && response.xpaths) {
        await this.processAndSaveXPath(response, effectiveWebsiteId, tab);
      } else {
        throw new Error(response?.error || 'Failed to get XPath');
      }
    } catch (error) {
      await this.handleXPathError(error);
    }
  }

  private async ensureWebsiteExists(websiteId: string, tab: browser.Tabs.Tab): Promise<string> {
    if (!websiteId) {
      return await this.createNewWebsite(tab);
    }
    return websiteId;
  }

  private async processAndSaveXPath(
    response: unknown,
    websiteId: string,
    tab: browser.Tabs.Tab
  ): Promise<void> {
    this.logger.info('Received XPath from content script', { response });

    await this.setStartUrlIfNeeded(websiteId, tab);

    const actionType = ActionTypeDetectorService.determineActionType(response.elementInfo);
    const savedXPath = await this.saveXPathWithDefaults(response, websiteId, tab, actionType);

    this.logger.info('Saved XPath', { savedXPath });

    await this.showSuccessNotification(response.xpaths.smart);
  }

  private async saveXPathWithDefaults(
    response: unknown,
    websiteId: string,
    tab: browser.Tabs.Tab,
    actionType: ActionType
  ): Promise<unknown> {
    return await this.saveXPathUseCase.execute({
      websiteId: websiteId,
      value: response.elementInfo?.text || `${response.elementInfo?.tagName || 'Unknown'} element`,
      actionType: actionType,
      url: tab.url || '',
      pathShort: response.xpaths?.mixed || '',
      pathAbsolute: response.xpaths?.absolute || '',
      pathSmart: response.xpaths?.smart || '',
      selectedPathPattern: 'smart',
      afterWaitSeconds: 1,
      actionPattern: 0,
      retryType: 0,
      executionTimeoutSeconds: 30,
    });
  }

  private async showSuccessNotification(smartXPath: string): Promise<void> {
    const message = `Smart: ${smartXPath}\n\nXPathを保存しました`;
    await this.notificationService.notify({
      title: 'XPathを取得しました',
      message: message,
      priority: 1,
    });
  }

  private async handleXPathError(error: unknown): Promise<void> {
    this.logger.error('Error getting XPath', error);
    await this.notificationService.notify({
      title: I18nAdapter.getMessage('error'),
      message: I18nAdapter.getMessage('xpathGetFailed'),
      priority: 1,
    });
  }

  /**
   * Handle XPath display (show only, do not save)
   */
  async handleShowXPath(tab: browser.Tabs.Tab): Promise<void> {
    if (!tab.id) return;

    try {
      const response = await this.messageDispatcher.getXPath(tab.id);

      if (response && response.success && response.xpaths) {
        await this.displayXPathDialog(tab.id, response);
      } else {
        throw new Error(response?.error || 'Failed to get XPath');
      }
    } catch (error) {
      await this.handleXPathError(error);
    }
  }

  private async displayXPathDialog(tabId: number, response: unknown): Promise<void> {
    this.logger.info('Received XPath from content script', { response });

    await this.messageDispatcher.showXPathDialog(tabId, {
      smart: response.xpaths?.smart || null,
      short: response.xpaths?.mixed || null,
      absolute: response.xpaths?.absolute || null,
      elementInfo: response.elementInfo || { tagName: '', text: '' },
    });
  }

  /**
   * Handle context menu click events
   */
  async handleContextMenuClick(
    info: browser.Menus.OnClickData,
    tab?: browser.Tabs.Tab
  ): Promise<void> {
    const menuItemId = info.menuItemId.toString();

    // Handle "XPathを表示する" menu click
    if (menuItemId === CONTEXT_MENU_IDS.SHOW_XPATH && tab?.id) {
      await this.handleShowXPath(tab);
    }
    // Handle "新規作成" submenu click
    else if (menuItemId === CONTEXT_MENU_IDS.GET_XPATH_NEW && tab?.id) {
      await this.handleGetXPath(tab, '');
    }
    // Handle submenu clicks (get-xpath-{websiteId})
    else if (menuItemId.startsWith(CONTEXT_MENU_IDS.GET_XPATH_PREFIX) && tab?.id) {
      const websiteId = menuItemId.replace(CONTEXT_MENU_IDS.GET_XPATH_PREFIX, '');
      await this.handleGetXPath(tab, websiteId);
    }
    // Handle parent menu click (backward compatibility)
    else if (menuItemId === CONTEXT_MENU_IDS.GET_XPATH && tab?.id) {
      await this.handleGetXPath(tab, '');
    }
  }

  /**
   * Create a new website configuration
   */
  private async createNewWebsite(tab: browser.Tabs.Tab): Promise<string> {
    const hostname = tab.url ? new URL(tab.url).hostname : I18nAdapter.getMessage('newSite');

    const { website: savedWebsite } = await this.saveWebsiteUseCase.execute({
      name: hostname,
      editable: true,
    });

    if (!savedWebsite) {
      throw new Error('Failed to create website');
    }

    this.logger.info(`Created new websiteConfig: ${savedWebsite.id} (${hostname})`);

    return savedWebsite.id;
  }

  /**
   * Set startUrl for website if this is the first XPath
   */
  private async setStartUrlIfNeeded(websiteId: string, tab: browser.Tabs.Tab): Promise<void> {
    const collectionResult = await this.xpathRepository.load();
    if (collectionResult.isFailure) {
      this.logger.error('Failed to load XPath collection', collectionResult.error);
      return;
    }

    const collection = collectionResult.value!;
    const existingXPaths = collection.getByWebsiteId(websiteId);

    // If no XPaths exist for this website, set startUrl
    if (existingXPaths.length === 0) {
      const { website } = await this.getWebsiteByIdUseCase.execute({ websiteId });
      if (website && !website.startUrl) {
        await this.updateWebsiteUseCase.execute({
          websiteData: {
            ...website,
            startUrl: tab.url || '',
          },
        });
        this.logger.info(`Set startUrl for website ${websiteId}: ${tab.url}`);
      }
    }
  }
}
