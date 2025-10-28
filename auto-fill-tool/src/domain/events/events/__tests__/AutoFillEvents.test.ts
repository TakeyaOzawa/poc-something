/**
 * Unit Tests: Auto-Fill Domain Events
 */

import {
  AutoFillStartedEvent,
  AutoFillCompletedEvent,
  AutoFillFailedEvent,
  AutoFillCancelledEvent,
  AutoFillProgressUpdatedEvent,
} from '../AutoFillEvents';

describe('AutoFillEvents', () => {
  describe('AutoFillStartedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new AutoFillStartedEvent(123, 'website-1', 'Test Website', 10);

      expect(event.tabId).toBe(123);
      expect(event.websiteId).toBe('website-1');
      expect(event.websiteName).toBe('Test Website');
      expect(event.totalSteps).toBe(10);
      expect(event.aggregateId).toBe('website-1');
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
    });

    it('should have correct eventType', () => {
      const event = new AutoFillStartedEvent(123, 'website-1', 'Test Website', 10);
      expect(event.eventType).toBe('AutoFillStarted');
    });

    it('should serialize to JSON correctly', () => {
      const metadata = { source: 'test' };
      const event = new AutoFillStartedEvent(123, 'website-1', 'Test Website', 10, metadata);
      const json = event.toJSON();

      expect(json.eventId).toBe(event.eventId);
      expect(json.eventType).toBe('AutoFillStarted');
      expect(json.occurredAt).toBe(event.occurredAt.toISOString());
      expect(json.aggregateId).toBe('website-1');
      expect(json.tabId).toBe(123);
      expect(json.websiteId).toBe('website-1');
      expect(json.websiteName).toBe('Test Website');
      expect(json.totalSteps).toBe(10);
      expect(json.metadata).toEqual(metadata);
    });

    it('should handle zero total steps', () => {
      const event = new AutoFillStartedEvent(123, 'website-1', 'Test Website', 0);
      expect(event.totalSteps).toBe(0);
    });

    it('should handle metadata parameter', () => {
      const metadata = { userId: 'user-123', action: 'manual' };
      const event = new AutoFillStartedEvent(123, 'website-1', 'Test Website', 10, metadata);

      expect(event.metadata).toEqual(metadata);
    });

    it('should work without metadata', () => {
      const event = new AutoFillStartedEvent(123, 'website-1', 'Test Website', 10);
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('AutoFillCompletedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new AutoFillCompletedEvent(456, 'website-2', 'Completed Website', 10, 10, 5000);

      expect(event.tabId).toBe(456);
      expect(event.websiteId).toBe('website-2');
      expect(event.websiteName).toBe('Completed Website');
      expect(event.totalSteps).toBe(10);
      expect(event.completedSteps).toBe(10);
      expect(event.duration).toBe(5000);
      expect(event.aggregateId).toBe('website-2');
    });

    it('should have correct eventType', () => {
      const event = new AutoFillCompletedEvent(456, 'website-2', 'Completed Website', 10, 10, 5000);
      expect(event.eventType).toBe('AutoFillCompleted');
    });

    it('should serialize to JSON correctly', () => {
      const metadata = { user: 'admin' };
      const event = new AutoFillCompletedEvent(
        456,
        'website-2',
        'Completed Website',
        10,
        10,
        5000,
        metadata
      );
      const json = event.toJSON();

      expect(json.eventType).toBe('AutoFillCompleted');
      expect(json.tabId).toBe(456);
      expect(json.websiteId).toBe('website-2');
      expect(json.websiteName).toBe('Completed Website');
      expect(json.totalSteps).toBe(10);
      expect(json.completedSteps).toBe(10);
      expect(json.duration).toBe(5000);
      expect(json.metadata).toEqual(metadata);
    });

    it('should handle partial completion', () => {
      const event = new AutoFillCompletedEvent(456, 'website-2', 'Website', 10, 7, 3000);

      expect(event.completedSteps).toBe(7);
      expect(event.totalSteps).toBe(10);
    });

    it('should handle zero duration', () => {
      const event = new AutoFillCompletedEvent(456, 'website-2', 'Website', 10, 10, 0);
      expect(event.duration).toBe(0);
    });

    it('should work without metadata', () => {
      const event = new AutoFillCompletedEvent(456, 'website-2', 'Website', 10, 10, 5000);
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('AutoFillFailedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new AutoFillFailedEvent(
        789,
        'website-3',
        'Failed Website',
        'Element not found',
        3,
        10,
        2000
      );

      expect(event.tabId).toBe(789);
      expect(event.websiteId).toBe('website-3');
      expect(event.websiteName).toBe('Failed Website');
      expect(event.error).toBe('Element not found');
      expect(event.completedSteps).toBe(3);
      expect(event.totalSteps).toBe(10);
      expect(event.duration).toBe(2000);
      expect(event.aggregateId).toBe('website-3');
    });

    it('should have correct eventType', () => {
      const event = new AutoFillFailedEvent(
        789,
        'website-3',
        'Failed Website',
        'Error',
        3,
        10,
        2000
      );
      expect(event.eventType).toBe('AutoFillFailed');
    });

    it('should serialize to JSON correctly', () => {
      const metadata = { reason: 'timeout' };
      const event = new AutoFillFailedEvent(
        789,
        'website-3',
        'Failed Website',
        'Element not found',
        3,
        10,
        2000,
        metadata
      );
      const json = event.toJSON();

      expect(json.eventType).toBe('AutoFillFailed');
      expect(json.tabId).toBe(789);
      expect(json.websiteId).toBe('website-3');
      expect(json.websiteName).toBe('Failed Website');
      expect(json.error).toBe('Element not found');
      expect(json.completedSteps).toBe(3);
      expect(json.totalSteps).toBe(10);
      expect(json.duration).toBe(2000);
      expect(json.metadata).toEqual(metadata);
    });

    it('should handle failure at first step', () => {
      const event = new AutoFillFailedEvent(789, 'website-3', 'Website', 'Error', 0, 10, 100);

      expect(event.completedSteps).toBe(0);
    });

    it('should work without metadata', () => {
      const event = new AutoFillFailedEvent(789, 'website-3', 'Website', 'Error', 3, 10, 2000);
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('AutoFillCancelledEvent', () => {
    it('should create event with correct properties', () => {
      const event = new AutoFillCancelledEvent(
        101,
        'website-4',
        'Cancelled Website',
        5,
        10,
        'User cancelled'
      );

      expect(event.tabId).toBe(101);
      expect(event.websiteId).toBe('website-4');
      expect(event.websiteName).toBe('Cancelled Website');
      expect(event.completedSteps).toBe(5);
      expect(event.totalSteps).toBe(10);
      expect(event.reason).toBe('User cancelled');
      expect(event.aggregateId).toBe('website-4');
    });

    it('should have correct eventType', () => {
      const event = new AutoFillCancelledEvent(
        101,
        'website-4',
        'Cancelled Website',
        5,
        10,
        'User cancelled'
      );
      expect(event.eventType).toBe('AutoFillCancelled');
    });

    it('should serialize to JSON correctly', () => {
      const metadata = { triggeredBy: 'user' };
      const event = new AutoFillCancelledEvent(
        101,
        'website-4',
        'Cancelled Website',
        5,
        10,
        'User cancelled',
        metadata
      );
      const json = event.toJSON();

      expect(json.eventType).toBe('AutoFillCancelled');
      expect(json.tabId).toBe(101);
      expect(json.websiteId).toBe('website-4');
      expect(json.websiteName).toBe('Cancelled Website');
      expect(json.completedSteps).toBe(5);
      expect(json.totalSteps).toBe(10);
      expect(json.reason).toBe('User cancelled');
      expect(json.metadata).toEqual(metadata);
    });

    it('should handle cancellation at beginning', () => {
      const event = new AutoFillCancelledEvent(101, 'website-4', 'Website', 0, 10, 'Cancelled');

      expect(event.completedSteps).toBe(0);
    });

    it('should handle different cancellation reasons', () => {
      const userEvent = new AutoFillCancelledEvent(101, 'w-1', 'W1', 5, 10, 'User cancelled');
      const errorEvent = new AutoFillCancelledEvent(102, 'w-2', 'W2', 3, 10, 'Critical error');

      expect(userEvent.reason).toBe('User cancelled');
      expect(errorEvent.reason).toBe('Critical error');
    });

    it('should work without metadata', () => {
      const event = new AutoFillCancelledEvent(101, 'website-4', 'Website', 5, 10, 'Cancelled');
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('AutoFillProgressUpdatedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new AutoFillProgressUpdatedEvent(202, 'website-5', 3, 10, 'Filling username');

      expect(event.tabId).toBe(202);
      expect(event.websiteId).toBe('website-5');
      expect(event.currentStep).toBe(3);
      expect(event.totalSteps).toBe(10);
      expect(event.currentAction).toBe('Filling username');
      expect(event.aggregateId).toBe('website-5');
    });

    it('should have correct eventType', () => {
      const event = new AutoFillProgressUpdatedEvent(202, 'website-5', 3, 10, 'Action');
      expect(event.eventType).toBe('AutoFillProgressUpdated');
    });

    it('should serialize to JSON correctly', () => {
      const metadata = { stepType: 'input' };
      const event = new AutoFillProgressUpdatedEvent(
        202,
        'website-5',
        3,
        10,
        'Filling username',
        metadata
      );
      const json = event.toJSON();

      expect(json.eventType).toBe('AutoFillProgressUpdated');
      expect(json.tabId).toBe(202);
      expect(json.websiteId).toBe('website-5');
      expect(json.currentStep).toBe(3);
      expect(json.totalSteps).toBe(10);
      expect(json.currentAction).toBe('Filling username');
      expect(json.metadata).toEqual(metadata);
    });

    it('should handle first step', () => {
      const event = new AutoFillProgressUpdatedEvent(202, 'website-5', 1, 10, 'Starting');

      expect(event.currentStep).toBe(1);
    });

    it('should handle last step', () => {
      const event = new AutoFillProgressUpdatedEvent(202, 'website-5', 10, 10, 'Finishing');

      expect(event.currentStep).toBe(10);
      expect(event.totalSteps).toBe(10);
    });

    it('should handle different action descriptions', () => {
      const inputEvent = new AutoFillProgressUpdatedEvent(202, 'w-5', 1, 10, 'Filling username');
      const clickEvent = new AutoFillProgressUpdatedEvent(202, 'w-5', 2, 10, 'Clicking submit');
      const waitEvent = new AutoFillProgressUpdatedEvent(202, 'w-5', 3, 10, 'Waiting 2000ms');

      expect(inputEvent.currentAction).toBe('Filling username');
      expect(clickEvent.currentAction).toBe('Clicking submit');
      expect(waitEvent.currentAction).toBe('Waiting 2000ms');
    });

    it('should work without metadata', () => {
      const event = new AutoFillProgressUpdatedEvent(202, 'website-5', 3, 10, 'Action');
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('Base Event Properties', () => {
    it('should generate unique eventId for each event', () => {
      const event1 = new AutoFillStartedEvent(123, 'w-1', 'Website 1', 10);
      const event2 = new AutoFillStartedEvent(124, 'w-2', 'Website 2', 10);

      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should set occurredAt to current time', () => {
      const before = new Date();
      const event = new AutoFillStartedEvent(123, 'w-1', 'Website', 10);
      const after = new Date();

      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should include base event properties in toJSON', () => {
      const event = new AutoFillStartedEvent(123, 'w-1', 'Website', 10);
      const json = event.toJSON();

      expect(json.eventId).toBeDefined();
      expect(json.eventType).toBeDefined();
      expect(json.occurredAt).toBeDefined();
      expect(json.aggregateId).toBeDefined();
    });
  });
});
