/**
 * Domain Repository Interface: AutomationResultRepository
 * Defines contract for AutomationResult persistence
 */

import { AutomationResult } from '@domain/entities/AutomationResult';
import { Result } from '@domain/values/result.value';
import { ExecutionStatus } from '@domain/constants/ExecutionStatus';

export interface AutomationResultRepository {
  /**
   * Save automation result
   */
  save(result: AutomationResult): Promise<Result<void, Error>>;

  /**
   * Load automation result by ID
   */
  load(id: string): Promise<Result<AutomationResult | null, Error>>;

  /**
   * Load all automation results
   */
  loadAll(): Promise<Result<AutomationResult[], Error>>;

  /**
   * Load automation results by execution status
   * @param status - Execution status to filter by (e.g., 'DOING', 'SUCCESS', 'FAILED')
   * @returns Results matching the specified status
   */
  loadByStatus(status: ExecutionStatus): Promise<Result<AutomationResult[], Error>>;

  /**
   * Load in-progress automation results (status: DOING, within 24 hours)
   * @param websiteId - Optional website ID to filter by
   * @returns In-progress results within 24 hours, optionally filtered by website
   */
  loadInProgress(websiteId?: string): Promise<Result<AutomationResult[], Error>>;

  /**
   * Load in-progress automation results from batch-loaded raw storage data
   * This method enables batch loading optimization by accepting pre-loaded data
   * @param rawStorageData - Raw storage data from batch load (array of AutomationResultData)
   * @param websiteId - Optional website ID to filter by
   * @returns In-progress results within 24 hours, optionally filtered by website
   */
  loadInProgressFromBatch(
    rawStorageData: unknown,
    websiteId?: string
  ): Result<AutomationResult[], Error>;

  /**
   * Load results for specific AutomationVariables
   */
  loadByAutomationVariablesId(variablesId: string): Promise<Result<AutomationResult[], Error>>;

  /**
   * Load latest result for specific AutomationVariables
   * (Returns the most recent entry by startFrom)
   */
  loadLatestByAutomationVariablesId(
    variablesId: string
  ): Promise<Result<AutomationResult | null, Error>>;

  /**
   * Delete automation result by ID
   */
  delete(id: string): Promise<Result<void, Error>>;

  /**
   * Delete all results for specific AutomationVariables
   */
  deleteByAutomationVariablesId(variablesId: string): Promise<Result<void, Error>>;
}
