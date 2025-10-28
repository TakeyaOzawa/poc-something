/**
 * Action Type Constants
 * Defines the types of actions that can be performed on web page elements
 */

/**
 * Action Type enumeration
 */
export const ACTION_TYPE = {
  TYPE: 'type', // Text input (formerly 'input')
  CLICK: 'click', // Button/link click
  CHECK: 'check', // Checkbox/radio button ON/OFF
  JUDGE: 'judge', // Value comparison/validation (formerly 'check')
  SELECT_VALUE: 'select_value', // Select box selection by value attribute
  SELECT_INDEX: 'select_index', // Select box selection by index
  SELECT_TEXT: 'select_text', // Select box selection by text (partial match)
  SELECT_TEXT_EXACT: 'select_text_exact', // Select box selection by text (exact match)
  CHANGE_URL: 'change_url', // URL change/navigation
  SCREENSHOT: 'screenshot', // Take screenshot and save with filename
  GET_VALUE: 'get_value', // Get element value and store as variable
} as const;

/**
 * Action Type type definition
 */
export type ActionType = (typeof ACTION_TYPE)[keyof typeof ACTION_TYPE];

/**
 * Type guard to check if a string is a valid ActionType
 */
export function isActionType(value: string): value is ActionType {
  return Object.values(ACTION_TYPE).includes(value as ActionType);
}
