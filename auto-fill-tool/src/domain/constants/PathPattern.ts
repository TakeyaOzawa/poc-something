/**
 * Domain Constants: Path Pattern
 * Constants for XPath path pattern selection
 */

/**
 * Path pattern constants
 * Used in selectedPathPattern field of XPathData
 */
export const PATH_PATTERN = {
  SMART: 'smart', // Smart XPath (推奨)
  SHORT: 'short', // Short XPath
  ABSOLUTE: 'absolute', // Absolute XPath
  NONE: '', // なし (change_url用)
} as const;

/**
 * Type alias for path pattern values
 */
export type PathPattern = (typeof PATH_PATTERN)[keyof typeof PATH_PATTERN];

/**
 * Type guard to check if a string is a valid path pattern
 */
export function isPathPattern(value: string): value is PathPattern {
  return Object.values(PATH_PATTERN).includes(value as PathPattern);
}
