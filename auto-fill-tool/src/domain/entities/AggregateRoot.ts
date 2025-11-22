/**
 * Domain Entity: Aggregate Root Base Class
 * Base class for all Aggregate Roots in the domain
 */

import { DomainEvent } from '@domain/events/DomainEvent';

/**
 * Abstract base class for Aggregate Roots
 * Provides common functionality for domain event management
 */
export abstract class AggregateRoot<T> {
  private domainEvents: DomainEvent[] = [];

  /**
   * Get the unique identifier of this aggregate
   */
  abstract getId(): T;

  /**
   * Add a domain event to be published
   */
  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  /**
   * Get all domain events and clear the list
   */
  public pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }

  /**
   * Get all domain events without clearing
   */
  public getDomainEvents(): ReadonlyArray<DomainEvent> {
    return this.domainEvents;
  }

  /**
   * Clear all domain events
   */
  public clearDomainEvents(): void {
    this.domainEvents = [];
  }

  /**
   * Check if this aggregate has any domain events
   */
  public hasDomainEvents(): boolean {
    return this.domainEvents.length > 0;
  }
}
