/**
 * Unit Tests: Sync Domain Events
 */

import {
  SyncStartedEvent,
  SyncCompletedEvent,
  SyncFailedEvent,
  SyncConfigCreatedEvent,
  SyncConfigUpdatedEvent,
  SyncConfigDeletedEvent,
  SyncConflictDetectedEvent,
} from '../SyncEvents';

describe('SyncEvents', () => {
  describe('SyncStartedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new SyncStartedEvent('config-1', 'manual', 'send');

      expect(event.configId).toBe('config-1');
      expect(event.syncType).toBe('manual');
      expect(event.direction).toBe('send');
      expect(event.aggregateId).toBe('config-1');
      expect(event.eventId).toBeDefined();
      expect(event.occurredAt).toBeInstanceOf(Date);
    });

    it('should have correct eventType', () => {
      const event = new SyncStartedEvent('config-1', 'manual', 'send');
      expect(event.eventType).toBe('SyncStarted');
    });

    it('should serialize to JSON correctly', () => {
      const metadata = { source: 'test' };
      const event = new SyncStartedEvent('config-1', 'scheduled', 'bidirectional', metadata);
      const json = event.toJSON();

      expect(json.eventId).toBe(event.eventId);
      expect(json.eventType).toBe('SyncStarted');
      expect(json.occurredAt).toBe(event.occurredAt.toISOString());
      expect(json.aggregateId).toBe('config-1');
      expect(json.configId).toBe('config-1');
      expect(json.syncType).toBe('scheduled');
      expect(json.direction).toBe('bidirectional');
      expect(json.metadata).toEqual(metadata);
    });

    it('should handle different sync types', () => {
      const manualEvent = new SyncStartedEvent('config-1', 'manual', 'send');
      const scheduledEvent = new SyncStartedEvent('config-2', 'scheduled', 'receive');

      expect(manualEvent.syncType).toBe('manual');
      expect(scheduledEvent.syncType).toBe('scheduled');
    });

    it('should handle different directions', () => {
      const sendEvent = new SyncStartedEvent('config-1', 'manual', 'send');
      const receiveEvent = new SyncStartedEvent('config-2', 'manual', 'receive');
      const bidirectionalEvent = new SyncStartedEvent('config-3', 'manual', 'bidirectional');

      expect(sendEvent.direction).toBe('send');
      expect(receiveEvent.direction).toBe('receive');
      expect(bidirectionalEvent.direction).toBe('bidirectional');
    });

    it('should work without metadata', () => {
      const event = new SyncStartedEvent('config-1', 'manual', 'send');
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('SyncCompletedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new SyncCompletedEvent('config-2', 5000, 42, 'send');

      expect(event.configId).toBe('config-2');
      expect(event.duration).toBe(5000);
      expect(event.itemsSynced).toBe(42);
      expect(event.direction).toBe('send');
      expect(event.aggregateId).toBe('config-2');
    });

    it('should have correct eventType', () => {
      const event = new SyncCompletedEvent('config-2', 5000, 42, 'send');
      expect(event.eventType).toBe('SyncCompleted');
    });

    it('should serialize to JSON correctly', () => {
      const metadata = { user: 'admin' };
      const event = new SyncCompletedEvent('config-2', 5000, 42, 'receive', metadata);
      const json = event.toJSON();

      expect(json.eventType).toBe('SyncCompleted');
      expect(json.configId).toBe('config-2');
      expect(json.duration).toBe(5000);
      expect(json.itemsSynced).toBe(42);
      expect(json.direction).toBe('receive');
      expect(json.metadata).toEqual(metadata);
    });

    it('should handle zero duration', () => {
      const event = new SyncCompletedEvent('config-2', 0, 10, 'send');
      expect(event.duration).toBe(0);
    });

    it('should handle zero items synced', () => {
      const event = new SyncCompletedEvent('config-2', 1000, 0, 'send');
      expect(event.itemsSynced).toBe(0);
    });

    it('should work without metadata', () => {
      const event = new SyncCompletedEvent('config-2', 5000, 42, 'send');
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('SyncFailedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new SyncFailedEvent('config-3', 'Network timeout', 'send');

      expect(event.configId).toBe('config-3');
      expect(event.error).toBe('Network timeout');
      expect(event.phase).toBe('send');
      expect(event.aggregateId).toBe('config-3');
    });

    it('should have correct eventType', () => {
      const event = new SyncFailedEvent('config-3', 'Network timeout', 'send');
      expect(event.eventType).toBe('SyncFailed');
    });

    it('should serialize to JSON correctly', () => {
      const metadata = { reason: 'timeout' };
      const event = new SyncFailedEvent('config-3', 'Network timeout', 'receive', metadata);
      const json = event.toJSON();

      expect(json.eventType).toBe('SyncFailed');
      expect(json.configId).toBe('config-3');
      expect(json.error).toBe('Network timeout');
      expect(json.phase).toBe('receive');
      expect(json.metadata).toEqual(metadata);
    });

    it('should handle different failure phases', () => {
      const sendEvent = new SyncFailedEvent('config-1', 'Error', 'send');
      const receiveEvent = new SyncFailedEvent('config-2', 'Error', 'receive');
      const validationEvent = new SyncFailedEvent('config-3', 'Error', 'validation');

      expect(sendEvent.phase).toBe('send');
      expect(receiveEvent.phase).toBe('receive');
      expect(validationEvent.phase).toBe('validation');
    });

    it('should work without metadata', () => {
      const event = new SyncFailedEvent('config-3', 'Network timeout', 'send');
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('SyncConfigCreatedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new SyncConfigCreatedEvent('config-4', 'My Sync Config', 'google-drive');

      expect(event.configId).toBe('config-4');
      expect(event.configName).toBe('My Sync Config');
      expect(event.provider).toBe('google-drive');
      expect(event.aggregateId).toBe('config-4');
    });

    it('should have correct eventType', () => {
      const event = new SyncConfigCreatedEvent('config-4', 'My Sync Config', 'google-drive');
      expect(event.eventType).toBe('SyncConfigCreated');
    });

    it('should serialize to JSON correctly', () => {
      const metadata = { userId: 'user-123' };
      const event = new SyncConfigCreatedEvent('config-4', 'My Sync Config', 'dropbox', metadata);
      const json = event.toJSON();

      expect(json.eventType).toBe('SyncConfigCreated');
      expect(json.configId).toBe('config-4');
      expect(json.configName).toBe('My Sync Config');
      expect(json.provider).toBe('dropbox');
      expect(json.metadata).toEqual(metadata);
    });

    it('should handle different providers', () => {
      const googleEvent = new SyncConfigCreatedEvent('config-1', 'Config 1', 'google-drive');
      const dropboxEvent = new SyncConfigCreatedEvent('config-2', 'Config 2', 'dropbox');
      const s3Event = new SyncConfigCreatedEvent('config-3', 'Config 3', 's3');

      expect(googleEvent.provider).toBe('google-drive');
      expect(dropboxEvent.provider).toBe('dropbox');
      expect(s3Event.provider).toBe('s3');
    });

    it('should work without metadata', () => {
      const event = new SyncConfigCreatedEvent('config-4', 'My Sync Config', 'google-drive');
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('SyncConfigUpdatedEvent', () => {
    it('should create event with correct properties', () => {
      const changes = { provider: 'dropbox', enabled: true };
      const event = new SyncConfigUpdatedEvent('config-5', changes);

      expect(event.configId).toBe('config-5');
      expect(event.changes).toEqual(changes);
      expect(event.aggregateId).toBe('config-5');
    });

    it('should have correct eventType', () => {
      const event = new SyncConfigUpdatedEvent('config-5', {});
      expect(event.eventType).toBe('SyncConfigUpdated');
    });

    it('should serialize to JSON correctly', () => {
      const changes = { provider: 'dropbox' };
      const metadata = { user: 'admin' };
      const event = new SyncConfigUpdatedEvent('config-5', changes, metadata);
      const json = event.toJSON();

      expect(json.eventType).toBe('SyncConfigUpdated');
      expect(json.configId).toBe('config-5');
      expect(json.changes).toEqual(changes);
      expect(json.metadata).toEqual(metadata);
    });

    it('should handle empty changes object', () => {
      const event = new SyncConfigUpdatedEvent('config-5', {});
      expect(event.changes).toEqual({});
    });

    it('should work without metadata', () => {
      const event = new SyncConfigUpdatedEvent('config-5', {});
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('SyncConfigDeletedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new SyncConfigDeletedEvent('config-6', 'Deleted Config');

      expect(event.configId).toBe('config-6');
      expect(event.configName).toBe('Deleted Config');
      expect(event.aggregateId).toBe('config-6');
    });

    it('should have correct eventType', () => {
      const event = new SyncConfigDeletedEvent('config-6', 'Deleted Config');
      expect(event.eventType).toBe('SyncConfigDeleted');
    });

    it('should serialize to JSON correctly', () => {
      const metadata = { reason: 'user request' };
      const event = new SyncConfigDeletedEvent('config-6', 'Deleted Config', metadata);
      const json = event.toJSON();

      expect(json.eventType).toBe('SyncConfigDeleted');
      expect(json.configId).toBe('config-6');
      expect(json.configName).toBe('Deleted Config');
      expect(json.metadata).toEqual(metadata);
    });

    it('should work without metadata', () => {
      const event = new SyncConfigDeletedEvent('config-6', 'Deleted Config');
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('SyncConflictDetectedEvent', () => {
    it('should create event with correct properties', () => {
      const event = new SyncConflictDetectedEvent('config-7', 'website', 'entity-123', 'version');

      expect(event.configId).toBe('config-7');
      expect(event.entityType).toBe('website');
      expect(event.entityId).toBe('entity-123');
      expect(event.conflictType).toBe('version');
      expect(event.aggregateId).toBe('config-7');
    });

    it('should have correct eventType', () => {
      const event = new SyncConflictDetectedEvent('config-7', 'xpath', 'entity-123', 'version');
      expect(event.eventType).toBe('SyncConflictDetected');
    });

    it('should serialize to JSON correctly', () => {
      const metadata = { resolvedBy: 'user' };
      const event = new SyncConflictDetectedEvent(
        'config-7',
        'website',
        'entity-123',
        'concurrent_modification',
        metadata
      );
      const json = event.toJSON();

      expect(json.eventType).toBe('SyncConflictDetected');
      expect(json.configId).toBe('config-7');
      expect(json.entityType).toBe('website');
      expect(json.entityId).toBe('entity-123');
      expect(json.conflictType).toBe('concurrent_modification');
      expect(json.metadata).toEqual(metadata);
    });

    it('should handle different entity types', () => {
      const websiteEvent = new SyncConflictDetectedEvent('c-1', 'website', 'e-1', 'version');
      const xpathEvent = new SyncConflictDetectedEvent('c-2', 'xpath', 'e-2', 'version');

      expect(websiteEvent.entityType).toBe('website');
      expect(xpathEvent.entityType).toBe('xpath');
    });

    it('should handle different conflict types', () => {
      const versionEvent = new SyncConflictDetectedEvent('c-1', 'website', 'e-1', 'version');
      const concurrentEvent = new SyncConflictDetectedEvent(
        'c-2',
        'xpath',
        'e-2',
        'concurrent_modification'
      );

      expect(versionEvent.conflictType).toBe('version');
      expect(concurrentEvent.conflictType).toBe('concurrent_modification');
    });

    it('should work without metadata', () => {
      const event = new SyncConflictDetectedEvent('config-7', 'website', 'entity-123', 'version');
      expect(event.metadata).toBeUndefined();
    });
  });

  describe('Base Event Properties', () => {
    it('should generate unique eventId for each event', () => {
      const event1 = new SyncStartedEvent('c-1', 'manual', 'send');
      const event2 = new SyncStartedEvent('c-2', 'manual', 'send');

      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should set occurredAt to current time', () => {
      const before = new Date();
      const event = new SyncStartedEvent('c-1', 'manual', 'send');
      const after = new Date();

      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should include base event properties in toJSON', () => {
      const event = new SyncStartedEvent('c-1', 'manual', 'send');
      const json = event.toJSON();

      expect(json.eventId).toBeDefined();
      expect(json.eventType).toBeDefined();
      expect(json.occurredAt).toBeDefined();
      expect(json.aggregateId).toBeDefined();
    });
  });
});
