/**
 * Domain Layer: Website Domain Events
 * Events related to website entity operations
 */

import { BaseDomainEvent } from '../DomainEvent';

/**
 * Event fired when a website is created
 */
export class WebsiteCreatedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'WebsiteCreated';
  }

  constructor(
    public readonly websiteId: string,
    public readonly websiteName: string,
    public readonly status: string,
    metadata?: Record<string, unknown>
  ) {
    super(websiteId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      websiteId: this.websiteId,
      websiteName: this.websiteName,
      status: this.status,
    };
  }
}

/**
 * Event fired when a website is updated
 */
export class WebsiteUpdatedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'WebsiteUpdated';
  }

  constructor(
    public readonly websiteId: string,
    public readonly websiteName: string,
    public readonly changes: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ) {
    super(websiteId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      websiteId: this.websiteId,
      websiteName: this.websiteName,
      changes: this.changes,
    };
  }
}

/**
 * Event fired when a website is deleted
 */
export class WebsiteDeletedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'WebsiteDeleted';
  }

  constructor(
    public readonly websiteId: string,
    public readonly websiteName: string,
    metadata?: Record<string, unknown>
  ) {
    super(websiteId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      websiteId: this.websiteId,
      websiteName: this.websiteName,
    };
  }
}

/**
 * Event fired when a website's status changes
 */
export class WebsiteStatusChangedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'WebsiteStatusChanged';
  }

  // eslint-disable-next-line max-params -- Domain events require multiple parameters to fully capture the event state and context
  constructor(
    public readonly websiteId: string,
    public readonly websiteName: string,
    public readonly oldStatus: string,
    public readonly newStatus: string,
    metadata?: Record<string, unknown>
  ) {
    super(websiteId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      websiteId: this.websiteId,
      websiteName: this.websiteName,
      oldStatus: this.oldStatus,
      newStatus: this.newStatus,
    };
  }
}

/**
 * Event fired when a website is duplicated
 */
export class WebsiteDuplicatedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'WebsiteDuplicated';
  }

  constructor(
    public readonly sourceWebsiteId: string,
    public readonly newWebsiteId: string,
    public readonly newWebsiteName: string,
    metadata?: Record<string, unknown>
  ) {
    super(newWebsiteId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      sourceWebsiteId: this.sourceWebsiteId,
      newWebsiteId: this.newWebsiteId,
      newWebsiteName: this.newWebsiteName,
    };
  }
}
