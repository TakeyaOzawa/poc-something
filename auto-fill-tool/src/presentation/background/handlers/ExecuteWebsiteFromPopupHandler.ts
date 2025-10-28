/**
 * Presentation Layer: Execute Website From Popup Message Handler
 * Handles website execution requests from popup
 */

import browser from 'webextension-polyfill';
import { MessageHandler } from '@domain/types/messaging';
import {
  ExecuteWebsiteFromPopupRequest,
  ExecuteWebsiteFromPopupResponse,
} from '@domain/types/messaging';
import { Logger } from '@domain/types/logger.types';
import { GetWebsiteByIdUseCase } from '@usecases/websites/GetWebsiteByIdUseCase';
import { ChromeStorageAutomationVariablesRepository } from '@infrastructure/repositories/ChromeStorageAutomationVariablesRepository';
import { ExecuteAutoFillUseCase } from '@usecases/auto-fill/ExecuteAutoFillUseCase';
import { AUTOMATION_STATUS } from '@domain/constants/AutomationStatus';
import { VariableCollection } from '@domain/entities/Variable';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';

export class ExecuteWebsiteFromPopupHandler
  implements MessageHandler<ExecuteWebsiteFromPopupRequest, ExecuteWebsiteFromPopupResponse>
{
  private automationVariablesRepository: ChromeStorageAutomationVariablesRepository;

  constructor(
    private getWebsiteByIdUseCase: GetWebsiteByIdUseCase,
    private executeAutoFillUseCase: ExecuteAutoFillUseCase,
    private logger: Logger
  ) {
    this.automationVariablesRepository = new ChromeStorageAutomationVariablesRepository(
      logger.createChild('AutomationVariables')
    );
  }

  async handle(message: ExecuteWebsiteFromPopupRequest): Promise<ExecuteWebsiteFromPopupResponse> {
    this.logger.info('[ExecuteWebsiteFromPopupHandler] Received request', {
      websiteId: message.websiteId,
    });

    try {
      const website = await this.loadAndValidateWebsite(message.websiteId);
      if (!website) {
        return this.createErrorResponse('Website not found');
      }

      const automationVariablesResult = await this.automationVariablesRepository.load(website.id);
      if (automationVariablesResult.isFailure) {
        this.logger.error(
          '[ExecuteWebsiteFromPopupHandler] Failed to load automation variables',
          automationVariablesResult.error
        );
        return this.createErrorResponse('Failed to load automation variables');
      }
      const automationVariables = automationVariablesResult.value;
      const validationError = this.validateWebsiteEnabled(website, automationVariables);
      if (validationError) {
        return this.createErrorResponse(validationError);
      }

      const tabId = await this.createNewTab(website.startUrl!);
      if (!tabId) {
        return this.createErrorResponse(I18nAdapter.getMessage('tabCreationFailed'));
      }

      const variables = this.createVariableCollection(automationVariables);
      const result = await this.executeAndUpdateStatus(
        tabId,
        website.id,
        variables,
        automationVariables
      );

      return {
        success: result.success,
        data: {
          processedSteps: result.processedSteps,
          error: result.error,
        },
      };
    } catch (error) {
      this.logger.error('[ExecuteWebsiteFromPopupHandler] Error executing website', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createErrorResponse(errorMessage);
    }
  }

  private async loadAndValidateWebsite(websiteId: string) {
    const { website } = await this.getWebsiteByIdUseCase.execute({ websiteId });
    if (!website) {
      this.logger.error('[ExecuteWebsiteFromPopupHandler] Website not found', { websiteId });
      return null;
    }

    this.logger.info('[ExecuteWebsiteFromPopupHandler] Website loaded', {
      name: website.name,
      startUrl: website.startUrl,
    });

    return website;
  }

  private validateWebsiteEnabled(website: any, automationVariables: any): string | null {
    const status = automationVariables?.getStatus();

    if (status === AUTOMATION_STATUS.DISABLED) {
      this.logger.warn('[ExecuteWebsiteFromPopupHandler] Website is disabled', {
        websiteId: website.id,
      });
      return I18nAdapter.getMessage('websiteDisabled');
    }

    if (!website.startUrl) {
      this.logger.error('[ExecuteWebsiteFromPopupHandler] Website has no startUrl', {
        websiteId: website.id,
      });
      return I18nAdapter.getMessage('startUrlNotSet');
    }

    return null;
  }

  private async createNewTab(startUrl: string): Promise<number | null> {
    this.logger.info('[ExecuteWebsiteFromPopupHandler] Creating new tab', { url: startUrl });

    const newTab = await browser.tabs.create({ url: startUrl, active: true });

    if (!newTab?.id) {
      this.logger.error('[ExecuteWebsiteFromPopupHandler] Failed to create new tab');
      return null;
    }

    this.logger.info('[ExecuteWebsiteFromPopupHandler] New tab created', { tabId: newTab.id });
    this.logger.info('[ExecuteWebsiteFromPopupHandler] Waiting 500ms for tab to initialize');
    await new Promise((resolve) => setTimeout(resolve, 500));

    return newTab.id;
  }

  private createVariableCollection(automationVariables: any): VariableCollection {
    const variables = new VariableCollection();
    const websiteVariables = automationVariables?.getVariables() || {};

    Object.entries(websiteVariables).forEach(([name, value]) => {
      variables.add({ name, value: value as string });
    });

    return variables;
  }

  private async executeAndUpdateStatus(
    tabId: number,
    websiteId: string,
    variables: VariableCollection,
    automationVariables: any
  ) {
    this.logger.info('[ExecuteWebsiteFromPopupHandler] Executing auto-fill', {
      tabId,
      websiteId,
      variablesCount: variables.getAll().length,
    });

    const result = await this.executeAutoFillUseCase.execute({
      tabId,
      url: '',
      variables,
      websiteId,
    });

    this.logger.info('[ExecuteWebsiteFromPopupHandler] Auto-fill completed', {
      success: result.success,
      processedSteps: result.processedSteps,
    });

    // If status is 'once', change to 'disabled' after successful execution
    const status = automationVariables?.getStatus();
    if (result.success && status === AUTOMATION_STATUS.ONCE && automationVariables) {
      const updatedAv = automationVariables.setStatus(AUTOMATION_STATUS.DISABLED);
      const saveResult = await this.automationVariablesRepository.save(updatedAv);
      if (saveResult.isSuccess) {
        this.logger.info(
          '[ExecuteWebsiteFromPopupHandler] Changed status to "disabled" for website',
          {
            websiteId,
          }
        );
      } else {
        this.logger.error(
          '[ExecuteWebsiteFromPopupHandler] Failed to save automation variables',
          saveResult.error
        );
      }
    }

    return result;
  }

  private createErrorResponse(error: string): ExecuteWebsiteFromPopupResponse {
    return {
      success: false,
      data: {
        processedSteps: 0,
        error,
      },
    };
  }
}
