/**
 * Domain Layer: Sync Domain Events
 * Events related to data synchronization operations
 */

import { BaseDomainEvent } from '../DomainEvent';

/**
 * Event fired when sync operation starts
 */
export class SyncStartedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'SyncStarted';
  }

  constructor(
    public readonly configId: string,
    public readonly syncType: 'manual' | 'scheduled',
    public readonly direction: 'send' | 'receive' | 'bidirectional',
    metadata?: Record<string, unknown>
  ) {
    super(configId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      configId: this.configId,
      syncType: this.syncType,
      direction: this.direction,
    };
  }
}

/**
 * Event fired when sync operation completes successfully
 */
export class SyncCompletedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'SyncCompleted';
  }

  // eslint-disable-next-line max-params -- Domain events require multiple parameters to fully capture the event state and context
  constructor(
    public readonly configId: string,
    public readonly duration: number, // milliseconds
    public readonly itemsSynced: number,
    public readonly direction: 'send' | 'receive' | 'bidirectional',
    metadata?: Record<string, unknown>
  ) {
    super(configId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      configId: this.configId,
      duration: this.duration,
      itemsSynced: this.itemsSynced,
      direction: this.direction,
    };
  }
}

/**
 * Event fired when sync operation fails
 */
export class SyncFailedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'SyncFailed';
  }

  constructor(
    public readonly configId: string,
    public readonly error: string,
    public readonly phase: 'send' | 'receive' | 'validation',
    metadata?: Record<string, unknown>
  ) {
    super(configId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      configId: this.configId,
      error: this.error,
      phase: this.phase,
    };
  }
}

/**
 * Event fired when sync configuration is created
 */
export class SyncConfigCreatedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'SyncConfigCreated';
  }

  constructor(
    public readonly configId: string,
    public readonly configName: string,
    public readonly provider: string,
    metadata?: Record<string, unknown>
  ) {
    super(configId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      configId: this.configId,
      configName: this.configName,
      provider: this.provider,
    };
  }
}

/**
 * Event fired when sync configuration is updated
 */
export class SyncConfigUpdatedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'SyncConfigUpdated';
  }

  constructor(
    public readonly configId: string,
    public readonly changes: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) {
    super(configId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      configId: this.configId,
      changes: this.changes,
    };
  }
}

/**
 * Event fired when sync configuration is deleted
 */
export class SyncConfigDeletedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'SyncConfigDeleted';
  }

  constructor(
    public readonly configId: string,
    public readonly configName: string,
    metadata?: Record<string, unknown>
  ) {
    super(configId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      configId: this.configId,
      configName: this.configName,
    };
  }
}

/**
 * Event fired when data conflict is detected during sync
 */
export class SyncConflictDetectedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'SyncConflictDetected';
  }

  // eslint-disable-next-line max-params -- Domain events require multiple parameters to fully capture the event state and context
  constructor(
    public readonly configId: string,
    public readonly entityType: string, // e.g., 'website', 'xpath'
    public readonly entityId: string,
    public readonly conflictType: 'version' | 'concurrent_modification',
    metadata?: Record<string, unknown>
  ) {
    super(configId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      configId: this.configId,
      entityType: this.entityType,
      entityId: this.entityId,
      conflictType: this.conflictType,
    };
  }
}
