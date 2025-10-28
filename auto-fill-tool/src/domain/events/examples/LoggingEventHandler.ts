/**
 * Example Event Handler: Logging Handler
 * Demonstrates how to create a handler that logs all domain events
 */

import { DomainEvent } from '../DomainEvent';
import { SyncEventHandler } from '../EventHandler';
import { Logger } from '@domain/types/logger.types';

/**
 * Logs all domain events for auditing and debugging purposes
 * This is a typical cross-cutting concern that benefits from event-driven architecture
 */
export class LoggingEventHandler extends SyncEventHandler {
  constructor(private logger: Logger) {
    super();
  }

  handle(event: DomainEvent): void {
    this.logger.info('Domain event occurred', {
      eventType: event.eventType,
      eventId: event.eventId,
      aggregateId: event.aggregateId,
      occurredAt: event.occurredAt.toISOString(),
      metadata: event.metadata,
    });
  }

  getSupportedEventTypes(): string[] {
    // Return empty array to indicate this handler should be registered globally
    // (subscribeToAll) rather than for specific event types
    return [];
  }
}
