/**
 * Infrastructure Layer: Chrome Storage Lockout Storage
 * Persists lockout state to browser.storage.local
 */

import { LockoutStorage, LockoutState } from '@domain/types/lockout-manager.types';
import browser from 'webextension-polyfill';

/**
 * Chrome Storage Lockout Storage Implementation
 * Stores lockout state in browser.storage.local
 */
export class ChromeStorageLockoutStorage implements LockoutStorage {
  private readonly STORAGE_KEY = 'lockout_state';

  /**
   * Save lockout state to storage
   * @param state Lockout state to save
   */
  async save(state: LockoutState): Promise<void> {
    try {
      await browser.storage.local.set({
        [this.STORAGE_KEY]: state,
      });
    } catch (error) {
      throw new Error(`Failed to save lockout state: ${error}`);
    }
  }

  /**
   * Load lockout state from storage
   * @returns Lockout state or null if not found
   */
  async load(): Promise<LockoutState | null> {
    try {
      const result = await browser.storage.local.get(this.STORAGE_KEY);
      const data = result[this.STORAGE_KEY];
      return data ? (data as LockoutState) : null;
    } catch (error) {
      throw new Error(`Failed to load lockout state: ${error}`);
    }
  }

  /**
   * Clear lockout state from storage
   */
  async clear(): Promise<void> {
    try {
      await browser.storage.local.remove(this.STORAGE_KEY);
    } catch (error) {
      throw new Error(`Failed to clear lockout state: ${error}`);
    }
  }
}
