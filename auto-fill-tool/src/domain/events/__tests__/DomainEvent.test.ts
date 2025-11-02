/**
 * Tests for DomainEvent base class and implementations
 */

import { BaseDomainEvent } from '../DomainEvent';
import { IdGenerator } from '@domain/types/id-generator.types';
import {
  AutoFillStartedEvent,
  AutoFillCompletedEvent,
  AutoFillFailedEvent,
  AutoFillCancelledEvent,
  AutoFillProgressUpdatedEvent,
} from '../events/AutoFillEvents';
import {
  WebsiteCreatedEvent,
  WebsiteUpdatedEvent,
  WebsiteDeletedEvent,
  WebsiteStatusChangedEvent,
  WebsiteDuplicatedEvent,
} from '../events/WebsiteEvents';
import {
  XPathCreatedEvent,
  XPathUpdatedEvent,
  XPathDeletedEvent,
  XPathsImportedEvent,
  XPathsExportedEvent,
} from '../events/XPathEvents';
import {
  SyncStartedEvent,
  SyncCompletedEvent,
  SyncFailedEvent,
  SyncConfigCreatedEvent,
  SyncConfigUpdatedEvent,
  SyncConfigDeletedEvent,
  SyncConflictDetectedEvent,
} from '../events/SyncEvents';

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

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('BaseDomainEvent', () => {
  describe('constructor', () => {
    it('should generate unique event ID', () => {
      const event1 = new TestEvent('data1');
      const event2 = new TestEvent('data2');

      expect(event1.eventId).toBeDefined();
      expect(event2.eventId).toBeDefined();
      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should set occurredAt timestamp', () => {
      const before = new Date();
      const event = new TestEvent('data');
      const after = new Date();

      expect(event.occurredAt).toBeInstanceOf(Date);
      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should accept aggregateId', () => {
      const event = new TestEvent('data', 'aggregate-123');
      expect(event.aggregateId).toBe('aggregate-123');
    });

    it('should accept metadata', () => {
      const metadata = { userId: 'user-1', source: 'test' };
      const event = new TestEvent('data', undefined, metadata);
      expect(event.metadata).toEqual(metadata);
    });
  });

  describe('toJSON', () => {
    it('should serialize event to JSON', () => {
      const event = new TestEvent('data', 'aggregate-123', { key: 'value' });
      const json = event.toJSON();

      expect(json).toEqual({
        eventId: event.eventId,
        eventType: 'TestEvent',
        occurredAt: event.occurredAt.toISOString(),
        aggregateId: 'aggregate-123',
        metadata: { key: 'value' },
      });
    });
  });
});

describe('AutoFillEvents', () => {
  describe('AutoFillStartedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new AutoFillStartedEvent(123, 'website-1', 'Test Website', 10);

      expect(event.eventType).toBe('AutoFillStarted');
      expect(event.tabId).toBe(123);
      expect(event.websiteId).toBe('website-1');
      expect(event.websiteName).toBe('Test Website');
      expect(event.totalSteps).toBe(10);
      expect(event.aggregateId).toBe('website-1');
    });

    it('should serialize correctly', () => {
      const event = new AutoFillStartedEvent(123, 'website-1', 'Test Website', 10);
      const json = event.toJSON();

      expect(json).toMatchObject({
        eventType: 'AutoFillStarted',
        tabId: 123,
        websiteId: 'website-1',
        websiteName: 'Test Website',
        totalSteps: 10,
      });
    });
  });

  describe('AutoFillCompletedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new AutoFillCompletedEvent(123, 'website-1', 'Test', 10, 10, 5000);

      expect(event.eventType).toBe('AutoFillCompleted');
      expect(event.completedSteps).toBe(10);
      expect(event.duration).toBe(5000);
    });
  });

  describe('AutoFillFailedEvent', () => {
    it('should create event with error information', () => {
      const event = new AutoFillFailedEvent(
        123,
        'website-1',
        'Test',
        'Element not found',
        5,
        10,
        3000
      );

      expect(event.eventType).toBe('AutoFillFailed');
      expect(event.error).toBe('Element not found');
      expect(event.completedSteps).toBe(5);
    });
  });

  describe('AutoFillCancelledEvent', () => {
    it('should create event with cancellation reason', () => {
      const event = new AutoFillCancelledEvent(123, 'website-1', 'Test', 3, 10, 'User cancelled');

      expect(event.eventType).toBe('AutoFillCancelled');
      expect(event.reason).toBe('User cancelled');
    });
  });

  describe('AutoFillProgressUpdatedEvent', () => {
    it('should create event with progress information', () => {
      const event = new AutoFillProgressUpdatedEvent(123, 'website-1', 5, 10, 'Filling input');

      expect(event.eventType).toBe('AutoFillProgressUpdated');
      expect(event.currentStep).toBe(5);
      expect(event.currentAction).toBe('Filling input');
    });
  });
});

describe('WebsiteEvents', () => {
  describe('WebsiteCreatedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new WebsiteCreatedEvent('website-1', 'New Website', 'enabled');

      expect(event.eventType).toBe('WebsiteCreated');
      expect(event.websiteId).toBe('website-1');
      expect(event.websiteName).toBe('New Website');
      expect(event.status).toBe('enabled');
    });
  });

  describe('WebsiteUpdatedEvent', () => {
    it('should create event with changes', () => {
      const changes = { name: 'Updated Name', status: 'disabled' };
      const event = new WebsiteUpdatedEvent('website-1', 'Website', changes);

      expect(event.eventType).toBe('WebsiteUpdated');
      expect(event.changes).toEqual(changes);
    });
  });

  describe('WebsiteDeletedEvent', () => {
    it('should create event for deletion', () => {
      const event = new WebsiteDeletedEvent('website-1', 'Deleted Website');

      expect(event.eventType).toBe('WebsiteDeleted');
      expect(event.websiteId).toBe('website-1');
    });
  });

  describe('WebsiteStatusChangedEvent', () => {
    it('should create event with old and new status', () => {
      const event = new WebsiteStatusChangedEvent('website-1', 'Website', 'enabled', 'disabled');

      expect(event.eventType).toBe('WebsiteStatusChanged');
      expect(event.oldStatus).toBe('enabled');
      expect(event.newStatus).toBe('disabled');
    });
  });

  describe('WebsiteDuplicatedEvent', () => {
    it('should create event with source and new website info', () => {
      const event = new WebsiteDuplicatedEvent('website-1', 'website-2', 'Copy of Website');

      expect(event.eventType).toBe('WebsiteDuplicated');
      expect(event.sourceWebsiteId).toBe('website-1');
      expect(event.newWebsiteId).toBe('website-2');
    });
  });
});

describe('XPathEvents', () => {
  describe('XPathCreatedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new XPathCreatedEvent(
        'xpath-1',
        'website-1',
        'Test Website',
        'Input Field',
        'input'
      );

      expect(event.eventType).toBe('XPathCreated');
      expect(event.xpathId).toBe('xpath-1');
      expect(event.actionType).toBe('input');
    });
  });

  describe('XPathUpdatedEvent', () => {
    it('should create event with changes', () => {
      const changes = { xpath: '//*[@id="new"]' };
      const event = new XPathUpdatedEvent('xpath-1', 'website-1', 'Field', changes);

      expect(event.eventType).toBe('XPathUpdated');
      expect(event.changes).toEqual(changes);
    });
  });

  describe('XPathDeletedEvent', () => {
    it('should create event for deletion', () => {
      const event = new XPathDeletedEvent('xpath-1', 'website-1', 'Field');

      expect(event.eventType).toBe('XPathDeleted');
    });
  });

  describe('XPathsImportedEvent', () => {
    it('should create event with import information', () => {
      const event = new XPathsImportedEvent('website-1', 25, 'csv');

      expect(event.eventType).toBe('XPathsImported');
      expect(event.importedCount).toBe(25);
      expect(event.source).toBe('csv');
    });
  });

  describe('XPathsExportedEvent', () => {
    it('should create event with export information', () => {
      const event = new XPathsExportedEvent('website-1', 15, 'json');

      expect(event.eventType).toBe('XPathsExported');
      expect(event.exportedCount).toBe(15);
      expect(event.format).toBe('json');
    });
  });
});

describe('SyncEvents', () => {
  describe('SyncStartedEvent', () => {
    it('should create event with sync information', () => {
      const event = new SyncStartedEvent('config-1', 'manual', 'bidirectional');

      expect(event.eventType).toBe('SyncStarted');
      expect(event.syncType).toBe('manual');
      expect(event.direction).toBe('bidirectional');
    });
  });

  describe('SyncCompletedEvent', () => {
    it('should create event with completion information', () => {
      const event = new SyncCompletedEvent('config-1', 5000, 42, 'send');

      expect(event.eventType).toBe('SyncCompleted');
      expect(event.duration).toBe(5000);
      expect(event.itemsSynced).toBe(42);
    });
  });

  describe('SyncFailedEvent', () => {
    it('should create event with error information', () => {
      const event = new SyncFailedEvent('config-1', 'Network error', 'send');

      expect(event.eventType).toBe('SyncFailed');
      expect(event.error).toBe('Network error');
      expect(event.phase).toBe('send');
    });
  });

  describe('SyncConfigCreatedEvent', () => {
    it('should create event for config creation', () => {
      const event = new SyncConfigCreatedEvent('config-1', 'My Sync', 'google-drive');

      expect(event.eventType).toBe('SyncConfigCreated');
      expect(event.provider).toBe('google-drive');
    });
  });

  describe('SyncConfigUpdatedEvent', () => {
    it('should create event with config changes', () => {
      const changes = { schedule: '0 0 * * *' };
      const event = new SyncConfigUpdatedEvent('config-1', changes);

      expect(event.eventType).toBe('SyncConfigUpdated');
      expect(event.changes).toEqual(changes);
    });
  });

  describe('SyncConfigDeletedEvent', () => {
    it('should create event for config deletion', () => {
      const event = new SyncConfigDeletedEvent('config-1', 'My Sync');

      expect(event.eventType).toBe('SyncConfigDeleted');
    });
  });

  describe('SyncConflictDetectedEvent', () => {
    it('should create event with conflict information', () => {
      const event = new SyncConflictDetectedEvent(
        'config-1',
        'website',
        'website-1',
        'concurrent_modification'
      );

      expect(event.eventType).toBe('SyncConflictDetected');
      expect(event.entityType).toBe('website');
      expect(event.conflictType).toBe('concurrent_modification');
    });
  });
});
