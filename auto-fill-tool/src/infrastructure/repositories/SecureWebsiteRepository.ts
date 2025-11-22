/**
 * Infrastructure Layer: Secure Website Repository
 * Implements WebsiteRepository with encryption using SecureStorage
 */

import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { WebsiteCollection } from '@domain/entities/WebsiteCollection';
import { SecureStorage } from '@domain/ports/SecureStoragePort';
import { Result } from '@domain/values/result.value';

/**
 * Secure Website Repository
 * Encrypts and stores website collection data using SecureStorage
 *
 * Storage Structure:
 * Encrypted JSON string containing array of WebsiteData objects
 */
export class SecureWebsiteRepository implements WebsiteRepository {
  private readonly STORAGE_KEY = 'websites';

  constructor(private secureStorage: SecureStorage) {}

  /**
   * Save website collection (encrypted)
   * @param collection Website collection entity
   * @returns Result containing void on success, or Error on failure
   */
  async save(collection: WebsiteCollection): Promise<Result<void, Error>> {
    try {
      // Check if storage is unlocked
      if (!this.secureStorage.isUnlocked()) {
        return Result.failure<void, Error>(
          new Error('Cannot access encrypted data: Storage is locked. Please authenticate first.')
        );
      }

      // Convert collection to JSON string
      const json = collection.toJSON();

      // Save encrypted
      await this.secureStorage.saveEncrypted(this.STORAGE_KEY, json);

      // Extend session
      this.extendSession();

      return Result.success<void, Error>(undefined);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to save website collection';
      return Result.failure<void, Error>(new Error(errorMessage));
    }
  }

  /**
   * Load website collection (decrypted)
   * @returns Result containing WebsiteCollection on success, or Error on failure
   */
  async load(): Promise<Result<WebsiteCollection, Error>> {
    try {
      // Check if storage is unlocked
      if (!this.secureStorage.isUnlocked()) {
        return Result.failure<WebsiteCollection, Error>(
          new Error('Cannot access encrypted data: Storage is locked. Please authenticate first.')
        );
      }

      // Load and decrypt data
      const jsonResult = await this.secureStorage.loadEncrypted<string>(this.STORAGE_KEY);

      // If no data exists, return empty collection
      if (!jsonResult.isSuccess || !jsonResult.value) {
        this.extendSession();
        return Result.success(WebsiteCollection.empty());
      }

      // Convert JSON to collection
      const collection = WebsiteCollection.fromJSON(jsonResult.value);

      // Extend session
      this.extendSession();

      return Result.success(collection);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load website collection';
      return Result.failure<WebsiteCollection, Error>(new Error(errorMessage));
    }
  }

  /**
   * Extend session timer
   */
  private extendSession(): void {
    this.secureStorage.extendSession();
  }
}
