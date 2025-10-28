/**
 * Input Pattern Constants
 * Defines the various input patterns for form field value setting
 *
 * Business Rules:
 * - Pattern 10: Basic pattern - uses standard DOM manipulation (focus, value setting, events)
 * - Pattern 20: Framework-agnostic pattern - handles modern frameworks (React, Vue, Angular)
 */

export enum InputPattern {
  /**
   * Basic input pattern
   * Uses standard DOM manipulation:
   * - element.focus()
   * - element.value = value
   * - dispatchEvent('input'), dispatchEvent('change')
   */
  BASIC = 10,

  /**
   * Framework-agnostic input pattern
   * Handles modern JavaScript frameworks:
   * - Detects React elements via _valueTracker, __reactProps$, __reactInternalInstance$
   * - Uses native property setters for framework compatibility
   * - Dispatches comprehensive events (input, change, blur)
   * - Triggers jQuery if present
   */
  FRAMEWORK_AGNOSTIC = 20,
}

/**
 * Type guard to check if a pattern is a valid InputPattern
 */
export function isInputPattern(pattern: number): pattern is InputPattern {
  return pattern === InputPattern.BASIC || pattern === InputPattern.FRAMEWORK_AGNOSTIC;
}

/**
 * Get all available input patterns
 */
export function getAllInputPatterns(): InputPattern[] {
  return [InputPattern.BASIC, InputPattern.FRAMEWORK_AGNOSTIC];
}
