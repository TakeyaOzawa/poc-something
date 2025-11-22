/**
 * Domain Error
 * Represents a domain-level error with error code and details
 */

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DomainError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DomainError);
    }
  }

  /**
   * Create a DomainError from an unknown error
   */
  static from(error: unknown, code: number): DomainError {
    if (error instanceof DomainError) {
      return error;
    }

    if (error instanceof Error) {
      return new DomainError(error.message, code);
    }

    return new DomainError(String(error), code);
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      stack: this.stack,
    };
  }

  /**
   * Convert to string representation
   */
  toString(): string {
    const detailsStr = this.details ? ` (${JSON.stringify(this.details)})` : '';
    return `${this.name} [${this.code}]: ${this.message}${detailsStr}`;
  }
}
