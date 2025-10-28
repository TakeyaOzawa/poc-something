/**
 * Domain Service: Value Comparison Service
 * Handles value comparison logic with various patterns (equals, not equals, greater than, less than)
 * This is business logic and belongs in the domain layer.
 */

import { ComparisonPattern, COMPARISON_PATTERN } from '@domain/constants/ComparisonPattern';

export class ValueComparisonService {
  /**
   * Compare two values using the specified comparison pattern
   * @param actual The actual value to compare
   * @param expected The expected value to compare against
   * @param pattern The comparison pattern to use
   * @returns true if the comparison passes, false otherwise
   */
  compare(actual: string, expected: string, pattern: ComparisonPattern): boolean {
    switch (pattern) {
      case COMPARISON_PATTERN.EQUALS:
        return this.compareEquals(actual, expected);
      case COMPARISON_PATTERN.NOT_EQUALS:
        return this.compareNotEquals(actual, expected);
      case COMPARISON_PATTERN.GREATER_THAN:
        return this.compareNumeric(actual, expected, (a, b) => a > b);
      case COMPARISON_PATTERN.LESS_THAN:
        return this.compareNumeric(actual, expected, (a, b) => a < b);
      default:
        return actual === expected;
    }
  }

  /**
   * Compare two values for equality
   * Business rule: Supports both exact match and regex pattern matching
   * @param actual The actual value
   * @param expected The expected value (can be a regex pattern)
   * @returns true if values are equal or regex matches
   */
  private compareEquals(actual: string, expected: string): boolean {
    // First try exact match
    if (actual === expected) {
      return true;
    }

    // Then try regex matching (business rule: flexible string comparison)
    try {
      const regex = new RegExp(expected);
      return regex.test(actual);
    } catch (e) {
      // If regex is invalid, fall back to exact match (already checked above)
      return false;
    }
  }

  /**
   * Compare two values for inequality
   * Business rule: Supports both exact match and regex pattern matching
   * @param actual The actual value
   * @param expected The expected value (can be a regex pattern)
   * @returns true if values are not equal or regex does not match
   */
  private compareNotEquals(actual: string, expected: string): boolean {
    // Try regex matching first
    try {
      const regex = new RegExp(expected);
      return !regex.test(actual);
    } catch (e) {
      // If regex is invalid, fall back to exact comparison
      return actual !== expected;
    }
  }

  /**
   * Compare two values numerically
   * Business rule: Attempt numeric comparison first, fall back to string comparison
   * @param actual The actual value
   * @param expected The expected value
   * @param compareFn The comparison function (e.g., (a, b) => a > b)
   * @returns true if the comparison passes
   */
  private compareNumeric(
    actual: string,
    expected: string,
    compareFn: (a: number, b: number) => boolean
  ): boolean {
    const actualNum = parseFloat(actual);
    const expectedNum = parseFloat(expected);

    // Business rule: If both values are numeric, compare as numbers
    if (!isNaN(actualNum) && !isNaN(expectedNum)) {
      return compareFn(actualNum, expectedNum);
    }

    // Business rule: If not numeric, compare by character code
    return compareFn(actual.charCodeAt(0), expected.charCodeAt(0));
  }
}
