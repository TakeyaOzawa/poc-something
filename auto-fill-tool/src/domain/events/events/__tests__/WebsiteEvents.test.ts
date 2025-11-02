/**
 * Unit Tests: Website Domain Events
 */

import {
  WebsiteCreatedEvent,
  WebsiteUpdatedEvent,
  WebsiteDeletedEvent,
  WebsiteStatusChangedEvent,
  WebsiteDuplicatedEvent,
} from '../WebsiteEvents';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('WebsiteEvents', () => {
  describe('WebsiteCreatedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new WebsiteCreatedEvent('website-1', 'Test Website', 'active');

      expect(event.websiteId).toBe('website-1');
      expect(event.websiteName).toBe('Test Website');
      expect(event.status).toBe('active');
      expect(event.aggregateId).toBe('website-1');
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
    });

    it('should have correct eventType', () => {
      const event = new WebsiteCreatedEvent('website-1', 'Test Website', 'active');
      expect(event.eventType).toBe('WebsiteCreated');
    });

    it('should serialize to JSON correctly', () => {
      const metadata = { source: 'test' };
      const event = new WebsiteCreatedEvent('website-1', 'Test Website', 'active', metadata);
      const json = event.toJSON();

      expect(json.eventId).toBe(event.eventId);
      expect(json.eventType).toBe('WebsiteCreated');
      expect(json.occurredAt).toBe(event.occurredAt.toISOString());
      expect(json.aggregateId).toBe('website-1');
      expect(json.websiteId).toBe('website-1');
      expect(json.websiteName).toBe('Test Website');
      expect(json.status).toBe('active');
      expect(json.metadata).toEqual(metadata);
    });

    it('should handle metadata parameter', () => {
      const metadata = { userId: 'user-123', action: 'manual' };
      const event = new WebsiteCreatedEvent('website-1', 'Test Website', 'active', metadata);

      expect(event.metadata).toEqual(metadata);
    });

    it('should work without metadata', () => {
      const event = new WebsiteCreatedEvent('website-1', 'Test Website', 'active');
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('WebsiteUpdatedEvent', () => {
    it('should create event with correct properties', () => {
      const changes = { name: 'New Name', url: 'http://new.example.com' };
      const event = new WebsiteUpdatedEvent('website-2', 'Updated Website', changes);

      expect(event.websiteId).toBe('website-2');
      expect(event.websiteName).toBe('Updated Website');
      expect(event.changes).toEqual(changes);
      expect(event.aggregateId).toBe('website-2');
    });

    it('should have correct eventType', () => {
      const event = new WebsiteUpdatedEvent('website-2', 'Updated Website', {});
      expect(event.eventType).toBe('WebsiteUpdated');
    });

    it('should serialize to JSON correctly', () => {
      const changes = { name: 'New Name' };
      const metadata = { user: 'admin' };
      const event = new WebsiteUpdatedEvent('website-2', 'Updated Website', changes, metadata);
      const json = event.toJSON();

      expect(json.eventType).toBe('WebsiteUpdated');
      expect(json.websiteId).toBe('website-2');
      expect(json.websiteName).toBe('Updated Website');
      expect(json.changes).toEqual(changes);
      expect(json.metadata).toEqual(metadata);
    });

    it('should handle empty changes object', () => {
      const event = new WebsiteUpdatedEvent('website-2', 'Updated Website', {});
      expect(event.changes).toEqual({});
    });
  });

  describe('WebsiteDeletedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new WebsiteDeletedEvent('website-3', 'Deleted Website');

      expect(event.websiteId).toBe('website-3');
      expect(event.websiteName).toBe('Deleted Website');
      expect(event.aggregateId).toBe('website-3');
    });

    it('should have correct eventType', () => {
      const event = new WebsiteDeletedEvent('website-3', 'Deleted Website');
      expect(event.eventType).toBe('WebsiteDeleted');
    });

    it('should serialize to JSON correctly', () => {
      const metadata = { reason: 'user request' };
      const event = new WebsiteDeletedEvent('website-3', 'Deleted Website', metadata);
      const json = event.toJSON();

      expect(json.eventType).toBe('WebsiteDeleted');
      expect(json.websiteId).toBe('website-3');
      expect(json.websiteName).toBe('Deleted Website');
      expect(json.metadata).toEqual(metadata);
    });

    it('should work without metadata', () => {
      const event = new WebsiteDeletedEvent('website-3', 'Deleted Website');
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('WebsiteStatusChangedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new WebsiteStatusChangedEvent(
        'website-4',
        'Status Changed Website',
        'active',
        'inactive'
      );

      expect(event.websiteId).toBe('website-4');
      expect(event.websiteName).toBe('Status Changed Website');
      expect(event.oldStatus).toBe('active');
      expect(event.newStatus).toBe('inactive');
      expect(event.aggregateId).toBe('website-4');
    });

    it('should have correct eventType', () => {
      const event = new WebsiteStatusChangedEvent('website-4', 'Website', 'active', 'inactive');
      expect(event.eventType).toBe('WebsiteStatusChanged');
    });

    it('should serialize to JSON correctly', () => {
      const metadata = { triggeredBy: 'system' };
      const event = new WebsiteStatusChangedEvent(
        'website-4',
        'Website',
        'active',
        'inactive',
        metadata
      );
      const json = event.toJSON();

      expect(json.eventType).toBe('WebsiteStatusChanged');
      expect(json.websiteId).toBe('website-4');
      expect(json.websiteName).toBe('Website');
      expect(json.oldStatus).toBe('active');
      expect(json.newStatus).toBe('inactive');
      expect(json.metadata).toEqual(metadata);
    });

    it('should handle same old and new status', () => {
      const event = new WebsiteStatusChangedEvent('website-4', 'Website', 'active', 'active');
      expect(event.oldStatus).toBe('active');
      expect(event.newStatus).toBe('active');
    });
  });

  describe('WebsiteDuplicatedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new WebsiteDuplicatedEvent(
        'source-website-5',
        'new-website-6',
        'Duplicated Website'
      );

      expect(event.sourceWebsiteId).toBe('source-website-5');
      expect(event.newWebsiteId).toBe('new-website-6');
      expect(event.newWebsiteName).toBe('Duplicated Website');
      expect(event.aggregateId).toBe('new-website-6');
    });

    it('should have correct eventType', () => {
      const event = new WebsiteDuplicatedEvent('source-1', 'new-2', 'Duplicated');
      expect(event.eventType).toBe('WebsiteDuplicated');
    });

    it('should serialize to JSON correctly', () => {
      const metadata = { duplicatedFields: ['xpaths', 'settings'] };
      const event = new WebsiteDuplicatedEvent(
        'source-website-5',
        'new-website-6',
        'Duplicated Website',
        metadata
      );
      const json = event.toJSON();

      expect(json.eventType).toBe('WebsiteDuplicated');
      expect(json.sourceWebsiteId).toBe('source-website-5');
      expect(json.newWebsiteId).toBe('new-website-6');
      expect(json.newWebsiteName).toBe('Duplicated Website');
      expect(json.aggregateId).toBe('new-website-6');
      expect(json.metadata).toEqual(metadata);
    });

    it('should work without metadata', () => {
      const event = new WebsiteDuplicatedEvent('source-1', 'new-2', 'Duplicated');
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('Base Event Properties', () => {
    it('should generate unique eventId for each event', () => {
      const event1 = new WebsiteCreatedEvent('w-1', 'Website 1', 'active');
      const event2 = new WebsiteCreatedEvent('w-2', 'Website 2', 'active');

      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should set occurredAt to current time', () => {
      const before = new Date();
      const event = new WebsiteCreatedEvent('w-1', 'Website', 'active');
      const after = new Date();

      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should include base event properties in toJSON', () => {
      const event = new WebsiteCreatedEvent('w-1', 'Website', 'active');
      const json = event.toJSON();

      expect(json.eventId).toBeDefined();
      expect(json.eventType).toBeDefined();
      expect(json.occurredAt).toBeDefined();
      expect(json.aggregateId).toBeDefined();
    });
  });
});
