/**
 * Domain Constants: Selection Strategy
 * Constants for select action types
 */

/**
 * Selection strategies for select element options
 */
export const SELECTION_STRATEGY = {
  BY_VALUE: 'select_value', // Select by option value attribute
  BY_INDEX: 'select_index', // Select by option index (0-based)
  BY_TEXT: 'select_text', // Select by partial text match
  BY_TEXT_EXACT: 'select_text_exact', // Select by exact text match
} as const;

/**
 * Type alias for selection strategy values
 */
export type SelectionStrategy = (typeof SELECTION_STRATEGY)[keyof typeof SELECTION_STRATEGY];

/**
 * Type guard to check if a string is a valid selection strategy
 */
export function isSelectionStrategy(value: string): value is SelectionStrategy {
  return Object.values(SELECTION_STRATEGY).includes(value as SelectionStrategy);
}
