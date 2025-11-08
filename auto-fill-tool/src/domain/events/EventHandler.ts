/**
 * Domain Layer: Event Handler
 * Interface for handling domain events
 */

import { DomainEvent } from './DomainEvent';
import { Observer, AsyncObserver } from '@domain/observers/Observer';

/**
 * Event handler interface
 * Implement this to create handlers for specific event types
 */
export interface EventHandler<T extends DomainEvent = DomainEvent> extends Observer<T> {
  /**
   * Handle the event (Observer pattern implementation)
   * @param event The domain event to handle
   * @returns Promise that resolves when handling is complete
   */
  handle(event: T): Promise<void> | void;

  /**
   * Observer pattern implementation
   * @param event The domain event to handle
   * @returns Promise that resolves when handling is complete
   */
  update(event: T): Promise<void> | void;

  /**
   * Optional: Specify which event types this handler can handle
   * If not specified, handler must be registered explicitly with event types
   */
  getSupportedEventTypes?(): string[];
}

/**
 * Async event handler (for operations that need to be awaited)
 */
export abstract class AsyncEventHandler<T extends DomainEvent = DomainEvent> 
  implements EventHandler<T>, AsyncObserver<T> {
  
  abstract handle(event: T): Promise<void>;

  /**
   * Observer pattern implementation (delegates to handle)
   */
  update(event: T): Promise<void> {
    return this.handle(event);
  }

  /**
   * AsyncObserver pattern implementation (delegates to handle)
   */
  updateAsync(event: T): Promise<void> {
    return this.handle(event);
  }

  getSupportedEventTypes?(): string[];
}

/**
 * Sync event handler (for simple, synchronous operations)
 */
export abstract class SyncEventHandler<T extends DomainEvent = DomainEvent>
  implements EventHandler<T> {
  
  abstract handle(event: T): void;

  /**
   * Observer pattern implementation (delegates to handle)
   */
  update(event: T): void {
    return this.handle(event);
  }

  getSupportedEventTypes?(): string[];
}
