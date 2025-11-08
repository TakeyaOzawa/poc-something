/**
 * Presentation Layer: Website Action Handler
 * Handles website execution requests from popup
 */

import { Logger } from '@/infrastructure/loggers/LoggerFactory';
import { MessageDispatcher } from '@infrastructure/messaging/MessageDispatcher';
import { WebsiteViewModel } from '../types/WebsiteViewModel';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';

export class WebsiteActionHandler {
  private messageDispatcher: MessageDispatcher;

  constructor(private logger: Logger) {
    this.messageDispatcher = new MessageDispatcher();
  }

  /**
   * Execute auto-fill for a website
   * Sends a message to background script to handle the execution
   */
  async executeWebsite(website: WebsiteViewModel): Promise<boolean> {
    this.logger.info('Executing website', {
      websiteId: website.id,
      websiteName: website.name,
    });

    try {
      // Send message to background script to execute website
      // Background script will handle tab creation and auto-fill execution
      this.logger.info('Sending executeWebsiteFromPopup message to background', {
        websiteId: website.id,
      });

      const response = await this.messageDispatcher.executeWebsiteFromPopup(website.id);

      this.logger.info('Received response from background', { response });

      if (response.success) {
        alert(I18nAdapter.format('autoFillCompleted', String(response.data?.processedSteps || 0)));
        return true;
      } else {
        alert(
          I18nAdapter.format(
            'autoFillFailed',
            response.data?.error || I18nAdapter.getMessage('unknownError')
          )
        );
        return false;
      }
    } catch (error) {
      this.logger.error('Failed to execute website', error, {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      alert(
        I18nAdapter.format(
          'autoFillExecutionFailed',
          error instanceof Error ? error.message : I18nAdapter.getMessage('unknownError')
        )
      );
      return false;
    }
  }
}
