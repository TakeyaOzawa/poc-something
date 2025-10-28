/**
 * Domain Constants: Retry Type
 * Constants for XPath retry behavior
 */

/**
 * Retry type constants
 * Used in retryType field of XPathData
 */
export const RETRY_TYPE = {
  NO_RETRY: 0, // リトライしない
  RETRY_FROM_BEGINNING: 10, // 最初からリトライ
} as const;

/**
 * Type alias for retry type values
 */
export type RetryType = (typeof RETRY_TYPE)[keyof typeof RETRY_TYPE];

/**
 * Type guard to check if a number is a valid retry type
 */
export function isRetryType(value: number): value is RetryType {
  return Object.values(RETRY_TYPE).includes(value as RetryType);
}
