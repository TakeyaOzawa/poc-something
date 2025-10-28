/**
 * Domain Constants: Comparison Pattern
 * Constants for judge actionType dispatchEventPattern values
 */

/**
 * Comparison patterns for judge action type
 * Used in dispatchEventPattern field when actionType is 'judge'
 */
export const COMPARISON_PATTERN = {
  EQUALS: 10, // 等しい (正規表現可)
  NOT_EQUALS: 20, // 等しくない (正規表現可)
  GREATER_THAN: 30, // 大なり (数値/文字列)
  LESS_THAN: 40, // 小なり (数値/文字列)
} as const;

/**
 * Type alias for comparison pattern values
 */
export type ComparisonPattern = (typeof COMPARISON_PATTERN)[keyof typeof COMPARISON_PATTERN];

/**
 * Type guard to check if a number is a valid comparison pattern
 */
export function isComparisonPattern(value: number): value is ComparisonPattern {
  return Object.values(COMPARISON_PATTERN).includes(value as ComparisonPattern);
}
