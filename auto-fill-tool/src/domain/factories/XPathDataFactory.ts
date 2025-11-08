/**
 * Domain Layer: XPathData Factory
 * Handles creation of XPathData with business rule defaults
 * Encapsulates default value logic that was previously in Mapper
 */

import { XPathData, ActionType, PathPattern } from '@domain/entities/XPathCollection';
import { RetryType } from '@domain/constants/RetryType';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { PATH_PATTERN } from '@domain/constants/PathPattern';
import { BatchFactory } from './Factory';

/**
 * Factory class for creating XPathData with business rule defaults
 * Business Rules:
 * - Default actionType: 'type' (most common action for form filling)
 * - Default pathPattern: 'smart' (recommended pattern for best compatibility)
 * - Default afterWaitSeconds: 0 (no wait)
 * - Default actionPattern: 0 (basic pattern)
 * - Default retryType: 0 (no retry)
 * - Default executionOrder: 100 (standard increment)
 * - Default executionTimeoutSeconds: 30 (standard timeout)
 */
export class XPathDataFactory implements BatchFactory<XPathData> {
  // Business Rule: Default values
  static readonly DEFAULT_ACTION_TYPE: ActionType = ACTION_TYPE.TYPE;
  static readonly DEFAULT_PATH_PATTERN: PathPattern = PATH_PATTERN.SMART;
  static readonly DEFAULT_AFTER_WAIT_SECONDS = 0;
  static readonly DEFAULT_ACTION_PATTERN = 0;
  static readonly DEFAULT_RETRY_TYPE: RetryType = 0;
  static readonly DEFAULT_EXECUTION_ORDER = 100;
  static readonly DEFAULT_EXECUTION_TIMEOUT_SECONDS = 30;

  /**
   * Parse execution timeout from CSV value
   * @param value CSV value for execution timeout
   * @returns Parsed timeout or default value
   */
  private static parseExecutionTimeout(value: string): number {
    const parsed = value ? parseFloat(value) : null;
    return parsed !== null && !isNaN(parsed) ? parsed : this.DEFAULT_EXECUTION_TIMEOUT_SECONDS;
  }

  /**
   * Create XPathData from CSV values with business rule defaults
   * Business Logic:
   * - Apply default values for missing or empty fields
   * - Parse numeric values with fallback to defaults
   * - Ensure type safety with explicit casts
   *
   * @param values Array of CSV values (14 columns expected)
   * @returns XPathData with defaults applied
   */
  static createFromCSVValues(values: string[]): XPathData {
    return {
      id: values[0] || '',
      websiteId: values[1] || '',
      value: values[2] || '',
      actionType: (values[3] || this.DEFAULT_ACTION_TYPE) as ActionType,
      afterWaitSeconds: parseFloat(values[4] || '0') || this.DEFAULT_AFTER_WAIT_SECONDS,
      actionPattern: values[5] ? parseInt(values[5]) : this.DEFAULT_ACTION_PATTERN,
      pathAbsolute: values[6] || '',
      pathShort: values[7] || '',
      pathSmart: values[8] || '',
      selectedPathPattern: (values[9] || this.DEFAULT_PATH_PATTERN) as PathPattern,
      retryType: (parseInt(values[10] || '0') || this.DEFAULT_RETRY_TYPE) as RetryType,
      executionOrder: parseInt(values[11] || '0') || this.DEFAULT_EXECUTION_ORDER,
      executionTimeoutSeconds: this.parseExecutionTimeout(values[12] || ''),
      url: values[13] || '',
    };
  }

  /**
   * BatchFactory実装: 複数のCSV行からXPathDataを一括生成
   *
   * @param items CSV値の配列の配列
   * @returns XPathDataの配列
   */
  createBatch(items: string[][]): XPathData[] {
    return items.map((values) => XPathDataFactory.createFromCSVValues(values));
  }

  /**
   * Factory実装: 単一のCSV行からXPathDataを生成
   *
   * @param values CSV値の配列
   * @returns XPathData
   */
  create(values: string[]): XPathData {
    return XPathDataFactory.createFromCSVValues(values);
  }

  /**
   * Create XPathData from JSON object with business rule defaults
   * Business Logic:
   * - Apply default values for missing fields
   * - Use nullish coalescing (??) for numeric fields to allow 0 values
   * - Use logical OR (||) for string fields and execution order
   *
   * @param item JSON object with partial XPathData fields
   * @returns Partial XPathData (without id) with defaults applied
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, complexity
  static createFromJSON(item: any): Omit<XPathData, 'id'> {
    return {
      // String fields with defaults
      websiteId: item.websiteId || '',
      value: item.value || '',
      actionType: (item.actionType as ActionType) || this.DEFAULT_ACTION_TYPE,
      pathAbsolute: item.pathAbsolute || '',
      pathShort: item.pathShort || '',
      pathSmart: item.pathSmart || '',
      selectedPathPattern: (item.selectedPathPattern as PathPattern) || this.DEFAULT_PATH_PATTERN,
      url: item.url || '',

      // Numeric fields with defaults (use ?? to allow 0 values)
      afterWaitSeconds: item.afterWaitSeconds ?? this.DEFAULT_AFTER_WAIT_SECONDS,
      actionPattern: item.actionPattern ?? this.DEFAULT_ACTION_PATTERN,
      retryType: (item.retryType ?? this.DEFAULT_RETRY_TYPE) as RetryType,
      executionOrder: item.executionOrder || this.DEFAULT_EXECUTION_ORDER, // Use || because 0 is invalid
      executionTimeoutSeconds:
        item.executionTimeoutSeconds ?? this.DEFAULT_EXECUTION_TIMEOUT_SECONDS,
    };
  }

  /**
   * Get explanation of default values (for documentation)
   */
  static getDefaultsExplanation(): Record<string, string> {
    return {
      actionType: `${this.DEFAULT_ACTION_TYPE} - Most common action type for form filling (text input)`,
      pathPattern: `${this.DEFAULT_PATH_PATTERN} - Recommended pattern for best compatibility`,
      afterWaitSeconds: `${this.DEFAULT_AFTER_WAIT_SECONDS} - No wait by default`,
      actionPattern: `${this.DEFAULT_ACTION_PATTERN} - Basic pattern`,
      retryType: `${this.DEFAULT_RETRY_TYPE} - No retry by default`,
      executionOrder: `${this.DEFAULT_EXECUTION_ORDER} - Standard increment for ordering`,
      executionTimeoutSeconds: `${this.DEFAULT_EXECUTION_TIMEOUT_SECONDS} - Standard timeout`,
    };
  }
}
