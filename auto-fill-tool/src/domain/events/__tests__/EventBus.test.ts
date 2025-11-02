/**
 * Tests for EventBus
 */

import { EventBus } from '../EventBus';
import { DomainEvent, BaseDomainEvent } from '../DomainEvent';
import { EventHandler } from '../EventHandler';
import { Logger } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Test event class
class TestEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'TestEvent';
  }

  constructor(
    public readonly testData: string,
    aggregateId?: string,
    metadata?: Record<string, unknown>
  ) {
    super(aggregateId, metadata);
  }
}

// Another test event class
class AnotherTestEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'AnotherTestEvent';
  }

  constructor(
    public readonly value: number,
    aggregateId?: string
  ) {
    super(aggregateId);
  }
}

// Mock event handler
class MockEventHandler implements EventHandler {
  public handledEvents: DomainEvent[] = [];

  async handle(event: DomainEvent): Promise<void> {
    this.handledEvents.push(event);
  }

  reset(): void {
    this.handledEvents = [];
  }
}

// Failing event handler (for error testing)
class FailingEventHandler implements EventHandler {
  async handle(_event: DomainEvent): Promise<void> {
    throw new Error('Handler failed intentionally');
  }
}

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('EventBus', () => {
  let eventBus: EventBus;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    eventBus = new EventBus(mockLogger);
  });

  afterEach(() => {
    eventBus.clearAll();
  });

  describe('subscribe', () => {
    it('should subscribe a handler to an event type', () => {
      const handler = new MockEventHandler();
      const subscriptionId = eventBus.subscribe('TestEvent', handler);

      expect(subscriptionId).toBeDefined();
      expect(subscriptionId).toContain('sub-');
      expect(eventBus.getSubscriptionCount('TestEvent')).toBe(1);
    });

    it('should allow multiple handlers for the same event type', () => {
      const handler1 = new MockEventHandler();
      const handler2 = new MockEventHandler();

      eventBus.subscribe('TestEvent', handler1);
      eventBus.subscribe('TestEvent', handler2);

      expect(eventBus.getSubscriptionCount('TestEvent')).toBe(2);
    });

    it('should log subscription', () => {
      const handler = new MockEventHandler();
      eventBus.subscribe('TestEvent', handler);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Subscribed to event type: TestEvent',
        expect.objectContaining({
          subscriptionId: expect.any(String),
          totalSubscriptions: 1,
        })
      );
    });
  });

  describe('subscribeToMultiple', () => {
    it('should subscribe to multiple event types at once', () => {
      const handler = new MockEventHandler();
      const subscriptionIds = eventBus.subscribeToMultiple(
        ['TestEvent', 'AnotherTestEvent'],
        handler
      );

      expect(subscriptionIds).toHaveLength(2);
      expect(eventBus.getSubscriptionCount('TestEvent')).toBe(1);
      expect(eventBus.getSubscriptionCount('AnotherTestEvent')).toBe(1);
    });
  });

  describe('subscribeToAll', () => {
    it('should register a global handler', () => {
      const handler = new MockEventHandler();
      eventBus.subscribeToAll(handler);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Global event handler registered',
        expect.objectContaining({
          totalGlobalHandlers: 1,
        })
      );
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe a handler', () => {
      const handler = new MockEventHandler();
      const subscriptionId = eventBus.subscribe('TestEvent', handler);

      const result = eventBus.unsubscribe(subscriptionId);

      expect(result).toBe(true);
      expect(eventBus.getSubscriptionCount('TestEvent')).toBe(0);
    });

    it('should return false for non-existent subscription', () => {
      const result = eventBus.unsubscribe('non-existent-id');
      expect(result).toBe(false);
    });

    it('should log unsubscription', () => {
      const handler = new MockEventHandler();
      const subscriptionId = eventBus.subscribe('TestEvent', handler);

      eventBus.unsubscribe(subscriptionId);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Unsubscribed from event type: TestEvent',
        expect.objectContaining({
          subscriptionId,
        })
      );
    });
  });

  describe('unsubscribeAll', () => {
    it('should remove all subscriptions for an event type', () => {
      const handler1 = new MockEventHandler();
      const handler2 = new MockEventHandler();

      eventBus.subscribe('TestEvent', handler1);
      eventBus.subscribe('TestEvent', handler2);

      eventBus.unsubscribeAll('TestEvent');

      expect(eventBus.getSubscriptionCount('TestEvent')).toBe(0);
    });
  });

  describe('clearAll', () => {
    it('should clear all subscriptions', () => {
      const handler = new MockEventHandler();

      eventBus.subscribe('TestEvent', handler);
      eventBus.subscribe('AnotherTestEvent', handler);
      eventBus.subscribeToAll(handler);

      eventBus.clearAll();

      expect(eventBus.getSubscriptionCount('TestEvent')).toBe(0);
      expect(eventBus.getSubscriptionCount('AnotherTestEvent')).toBe(0);
      expect(eventBus.getRegisteredEventTypes()).toHaveLength(0);
    });
  });

  describe('publish', () => {
    it('should publish event to subscribed handlers', async () => {
      const handler = new MockEventHandler();
      eventBus.subscribe('TestEvent', handler);

      const event = new TestEvent('test data', 'aggregate-1');
      await eventBus.publish(event);

      expect(handler.handledEvents).toHaveLength(1);
      expect(handler.handledEvents[0]).toBe(event);
    });

    it('should publish event to multiple subscribed handlers', async () => {
      const handler1 = new MockEventHandler();
      const handler2 = new MockEventHandler();

      eventBus.subscribe('TestEvent', handler1);
      eventBus.subscribe('TestEvent', handler2);

      const event = new TestEvent('test data');
      await eventBus.publish(event);

      expect(handler1.handledEvents).toHaveLength(1);
      expect(handler2.handledEvents).toHaveLength(1);
    });

    it('should publish event to global handlers', async () => {
      const specificHandler = new MockEventHandler();
      const globalHandler = new MockEventHandler();

      eventBus.subscribe('TestEvent', specificHandler);
      eventBus.subscribeToAll(globalHandler);

      const event = new TestEvent('test data');
      await eventBus.publish(event);

      expect(specificHandler.handledEvents).toHaveLength(1);
      expect(globalHandler.handledEvents).toHaveLength(1);
    });

    it('should not fail if no handlers are registered', async () => {
      const event = new TestEvent('test data');
      await expect(eventBus.publish(event)).resolves.not.toThrow();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'No handlers registered for event',
        expect.objectContaining({
          eventType: 'TestEvent',
        })
      );
    });

    it('should handle errors in handlers without stopping other handlers', async () => {
      const goodHandler = new MockEventHandler();
      const failingHandler = new FailingEventHandler();
      const anotherGoodHandler = new MockEventHandler();

      eventBus.subscribe('TestEvent', goodHandler);
      eventBus.subscribe('TestEvent', failingHandler);
      eventBus.subscribe('TestEvent', anotherGoodHandler);

      const event = new TestEvent('test data');
      await eventBus.publish(event);

      // Both good handlers should have been called despite the failing one
      expect(goodHandler.handledEvents).toHaveLength(1);
      expect(anotherGoodHandler.handledEvents).toHaveLength(1);

      // Error should be logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error in event handler',
        expect.objectContaining({
          eventType: 'TestEvent',
          error: 'Handler failed intentionally',
        })
      );
    });

    it('should queue events published during event handling', async () => {
      const handler = new MockEventHandler();

      // Handler that publishes another event
      const recursiveHandler: EventHandler = {
        async handle(event: DomainEvent): Promise<void> {
          if (event.eventType === 'TestEvent') {
            // Publish another event during handling
            await eventBus.publish(new AnotherTestEvent(42));
          }
        },
      };

      eventBus.subscribe('TestEvent', recursiveHandler);
      eventBus.subscribe('AnotherTestEvent', handler);

      const event = new TestEvent('test data');
      await eventBus.publish(event);

      // The second event should have been handled
      expect(handler.handledEvents).toHaveLength(1);
      expect(handler.handledEvents[0].eventType).toBe('AnotherTestEvent');
    });

    it('should log event publishing', async () => {
      const handler = new MockEventHandler();
      eventBus.subscribe('TestEvent', handler);

      const event = new TestEvent('test data', 'aggregate-1');
      await eventBus.publish(event);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Publishing event',
        expect.objectContaining({
          eventType: 'TestEvent',
          eventId: event.eventId,
          aggregateId: 'aggregate-1',
        })
      );
    });
  });

  describe('publishMany', () => {
    it('should publish multiple events in sequence', async () => {
      const handler = new MockEventHandler();
      eventBus.subscribe('TestEvent', handler);
      eventBus.subscribe('AnotherTestEvent', handler);

      const events = [new TestEvent('event 1'), new TestEvent('event 2'), new AnotherTestEvent(42)];

      await eventBus.publishMany(events);

      expect(handler.handledEvents).toHaveLength(3);
      expect(handler.handledEvents[0].eventType).toBe('TestEvent');
      expect(handler.handledEvents[1].eventType).toBe('TestEvent');
      expect(handler.handledEvents[2].eventType).toBe('AnotherTestEvent');
    });
  });

  describe('getSubscriptionCount', () => {
    it('should return 0 for event type with no subscriptions', () => {
      expect(eventBus.getSubscriptionCount('NonExistentEvent')).toBe(0);
    });

    it('should return correct count of subscriptions', () => {
      const handler = new MockEventHandler();

      eventBus.subscribe('TestEvent', handler);
      eventBus.subscribe('TestEvent', handler);

      expect(eventBus.getSubscriptionCount('TestEvent')).toBe(2);
    });
  });

  describe('getRegisteredEventTypes', () => {
    it('should return empty array when no subscriptions', () => {
      expect(eventBus.getRegisteredEventTypes()).toEqual([]);
    });

    it('should return all registered event types', () => {
      const handler = new MockEventHandler();

      eventBus.subscribe('TestEvent', handler);
      eventBus.subscribe('AnotherTestEvent', handler);

      const eventTypes = eventBus.getRegisteredEventTypes();

      expect(eventTypes).toHaveLength(2);
      expect(eventTypes).toContain('TestEvent');
      expect(eventTypes).toContain('AnotherTestEvent');
    });
  });
});
