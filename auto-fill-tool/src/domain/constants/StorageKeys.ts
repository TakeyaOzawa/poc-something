/**
 * Domain Constants: Storage Keys
 * Constants for Chrome Storage key names
 */

/**
 * Storage key constants
 * Used across all repository implementations
 */
export const STORAGE_KEYS = {
  XPATH_COLLECTION: 'xpathCollectionCSV',
  WEBSITE_CONFIGS: 'websiteConfigs',
  SYSTEM_SETTINGS: 'systemSettings',
  AUTOMATION_VARIABLES: 'automationVariables',
  AUTOMATION_RESULTS: 'automationResults',
  STORAGE_SYNC_CONFIGS: 'storageSyncConfigs',
} as const;

/**
 * Type alias for storage key values
 */
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Type guard to check if a string is a valid storage key
 */
export function isStorageKey(value: string): value is StorageKey {
  return Object.values(STORAGE_KEYS).includes(value as StorageKey);
}
