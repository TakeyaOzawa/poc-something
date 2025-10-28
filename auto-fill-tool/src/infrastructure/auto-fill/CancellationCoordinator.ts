/**
 * Infrastructure Layer: Cancellation Coordinator
 * Manages cancellation state for auto-fill operations
 *
 * Extracted from ChromeAutoFillAdapter to improve separation of concerns.
 */

import { Logger } from '@domain/types/logger.types';

/**
 * CancellationCoordinator manages cancellation flags and checks for auto-fill operations
 */
export class CancellationCoordinator {
  // Track cancellation state by tabId (shared across all instances)
  private static cancellationFlags: Map<number, boolean> = new Map();

  constructor(private logger: Logger) {}

  /**
   * Request cancellation of auto-fill for a specific tab
   * This is a static method that can be called from anywhere
   */
  public static requestCancellation(tabId: number): void {
    CancellationCoordinator.cancellationFlags.set(tabId, true);
  }

  /**
   * Clear cancellation flag for a specific tab
   * Call this at the start of execution or after handling cancellation
   */
  clearCancellationFlag(tabId: number): void {
    CancellationCoordinator.cancellationFlags.delete(tabId);
    this.logger.debug(`Cancellation flag cleared for tab ${tabId}`);
  }

  /**
   * Check if cancellation was requested for a specific tab
   */
  isCancelled(tabId: number): boolean {
    return CancellationCoordinator.cancellationFlags.get(tabId) === true;
  }

  /**
   * Check cancellation and log if cancelled
   * Returns true if cancelled, false otherwise
   */
  checkAndLogCancellation(tabId: number, context: string): boolean {
    if (this.isCancelled(tabId)) {
      this.logger.info(`Auto-fill cancelled by user ${context}`);
      return true;
    }
    return false;
  }

  /**
   * Handle cancellation by logging and clearing flag
   * Returns an error result object
   */
  handleCancellation<T extends { success: boolean; error?: string }>(
    tabId: number,
    context: string,
    errorFactory: (message: string) => T
  ): T {
    this.logger.info(`Auto-fill cancelled by user ${context}`);
    this.clearCancellationFlag(tabId);
    return errorFactory('Auto-fill cancelled by user');
  }

  /**
   * Execute a cancellable sleep with periodic checks
   * Returns true if cancelled, false if completed normally
   */
  async sleepWithCancellationCheck(tabId: number, ms: number): Promise<boolean> {
    const checkInterval = 100; // Check every 100ms
    const iterations = Math.ceil(ms / checkInterval);

    for (let i = 0; i < iterations; i++) {
      if (this.isCancelled(tabId)) {
        this.logger.debug('Sleep interrupted by cancellation');
        return true; // Cancelled
      }

      const remainingTime = ms - i * checkInterval;
      const sleepTime = Math.min(checkInterval, remainingTime);

      await new Promise((resolve) => setTimeout(resolve, sleepTime));
    }

    return false; // Not cancelled (completed normally)
  }

  /**
   * Initialize execution by clearing any existing cancellation flag
   */
  initializeExecution(tabId: number): void {
    this.clearCancellationFlag(tabId);
    this.logger.debug(`Initialized execution for tab ${tabId}, cancellation flag cleared`);
  }

  /**
   * Check if cancelled at the start of a retry iteration
   * Clears flag and returns error result if cancelled
   */
  checkCancellationAtRetryStart<T extends { success: boolean; error?: string }>(
    tabId: number,
    errorFactory: (message: string) => T
  ): T | null {
    if (this.isCancelled(tabId)) {
      this.logger.info('Auto-fill cancelled by user during retry loop');
      this.clearCancellationFlag(tabId);
      return errorFactory('Auto-fill cancelled by user');
    }
    return null;
  }

  /**
   * Check if cancelled at a specific step
   * Clears flag and returns error result if cancelled
   */
  checkCancellationAtStep<T extends { success: boolean; error?: string; failedStep?: number }>(
    tabId: number,
    stepNumber: number,
    errorFactory: (message: string, failedStep: number) => T
  ): T | null {
    if (this.isCancelled(tabId)) {
      this.logger.info(`Auto-fill cancelled by user at step ${stepNumber}`);
      this.clearCancellationFlag(tabId);
      return errorFactory('Auto-fill cancelled by user', stepNumber);
    }
    return null;
  }

  /**
   * Check if cancelled during wait after a step
   * Clears flag and returns error result if cancelled
   */
  checkCancellationDuringWait<T extends { success: boolean; error?: string; failedStep?: number }>(
    tabId: number,
    stepNumber: number,
    cancelled: boolean,
    errorFactory: (message: string, failedStep: number) => T
  ): T | null {
    if (cancelled) {
      this.logger.info(`Auto-fill cancelled by user during wait after step ${stepNumber}`);
      this.clearCancellationFlag(tabId);
      return errorFactory('Auto-fill cancelled by user', stepNumber);
    }
    return null;
  }
}
