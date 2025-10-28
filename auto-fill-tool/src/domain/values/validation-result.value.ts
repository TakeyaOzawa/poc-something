/**
 * Domain Layer: ValidationResult Type
 * Represents the result of a validation operation
 * Provides a type-safe way to handle validation success and failure
 */

/**
 * ValidationResult class for representing validation outcomes
 * Implements Railway-Oriented Programming pattern for validation
 *
 * @example Success case
 * ```typescript
 * const result = ValidationResult.success(42);
 * if (result.isValid()) {
 *   console.log(result.getValue()); // 42
 * }
 * ```
 *
 * @example Failure case
 * ```typescript
 * const result = ValidationResult.failure<number>('Value must be positive');
 * if (!result.isValid()) {
 *   console.log(result.getError()); // 'Value must be positive'
 * }
 * ```
 */
export class ValidationResult<T> {
  private constructor(
    private readonly _isValid: boolean,
    private readonly _value?: T,
    private readonly _error?: string
  ) {}

  /**
   * Create a successful validation result
   * @param value The validated value
   * @returns ValidationResult representing success
   */
  static success<T>(value: T): ValidationResult<T> {
    return new ValidationResult(true, value);
  }

  /**
   * Create a failed validation result
   * @param error Error message describing the validation failure
   * @returns ValidationResult representing failure
   */
  static failure<T>(error: string): ValidationResult<T> {
    return new ValidationResult<T>(false, undefined as T, error);
  }

  /**
   * Check if validation was successful
   * @returns true if validation succeeded, false otherwise
   */
  isValid(): boolean {
    return this._isValid;
  }

  /**
   * Get the validated value
   * @throws Error if validation failed
   * @returns The validated value
   */
  getValue(): T {
    if (!this._isValid) {
      throw new Error('Cannot get value from failed validation');
    }
    return this._value!;
  }

  /**
   * Get the error message
   * @throws Error if validation succeeded
   * @returns The error message
   */
  getError(): string {
    if (this._isValid) {
      throw new Error('Cannot get error from successful validation');
    }
    return this._error!;
  }

  /**
   * Map the value if validation was successful
   * Railway-Oriented Programming: transform success value, propagate failure
   * @param fn Function to transform the value
   * @returns New ValidationResult with transformed value or original failure
   */
  map<U>(fn: (value: T) => U): ValidationResult<U> {
    if (!this._isValid) {
      return ValidationResult.failure<U>(this._error!);
    }
    return ValidationResult.success(fn(this._value!));
  }

  /**
   * Chain validation operations
   * Railway-Oriented Programming: continue validation, propagate failure
   * @param fn Function that returns a new ValidationResult
   * @returns New ValidationResult from the function or original failure
   */
  flatMap<U>(fn: (value: T) => ValidationResult<U>): ValidationResult<U> {
    if (!this._isValid) {
      return ValidationResult.failure<U>(this._error!);
    }
    return fn(this._value!);
  }
}
