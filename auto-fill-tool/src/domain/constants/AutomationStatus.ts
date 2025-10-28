/**
 * Domain Constants: Automation Status
 * Constants for automation execution status
 */

/**
 * Automation status constants
 * Used in status field of AutomationVariables entity
 */
export const AUTOMATION_STATUS = {
  DISABLED: 'disabled', // 無効
  ENABLED: 'enabled', // 有効
  ONCE: 'once', // 1度だけ有効
} as const;

/**
 * Type alias for automation status values
 */
export type AutomationStatus = (typeof AUTOMATION_STATUS)[keyof typeof AUTOMATION_STATUS];

/**
 * Type guard to check if a string is a valid automation status
 */
export function isAutomationStatus(value: string): value is AutomationStatus {
  return Object.values(AUTOMATION_STATUS).includes(value as AutomationStatus);
}
