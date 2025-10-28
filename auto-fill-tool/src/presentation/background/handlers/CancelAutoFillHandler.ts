/**
 * Presentation Layer: Cancel Auto Fill Message Handler
 * Handles cancelAutoFill messages from content scripts
 */

import { MessageHandler, MessageContext } from '@domain/types/messaging';
import { CancelAutoFillRequest, CancelAutoFillResponse } from '@domain/types/messaging';
import { ChromeAutoFillAdapter } from '@infrastructure/adapters/ChromeAutoFillAdapter';
import { Logger } from '@domain/types/logger.types';

export class CancelAutoFillHandler
  implements MessageHandler<CancelAutoFillRequest, CancelAutoFillResponse>
{
  constructor(private logger: Logger) {}

  async handle(
    message: CancelAutoFillRequest,
    context: MessageContext
  ): Promise<CancelAutoFillResponse> {
    let tabId = message.tabId;

    // If tabId is not provided, use sender's tab ID (for content script calls)
    if (!tabId && context.sender.tab?.id) {
      tabId = context.sender.tab.id;
    }

    if (!tabId) {
      return {
        success: false,
        error: 'Missing tabId parameter',
      };
    }

    try {
      this.logger.info(`Cancellation requested for tab ${tabId}`);
      ChromeAutoFillAdapter.requestCancellation(tabId);

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error('Error processing cancellation request', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
