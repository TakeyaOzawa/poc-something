/**
 * Auto-Fill Handler
 * Handles automatic form filling when page loads
 *
 * @coverage 0% - DOM-heavy UI component requiring E2E testing
 */
/* eslint-disable max-lines -- This file orchestrates page load detection, in-progress execution detection, URL matching, auto-fill triggering, and resume functionality. The comprehensive integration logic with multiple repositories and services requires this file size. */

import browser from 'webextension-polyfill';
import { Logger } from '@domain/types/logger.types';
import { MessageDispatcher } from '@infrastructure/messaging/MessageDispatcher';
import { AutoFillOverlay } from './AutoFillOverlay';
import { WebsiteData } from '@domain/entities/Website';
import { AutomationVariablesData } from '@domain/entities/AutomationVariables';
import { ChromeStorageSystemSettingsRepository } from '@infrastructure/repositories/ChromeStorageSystemSettingsRepository';
import { ChromeStorageAutomationVariablesRepository } from '@infrastructure/repositories/ChromeStorageAutomationVariablesRepository';
import { ChromeStorageAutomationResultRepository } from '@infrastructure/repositories/ChromeStorageAutomationResultRepository';
import { AUTOMATION_STATUS } from '@domain/constants/AutomationStatus';
import { URLMatchingService } from '@domain/services/URLMatchingService';
import { AutomationResult } from '@domain/entities/AutomationResult';
import { XPathData, ActionType, PathPattern, RetryType } from '@domain/entities/XPathCollection';

export class AutoFillHandler {
  private messageDispatcher: MessageDispatcher;
  private overlay: AutoFillOverlay;
  private systemSettingsRepository: ChromeStorageSystemSettingsRepository;
  private automationVariablesRepository: ChromeStorageAutomationVariablesRepository;
  private automationResultRepository: ChromeStorageAutomationResultRepository;
  private urlMatchingService: URLMatchingService;

  constructor(private logger: Logger) {
    this.messageDispatcher = new MessageDispatcher();
    this.overlay = new AutoFillOverlay();
    this.systemSettingsRepository = new ChromeStorageSystemSettingsRepository(
      logger.createChild('SystemSettings')
    );
    this.automationVariablesRepository = new ChromeStorageAutomationVariablesRepository(
      logger.createChild('AutomationVariables')
    );
    this.automationResultRepository = new ChromeStorageAutomationResultRepository(
      logger.createChild('AutomationResult')
    );
    this.urlMatchingService = new URLMatchingService(logger.createChild('URLMatcher'));
  }

  async handlePageLoad(): Promise<void> {
    try {
      const currentURL = window.location.href;
      this.logger.info('Page loaded', { currentURL });

      // Check for in-progress execution first
      const inProgressExecution = await this.findInProgressExecution(currentURL);
      if (inProgressExecution) {
        this.logger.info('Found in-progress execution, resuming', {
          executionId: inProgressExecution.getId(),
          currentStep: inProgressExecution.getCurrentStepIndex(),
          totalSteps: inProgressExecution.getTotalSteps(),
        });
        await this.resumeAutoFill(inProgressExecution.getId());
        return;
      }

      // No in-progress execution, start new auto-fill if matched
      const { enabledWebsites, automationVariablesMap } = await this.loadEnabledWebsites();
      if (enabledWebsites.length === 0) {
        return;
      }

      const xpaths = await this.loadAndParseXPaths();
      if (!xpaths) {
        return;
      }

      const matchedWebsiteId = this.findMatchingWebsite(
        currentURL,
        enabledWebsites,
        xpaths,
        automationVariablesMap
      );
      if (!matchedWebsiteId) {
        this.logger.debug('No matching website found', { currentURL });
        return;
      }

      const { matchedWebsite, matchedAv, allSteps } = await this.prepareAutomationExecution(
        matchedWebsiteId,
        enabledWebsites,
        xpaths,
        automationVariablesMap
      );
      if (!matchedWebsite || allSteps.length === 0) {
        return;
      }

      await this.executeAutoFillWithProgress(matchedWebsiteId, matchedAv, allSteps);
    } catch (error) {
      this.logger.error('Error during auto-fill on load', error);
      this.overlay.hide();
    }
  }

  private async loadEnabledWebsites(): Promise<{
    enabledWebsites: WebsiteData[];
    automationVariablesMap: Map<string, any>;
  }> {
    const result = await browser.storage.local.get('websiteConfigs');
    if (!result.websiteConfigs) {
      this.logger.debug('No website configs found');
      return { enabledWebsites: [], automationVariablesMap: new Map() };
    }

    const websites: WebsiteData[] = JSON.parse(result.websiteConfigs as string);
    const allVariablesResult = await this.automationVariablesRepository.loadAll();
    if (allVariablesResult.isFailure) {
      this.logger.error('Failed to load automation variables', {
        error: allVariablesResult.error?.message,
      });
      return { enabledWebsites: [], automationVariablesMap: new Map() };
    }

    const allAutomationVariables = allVariablesResult.value!;
    const automationVariablesMap = new Map(
      allAutomationVariables.map((av) => [av.getWebsiteId(), av])
    );

    this.logger.info('Loaded automation variables', { count: allAutomationVariables.length });
    this.logger.debug('All automation variables', { allAutomationVariables });

    const enabledWebsites = websites
      .filter((w) => {
        const av = automationVariablesMap.get(w.id);
        const status = av?.getStatus();
        return status === AUTOMATION_STATUS.ENABLED || status === AUTOMATION_STATUS.ONCE;
      })
      .sort((a, b) => {
        const avA = automationVariablesMap.get(a.id);
        const avB = automationVariablesMap.get(b.id);
        const dateA = avA ? new Date(avA.getUpdatedAt()).getTime() : 0;
        const dateB = avB ? new Date(avB.getUpdatedAt()).getTime() : 0;
        return dateB - dateA; // Sort by automationVariables.updatedAt (newest first)
      });

    return { enabledWebsites, automationVariablesMap };
  }

  private async loadAndParseXPaths(): Promise<XPathData[] | null> {
    const xpathResult = await browser.storage.local.get('xpathCollectionCSV');
    const csvData = xpathResult.xpathCollectionCSV;

    if (!csvData || typeof csvData !== 'string') {
      this.logger.debug('No XPath collection found');
      return null;
    }

    const csvLines = csvData.split('\n');
    if (csvLines.length <= 1) {
      this.logger.debug('XPath collection is empty');
      return [];
    }

    const xpaths: XPathData[] = [];
    for (let i = 1; i < (csvLines?.length || 0); i++) {
      const line = csvLines?.[i]?.trim();
      if (!line) continue;

      const columns = line.split(',');
      if (columns.length < 14) continue;

      // 型安全性を確保
      const safeColumns = columns.map((col) => col || '');

      // 必要な長さを確保
      while (safeColumns.length < 14) {
        safeColumns.push('');
      }

      // 型安全性を確保してXPathDataを作成
      const xpath: XPathData = {
        id: safeColumns[0] || '',
        websiteId: safeColumns[1] || '',
        value: safeColumns[2] || '',
        actionType: (safeColumns[3] || 'TYPE') as ActionType,
        afterWaitSeconds: parseFloat(safeColumns[4] || '0') || 0,
        actionPattern: parseInt(safeColumns[5] || '0') || 0,
        pathAbsolute: safeColumns[6] || '',
        pathShort: safeColumns[7] || '',
        pathSmart: safeColumns[8] || '',
        selectedPathPattern: (safeColumns[9] || 'smart') as PathPattern,
        retryType: (parseInt(safeColumns[10] || '0') || 0) as RetryType,
        executionOrder: parseInt(safeColumns[11] || '0') || 0,
        executionTimeoutSeconds: parseFloat(safeColumns[12] || '0') || 0,
        url: safeColumns[13] || '',
      };

      xpaths.push(xpath);
    }

    return xpaths;
  }

  private findMatchingWebsite(
    currentURL: string,
    enabledWebsites: WebsiteData[],
    xpaths: XPathData[],
    automationVariablesMap: Map<string, AutomationVariablesData>
  ): string | null {
    for (const website of enabledWebsites) {
      const av = automationVariablesMap.get(website.id);
      const websiteXPaths = xpaths
        .filter((x) => x.websiteId === website.id)
        .sort((a, b) => a.executionOrder - b.executionOrder);

      if (websiteXPaths.length === 0) {
        this.logger.debug('Skipping website (no XPaths configured)', { name: website.name });
        continue;
      }

      const firstStepUrl = websiteXPaths[0]?.url;
      this.logger.debug('Checking website', {
        name: website.name,
        status: av?.status,
        firstStepUrl,
        firstStepOrder: websiteXPaths[0]?.executionOrder,
      });

      if (!firstStepUrl) {
        this.logger.debug('Skipping website (first step has no URL)', { name: website.name });
        continue;
      }

      const isMatch = this.urlMatchingService.matches(currentURL, firstStepUrl);
      this.logger.debug('Match result', { isMatch });

      if (isMatch) {
        this.logger.info('Matched website', { name: website.name, status: av?.status });
        return website.id;
      }
    }

    return null;
  }

  private async prepareAutomationExecution(
    matchedWebsiteId: string,
    enabledWebsites: WebsiteData[],
    xpaths: XPathData[],
    automationVariablesMap: Map<string, any>
  ): Promise<{
    matchedWebsite: WebsiteData | undefined;
    matchedAv: any;
    allSteps: XPathData[];
  }> {
    const matchedWebsite = enabledWebsites.find((w) => w.id === matchedWebsiteId);
    if (!matchedWebsite) {
      this.logger.error('Could not find matched website in enabledWebsites array');
      return { matchedWebsite: undefined, matchedAv: undefined, allSteps: [] };
    }

    const matchedAv = automationVariablesMap.get(matchedWebsite.id);
    const allSteps = xpaths
      .filter((x) => x.websiteId === matchedWebsiteId)
      .sort((a, b) => a.executionOrder - b.executionOrder);

    this.logger.info('Matched website details', {
      id: matchedWebsite.id,
      name: matchedWebsite.name,
      status: matchedAv?.getStatus(),
      firstStepUrl: allSteps[0]?.url,
    });

    this.logger.info('Found steps for website', {
      stepsCount: allSteps.length,
      websiteName: matchedWebsite.name,
    });

    if (allSteps.length === 0) {
      this.logger.warn('No steps configured for this website');
      return { matchedWebsite, matchedAv, allSteps: [] };
    }

    if (matchedAv && matchedAv.getStatus() === AUTOMATION_STATUS.ONCE) {
      this.logger.info('Status is "once", changing to "disabled" before execution');
      const updatedAv = matchedAv.setStatus(AUTOMATION_STATUS.DISABLED);
      await this.automationVariablesRepository.save(updatedAv);
      this.logger.info('Changed status to "disabled" for website', {
        name: matchedWebsite.name,
      });
    }

    return { matchedWebsite, matchedAv, allSteps };
  }

  /**
   * Find in-progress execution
   * Returns DOING status AutomationResult within 24 hours if found
   */
  // eslint-disable-next-line max-lines-per-function -- Sequential search operation that loads all automation results, filters by status and time window, iterates through valid results to load corresponding automation variables, retrieves next step URLs, and checks URL matching. The repository calls with Result type handling, filtering logic, iteration, and comprehensive logging cannot be split without breaking the atomic search operation and reducing code clarity.
  private async findInProgressExecution(currentURL: string): Promise<AutomationResult | null> {
    try {
      const resultsResult = await this.automationResultRepository.loadAll();
      if (resultsResult.isFailure) {
        this.logger.warn('Failed to load automation results during check', {
          error: resultsResult.error?.message,
        });
        return null;
      }

      const results = resultsResult.value!;

      // Filter DOING status results
      const inProgress = results.filter((r: AutomationResult) => r.isInProgress());

      // Filter by 24 hours
      const now = Date.now();
      const validResults = inProgress.filter((r: AutomationResult) => {
        const age = now - new Date(r.getStartFrom()).getTime();
        return age < 24 * 60 * 60 * 1000; // 24 hours
      });

      this.logger.debug('Found in-progress executions', {
        total: inProgress.length,
        within24h: validResults.length,
      });

      // Find matching automationVariablesId
      for (const result of validResults) {
        const variablesResult = await this.automationVariablesRepository.load(
          result.getAutomationVariablesId()
        );

        if (variablesResult.isFailure) {
          this.logger.warn('Failed to load automation variables during check', {
            error: variablesResult.error?.message,
          });
          continue;
        }

        const variables = variablesResult.value;

        if (!variables) {
          continue;
        }

        // Get next step URL
        const nextStepUrl = await this.getNextStepUrl(
          variables.getWebsiteId(),
          result.getCurrentStepIndex()
        );

        if (!nextStepUrl) {
          continue;
        }

        // Check if current URL matches next step URL
        if (this.urlMatchingService.matches(currentURL, nextStepUrl)) {
          this.logger.info('Found matching in-progress execution', {
            executionId: result.getId(),
            currentStep: result.getCurrentStepIndex(),
            totalSteps: result.getTotalSteps(),
            nextStepUrl,
          });
          return result;
        }
      }

      return null;
    } catch (error) {
      this.logger.warn('Failed to check existing execution', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null; // Don't block execution on check failure
    }
  }

  /**
   * Get next step URL for a given websiteId and step index
   */
  private async getNextStepUrl(websiteId: string, stepIndex: number): Promise<string | null> {
    try {
      const xpaths = await this.loadAndParseXPaths();
      if (!xpaths) {
        return null;
      }

      const websiteXPaths = xpaths
        .filter((x) => x.websiteId === websiteId)
        .sort((a, b) => a.executionOrder - b.executionOrder);

      if (stepIndex >= websiteXPaths.length) {
        return null;
      }

      return websiteXPaths[stepIndex]?.url || null;
    } catch (error) {
      this.logger.error('Error getting next step URL', error);
      return null;
    }
  }

  /**
   * Resume auto-fill execution from in-progress state
   */
  private async resumeAutoFill(executionId: string): Promise<void> {
    try {
      this.logger.info('Resuming auto-fill execution', { executionId });

      // Get current tab ID
      const tabId = await this.getCurrentTabId();
      if (!tabId) {
        this.logger.error('Failed to get current tab ID for resume');
        return;
      }

      // Send resume message to background script
      const response = (await browser.runtime.sendMessage({
        action: 'resumeAutoFill',
        executionId,
        tabId,
      })) as { success?: boolean; error?: string };

      if (response && response.success) {
        this.logger.info('Auto-fill resumed successfully');
      } else {
        this.logger.error('Auto-fill resume failed', response?.error);
      }
    } catch (error) {
      this.logger.error('Error during resume auto-fill', error);
    }
  }

  /**
   * Get current tab ID from background script
   */
  private async getCurrentTabId(): Promise<number | null> {
    try {
      const response = (await browser.runtime.sendMessage({
        action: 'getCurrentTabId',
      })) as { tabId?: number };

      if (response && response.tabId) {
        return response.tabId;
      }

      return null;
    } catch (error) {
      this.logger.error('Error getting current tab ID', error);
      return null;
    }
  }

  private async executeAutoFillWithProgress(
    matchedWebsiteId: string,
    matchedAv: any,
    allSteps: XPathData[]
  ): Promise<void> {
    this.logger.info('Starting auto-fill execution');

    const settingsResult = await this.systemSettingsRepository.load();
    if (settingsResult.isFailure) {
      throw new Error(`Failed to load system settings: ${settingsResult.error?.message}`);
    }
    const systemSettings = settingsResult.value!;
    const dialogMode = systemSettings.getAutoFillProgressDialogMode();
    this.logger.info('System setting: autoFillProgressDialogMode', { dialogMode });

    if (dialogMode !== 'hidden') {
      const showCancelButton = dialogMode === 'withCancel';
      this.logger.info('Showing auto-fill progress dialog', { showCancelButton });
      this.overlay.show(undefined, showCancelButton);
      this.overlay.updateProgress(0, allSteps.length);
    } else {
      this.logger.info('Progress dialog is disabled in settings');
    }

    const response = await this.messageDispatcher.executeAutoFill({
      tabId: null,
      websiteId: matchedWebsiteId,
      websiteVariables: matchedAv?.getVariables() || {},
    });

    if (dialogMode !== 'hidden') {
      this.overlay.hide();
    }

    if (response && response.success) {
      this.logger.info('Auto-fill completed successfully', {
        processedSteps: response.data?.processedSteps || 0,
      });
    } else {
      this.logger.error('Auto-fill failed', response?.data?.error);
    }
  }
}
