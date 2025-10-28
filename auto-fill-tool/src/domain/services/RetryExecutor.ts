/**
 * Domain Service: Retry Executor
 * Executes operations with retry logic based on retry policy
 */

import { RetryPolicy } from '@domain/entities/RetryPolicy';
import { Logger } from '@domain/types/logger.types';

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attemptsMade: number;
  totalDelayMs: number;
}

/**
 * Retry Executor Service
 * Executes async operations with configurable retry logic
 */
export class RetryExecutor {
  constructor(private logger: Logger) {}

  /**
   * Execute an async operation with retry logic
   *
   * @param operation The async operation to execute
   * @param retryPolicy The retry policy to use
   * @param operationName Name for logging purposes
   * @returns Retry result with success status and attempts made
   */
  // eslint-disable-next-line max-lines-per-function -- Implements retry loop with delay calculation, error handling, and detailed logging. The logic is cohesive and splitting would reduce clarity.
  async execute<T>(
    operation: () => Promise<T>,
    retryPolicy: RetryPolicy,
    operationName: string = 'operation'
  ): Promise<RetryResult<T>> {
    const MAX_RETRY_ATTEMPTS = 1000000; // Effectively unlimited, but avoids infinite loop
    let attemptNumber = 0;
    let totalDelayMs = 0;
    let lastError: Error | undefined;

    while (attemptNumber < MAX_RETRY_ATTEMPTS) {
      attemptNumber++;

      try {
        this.logger.debug(`Executing ${operationName} (attempt ${attemptNumber})`, {
          attemptNumber,
          maxAttempts: retryPolicy.getMaxAttempts(),
        });

        const result = await operation();

        this.logger.debug(`${operationName} succeeded`, {
          attemptNumber,
          totalDelayMs,
        });

        return {
          success: true,
          result,
          attemptsMade: attemptNumber,
          totalDelayMs,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        this.logger.warn(`${operationName} failed (attempt ${attemptNumber})`, {
          attemptNumber,
          error: lastError.message,
        });

        // Check if we should retry
        if (!retryPolicy.shouldRetry(lastError, attemptNumber)) {
          this.logger.error(`${operationName} exhausted all retries or error not retryable`, {
            attemptNumber,
            maxAttempts: retryPolicy.getMaxAttempts(),
            error: lastError.message,
          });

          return {
            success: false,
            error: lastError,
            attemptsMade: attemptNumber,
            totalDelayMs,
          };
        }

        // Calculate and apply delay
        const delayMs = retryPolicy.calculateDelay(attemptNumber);
        if (delayMs > 0) {
          this.logger.debug(`Waiting ${delayMs}ms before retry`, {
            attemptNumber,
            delayMs,
          });

          await this.sleep(delayMs);
          totalDelayMs += delayMs;
        }
      }
    }

    // Fallback: Should not reach here under normal circumstances
    // This handles the edge case where MAX_RETRY_ATTEMPTS is reached
    this.logger.error(`${operationName} reached maximum retry attempts`, {
      attemptNumber,
      maxAttempts: MAX_RETRY_ATTEMPTS,
    });

    return {
      success: false,
      error: lastError || new Error('Maximum retry attempts reached'),
      attemptsMade: attemptNumber,
      totalDelayMs,
    };
  }

  /**
   * Execute an async operation with retry logic, passing attempt number to the operation
   * Useful when the operation needs to know which attempt it is
   *
   * @param operation The async operation to execute (receives attempt number)
   * @param retryPolicy The retry policy to use
   * @param operationName Name for logging purposes
   * @returns Retry result with success status and attempts made
   */
  // eslint-disable-next-line max-lines-per-function -- Implements retry loop with attempt tracking, delay calculation, error handling, and detailed logging. The logic is cohesive and splitting would reduce clarity.
  async executeWithAttempt<T>(
    operation: (attemptNumber: number) => Promise<T>,
    retryPolicy: RetryPolicy,
    operationName: string = 'operation'
  ): Promise<RetryResult<T>> {
    const MAX_RETRY_ATTEMPTS = 1000000; // Effectively unlimited, but avoids infinite loop
    let attemptNumber = 0;
    let totalDelayMs = 0;
    let lastError: Error | undefined;

    while (attemptNumber < MAX_RETRY_ATTEMPTS) {
      attemptNumber++;

      try {
        this.logger.debug(`Executing ${operationName} (attempt ${attemptNumber})`, {
          attemptNumber,
          maxAttempts: retryPolicy.getMaxAttempts(),
        });

        const result = await operation(attemptNumber);

        this.logger.debug(`${operationName} succeeded`, {
          attemptNumber,
          totalDelayMs,
        });

        return {
          success: true,
          result,
          attemptsMade: attemptNumber,
          totalDelayMs,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        this.logger.warn(`${operationName} failed (attempt ${attemptNumber})`, {
          attemptNumber,
          error: lastError.message,
        });

        // Check if we should retry
        if (!retryPolicy.shouldRetry(lastError, attemptNumber)) {
          this.logger.error(`${operationName} exhausted all retries or error not retryable`, {
            attemptNumber,
            maxAttempts: retryPolicy.getMaxAttempts(),
            error: lastError.message,
          });

          return {
            success: false,
            error: lastError,
            attemptsMade: attemptNumber,
            totalDelayMs,
          };
        }

        // Calculate and apply delay
        const delayMs = retryPolicy.calculateDelay(attemptNumber);
        if (delayMs > 0) {
          this.logger.debug(`Waiting ${delayMs}ms before retry`, {
            attemptNumber,
            delayMs,
          });

          await this.sleep(delayMs);
          totalDelayMs += delayMs;
        }
      }
    }

    // Fallback: Should not reach here under normal circumstances
    // This handles the edge case where MAX_RETRY_ATTEMPTS is reached
    this.logger.error(`${operationName} reached maximum retry attempts`, {
      attemptNumber,
      maxAttempts: MAX_RETRY_ATTEMPTS,
    });

    return {
      success: false,
      error: lastError || new Error('Maximum retry attempts reached'),
      attemptsMade: attemptNumber,
      totalDelayMs,
    };
  }

  /**
   * Sleep for the specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
