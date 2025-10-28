/**
 * Progress Reporter
 * Handles progress reporting to content scripts
 */

import browser from 'webextension-polyfill';
import { Logger } from '@domain/types/logger.types';
import { UpdateAutoFillProgressMessage } from '@domain/types/messaging';
import { MessageTypes } from '@domain/types/messaging';

export class ProgressReporter {
  constructor(private logger: Logger) {}

  /**
   * Report progress to the content script
   * Fire-and-forget: does not wait for response to avoid blocking execution
   */
  async report(
    tabId: number,
    current: number,
    total: number,
    description: string = ''
  ): Promise<void> {
    try {
      const message: UpdateAutoFillProgressMessage = {
        action: MessageTypes.UPDATE_AUTO_FILL_PROGRESS,
        current,
        total,
        description,
      };

      // Fire-and-forget: no await to avoid blocking on response
      browser.tabs.sendMessage(tabId, message).catch((error) => {
        // Silently fail if tab is closed or message can't be delivered
        this.logger.debug('Failed to report progress', { error });
      });
    } catch (error) {
      // Catch synchronous errors
      this.logger.debug('Failed to report progress', { error });
    }
  }
}
