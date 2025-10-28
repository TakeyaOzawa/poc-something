/**
 * Domain Repository Interface: Automation Variables Repository
 */

import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { Result } from '@domain/values/result.value';

export interface AutomationVariablesRepository {
  /**
   * Save automation variables for a specific website
   */
  save(variables: AutomationVariables): Promise<Result<void, Error>>;

  /**
   * Load automation variables for a specific website
   * Returns null if not found
   */
  load(websiteId: string): Promise<Result<AutomationVariables | null, Error>>;

  /**
   * Load all automation variables
   */
  loadAll(): Promise<Result<AutomationVariables[], Error>>;

  /**
   * Delete automation variables for a specific website
   */
  delete(websiteId: string): Promise<Result<void, Error>>;

  /**
   * Check if automation variables exist for a specific website
   */
  exists(websiteId: string): Promise<Result<boolean, Error>>;

  /**
   * Load automation variables from batch-loaded raw storage data
   * This method enables batch loading optimization by accepting pre-loaded data
   * @param rawStorageData - Raw storage data from batch load (AutomationVariables data array)
   * @param websiteId - Website ID to find
   * @returns AutomationVariables for the specified website, or null if not found
   */
  loadFromBatch(
    rawStorageData: unknown,
    websiteId: string
  ): Result<AutomationVariables | null, Error>;
}
