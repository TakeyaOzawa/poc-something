/**
 * Infrastructure Layer: Secure Storage Adapter
 * Manages encrypted storage with master password and session management
 * Adapts Chrome Storage API for secure encrypted storage operations
 */

import { SecureStorage } from '@domain/types/secure-storage-port.types';
import { CryptoAdapter, EncryptedData } from '@domain/types/crypto-port.types';
import { SessionManager } from '@domain/services/SessionManager';
import { PasswordValidator } from '@domain/services/PasswordValidator';
import { SESSION_CONFIG } from '@domain/constants/SessionConfig';
import { Result } from '@domain/values/result.value';
import browser from 'webextension-polyfill';

/**
 * Secure Storage Adapter
 * Provides session-based encrypted storage with automatic locking
 * Implements SecureStorage interface with dependency injection
 */
export class SecureStorageAdapter implements SecureStorage {
  private masterPassword: string | null = null;
  private readonly sessionManager: SessionManager;
  private readonly cryptoAdapter: CryptoAdapter;
  private readonly passwordValidator: PasswordValidator;
  private readonly SESSION_DURATION = SESSION_CONFIG.DURATION_MS; // Business rule from domain
  private readonly STORAGE_KEY_PREFIX = 'secure_';
  private readonly MASTER_PASSWORD_HASH_KEY = 'master_password_hash';

  /**
   * Constructor with dependency injection
   * @param cryptoAdapter Crypto service for encryption/decryption
   */
  constructor(cryptoAdapter: CryptoAdapter) {
    this.cryptoAdapter = cryptoAdapter;
    this.passwordValidator = new PasswordValidator();
    this.sessionManager = new SessionManager(this.SESSION_DURATION);
  }

  /**
   * Check if master password has been initialized
   */
  async isInitialized(): Promise<Result<boolean, Error>> {
    try {
      const result = await browser.storage.local.get(this.MASTER_PASSWORD_HASH_KEY);
      return Result.success(!!result[this.MASTER_PASSWORD_HASH_KEY]);
    } catch (error) {
      return Result.failure(new Error(`Failed to check initialization status: ${error}`));
    }
  }

  /**
   * Initialize with master password (first time setup)
   * @param password Master password
   */
  async initialize(password: string): Promise<Result<void, Error>> {
    try {
      const initResult = await this.isInitialized();
      if (initResult.isFailure) {
        return Result.failure(initResult.error!);
      }
      if (initResult.value) {
        return Result.failure(new Error('Master password already initialized'));
      }

      // Delegate password validation to domain service
      const validation = this.passwordValidator.validate(password);
      if (!validation.valid) {
        return Result.failure(new Error(validation.errors.join(', ')));
      }

      // Store password hash for verification (encrypted with itself)
      const passwordHash = await this.cryptoAdapter.encryptData('VALID_PASSWORD', password);
      await browser.storage.local.set({
        [this.MASTER_PASSWORD_HASH_KEY]: passwordHash,
      });

      // Unlock the session
      this.masterPassword = password;
      this.sessionManager.startSession(() => this.lock());
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Unlock with master password
   * @param password Master password
   */
  async unlock(password: string): Promise<Result<void, Error>> {
    try {
      const initResult = await this.isInitialized();
      if (initResult.isFailure) {
        return Result.failure(initResult.error!);
      }
      if (!initResult.value) {
        return Result.failure(new Error('Master password not initialized. Please initialize first.'));
      }

      // Verify password by decrypting the stored hash
      const result = await browser.storage.local.get(this.MASTER_PASSWORD_HASH_KEY);
      const passwordHash = result[this.MASTER_PASSWORD_HASH_KEY] as EncryptedData;

      try {
        const decrypted = await this.cryptoAdapter.decryptData(passwordHash, password);
        if (decrypted !== 'VALID_PASSWORD') {
          return Result.failure(new Error('Invalid password'));
        }
      } catch (error) {
        return Result.failure(new Error('Invalid password or corrupted data'));
      }

      // Password is valid, unlock the session
      this.masterPassword = password;
      this.sessionManager.startSession(() => this.lock());
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Lock the storage (clear master password from memory)
   */
  lock(): void {
    this.masterPassword = null;
    this.sessionManager.endSession();

    // Clear Chrome alarms
    if (typeof browser.alarms !== 'undefined') {
      browser.alarms.clear('secure-storage-session');
    }
  }

  /**
   * Check if storage is unlocked
   */
  isUnlocked(): boolean {
    return this.sessionManager.isSessionActive();
  }

  /**
   * Get the current session expiration time
   */
  getSessionExpiresAt(): number | null {
    return this.sessionManager.getExpiresAt();
  }

  /**
   * Extend the session timer
   */
  extendSession(): void {
    this.sessionManager.extendSession();
  }

  /**
   * Save encrypted data
   * @param key Storage key
   * @param data Data to encrypt and save
   */
  async saveEncrypted(key: string, data: any): Promise<Result<void, Error>> {
    try {
      if (!this.isUnlocked()) {
        return Result.failure(new Error('Storage is locked. Please unlock first.'));
      }

      const plaintext = JSON.stringify(data);
      const encrypted = await this.cryptoAdapter.encryptData(plaintext, this.masterPassword!);

      const storageKey = this.STORAGE_KEY_PREFIX + key;
      await browser.storage.local.set({
        [storageKey]: encrypted,
      });
      
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Load and decrypt data
   * @param key Storage key
   * @returns Decrypted data or null if not found
   */
  async loadEncrypted<T>(key: string): Promise<Result<T | null, Error>> {
    try {
      if (!this.isUnlocked()) {
        return Result.failure(new Error('Storage is locked. Please unlock first.'));
      }

      const storageKey = this.STORAGE_KEY_PREFIX + key;
      const result = await browser.storage.local.get(storageKey);

      if (!result[storageKey]) {
        return Result.success(null);
      }

      const encrypted = result[storageKey] as EncryptedData;
      const plaintext = await this.cryptoAdapter.decryptData(encrypted, this.masterPassword!);

      return Result.success(JSON.parse(plaintext) as T);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Remove encrypted data
   * @param key Storage key
   */
  async removeEncrypted(key: string): Promise<Result<void, Error>> {
    try {
      const storageKey = this.STORAGE_KEY_PREFIX + key;
      await browser.storage.local.remove(storageKey);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Clear all encrypted data
   */
  async clearAllEncrypted(): Promise<Result<void, Error>> {
    try {
      const allData = await browser.storage.local.get(null);
      const keysToRemove = Object.keys(allData).filter((key) =>
        key.startsWith(this.STORAGE_KEY_PREFIX)
      );
      await browser.storage.local.remove(keysToRemove);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Change master password
   * @param oldPassword Current master password
   * @param newPassword New master password
   */
  async changeMasterPassword(oldPassword: string, newPassword: string): Promise<Result<void, Error>> {
    try {
      // Verify old password
      if (!this.isUnlocked() || this.masterPassword !== oldPassword) {
        const unlockResult = await this.unlock(oldPassword);
        if (unlockResult.isFailure) {
          return unlockResult;
        }
      }

      // Delegate password validation to domain service
      const validation = this.passwordValidator.validate(newPassword);
      if (!validation.valid) {
        return Result.failure(new Error(validation.errors.join(', ')));
      }

      // Re-encrypt all data with new password
      const allData = await browser.storage.local.get(null);
      const encryptedKeys = Object.keys(allData).filter((key) =>
        key.startsWith(this.STORAGE_KEY_PREFIX)
      );

      // Decrypt all data with old password
      const decryptedData: Record<string, any> = {};
      for (const storageKey of encryptedKeys) {
        const key = storageKey.replace(this.STORAGE_KEY_PREFIX, '');
        const encrypted = allData[storageKey] as EncryptedData;
        const plaintext = await this.cryptoAdapter.decryptData(encrypted, oldPassword);
        decryptedData[key] = JSON.parse(plaintext);
      }

      // Update master password hash
      const newPasswordHash = await this.cryptoAdapter.encryptData('VALID_PASSWORD', newPassword);
      await browser.storage.local.set({
        [this.MASTER_PASSWORD_HASH_KEY]: newPasswordHash,
      });

      // Re-encrypt all data with new password
      for (const [key, data] of Object.entries(decryptedData)) {
        const plaintext = JSON.stringify(data);
        const encrypted = await this.cryptoAdapter.encryptData(plaintext, newPassword);
        const storageKey = this.STORAGE_KEY_PREFIX + key;
        await browser.storage.local.set({
          [storageKey]: encrypted,
        });
      }

      // Update session
      this.masterPassword = newPassword;
      this.sessionManager.startSession(() => this.lock());
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Reset master password (WARNING: This will delete all encrypted data)
   */
  async reset(): Promise<Result<void, Error>> {
    try {
      const clearResult = await this.clearAllEncrypted();
      if (clearResult.isFailure) {
        return clearResult;
      }
      
      await browser.storage.local.remove(this.MASTER_PASSWORD_HASH_KEY);
      this.lock();
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
