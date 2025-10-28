/**
 * Domain Entity: Retry Policy
 * Defines retry behavior for failed operations
 */

export interface RetryPolicyData {
  maxAttempts: number; // Maximum number of retry attempts (0 = no retry)
  initialDelayMs: number; // Initial delay in milliseconds
  maxDelayMs: number; // Maximum delay in milliseconds
  backoffMultiplier: number; // Multiplier for exponential backoff
  retryableErrors: string[]; // Error patterns that should trigger retry
}

export class RetryPolicy {
  private data: RetryPolicyData;

  constructor(data: RetryPolicyData) {
    this.validate(data);
    this.data = { ...data };
  }

  private validate(data: RetryPolicyData): void {
    if (data.maxAttempts < 0) {
      throw new Error('Max attempts must be non-negative');
    }

    if (data.initialDelayMs < 0) {
      throw new Error('Initial delay must be non-negative');
    }

    if (data.maxDelayMs < data.initialDelayMs) {
      throw new Error('Max delay must be greater than or equal to initial delay');
    }

    if (data.backoffMultiplier < 1) {
      throw new Error('Backoff multiplier must be at least 1');
    }
  }

  // Getters
  getMaxAttempts(): number {
    return this.data.maxAttempts;
  }

  getInitialDelayMs(): number {
    return this.data.initialDelayMs;
  }

  getMaxDelayMs(): number {
    return this.data.maxDelayMs;
  }

  getBackoffMultiplier(): number {
    return this.data.backoffMultiplier;
  }

  getRetryableErrors(): string[] {
    return [...this.data.retryableErrors];
  }

  /**
   * Calculate delay for a specific retry attempt
   * Uses exponential backoff with maximum delay cap
   */
  calculateDelay(attemptNumber: number): number {
    if (attemptNumber <= 0) {
      return 0;
    }

    const delay =
      this.data.initialDelayMs * Math.pow(this.data.backoffMultiplier, attemptNumber - 1);
    return Math.min(delay, this.data.maxDelayMs);
  }

  /**
   * Check if an error should trigger a retry
   */
  shouldRetry(error: Error, attemptNumber: number): boolean {
    // No retry if max attempts reached
    if (attemptNumber >= this.data.maxAttempts) {
      return false;
    }

    // No retry if no retryable errors configured (retry all errors)
    if (this.data.retryableErrors.length === 0) {
      return true;
    }

    // Check if error message matches any retryable error pattern
    const errorMessage = error.message.toLowerCase();
    return this.data.retryableErrors.some((pattern) =>
      errorMessage.includes(pattern.toLowerCase())
    );
  }

  // Export
  toData(): RetryPolicyData {
    return { ...this.data };
  }

  // Clone
  clone(): RetryPolicy {
    return new RetryPolicy({ ...this.data });
  }

  // Static factory methods
  static default(): RetryPolicy {
    return new RetryPolicy({
      maxAttempts: 3,
      initialDelayMs: 1000, // 1 second
      maxDelayMs: 30000, // 30 seconds
      backoffMultiplier: 2,
      retryableErrors: [
        'timeout',
        'network',
        'connection',
        'econnrefused',
        'enotfound',
        'etimedout',
        '5', // HTTP 5xx errors
      ],
    });
  }

  static noRetry(): RetryPolicy {
    return new RetryPolicy({
      maxAttempts: 0,
      initialDelayMs: 0,
      maxDelayMs: 0,
      backoffMultiplier: 1,
      retryableErrors: [],
    });
  }

  static aggressive(): RetryPolicy {
    return new RetryPolicy({
      maxAttempts: 5,
      initialDelayMs: 500, // 0.5 second
      maxDelayMs: 60000, // 1 minute
      backoffMultiplier: 2,
      retryableErrors: [],
    });
  }

  static fromData(data: RetryPolicyData): RetryPolicy {
    return new RetryPolicy(data);
  }
}
