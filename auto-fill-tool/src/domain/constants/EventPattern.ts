/**
 * Domain Constant: Event Pattern
 * Defines event dispatching patterns for TYPE/CLICK/CHECK operations
 */

export const EVENT_PATTERN = {
  BASIC: 10,
  FRAMEWORK_AGNOSTIC: 20,
} as const;

export type EventPattern = (typeof EVENT_PATTERN)[keyof typeof EVENT_PATTERN];

/**
 * Get the default event pattern
 * @returns Default pattern (FRAMEWORK_AGNOSTIC)
 */
export function getDefaultEventPattern(): EventPattern {
  return EVENT_PATTERN.FRAMEWORK_AGNOSTIC;
}

/**
 * Normalize event pattern (0 or undefined becomes default)
 * @param pattern Event pattern value
 * @returns Normalized event pattern
 */
export function normalizeEventPattern(pattern: number | undefined): EventPattern {
  if (pattern === undefined || pattern === 0) {
    return EVENT_PATTERN.FRAMEWORK_AGNOSTIC;
  }
  if (pattern === EVENT_PATTERN.BASIC) {
    return EVENT_PATTERN.BASIC;
  }
  return EVENT_PATTERN.FRAMEWORK_AGNOSTIC;
}
