/**
 * Domain Layer: Auto-Fill Domain Events
 * Events related to auto-fill operations
 */

import { BaseDomainEvent } from '../DomainEvent';

/**
 * Event fired when auto-fill operation starts
 */
export class AutoFillStartedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'AutoFillStarted';
  }

  // eslint-disable-next-line max-params -- Domain events require multiple parameters to fully capture the event state and context
  constructor(
    public readonly tabId: number,
    public readonly websiteId: string,
    public readonly websiteName: string,
    public readonly totalSteps: number,
    metadata?: Record<string, unknown>
  ) {
    super(websiteId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      tabId: this.tabId,
      websiteId: this.websiteId,
      websiteName: this.websiteName,
      totalSteps: this.totalSteps,
    };
  }
}

/**
 * Event fired when auto-fill operation completes successfully
 */
export class AutoFillCompletedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'AutoFillCompleted';
  }

  // eslint-disable-next-line max-params -- Domain events require multiple parameters to fully capture the event state and context
  constructor(
    public readonly tabId: number,
    public readonly websiteId: string,
    public readonly websiteName: string,
    public readonly totalSteps: number,
    public readonly completedSteps: number,
    public readonly duration: number, // milliseconds
    metadata?: Record<string, unknown>
  ) {
    super(websiteId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      tabId: this.tabId,
      websiteId: this.websiteId,
      websiteName: this.websiteName,
      totalSteps: this.totalSteps,
      completedSteps: this.completedSteps,
      duration: this.duration,
    };
  }
}

/**
 * Event fired when auto-fill operation fails
 */
export class AutoFillFailedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'AutoFillFailed';
  }

  // eslint-disable-next-line max-params -- Domain events require multiple parameters to fully capture the event state and context
  constructor(
    public readonly tabId: number,
    public readonly websiteId: string,
    public readonly websiteName: string,
    public readonly error: string,
    public readonly completedSteps: number,
    public readonly totalSteps: number,
    public readonly duration: number, // milliseconds
    metadata?: Record<string, unknown>
  ) {
    super(websiteId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      tabId: this.tabId,
      websiteId: this.websiteId,
      websiteName: this.websiteName,
      error: this.error,
      completedSteps: this.completedSteps,
      totalSteps: this.totalSteps,
      duration: this.duration,
    };
  }
}

/**
 * Event fired when auto-fill operation is cancelled
 */
export class AutoFillCancelledEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'AutoFillCancelled';
  }

  // eslint-disable-next-line max-params -- Domain events require multiple parameters to fully capture the event state and context
  constructor(
    public readonly tabId: number,
    public readonly websiteId: string,
    public readonly websiteName: string,
    public readonly completedSteps: number,
    public readonly totalSteps: number,
    public readonly reason: string,
    metadata?: Record<string, unknown>
  ) {
    super(websiteId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      tabId: this.tabId,
      websiteId: this.websiteId,
      websiteName: this.websiteName,
      completedSteps: this.completedSteps,
      totalSteps: this.totalSteps,
      reason: this.reason,
    };
  }
}

/**
 * Event fired when auto-fill progress is updated
 */
export class AutoFillProgressUpdatedEvent extends BaseDomainEvent {
  get eventType(): string {
    return 'AutoFillProgressUpdated';
  }

  // eslint-disable-next-line max-params -- Domain events require multiple parameters to fully capture the event state and context
  constructor(
    public readonly tabId: number,
    public readonly websiteId: string,
    public readonly currentStep: number,
    public readonly totalSteps: number,
    public readonly currentAction: string,
    metadata?: Record<string, unknown>
  ) {
    super(websiteId, metadata);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      tabId: this.tabId,
      websiteId: this.websiteId,
      currentStep: this.currentStep,
      totalSteps: this.totalSteps,
      currentAction: this.currentAction,
    };
  }
}
