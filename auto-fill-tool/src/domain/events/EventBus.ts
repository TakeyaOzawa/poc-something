/**
 * Domain Layer: Event Bus
 * Manages event publishing and subscription
 *
 * The EventBus provides a pub/sub mechanism for domain events,
 * allowing loose coupling between event publishers and subscribers.
 */

import { DomainEvent } from './DomainEvent';
import { EventHandler } from './EventHandler';
import { Logger } from '@domain/types/logger.types';

/**
 * Event subscription
 */
interface EventSubscription {
  eventType: string;
  handler: EventHandler;
  subscriptionId: string;
}

/**
 * EventBus - Central hub for domain events
 */
export class EventBus {
  private subscriptions: Map<string, EventSubscription[]>;
  private globalHandlers: EventHandler[];
  private isPublishing: boolean;
  private eventQueue: DomainEvent[];

  constructor(private logger?: Logger) {
    this.subscriptions = new Map();
    this.globalHandlers = [];
    this.isPublishing = false;
    this.eventQueue = [];
  }

  /**
   * Subscribe to a specific event type
   * @param eventType The type of event to listen for
   * @param handler The handler to invoke when event occurs
   * @returns Subscription ID for later unsubscription
   */
  subscribe(eventType: string, handler: EventHandler): string {
    const subscriptionId = this.generateSubscriptionId();

    const subscription: EventSubscription = {
      eventType,
      handler,
      subscriptionId,
    };

    const existingSubscriptions = this.subscriptions.get(eventType) || [];
    existingSubscriptions.push(subscription);
    this.subscriptions.set(eventType, existingSubscriptions);

    this.logger?.debug(`Subscribed to event type: ${eventType}`, {
      subscriptionId,
      totalSubscriptions: existingSubscriptions.length,
    });

    return subscriptionId;
  }

  /**
   * Subscribe to multiple event types with the same handler
   * @param eventTypes Array of event types to listen for
   * @param handler The handler to invoke for any of these events
   * @returns Array of subscription IDs
   */
  subscribeToMultiple(eventTypes: string[], handler: EventHandler): string[] {
    return eventTypes.map((eventType) => this.subscribe(eventType, handler));
  }

  /**
   * Subscribe a handler to all events (global handler)
   * Useful for logging, auditing, or monitoring purposes
   * @param handler The handler to invoke for all events
   */
  subscribeToAll(handler: EventHandler): void {
    this.globalHandlers.push(handler);
    this.logger?.debug('Global event handler registered', {
      totalGlobalHandlers: this.globalHandlers.length,
    });
  }

  /**
   * Unsubscribe from an event
   * @param subscriptionId The subscription ID returned from subscribe()
   * @returns True if unsubscribed successfully
   */
  unsubscribe(subscriptionId: string): boolean {
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      const index = subscriptions.findIndex((sub) => sub.subscriptionId === subscriptionId);
      if (index !== -1) {
        subscriptions.splice(index, 1);
        if (subscriptions.length === 0) {
          this.subscriptions.delete(eventType);
        }
        this.logger?.debug(`Unsubscribed from event type: ${eventType}`, {
          subscriptionId,
        });
        return true;
      }
    }
    return false;
  }

  /**
   * Unsubscribe all handlers for a specific event type
   * @param eventType The event type to clear all subscriptions for
   */
  unsubscribeAll(eventType: string): void {
    const subscriptions = this.subscriptions.get(eventType);
    if (subscriptions) {
      this.subscriptions.delete(eventType);
      this.logger?.debug(`Cleared all subscriptions for event type: ${eventType}`, {
        clearedCount: subscriptions.length,
      });
    }
  }

  /**
   * Clear all subscriptions
   */
  clearAll(): void {
    const totalSubscriptions = Array.from(this.subscriptions.values()).reduce(
      (sum, subs) => sum + subs.length,
      0
    );
    this.subscriptions.clear();
    this.globalHandlers = [];
    this.logger?.debug('Cleared all event subscriptions', {
      clearedSubscriptions: totalSubscriptions,
    });
  }

  /**
   * Publish an event to all registered handlers
   * @param event The domain event to publish
   */
  async publish(event: DomainEvent): Promise<void> {
    this.logger?.debug('Publishing event', {
      eventType: event.eventType,
      eventId: event.eventId,
      aggregateId: event.aggregateId,
    });

    // If currently publishing, queue the event to prevent recursion issues
    if (this.isPublishing) {
      this.eventQueue.push(event);
      this.logger?.debug('Event queued (publishing in progress)', {
        eventType: event.eventType,
        queueLength: this.eventQueue.length,
      });
      return;
    }

    try {
      this.isPublishing = true;
      await this.publishEvent(event);

      // Process queued events
      while (this.eventQueue.length > 0) {
        const queuedEvent = this.eventQueue.shift()!;
        await this.publishEvent(queuedEvent);
      }
    } finally {
      this.isPublishing = false;
    }
  }

  /**
   * Publish multiple events in sequence
   * @param events Array of events to publish
   */
  async publishMany(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Internal: Actually publish the event to handlers
   */
  private async publishEvent(event: DomainEvent): Promise<void> {
    const subscriptions = this.subscriptions.get(event.eventType) || [];
    const allHandlers = [...subscriptions.map((sub) => sub.handler), ...this.globalHandlers];

    if (allHandlers.length === 0) {
      this.logger?.debug('No handlers registered for event', {
        eventType: event.eventType,
      });
      return;
    }

    // Execute all handlers in parallel
    const handlerPromises = allHandlers.map(async (handler) => {
      try {
        await handler.handle(event);
        this.logger?.debug('Event handler executed successfully', {
          eventType: event.eventType,
          eventId: event.eventId,
        });
      } catch (error) {
        this.logger?.error('Error in event handler', {
          eventType: event.eventType,
          eventId: event.eventId,
          error: error instanceof Error ? error.message : String(error),
        });
        // Don't rethrow - one handler's failure shouldn't affect others
      }
    });

    await Promise.all(handlerPromises);
  }

  /**
   * Get count of subscriptions for an event type
   */
  getSubscriptionCount(eventType: string): number {
    return this.subscriptions.get(eventType)?.length || 0;
  }

  /**
   * Get all registered event types
   */
  getRegisteredEventTypes(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
