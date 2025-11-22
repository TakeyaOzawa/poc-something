/**
 * Test: AggregateRoot
 * Tests the base functionality of Aggregate Roots
 */

import { AggregateRoot } from '../AggregateRoot';
import { DomainEvent } from '@domain/events/DomainEvent';

// Test implementation of AggregateRoot
class TestAggregate extends AggregateRoot<string> {
  constructor(private readonly id: string) {
    super();
  }

  getId(): string {
    return this.id;
  }

  // Public method to add domain events for testing
  public addTestEvent(event: DomainEvent): void {
    this.addDomainEvent(event);
  }
}

// Test domain event
class TestEvent implements DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly eventName: string,
    public readonly occurredOn: Date = new Date()
  ) {}
}

describe('AggregateRoot', () => {
  describe('Domain Event Management', () => {
    it('should add domain events', () => {
      const aggregate = new TestAggregate('test-id');
      const event = new TestEvent('test-id', 'TestEvent');

      aggregate.addTestEvent(event);

      expect(aggregate.hasDomainEvents()).toBe(true);
      expect(aggregate.getDomainEvents()).toHaveLength(1);
      expect(aggregate.getDomainEvents()[0]).toBe(event);
    });

    it('should pull domain events and clear them', () => {
      const aggregate = new TestAggregate('test-id');
      const event1 = new TestEvent('test-id', 'Event1');
      const event2 = new TestEvent('test-id', 'Event2');

      aggregate.addTestEvent(event1);
      aggregate.addTestEvent(event2);

      const events = aggregate.pullDomainEvents();

      expect(events).toHaveLength(2);
      expect(events[0]).toBe(event1);
      expect(events[1]).toBe(event2);
      expect(aggregate.hasDomainEvents()).toBe(false);
      expect(aggregate.getDomainEvents()).toHaveLength(0);
    });

    it('should get domain events without clearing', () => {
      const aggregate = new TestAggregate('test-id');
      const event = new TestEvent('test-id', 'TestEvent');

      aggregate.addTestEvent(event);

      const events = aggregate.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(aggregate.hasDomainEvents()).toBe(true);
    });

    it('should clear domain events', () => {
      const aggregate = new TestAggregate('test-id');
      const event = new TestEvent('test-id', 'TestEvent');

      aggregate.addTestEvent(event);
      aggregate.clearDomainEvents();

      expect(aggregate.hasDomainEvents()).toBe(false);
      expect(aggregate.getDomainEvents()).toHaveLength(0);
    });

    it('should handle multiple events', () => {
      const aggregate = new TestAggregate('test-id');
      const events = [
        new TestEvent('test-id', 'Event1'),
        new TestEvent('test-id', 'Event2'),
        new TestEvent('test-id', 'Event3'),
      ];

      events.forEach((event) => aggregate.addTestEvent(event));

      expect(aggregate.getDomainEvents()).toHaveLength(3);
      expect(aggregate.hasDomainEvents()).toBe(true);
    });

    it('should return empty array when no events', () => {
      const aggregate = new TestAggregate('test-id');

      expect(aggregate.getDomainEvents()).toHaveLength(0);
      expect(aggregate.hasDomainEvents()).toBe(false);
    });
  });

  describe('getId', () => {
    it('should return the aggregate id', () => {
      const aggregate = new TestAggregate('test-id-123');

      expect(aggregate.getId()).toBe('test-id-123');
    });
  });
});
