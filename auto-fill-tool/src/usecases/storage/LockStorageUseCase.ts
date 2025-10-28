/**
 * LockStorageUseCase
 * Locks secure storage and ends current session
 * Use Case layer: Orchestration only, business logic in Domain
 */

import { Result } from '@domain/values/result.value';
import { SecureStorage } from '@domain/types/secure-storage-port.types';
import { LogAggregatorPort } from '@domain/types/log-aggregator-port.types';
import { SecurityEventLogger } from '@domain/services/SecurityEventLogger';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Empty input interface for consistency with other UseCases
export interface LockStorageInput {}

export class LockStorageUseCase {
  constructor(
    private readonly secureStorage: SecureStorage,
    private readonly logAggregator: LogAggregatorPort
  ) {}

  /**
   * Execute lock
   * Returns Result<void> on success, Result with error on failure
   */
  async execute(_input: LockStorageInput = {}): Promise<Result<void>> {
    try {
      await this.secureStorage.lock();

      // Log security event: STORAGE_LOCK
      const lockLog = SecurityEventLogger.createStorageLock(
        'LockStorageUseCase',
        'Secure storage locked successfully'
      );
      await this.logAggregator.addLog(lockLog);

      return Result.success(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.failure(`Failed to lock storage: ${message}`);
    }
  }
}
