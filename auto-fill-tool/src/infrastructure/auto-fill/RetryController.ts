/**
 * Infrastructure Layer: Retry Controller
 * Manages retry logic for auto-fill execution
 *
 * Extracted from ChromeAutoFillAdapter to improve separation of concerns.
 */

import { Logger } from '@domain/types/logger.types';
import { XPathData } from '@domain/entities/XPathCollection';
import { RetryPolicyService } from '@domain/services/RetryPolicyService';
import { AutoFillResult } from '@domain/types/auto-fill-port.types';

export interface RetryConfig {
  min: number;
  max: number;
  maxRetries: number;
  isInfinite: boolean;
}

/**
 * RetryController manages retry logic for auto-fill operations
 */
export class RetryController {
  private retryPolicyService: RetryPolicyService;

  constructor(private logger: Logger) {
    this.retryPolicyService = new RetryPolicyService();
  }

  /**
   * Determine if a failed step should trigger a retry
   */
  shouldRetryStep(xpaths: XPathData[], failedStep?: number): boolean {
    const failedXPath = xpaths.find((x) => x.executionOrder === failedStep);
    this.logger.debug(`Failed step retry_type: ${failedXPath?.retryType}`);

    // Delegate business logic to domain service
    const shouldRetry = failedXPath
      ? this.retryPolicyService.shouldRetry(failedXPath.retryType)
      : false;
    this.logger.debug(`Should retry from beginning: ${shouldRetry}`);

    if (!shouldRetry) {
      this.logger.info(`Not retrying (retry_type is not RETRY_FROM_BEGINNING). Returning error.`);
    }
    return shouldRetry;
  }

  /**
   * Calculate wait time before retry using configured min/max bounds
   */
  calculateWaitTime(config: RetryConfig): number {
    return this.retryPolicyService.calculateWaitTime(config.min, config.max);
  }

  /**
   * Round wait time for display purposes
   */
  roundWaitTime(waitTime: number): number {
    return this.retryPolicyService.roundWaitTime(waitTime);
  }

  /**
   * Log retry attempt information
   */
  logRetryAttempt(retryCount: number, config: RetryConfig): void {
    const retryInfo = config.isInfinite
      ? `Retry attempt ${retryCount} (infinite mode)`
      : `Retry attempt ${retryCount}/${config.maxRetries}`;
    this.logger.info(retryInfo);
  }

  /**
   * Log successful completion with retry count
   */
  logSuccess(retryCount: number): void {
    const attemptInfo =
      retryCount === 0
        ? 'on first attempt'
        : `after ${retryCount} retry ${retryCount === 1 ? 'attempt' : 'attempts'}`;
    this.logger.info(`Auto-fill completed successfully ${attemptInfo}`);
  }

  /**
   * Create error message when maximum retries are exhausted
   */
  createMaxRetriesError(result: AutoFillResult, maxRetries: number): AutoFillResult {
    this.logger.info(`Maximum retry attempts (${maxRetries}) reached. Giving up.`);
    return {
      ...result,
      error: `${result.error} (Failed after ${maxRetries} retry attempts)`,
    };
  }

  /**
   * Log wait information before retry
   */
  // eslint-disable-next-line max-params -- All 5 parameters are essential for comprehensive retry logging: failedStep (which step failed), waitTimeRounded (display value), waitTime (actual value), retryCount (current attempt), config (retry configuration for infinite/max retries). Grouping would reduce clarity.
  logWaitBeforeRetry(
    failedStep: number | undefined,
    waitTimeRounded: number,
    waitTime: number,
    retryCount: number,
    config: RetryConfig
  ): void {
    const nextAttemptInfo = config.isInfinite
      ? `Retry attempt ${retryCount} will start`
      : `Retry attempt ${retryCount}/${config.maxRetries} will start`;

    this.logger.info(`Step ${failedStep} failed with retry_type=10.`);
    this.logger.info(`Waiting ${waitTimeRounded} seconds (${waitTime * 1000}ms) before retry...`);
    this.logger.info(nextAttemptInfo);
  }

  /**
   * Log wait completion information
   */
  logWaitCompleted(actualWaitTime: number, waitTimeRounded: number): void {
    this.logger.info(
      `Wait completed (actual: ${actualWaitTime.toFixed(2)}s, expected: ${waitTimeRounded}s).`
    );
  }

  /**
   * Log wait interruption by cancellation
   */
  logWaitCancelled(actualWaitTime: number, waitTimeRounded: number): void {
    this.logger.info(
      `Wait interrupted by cancellation after ${actualWaitTime.toFixed(2)}s (expected: ${waitTimeRounded}s)`
    );
  }

  /**
   * Log retry configuration
   */
  logRetryConfig(config: RetryConfig): void {
    this.logger.info(
      `Retry configuration - Max attempts: ${config.isInfinite ? 'infinite' : config.maxRetries}, Wait time: ${config.min}-${config.max} seconds (random)`
    );
  }
}
