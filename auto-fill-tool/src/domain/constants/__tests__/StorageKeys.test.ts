/**
 * Unit Tests: StorageKeys
 */

import { STORAGE_KEYS, StorageKey, isStorageKey } from '../StorageKeys';

describe('StorageKeys', () => {
  describe('STORAGE_KEYS constants', () => {
    it('should define XPATH_COLLECTION as "xpathCollectionCSV"', () => {
      expect(STORAGE_KEYS.XPATH_COLLECTION).toBe('xpathCollectionCSV');
    });

    it('should define WEBSITE_CONFIGS as "websiteConfigs"', () => {
      expect(STORAGE_KEYS.WEBSITE_CONFIGS).toBe('websiteConfigs');
    });

    it('should define SYSTEM_SETTINGS as "systemSettings"', () => {
      expect(STORAGE_KEYS.SYSTEM_SETTINGS).toBe('systemSettings');
    });

    it('should define AUTOMATION_VARIABLES as "automationVariables"', () => {
      expect(STORAGE_KEYS.AUTOMATION_VARIABLES).toBe('automationVariables');
    });

    it('should define AUTOMATION_RESULTS as "automationResults"', () => {
      expect(STORAGE_KEYS.AUTOMATION_RESULTS).toBe('automationResults');
    });

    it('should define STORAGE_SYNC_CONFIGS as "storageSyncConfigs"', () => {
      expect(STORAGE_KEYS.STORAGE_SYNC_CONFIGS).toBe('storageSyncConfigs');
    });

    it('should have all unique values', () => {
      const values = Object.values(STORAGE_KEYS);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it('should have exactly 6 storage keys', () => {
      const values = Object.values(STORAGE_KEYS);
      expect(values.length).toBe(6);
    });

    it('should not have empty string values', () => {
      const values = Object.values(STORAGE_KEYS);
      values.forEach((value) => {
        expect(value).not.toBe('');
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

  describe('StorageKey type', () => {
    it('should accept valid storage key values', () => {
      const xpathCollection: StorageKey = STORAGE_KEYS.XPATH_COLLECTION;
      const websiteConfigs: StorageKey = STORAGE_KEYS.WEBSITE_CONFIGS;
      const systemSettings: StorageKey = STORAGE_KEYS.SYSTEM_SETTINGS;
      const automationVariables: StorageKey = STORAGE_KEYS.AUTOMATION_VARIABLES;
      const storageSyncConfigs: StorageKey = STORAGE_KEYS.STORAGE_SYNC_CONFIGS;

      expect(xpathCollection).toBe('xpathCollectionCSV');
      expect(websiteConfigs).toBe('websiteConfigs');
      expect(systemSettings).toBe('systemSettings');
      expect(automationVariables).toBe('automationVariables');
      expect(storageSyncConfigs).toBe('storageSyncConfigs');
    });
  });

  describe('isStorageKey', () => {
    it('should return true for XPATH_COLLECTION', () => {
      expect(isStorageKey('xpathCollectionCSV')).toBe(true);
    });

    it('should return true for WEBSITE_CONFIGS', () => {
      expect(isStorageKey('websiteConfigs')).toBe(true);
    });

    it('should return true for SYSTEM_SETTINGS', () => {
      expect(isStorageKey('systemSettings')).toBe(true);
    });

    it('should return true for AUTOMATION_VARIABLES', () => {
      expect(isStorageKey('automationVariables')).toBe(true);
    });

    it('should return true for STORAGE_SYNC_CONFIGS', () => {
      expect(isStorageKey('storageSyncConfigs')).toBe(true);
    });

    it('should return false for invalid key', () => {
      expect(isStorageKey('invalidKey')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isStorageKey('')).toBe(false);
    });

    it('should return false for similar but incorrect keys', () => {
      expect(isStorageKey('xpathCollection')).toBe(false); // Missing CSV
      expect(isStorageKey('websiteConfig')).toBe(false); // Missing s
      expect(isStorageKey('systemSetting')).toBe(false); // Missing s
    });

    it('should be case sensitive', () => {
      expect(isStorageKey('XpathCollectionCSV')).toBe(false);
      expect(isStorageKey('WEBSITECONFIGS')).toBe(false);
      expect(isStorageKey('SYSTEMSETTINGS')).toBe(false);
    });

    it('should work with constant values', () => {
      expect(isStorageKey(STORAGE_KEYS.XPATH_COLLECTION)).toBe(true);
      expect(isStorageKey(STORAGE_KEYS.WEBSITE_CONFIGS)).toBe(true);
      expect(isStorageKey(STORAGE_KEYS.SYSTEM_SETTINGS)).toBe(true);
      expect(isStorageKey(STORAGE_KEYS.AUTOMATION_VARIABLES)).toBe(true);
      expect(isStorageKey(STORAGE_KEYS.STORAGE_SYNC_CONFIGS)).toBe(true);
    });

    it('should handle all valid keys in a loop', () => {
      const validKeys = Object.values(STORAGE_KEYS);
      validKeys.forEach((key) => {
        expect(isStorageKey(key)).toBe(true);
      });
    });

    it('should be used to validate storage keys at runtime', () => {
      const key = 'xpathCollectionCSV';

      if (isStorageKey(key)) {
        expect(key).toBe(STORAGE_KEYS.XPATH_COLLECTION);
      } else {
        fail('Should be a valid storage key');
      }
    });

    it('should validate keys from external sources', () => {
      const externalKeys = ['xpathCollectionCSV', 'unknownKey', 'websiteConfigs'];

      const validKeys = externalKeys.filter(isStorageKey);

      expect(validKeys).toHaveLength(2);
      expect(validKeys).toContain('xpathCollectionCSV');
      expect(validKeys).toContain('websiteConfigs');
      expect(validKeys).not.toContain('unknownKey');
    });
  });
});
