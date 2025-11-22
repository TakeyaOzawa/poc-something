/**
 * Domain Port Interface: Sync Port
 * Handles data synchronization between local storage and external sources
 */

import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { SyncResult } from '@domain/entities/SyncResult';

export type SyncDirection = 'send' | 'receive' | 'bidirectional';

export interface SyncProgress {
  /**
   * Current step being executed
   */
  currentStep: string;

  /**
   * Total number of steps
   */
  totalSteps: number;

  /**
   * Number of completed steps
   */
  completedSteps: number;

  /**
   * Progress percentage (0-100)
   */
  percentage: number;

  /**
   * Optional message
   */
  message?: string;
}

export interface SyncPort {
  /**
   * Execute synchronization according to configuration
   *
   * @param config Sync configuration
   * @param progressCallback Optional callback for progress updates
   * @returns Sync result with statistics
   * @throws Error if sync fails
   *
   * @example
   * const result = await syncService.sync(config, (progress) => {
   *   console.log(`Progress: ${progress.percentage}%`);
   * });
   */
  sync(
    config: StorageSyncConfig,
    progressCallback?: (progress: SyncProgress) => void
  ): Promise<SyncResult>;

  /**
   * Execute receive-only synchronization (download from external source)
   *
   * @param config Sync configuration
   * @param progressCallback Optional callback for progress updates
   * @returns Sync result with statistics
   * @throws Error if sync fails
   */
  syncReceive(
    config: StorageSyncConfig,
    progressCallback?: (progress: SyncProgress) => void
  ): Promise<SyncResult>;

  /**
   * Execute send-only synchronization (upload to external source)
   *
   * @param config Sync configuration
   * @param progressCallback Optional callback for progress updates
   * @returns Sync result with statistics
   * @throws Error if sync fails
   */
  syncSend(
    config: StorageSyncConfig,
    progressCallback?: (progress: SyncProgress) => void
  ): Promise<SyncResult>;

  /**
   * Validate sync configuration
   *
   * @param config Sync configuration to validate
   * @returns Validation result with error messages if invalid
   *
   * @example
   * const validation = await syncService.validateConfig(config);
   * if (!validation.valid) {
   *   console.error(validation.errors);
   * }
   */
  validateConfig(config: StorageSyncConfig): Promise<{
    valid: boolean;
    errors: string[];
  }>;

  /**
   * Test connection to external data source
   *
   * @param config Sync configuration
   * @returns True if connection is successful
   * @throws Error if connection fails
   *
   * @example
   * try {
   *   const connected = await syncService.testConnection(config);
   *   console.log('Connection successful');
   * } catch (error) {
   *   console.error('Connection failed:', error);
   * }
   */
  testConnection(config: StorageSyncConfig): Promise<boolean>;
}
