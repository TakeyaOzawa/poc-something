/**
 * Domain Layer: Secure Storage Interface
 * Defines contract for secure storage operations with session management
 */

import { Result } from '@domain/values/result.value';

/**
 * Session state information
 */
export interface SecureStorageSession {
  isUnlocked: boolean;
  expiresAt: number | null;
}

/**
 * Secure Storage Interface
 * Provides encrypted storage with master password and session management
 */
export interface SecureStorage {
  /**
   * Check if master password has been initialized
   * @returns True if master password is set
   */
  isInitialized(): Promise<Result<boolean, Error>>;

  /**
   * Initialize with master password (first time setup)
   * @param password Master password
   */
  initialize(password: string): Promise<Result<void, Error>>;

  /**
   * Unlock storage with master password
   * @param password Master password
   */
  unlock(password: string): Promise<Result<void, Error>>;

  /**
   * Lock the storage (clear master password from memory)
   */
  lock(): void;

  /**
   * Check if storage is currently unlocked
   * @returns True if unlocked
   */
  isUnlocked(): boolean;

  /**
   * Get the current session expiration time
   * @returns Expiration timestamp or null if locked
   */
  getSessionExpiresAt(): number | null;

  /**
   * Extend the session timer
   */
  extendSession(): void;

  /**
   * Save encrypted data
   * @param key Storage key
   * @param data Data to encrypt and save
   */
  saveEncrypted(key: string, data: unknown): Promise<Result<void, Error>>;

  /**
   * Load and decrypt data
   * @param key Storage key
   * @returns Decrypted data or null if not found
   */
  loadEncrypted<T>(key: string): Promise<Result<T | null, Error>>;

  /**
   * Remove encrypted data
   * @param key Storage key
   */
  removeEncrypted(key: string): Promise<Result<void, Error>>;

  /**
   * Clear all encrypted data
   */
  clearAllEncrypted(): Promise<Result<void, Error>>;

  /**
   * Change master password
   * @param oldPassword Current master password
   * @param newPassword New master password
   */
  changeMasterPassword(oldPassword: string, newPassword: string): Promise<Result<void, Error>>;

  /**
   * Reset master password (WARNING: This will delete all encrypted data)
   */
  reset(): Promise<Result<void, Error>>;
}
