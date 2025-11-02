/**
 * Result type for representing success or failure
 * Generic wrapper for operation results with type safety
 */

export class Result<T, E = string> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E,
    private readonly _data?: unknown
  ) {}

  /**
   * Create a successful result
   */
  static success<T, E = string>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined);
  }

  /**
   * Create a failed result
   * @param error Error message or object
   * @param data Optional additional data (e.g., partial state)
   */
  static failure<T, E = string>(error: E, data?: unknown): Result<T, E> {
    return new Result<T, E>(false, undefined, error, data);
  }

  /**
   * Check if the result is successful
   */
  get isSuccess(): boolean {
    return this._isSuccess;
  }

  /**
   * Check if the result is a failure
   */
  get isFailure(): boolean {
    return !this._isSuccess;
  }

  /**
   * Get the success value
   * Returns undefined if the result is a failure
   */
  get value(): T | undefined {
    return this._value;
  }

  /**
   * Get the error
   * Returns undefined if the result is successful
   */
  get error(): E | undefined {
    return this._error;
  }

  /**
   * Get additional data
   * Useful for passing partial state on failure
   */
  get data(): unknown {
    return this._data;
  }

  /**
   * Map the success value to a new value
   * If the result is a failure, returns the failure unchanged
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isFailure) {
      return Result.failure(this._error!, this._data);
    }
    return Result.success<U, E>(fn(this._value!));
  }

  /**
   * Flat map the success value to a new Result
   * If the result is a failure, returns the failure unchanged
   */
  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isFailure) {
      return Result.failure(this._error!, this._data);
    }
    return fn(this._value!);
  }

  /**
   * Match the result with handlers for success and failure
   */
  match<U>(handlers: { success: (value: T) => U; failure: (error: E) => U }): U {
    if (this.isSuccess) {
      return handlers.success(this._value!);
    }
    return handlers.failure(this._error!);
  }

  /**
   * Get the value or throw an error if the result is a failure
   */
  unwrap(): T {
    if (this.isFailure) {
      throw new Error(`Cannot unwrap failure: ${this._error}`);
    }
    return this._value!;
  }

  /**
   * Get the value or return a default value if the result is a failure
   */
  unwrapOr(defaultValue: T): T {
    return this.isSuccess ? this._value! : defaultValue;
  }

  /**
   * Get the error or throw an error if the result is successful
   */
  unwrapError(): E {
    if (this.isSuccess) {
      throw new Error('Cannot unwrap error from success');
    }
    return this._error!;
  }

  /**
   * Convert result to string representation
   */
  toString(): string {
    if (this.isSuccess) {
      return `Result(success: ${this._value})`;
    }
    return `Result(failure: ${this._error})`;
  }
}
