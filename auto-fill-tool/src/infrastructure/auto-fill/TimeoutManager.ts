/**
 * Infrastructure Layer: Timeout Manager
 * Manages timeout logic for auto-fill step execution
 *
 * Extracted from ChromeAutoFillAdapter to improve separation of concerns.
 */

import { Logger } from '@domain/types/logger.types';

export interface TimeoutResult<T> {
  success: boolean;
  error?: string;
  result?: T;
}

export type CancellationChecker = (tabId: number) => boolean;

/**
 * TimeoutManager manages timeout and cancellation for async operations
 */
export class TimeoutManager {
  private readonly CANCELLATION_CHECK_INTERVAL_MS = 100;

  constructor(private logger: Logger) {}

  /**
   * Execute an operation with timeout and cancellation checks
   *
   * @param operation The async operation to execute
   * @param timeoutSeconds Timeout duration in seconds (0 or negative = no timeout)
   * @param tabId Tab ID for cancellation checking
   * @param stepNumber Step number for logging
   * @param cancellationChecker Function to check if operation is cancelled
   * @returns Promise that resolves to TimeoutResult
   */
  // eslint-disable-next-line max-params -- All 5 parameters are required for timeout management: operation (what to execute), timeoutSeconds (when to timeout), tabId (which tab for cancellation check), stepNumber (for logging), cancellationChecker (how to check cancellation). Grouping into object would obscure the distinct roles of timeout control vs cancellation control.
  async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutSeconds: number,
    tabId: number,
    stepNumber: number,
    cancellationChecker: CancellationChecker
  ): Promise<TimeoutResult<T>> {
    // If no timeout specified, execute without timeout
    if (timeoutSeconds <= 0) {
      try {
        const result = await operation();
        return {
          success: true,
          result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    // Execute with timeout and cancellation check
    const timeoutMs = timeoutSeconds * 1000;
    this.logger.debug(`Executing step ${stepNumber} with timeout of ${timeoutSeconds}s`);

    // Cancellation check promise
    const cancellationPromise = this.createCancellationPromise<T>(
      tabId,
      stepNumber,
      timeoutMs,
      cancellationChecker
    );

    // Timeout promise
    const timeoutPromise = this.createTimeoutPromise<T>(stepNumber, timeoutSeconds, timeoutMs);

    // Execution promise
    const executionPromise = this.wrapExecutionPromise(operation());

    return Promise.race([executionPromise, timeoutPromise, cancellationPromise]);
  }

  /**
   * Create a promise that checks for cancellation at regular intervals
   */
  private createCancellationPromise<T>(
    tabId: number,
    stepNumber: number,
    timeoutMs: number,
    cancellationChecker: CancellationChecker
  ): Promise<TimeoutResult<T>> {
    return new Promise<TimeoutResult<T>>((resolve) => {
      const checkInterval = setInterval(() => {
        if (cancellationChecker(tabId)) {
          clearInterval(checkInterval);
          this.logger.info(`Step ${stepNumber} cancelled by user during execution (with timeout)`);
          resolve({
            success: false,
            error: 'Auto-fill cancelled by user',
          });
        }
      }, this.CANCELLATION_CHECK_INTERVAL_MS);

      // Clean up interval when timeout is reached
      setTimeout(() => clearInterval(checkInterval), timeoutMs);
    });
  }

  /**
   * Create a promise that resolves when timeout is reached
   */
  private createTimeoutPromise<T>(
    stepNumber: number,
    timeoutSeconds: number,
    timeoutMs: number
  ): Promise<TimeoutResult<T>> {
    return new Promise<TimeoutResult<T>>((resolve) => {
      setTimeout(() => {
        resolve({
          success: false,
          error: `Step ${stepNumber} timed out after ${timeoutSeconds}s`,
        });
      }, timeoutMs);
    });
  }

  /**
   * Wrap the execution promise to convert result to TimeoutResult format
   */
  private async wrapExecutionPromise<T>(executionPromise: Promise<T>): Promise<TimeoutResult<T>> {
    try {
      const result = await executionPromise;
      return {
        success: true,
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Log timeout configuration
   */
  logTimeoutConfig(stepNumber: number, timeoutSeconds: number): void {
    if (timeoutSeconds > 0) {
      this.logger.debug(`Step ${stepNumber} will timeout after ${timeoutSeconds}s`);
    } else {
      this.logger.debug(`Step ${stepNumber} has no timeout limit`);
    }
  }
}
