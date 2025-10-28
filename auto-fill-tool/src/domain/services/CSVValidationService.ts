/**
 * Domain Layer: CSV Validation Service
 * Handles CSV format validation logic
 * Business Rules:
 * - CSV must have at least 2 lines (header + 1 data row)
 * - Data rows must have minimum required columns
 * - Empty lines are ignored
 */

import { ValidationResult } from '@domain/values/validation-result.value';

/**
 * CSV Validation Service
 * Centralizes CSV validation logic that was scattered across mappers
 */
export class CSVValidationService {
  /**
   * Validate CSV string format
   * Business Rule: CSV must have header + at least one data row
   * @param csv CSV string to validate
   * @returns ValidationResult containing lines or error message
   */
  validateCSVFormat(csv: string): ValidationResult<string[]> {
    const lines = csv.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      return ValidationResult.failure('Invalid CSV format: no data rows');
    }

    return ValidationResult.success(lines);
  }

  /**
   * Validate CSV line has minimum required columns
   * Business Rule: Each CSV line must have at least the required number of columns
   * @param values Parsed CSV values
   * @param minColumns Minimum required columns
   * @param lineNumber Line number for error reporting (1-indexed)
   * @returns ValidationResult containing values or error message
   */
  validateColumnCount(
    values: string[],
    minColumns: number,
    lineNumber: number
  ): ValidationResult<string[]> {
    if (values.length < minColumns) {
      return ValidationResult.failure(
        `Line ${lineNumber}: insufficient columns (expected ${minColumns}, got ${values.length})`
      );
    }

    return ValidationResult.success(values);
  }

  /**
   * Validate XPath CSV line
   * Business Rule: XPath CSV requires 14 columns minimum
   * @param values Parsed CSV values
   * @param lineNumber Line number for error reporting (1-indexed)
   * @returns ValidationResult containing values or error message
   */
  validateXPathCSVLine(values: string[], lineNumber: number): ValidationResult<string[]> {
    return this.validateColumnCount(values, 14, lineNumber);
  }

  /**
   * Validate Website CSV line
   * Business Rule: Website CSV requires 5 columns minimum
   * @param values Parsed CSV values
   * @param lineNumber Line number for error reporting (1-indexed)
   * @returns ValidationResult containing values or error message
   */
  validateWebsiteCSVLine(values: string[], lineNumber: number): ValidationResult<string[]> {
    return this.validateColumnCount(values, 5, lineNumber);
  }

  /**
   * Validate required field is not empty
   * Business Rule: Required fields must not be empty or whitespace-only
   * @param value Field value to validate
   * @param fieldName Field name for error reporting
   * @returns ValidationResult containing trimmed value or error message
   */
  validateRequiredField(value: string, fieldName: string): ValidationResult<string> {
    const trimmed = value.trim();

    if (!trimmed) {
      return ValidationResult.failure(`${fieldName} is required and cannot be empty`);
    }

    return ValidationResult.success(trimmed);
  }

  /**
   * Validate optional field (always succeeds, but trims the value)
   * @param value Field value to validate
   * @returns ValidationResult containing trimmed value (empty string if not provided)
   */
  validateOptionalField(value: string | undefined): ValidationResult<string> {
    return ValidationResult.success(value?.trim() || '');
  }
}
