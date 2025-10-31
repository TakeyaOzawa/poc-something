import { Result } from '@domain/values/result.value';
import { StorageKey } from '@domain/constants/StorageKeys';

/**
 * Interface for batch loading multiple storage keys at once
 *
 * This interface enables performance optimization by consolidating
 * multiple Chrome Storage API calls into a single batch operation.
 *
 * Benefits:
 * - Reduces Chrome Storage API calls from N to 1
 * - Decreases overall loading time by ~67% (from 3×50ms to 1×50ms)
 * - Maintains Clean Architecture (UseCase depends on Domain interface)
 *
 * @example
 * ```typescript
 * const result = await batchLoader.loadBatch([
 *   STORAGE_KEYS.XPATH_COLLECTION,
 *   STORAGE_KEYS.AUTOMATION_VARIABLES,
 *   STORAGE_KEYS.AUTOMATION_RESULTS,
 * ]);
 *
 * if (result.isSuccess) {
 *   const xpaths = result.value.get(STORAGE_KEYS.XPATH_COLLECTION);
 *   const variables = result.value.get(STORAGE_KEYS.AUTOMATION_VARIABLES);
 *   const results = result.value.get(STORAGE_KEYS.AUTOMATION_RESULTS);
 * }
 * ```
 */
export interface BatchStorageLoader {
  /**
   * Loads multiple storage keys in a single batch operation
   *
   * @param keys - Array of storage keys to load
   * @returns Result containing a Map of storage keys to their raw data
   *
   * @remarks
   * - Returns empty data (undefined) for keys that don't exist in storage
   * - All keys are loaded atomically in a single Chrome Storage API call
   * - Raw data must be parsed/deserialized by the caller or repository
   */
  loadBatch(keys: StorageKey[]): Promise<Result<Map<StorageKey, unknown>, Error>>;
}
