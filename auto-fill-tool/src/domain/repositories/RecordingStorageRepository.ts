/**
 * Domain Layer: Recording Storage Repository Interface
 * Defines contract for persisting and retrieving tab recording data
 */

import { TabRecording } from '@domain/entities/TabRecording';
import { Result } from '@domain/values/result.value';

export interface RecordingStorageRepository {
  /**
   * Save a tab recording
   */
  save(recording: TabRecording): Promise<Result<void, Error>>;

  /**
   * Load a tab recording by its ID
   */
  load(id: string): Promise<Result<TabRecording | null, Error>>;

  /**
   * Load a tab recording by automation result ID
   */
  loadByAutomationResultId(resultId: string): Promise<Result<TabRecording | null, Error>>;

  /**
   * Load the latest tab recording for a given automation variables ID
   * This finds the most recent AutomationResult for the variables and returns its recording
   */
  loadLatestByAutomationVariablesId(
    variablesId: string
  ): Promise<Result<TabRecording | null, Error>>;

  /**
   * Load all tab recordings
   */
  loadAll(): Promise<Result<TabRecording[], Error>>;

  /**
   * Delete a tab recording by its ID
   */
  delete(id: string): Promise<Result<void, Error>>;

  /**
   * Delete a tab recording by automation result ID
   */
  deleteByAutomationResultId(resultId: string): Promise<Result<void, Error>>;

  /**
   * Delete old recordings older than the retention period
   * @param retentionDays Number of days to retain recordings (recordings older than this will be deleted)
   * @returns Number of recordings deleted
   */
  deleteOldRecordings(retentionDays: number): Promise<Result<number, Error>>;

  /**
   * Get total storage size used by all recordings (in bytes)
   */
  getStorageSize(): Promise<Result<number, Error>>;
}
