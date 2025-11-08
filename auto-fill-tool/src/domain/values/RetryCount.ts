/**
 * Domain Value Object: Retry Count
 * Represents a validated retry count with business rules
 */

/**
 * Retry Count value object
 * Encapsulates retry count validation and business logic
 */
export class RetryCount {
  private readonly value: number;

  // Business constants
  public static readonly INFINITE = -1;
  public static readonly MIN_FINITE = 0;
  public static readonly MAX_FINITE = 100;
  public static readonly DEFAULT = 3;

  constructor(count: number) {
    this.value = this.validate(count);
  }

  /**
   * Validate retry count
   */
  private validate(count: number): number {
    if (!Number.isInteger(count)) {
      throw new Error('Retry count must be an integer');
    }

    if (count === RetryCount.INFINITE) {
      return count; // -1 is valid (infinite retries)
    }

    if (count < RetryCount.MIN_FINITE) {
      throw new Error(`Retry count must be >= ${RetryCount.MIN_FINITE} or -1 for infinite`);
    }

    if (count > RetryCount.MAX_FINITE) {
      throw new Error(`Retry count must be <= ${RetryCount.MAX_FINITE}`);
    }

    return count;
  }

  /**
   * Get the retry count value
   */
  public getValue(): number {
    return this.value;
  }

  /**
   * Check if retry count is infinite
   */
  public isInfinite(): boolean {
    return this.value === RetryCount.INFINITE;
  }

  /**
   * Check if retry count is finite
   */
  public isFinite(): boolean {
    return this.value >= RetryCount.MIN_FINITE;
  }

  /**
   * Check if retries are disabled
   */
  public isDisabled(): boolean {
    return this.value === 0;
  }

  /**
   * Get display string for UI
   */
  public getDisplayString(): string {
    if (this.isInfinite()) {
      return 'Infinite';
    }
    if (this.isDisabled()) {
      return 'Disabled';
    }
    return this.value.toString();
  }

  /**
   * Get description for logging
   */
  public getDescription(): string {
    if (this.isInfinite()) {
      return 'infinite retries';
    }
    if (this.isDisabled()) {
      return 'no retries';
    }
    if (this.value === 1) {
      return '1 retry';
    }
    return `${this.value} retries`;
  }

  /**
   * Check if should retry given current attempt
   */
  public shouldRetry(currentAttempt: number): boolean {
    if (currentAttempt < 1) {
      throw new Error('Current attempt must be >= 1');
    }

    if (this.isDisabled()) {
      return false;
    }

    if (this.isInfinite()) {
      return true;
    }

    return currentAttempt <= this.value;
  }

  /**
   * Get remaining retries after current attempt
   */
  public getRemainingRetries(currentAttempt: number): number {
    if (currentAttempt < 1) {
      throw new Error('Current attempt must be >= 1');
    }

    if (this.isInfinite()) {
      return RetryCount.INFINITE;
    }

    const remaining = this.value - currentAttempt;
    return Math.max(0, remaining);
  }

  /**
   * Equality comparison
   */
  public equals(other: RetryCount): boolean {
    return this.value === other.value;
  }

  /**
   * String representation
   */
  public toString(): string {
    return this.getDisplayString();
  }

  /**
   * Create from number (factory method)
   */
  public static from(count: number): RetryCount {
    return new RetryCount(count);
  }

  /**
   * Create infinite retry count
   */
  public static infinite(): RetryCount {
    return new RetryCount(RetryCount.INFINITE);
  }

  /**
   * Create disabled retry count
   */
  public static disabled(): RetryCount {
    return new RetryCount(0);
  }

  /**
   * Create default retry count
   */
  public static default(): RetryCount {
    return new RetryCount(RetryCount.DEFAULT);
  }

  /**
   * Create from string (for UI input)
   */
  public static fromString(str: string): RetryCount {
    const trimmed = str.trim().toLowerCase();

    if (trimmed === 'infinite' || trimmed === '∞' || trimmed === '-1') {
      return RetryCount.infinite();
    }

    if (trimmed === 'disabled' || trimmed === 'none' || trimmed === '0') {
      return RetryCount.disabled();
    }

    const parsed = parseInt(trimmed, 10);
    if (isNaN(parsed)) {
      throw new Error(`Invalid retry count string: ${str}`);
    }

    return new RetryCount(parsed);
  }
}
