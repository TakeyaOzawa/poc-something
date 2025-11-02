/**
 * Domain Layer: Domain Event
 * Base interface and types for domain events
 *
 * Domain events represent significant business occurrences
 * that other parts of the system may want to know about.
 */

/**
 * Base interface for all domain events
 */
export interface DomainEvent {
  /**
   * Unique identifier for the event instance
   */
  readonly eventId: string;

  /**
   * Type of the event (e.g., 'AutoFillCompleted', 'WebsiteCreated')
   */
  readonly eventType: string;

  /**
   * Timestamp when the event occurred
   */
  readonly occurredAt: Date;

  /**
   * Optional aggregate/entity ID related to this event
   */
  readonly aggregateId: string | undefined;

  /**
   * Optional metadata for additional context
   */
  readonly metadata: Record<string, unknown> | undefined;
}

/**
 * Base abstract class for domain events
 * Provides common implementation for all events
 */
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;

  constructor(
    public readonly aggregateId: string | undefined,
    public readonly metadata: Record<string, unknown> | undefined
  ) {
    this.eventId = this.generateEventId();
    this.occurredAt = new Date();
  }

  /**
   * Get the event type (must be implemented by subclasses)
   */
  abstract get eventType(): string;

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Convert event to a plain object for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      occurredAt: this.occurredAt.toISOString(),
      aggregateId: this.aggregateId,
      metadata: this.metadata,
    };
  }
}
