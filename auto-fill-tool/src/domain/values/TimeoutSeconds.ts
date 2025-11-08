/**
 * Domain Value Object: Timeout Seconds
 * Represents a validated timeout duration with business rules
 */

/**
 * Timeout Seconds value object
 * Encapsulates timeout validation and conversion utilities
 */
export class TimeoutSeconds {
  private readonly value: number;

  // Business constants
  public static readonly MIN_SECONDS = 1;
  public static readonly MAX_SECONDS = 300; // 5 minutes
  public static readonly DEFAULT_SECONDS = 30;
  public static readonly QUICK_TIMEOUT = 5;
  public static readonly LONG_TIMEOUT = 120;

  constructor(seconds: number) {
    this.value = this.validate(seconds);
  }

  /**
   * Validate timeout seconds
   */
  private validate(seconds: number): number {
    if (!Number.isFinite(seconds) || seconds <= 0) {
      throw new Error('Timeout must be a positive number');
    }

    if (seconds < TimeoutSeconds.MIN_SECONDS) {
      throw new Error(`Timeout must be at least ${TimeoutSeconds.MIN_SECONDS} second`);
    }

    if (seconds > TimeoutSeconds.MAX_SECONDS) {
      throw new Error(`Timeout must be at most ${TimeoutSeconds.MAX_SECONDS} seconds`);
    }

    return Math.round(seconds); // Round to nearest integer
  }

  /**
   * Get the timeout value in seconds
   */
  public getSeconds(): number {
    return this.value;
  }

  /**
   * Get the timeout value in milliseconds
   */
  public getMilliseconds(): number {
    return this.value * 1000;
  }

  /**
   * Get the timeout value in minutes (rounded to 2 decimal places)
   */
  public getMinutes(): number {
    return Math.round((this.value / 60) * 100) / 100;
  }

  /**
   * Check if timeout is considered quick
   */
  public isQuick(): boolean {
    return this.value <= TimeoutSeconds.QUICK_TIMEOUT;
  }

  /**
   * Check if timeout is considered long
   */
  public isLong(): boolean {
    return this.value >= TimeoutSeconds.LONG_TIMEOUT;
  }

  /**
   * Check if timeout is default value
   */
  public isDefault(): boolean {
    return this.value === TimeoutSeconds.DEFAULT_SECONDS;
  }

  /**
   * Get display string for UI
   */
  public getDisplayString(): string {
    if (this.value < 60) {
      return `${this.value}s`;
    }

    const minutes = this.getMinutes();
    if (minutes === Math.floor(minutes)) {
      return `${Math.floor(minutes)}m`;
    }

    return `${minutes}m`;
  }

  /**
   * Get detailed description
   */
  public getDescription(): string {
    const base = `${this.value} second${this.value === 1 ? '' : 's'}`;

    if (this.isQuick()) {
      return `${base} (quick)`;
    }
    if (this.isLong()) {
      return `${base} (long)`;
    }
    return base;
  }

  /**
   * Create a Promise that resolves after this timeout
   */
  public createDelay(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, this.getMilliseconds());
    });
  }

  /**
   * Create a timeout Promise that rejects after this duration
   */
  public createTimeoutPromise<T>(promise: Promise<T>): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${this.getDisplayString()}`));
      }, this.getMilliseconds());
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Add seconds to current timeout
   */
  public add(seconds: number): TimeoutSeconds {
    return new TimeoutSeconds(this.value + seconds);
  }

  /**
   * Subtract seconds from current timeout
   */
  public subtract(seconds: number): TimeoutSeconds {
    return new TimeoutSeconds(this.value - seconds);
  }

  /**
   * Multiply timeout by factor
   */
  public multiply(factor: number): TimeoutSeconds {
    if (factor <= 0) {
      throw new Error('Multiplication factor must be positive');
    }
    return new TimeoutSeconds(this.value * factor);
  }

  /**
   * Equality comparison
   */
  public equals(other: TimeoutSeconds): boolean {
    return this.value === other.value;
  }

  /**
   * Compare with another timeout
   */
  public compareTo(other: TimeoutSeconds): number {
    return this.value - other.value;
  }

  /**
   * Check if this timeout is longer than another
   */
  public isLongerThan(other: TimeoutSeconds): boolean {
    return this.value > other.value;
  }

  /**
   * Check if this timeout is shorter than another
   */
  public isShorterThan(other: TimeoutSeconds): boolean {
    return this.value < other.value;
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
  public static from(seconds: number): TimeoutSeconds {
    return new TimeoutSeconds(seconds);
  }

  /**
   * Create quick timeout
   */
  public static quick(): TimeoutSeconds {
    return new TimeoutSeconds(TimeoutSeconds.QUICK_TIMEOUT);
  }

  /**
   * Create default timeout
   */
  public static default(): TimeoutSeconds {
    return new TimeoutSeconds(TimeoutSeconds.DEFAULT_SECONDS);
  }

  /**
   * Create long timeout
   */
  public static long(): TimeoutSeconds {
    return new TimeoutSeconds(TimeoutSeconds.LONG_TIMEOUT);
  }

  /**
   * Create from minutes
   */
  public static fromMinutes(minutes: number): TimeoutSeconds {
    return new TimeoutSeconds(minutes * 60);
  }

  /**
   * Create from milliseconds
   */
  public static fromMilliseconds(milliseconds: number): TimeoutSeconds {
    return new TimeoutSeconds(milliseconds / 1000);
  }

  /**
   * Create from string (for UI input)
   */
  public static fromString(str: string): TimeoutSeconds {
    const trimmed = str.trim().toLowerCase();

    // Handle special cases
    if (trimmed === 'quick') {
      return TimeoutSeconds.quick();
    }
    if (trimmed === 'default') {
      return TimeoutSeconds.default();
    }
    if (trimmed === 'long') {
      return TimeoutSeconds.long();
    }

    // Parse number with optional unit
    const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*([sm]?)$/);
    if (!match) {
      throw new Error(`Invalid timeout format: ${str}`);
    }

    const [, numberStr, unit] = match;
    const number = parseFloat(numberStr);

    if (unit === 'm') {
      return TimeoutSeconds.fromMinutes(number);
    }

    return new TimeoutSeconds(number);
  }
}
