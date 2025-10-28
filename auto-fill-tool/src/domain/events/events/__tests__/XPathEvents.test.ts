/**
 * Unit Tests: XPath Domain Events
 */

import {
  XPathCreatedEvent,
  XPathUpdatedEvent,
  XPathDeletedEvent,
  XPathsImportedEvent,
  XPathsExportedEvent,
} from '../XPathEvents';

describe('XPathEvents', () => {
  describe('XPathCreatedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new XPathCreatedEvent(
        'xpath-1',
        'website-1',
        'Test Website',
        'Username Field',
        'input'
      );

      expect(event.xpathId).toBe('xpath-1');
      expect(event.websiteId).toBe('website-1');
      expect(event.websiteName).toBe('Test Website');
      expect(event.xpathName).toBe('Username Field');
      expect(event.actionType).toBe('input');
      expect(event.aggregateId).toBe('xpath-1');
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
    });

    it('should have correct eventType', () => {
      const event = new XPathCreatedEvent(
        'xpath-1',
        'website-1',
        'Test Website',
        'Username Field',
        'input'
      );
      expect(event.eventType).toBe('XPathCreated');
    });

    it('should serialize to JSON correctly', () => {
      const metadata = { source: 'test' };
      const event = new XPathCreatedEvent(
        'xpath-1',
        'website-1',
        'Test Website',
        'Username Field',
        'input',
        metadata
      );
      const json = event.toJSON();

      expect(json.eventId).toBe(event.eventId);
      expect(json.eventType).toBe('XPathCreated');
      expect(json.occurredAt).toBe(event.occurredAt.toISOString());
      expect(json.aggregateId).toBe('xpath-1');
      expect(json.xpathId).toBe('xpath-1');
      expect(json.websiteId).toBe('website-1');
      expect(json.websiteName).toBe('Test Website');
      expect(json.xpathName).toBe('Username Field');
      expect(json.actionType).toBe('input');
      expect(json.metadata).toEqual(metadata);
    });

    it('should handle metadata parameter', () => {
      const metadata = { userId: 'user-123', action: 'manual' };
      const event = new XPathCreatedEvent(
        'xpath-1',
        'website-1',
        'Test Website',
        'Username Field',
        'input',
        metadata
      );

      expect(event.metadata).toEqual(metadata);
    });

    it('should work without metadata', () => {
      const event = new XPathCreatedEvent(
        'xpath-1',
        'website-1',
        'Test Website',
        'Username Field',
        'input'
      );
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('XPathUpdatedEvent', () => {
    it('should create event with correct properties', () => {
      const changes = { xpathExpression: '//input[@id="new"]', actionType: 'click' };
      const event = new XPathUpdatedEvent('xpath-2', 'website-2', 'Updated XPath', changes);

      expect(event.xpathId).toBe('xpath-2');
      expect(event.websiteId).toBe('website-2');
      expect(event.xpathName).toBe('Updated XPath');
      expect(event.changes).toEqual(changes);
      expect(event.aggregateId).toBe('xpath-2');
    });

    it('should have correct eventType', () => {
      const event = new XPathUpdatedEvent('xpath-2', 'website-2', 'Updated XPath', {});
      expect(event.eventType).toBe('XPathUpdated');
    });

    it('should serialize to JSON correctly', () => {
      const changes = { xpathExpression: '//input[@id="new"]' };
      const metadata = { user: 'admin' };
      const event = new XPathUpdatedEvent(
        'xpath-2',
        'website-2',
        'Updated XPath',
        changes,
        metadata
      );
      const json = event.toJSON();

      expect(json.eventType).toBe('XPathUpdated');
      expect(json.xpathId).toBe('xpath-2');
      expect(json.websiteId).toBe('website-2');
      expect(json.xpathName).toBe('Updated XPath');
      expect(json.changes).toEqual(changes);
      expect(json.metadata).toEqual(metadata);
    });

    it('should handle empty changes object', () => {
      const event = new XPathUpdatedEvent('xpath-2', 'website-2', 'Updated XPath', {});
      expect(event.changes).toEqual({});
    });

    it('should work without metadata', () => {
      const event = new XPathUpdatedEvent('xpath-2', 'website-2', 'Updated XPath', {});
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('XPathDeletedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new XPathDeletedEvent('xpath-3', 'website-3', 'Deleted XPath');

      expect(event.xpathId).toBe('xpath-3');
      expect(event.websiteId).toBe('website-3');
      expect(event.xpathName).toBe('Deleted XPath');
      expect(event.aggregateId).toBe('xpath-3');
    });

    it('should have correct eventType', () => {
      const event = new XPathDeletedEvent('xpath-3', 'website-3', 'Deleted XPath');
      expect(event.eventType).toBe('XPathDeleted');
    });

    it('should serialize to JSON correctly', () => {
      const metadata = { reason: 'user request' };
      const event = new XPathDeletedEvent('xpath-3', 'website-3', 'Deleted XPath', metadata);
      const json = event.toJSON();

      expect(json.eventType).toBe('XPathDeleted');
      expect(json.xpathId).toBe('xpath-3');
      expect(json.websiteId).toBe('website-3');
      expect(json.xpathName).toBe('Deleted XPath');
      expect(json.metadata).toEqual(metadata);
    });

    it('should work without metadata', () => {
      const event = new XPathDeletedEvent('xpath-3', 'website-3', 'Deleted XPath');
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('XPathsImportedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new XPathsImportedEvent('website-4', 25, 'csv');

      expect(event.websiteId).toBe('website-4');
      expect(event.importedCount).toBe(25);
      expect(event.source).toBe('csv');
      expect(event.aggregateId).toBe('website-4');
    });

    it('should have correct eventType', () => {
      const event = new XPathsImportedEvent('website-4', 25, 'csv');
      expect(event.eventType).toBe('XPathsImported');
    });

    it('should serialize to JSON correctly', () => {
      const metadata = { importedBy: 'user-123', timestamp: Date.now() };
      const event = new XPathsImportedEvent('website-4', 25, 'csv', metadata);
      const json = event.toJSON();

      expect(json.eventType).toBe('XPathsImported');
      expect(json.websiteId).toBe('website-4');
      expect(json.importedCount).toBe(25);
      expect(json.source).toBe('csv');
      expect(json.metadata).toEqual(metadata);
    });

    it('should handle different source formats', () => {
      const csvEvent = new XPathsImportedEvent('website-1', 10, 'csv');
      const jsonEvent = new XPathsImportedEvent('website-2', 15, 'json');

      expect(csvEvent.source).toBe('csv');
      expect(jsonEvent.source).toBe('json');
    });

    it('should handle zero imported count', () => {
      const event = new XPathsImportedEvent('website-5', 0, 'csv');
      expect(event.importedCount).toBe(0);
    });

    it('should work without metadata', () => {
      const event = new XPathsImportedEvent('website-4', 25, 'csv');
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('XPathsExportedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new XPathsExportedEvent('website-5', 30, 'json');

      expect(event.websiteId).toBe('website-5');
      expect(event.exportedCount).toBe(30);
      expect(event.format).toBe('json');
      expect(event.aggregateId).toBe('website-5');
    });

    it('should have correct eventType', () => {
      const event = new XPathsExportedEvent('website-5', 30, 'json');
      expect(event.eventType).toBe('XPathsExported');
    });

    it('should serialize to JSON correctly', () => {
      const metadata = { exportedBy: 'admin', destination: 's3' };
      const event = new XPathsExportedEvent('website-5', 30, 'json', metadata);
      const json = event.toJSON();

      expect(json.eventType).toBe('XPathsExported');
      expect(json.websiteId).toBe('website-5');
      expect(json.exportedCount).toBe(30);
      expect(json.format).toBe('json');
      expect(json.metadata).toEqual(metadata);
    });

    it('should handle different export formats', () => {
      const csvEvent = new XPathsExportedEvent('website-1', 20, 'csv');
      const jsonEvent = new XPathsExportedEvent('website-2', 25, 'json');

      expect(csvEvent.format).toBe('csv');
      expect(jsonEvent.format).toBe('json');
    });

    it('should handle zero exported count', () => {
      const event = new XPathsExportedEvent('website-6', 0, 'json');
      expect(event.exportedCount).toBe(0);
    });

    it('should work without metadata', () => {
      const event = new XPathsExportedEvent('website-5', 30, 'json');
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('Base Event Properties', () => {
    it('should generate unique eventId for each event', () => {
      const event1 = new XPathCreatedEvent('x-1', 'w-1', 'Website 1', 'XPath 1', 'input');
      const event2 = new XPathCreatedEvent('x-2', 'w-2', 'Website 2', 'XPath 2', 'click');

      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should set occurredAt to current time', () => {
      const before = new Date();
      const event = new XPathCreatedEvent('x-1', 'w-1', 'Website', 'XPath', 'input');
      const after = new Date();

      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should include base event properties in toJSON', () => {
      const event = new XPathCreatedEvent('x-1', 'w-1', 'Website', 'XPath', 'input');
      const json = event.toJSON();

      expect(json.eventId).toBeDefined();
      expect(json.eventType).toBeDefined();
      expect(json.occurredAt).toBeDefined();
      expect(json.aggregateId).toBeDefined();
    });
  });
});
