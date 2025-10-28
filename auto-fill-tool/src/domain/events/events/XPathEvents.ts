/**
 * Domain Layer: XPath Domain Events
 * Events related to XPath configuration operations
 */

import { BaseDomainEvent } from '../DomainEvent';

/**
 * Event fired when an XPath is created
 */
export class XPathCreatedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'XPathCreated';
  }

  // eslint-disable-next-line max-params -- Domain events require multiple parameters to fully capture the event state and context
  constructor(
    public readonly xpathId: string,
    public readonly websiteId: string,
    public readonly websiteName: string,
    public readonly xpathName: string,
    public readonly actionType: string,
    metadata?: Record<string, unknown>
  ) {
    super(xpathId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      xpathId: this.xpathId,
      websiteId: this.websiteId,
      websiteName: this.websiteName,
      xpathName: this.xpathName,
      actionType: this.actionType,
    };
  }
}

/**
 * Event fired when an XPath is updated
 */
export class XPathUpdatedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'XPathUpdated';
  }

  // eslint-disable-next-line max-params -- Domain events require multiple parameters to fully capture the event state and context
  constructor(
    public readonly xpathId: string,
    public readonly websiteId: string,
    public readonly xpathName: string,
    public readonly changes: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) {
    super(xpathId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      xpathId: this.xpathId,
      websiteId: this.websiteId,
      xpathName: this.xpathName,
      changes: this.changes,
    };
  }
}

/**
 * Event fired when an XPath is deleted
 */
export class XPathDeletedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'XPathDeleted';
  }

  constructor(
    public readonly xpathId: string,
    public readonly websiteId: string,
    public readonly xpathName: string,
    metadata?: Record<string, unknown>
  ) {
    super(xpathId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      xpathId: this.xpathId,
      websiteId: this.websiteId,
      xpathName: this.xpathName,
    };
  }
}

/**
 * Event fired when multiple XPaths are imported
 */
export class XPathsImportedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'XPathsImported';
  }

  constructor(
    public readonly websiteId: string,
    public readonly importedCount: number,
    public readonly source: string, // e.g., 'csv', 'json'
    metadata?: Record<string, unknown>
  ) {
    super(websiteId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      websiteId: this.websiteId,
      importedCount: this.importedCount,
      source: this.source,
    };
  }
}

/**
 * Event fired when XPaths are exported
 */
export class XPathsExportedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'XPathsExported';
  }

  constructor(
    public readonly websiteId: string,
    public readonly exportedCount: number,
    public readonly format: string, // e.g., 'csv', 'json'
    metadata?: Record<string, unknown>
  ) {
    super(websiteId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      websiteId: this.websiteId,
      exportedCount: this.exportedCount,
      format: this.format,
    };
  }
}
