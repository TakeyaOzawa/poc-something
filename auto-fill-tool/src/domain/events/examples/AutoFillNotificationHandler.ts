/**
 * Example Event Handler: Auto-Fill Notification Handler
 * Demonstrates how to create a handler for specific auto-fill events
 */

import { AsyncEventHandler } from '../EventHandler';
import {
  AutoFillCompletedEvent,
  AutoFillFailedEvent,
  AutoFillCancelledEvent,
} from '../events/AutoFillEvents';
import { DomainEvent } from '../DomainEvent';
import { Logger } from '@domain/types/logger.types';

/**
 * Handles auto-fill completion events and sends notifications
 * This demonstrates how to create targeted handlers for specific business events
 */
export class AutoFillNotificationHandler extends AsyncEventHandler {
  constructor(private logger: Logger) {
    super();
  }

  async handle(event: DomainEvent): Promise<void> {
    if (event instanceof AutoFillCompletedEvent) {
      await this.handleCompleted(event);
    } else if (event instanceof AutoFillFailedEvent) {
      await this.handleFailed(event);
    } else if (event instanceof AutoFillCancelledEvent) {
      await this.handleCancelled(event);
    }
  }

  private async handleCompleted(event: AutoFillCompletedEvent): Promise<void> {
    this.logger.info('Auto-fill completed successfully', {
      websiteName: event.websiteName,
      duration: event.duration,
      steps: event.completedSteps,
    });

    // Example: Send browser notification
    if (typeof chrome !== 'undefined' && chrome.notifications) {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Auto-Fill Completed',
        message: `Successfully filled ${event.completedSteps} steps in ${event.websiteName}`,
      });
    }
  }

  private async handleFailed(event: AutoFillFailedEvent): Promise<void> {
    this.logger.error('Auto-fill failed', {
      websiteName: event.websiteName,
      error: event.error,
      completedSteps: event.completedSteps,
      totalSteps: event.totalSteps,
    });

    // Example: Send error notification
    if (typeof chrome !== 'undefined' && chrome.notifications) {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon48.png',
        title: 'Auto-Fill Failed',
        message: `Failed at step ${event.completedSteps}/${event.totalSteps}: ${event.error}`,
      });
    }
  }

  private async handleCancelled(event: AutoFillCancelledEvent): Promise<void> {
    this.logger.info('Auto-fill cancelled', {
      websiteName: event.websiteName,
      reason: event.reason,
    });
  }

  getSupportedEventTypes(): string[] {
    return ['AutoFillCompleted', 'AutoFillFailed', 'AutoFillCancelled'];
  }
}
