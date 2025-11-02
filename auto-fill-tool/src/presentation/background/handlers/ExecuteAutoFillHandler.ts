/**
 * Presentation Layer: Execute Auto Fill Message Handler
 * Handles executeAutoFill messages from popup and content scripts
 */

import { MessageHandler, MessageContext } from '@domain/types/messaging';
import { ExecuteAutoFillRequest, ExecuteAutoFillResponse } from '@domain/types/messaging';
import { ExecuteAutoFillUseCase } from '@usecases/auto-fill/ExecuteAutoFillUseCase';
import { VariableCollection } from '@domain/entities/Variable';
import { Logger } from '@domain/types/logger.types';

export class ExecuteAutoFillHandler
  implements MessageHandler<ExecuteAutoFillRequest, ExecuteAutoFillResponse>
{
  constructor(
    private executeAutoFillUseCase: ExecuteAutoFillUseCase,
    private logger: Logger
  ) {}

  async handle(
    message: ExecuteAutoFillRequest,
    context: MessageContext
  ): Promise<ExecuteAutoFillResponse> {
    this.logger.info('[ExecuteAutoFillHandler] Received executeAutoFill message', {
      messageTabId: message.tabId,
      websiteId: message.websiteId,
      senderTabId: context.sender.tab?.id,
    });

    const tabId = this.resolveTabId(message.tabId, context);
    if (!tabId) {
      return this.createErrorResponse('Missing tabId parameter');
    }

    try {
      const websiteVariables = message.websiteVariables || {};
      const websiteId = message.websiteId || '';

      const variables = this.createVariableCollection(websiteVariables);
      const result = await this.executeAutoFill(tabId, websiteId, variables);

      const responseData: { processedSteps?: number; error?: string } = {
        processedSteps: result.processedSteps,
      };

      if (result.error !== undefined) {
        responseData.error = result.error;
      }

      return {
        success: result.success,
        data: responseData,
      };
    } catch (error) {
      this.logger.error('[ExecuteAutoFillHandler] Error executing auto-fill', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.createErrorResponse(errorMessage);
    }
  }

  private resolveTabId(
    messageTabId: number | null | undefined,
    context: MessageContext
  ): number | null {
    if (messageTabId) {
      return messageTabId;
    }

    const senderTabId = context.sender.tab?.id;
    if (senderTabId) {
      this.logger.info('[ExecuteAutoFillHandler] Using sender tab ID', { tabId: senderTabId });
      return senderTabId;
    }

    this.logger.error('[ExecuteAutoFillHandler] No tabId available');
    return null;
  }

  private createVariableCollection(websiteVariables: Record<string, string>): VariableCollection {
    this.logger.info('[ExecuteAutoFillHandler] Creating variables collection', {
      variablesCount: Object.keys(websiteVariables).length,
    });

    const variables = new VariableCollection();
    Object.entries(websiteVariables).forEach(([name, value]) => {
      variables.add({ name, value: value as string });
    });

    return variables;
  }

  private async executeAutoFill(
    tabId: number,
    websiteId: string,
    variables: VariableCollection
  ): Promise<{ success: boolean; processedSteps: number; error?: string }> {
    this.logger.info('[ExecuteAutoFillHandler] Executing auto-fill use case', {
      tabId,
      websiteId,
    });

    const result = await this.executeAutoFillUseCase.execute({
      tabId,
      url: '',
      variables,
      websiteId,
    });

    this.logger.info('[ExecuteAutoFillHandler] Auto-fill use case completed', {
      success: result.success,
      processedSteps: result.processedSteps,
    });

    return result;
  }

  private createErrorResponse(error: string): ExecuteAutoFillResponse {
    return {
      success: false,
      data: {
        processedSteps: 0,
        error,
      },
    };
  }
}
