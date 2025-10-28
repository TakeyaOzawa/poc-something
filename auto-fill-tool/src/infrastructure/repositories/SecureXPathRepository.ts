/**
 * Infrastructure Layer: Secure XPath Repository
 * Implements XPathRepository with encryption using SecureStorage
 */

import { XPathRepository } from '@domain/repositories/XPathRepository';
import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';
import { SecureStorage } from '@domain/types/secure-storage-port.types';
import { Result } from '@domain/values/result.value';

/**
 * Secure XPath Repository
 * Encrypts and stores XPath collection data using SecureStorage
 *
 * Storage Structure:
 * Encrypted array of XPathData objects
 */
export class SecureXPathRepository implements XPathRepository {
  private readonly STORAGE_KEY = 'xpaths';

  constructor(private secureStorage: SecureStorage) {}

  /**
   * Save XPath collection (encrypted)
   * @param collection XPath collection entity
   * @returns Result with void on success, Error if storage is locked or save fails
   */
  async save(collection: XPathCollection): Promise<Result<void, Error>> {
    // Check session
    const sessionCheck = this.checkSession();
    if (sessionCheck.isFailure) {
      return sessionCheck;
    }

    try {
      // Convert collection to array of XPathData
      const xpaths = collection.getAll();

      // Save encrypted
      await this.secureStorage.saveEncrypted(this.STORAGE_KEY, xpaths);

      // Extend session
      this.extendSession();

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to save XPath collection')
      );
    }
  }

  /**
   * Load XPath collection (decrypted)
   * @returns Result with XPath collection entity on success, Error if storage is locked or load fails
   */
  async load(): Promise<Result<XPathCollection, Error>> {
    // Check session
    const sessionCheck = this.checkSession();
    if (sessionCheck.isFailure) {
      return Result.failure(sessionCheck.error!);
    }

    try {
      // Load and decrypt data
      const xpaths = await this.secureStorage.loadEncrypted<XPathData[]>(this.STORAGE_KEY);

      // If no data exists, return empty collection
      if (!xpaths || !Array.isArray(xpaths)) {
        this.extendSession();
        return Result.success(XPathCollection.empty());
      }

      // Reconstruct collection from array
      const collection = new XPathCollection(xpaths);

      // Extend session
      this.extendSession();

      return Result.success(collection);
    } catch (error) {
      return Result.failure(
        error instanceof Error ? error : new Error('Failed to load XPath collection')
      );
    }
  }

  /**
   * Load XPaths for a specific website (decrypted and filtered)
   * @param websiteId Website ID to filter by
   * @returns Result with XPathData array on success, Error if storage is locked or load fails
   */
  async loadByWebsiteId(websiteId: string): Promise<Result<XPathData[], Error>> {
    // Load the entire collection
    const collectionResult = await this.load();
    if (collectionResult.isFailure) {
      return Result.failure(collectionResult.error!);
    }

    const collection = collectionResult.value!;
    const xpaths = collection.getByWebsiteId(websiteId);

    return Result.success(xpaths);
  }

  /**
   * Load XPaths from batch-loaded raw storage data
   * Note: Batch loading is not supported for encrypted storage as it requires
   * session management and decryption. Use the standard load() or loadByWebsiteId() methods instead.
   * @param rawStorageData Raw storage data (not used for secure storage)
   * @param websiteId Optional website ID (not used for secure storage)
   * @returns Error indicating batch loading is not supported
   */
  loadFromBatch(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- rawStorageData parameter required by interface but not used in secure storage implementation
    rawStorageData: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- websiteId parameter required by interface but not used in secure storage implementation
    websiteId?: string
  ): Result<XPathData[] | XPathCollection, Error> {
    return Result.failure(
      new Error('Batch loading is not supported for encrypted storage. Use load() method instead.')
    );
  }

  /**
   * Check if storage is unlocked
   * @returns Result with void on success, Error with descriptive message if locked
   */
  private checkSession(): Result<void, Error> {
    if (!this.secureStorage.isUnlocked()) {
      return Result.failure(
        new Error('Cannot access encrypted data: Storage is locked. Please authenticate first.')
      );
    }
    return Result.success(undefined);
  }

  /**
   * Extend session timer
   */
  private extendSession(): void {
    this.secureStorage.extendSession();
  }
}
