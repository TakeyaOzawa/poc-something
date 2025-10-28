/**
 * Domain Layer: Retry Policy Service
 * Manages retry logic and policies for auto-fill operations
 * Business Rules: Retry decisions, wait time calculations, infinite retry detection
 */

import { RETRY_TYPE } from '@domain/constants/RetryType';

/**
 * Retry Policy Service
 * Encapsulates business rules for retry behavior
 *
 * Business Rules:
 * - Only RETRY_FROM_BEGINNING (10) should trigger retry
 * - Wait time should be randomized between min and max to distribute server load
 * - maxRetries = -1 indicates infinite retry mode
 */
export class RetryPolicyService {
  /**
   * Determine if a step should be retried based on retry type
   * Business Rule: Only retryType=10 (RETRY_FROM_BEGINNING) triggers retry
   *
   * @param retryType The retry type of the failed step
   * @returns true if step should be retried from beginning, false otherwise
   */
  shouldRetry(retryType: number): boolean {
    return retryType === RETRY_TYPE.RETRY_FROM_BEGINNING;
  }

  /**
   * Calculate wait time before retry with randomization
   * Business Rule: Randomize wait time between min and max to distribute load
   *
   * @param minSeconds Minimum wait time in seconds
   * @param maxSeconds Maximum wait time in seconds
   * @returns Wait time in seconds (randomized if min != max)
   */
  calculateWaitTime(minSeconds: number, maxSeconds: number): number {
    // If min == max, no need for randomization
    if (minSeconds === maxSeconds) {
      return minSeconds;
    }

    // Randomize between min and max (uniform distribution)
    return minSeconds + Math.random() * (maxSeconds - minSeconds);
  }

  /**
   * Determine if retry mode is infinite
   * Business Rule: maxRetries = -1 means infinite retry
   *
   * @param maxRetries Maximum number of retries (-1 for infinite)
   * @returns true if infinite retry mode, false otherwise
   */
  isInfiniteRetry(maxRetries: number): boolean {
    return maxRetries === -1;
  }

  /**
   * Check if more retries are allowed
   *
   * @param currentRetryCount Current retry attempt number (0-based)
   * @param maxRetries Maximum number of retries (-1 for infinite)
   * @returns true if more retries are allowed
   */
  canRetry(currentRetryCount: number, maxRetries: number): boolean {
    if (this.isInfiniteRetry(maxRetries)) {
      return true;
    }
    return currentRetryCount <= maxRetries;
  }

  /**
   * Format retry attempt information for logging
   *
   * @param retryCount Current retry count
   * @param maxRetries Maximum retries (-1 for infinite)
   * @returns Formatted retry info string
   */
  formatRetryInfo(retryCount: number, maxRetries: number): string {
    if (this.isInfiniteRetry(maxRetries)) {
      return `Retry attempt ${retryCount} (infinite mode)`;
    }
    return `Retry attempt ${retryCount}/${maxRetries}`;
  }

  /**
   * Round wait time for display (1 decimal place)
   *
   * @param waitTimeSeconds Wait time in seconds
   * @returns Rounded wait time
   */
  roundWaitTime(waitTimeSeconds: number): number {
    return Math.round(waitTimeSeconds * 10) / 10;
  }
}
