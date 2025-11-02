/**
 * UnlockStorageUseCase
 * Unlocks secure storage with master password
 * Use Case layer: Orchestration only, business logic in Domain/Infrastructure
 */

import { Result } from '@domain/values/result.value';
import { UnlockStatus } from '@domain/values/UnlockStatus';
import { SecureStorage } from '@domain/types/secure-storage-port.types';
import { LockoutManager } from '@domain/types/lockout-manager.types';
import { LogAggregatorPort } from '@domain/types/log-aggregator-port.types';
import { SecurityEventLogger } from '@domain/services/SecurityEventLogger';

export interface UnlockStorageInput {
  password: string;
}

export class UnlockStorageUseCase {
  constructor(
    private readonly secureStorage: SecureStorage,
    private readonly lockoutManager: LockoutManager,
    private readonly logAggregator: LogAggregatorPort
  ) {}

  /**
   * Execute unlock
   * Returns Result<UnlockStatus> on success or failure with status
   */
  async execute(input: UnlockStorageInput): Promise<Result<UnlockStatus>> {
    // 1. Check if locked out (Domain layer)
    const isLockedOut = await this.lockoutManager.isLockedOut();
    if (isLockedOut) {
      const lockoutStatus = await this.lockoutManager.getStatus();
      const expiresAt = new Date(lockoutStatus.lockoutEndsAt || Date.now());
      const status = UnlockStatus.lockedOut(expiresAt);
      return Result.failure('Too many failed attempts. Please try again later.', status);
    }

    // 2. Attempt to unlock (Infrastructure layer)
    const unlockResult = await this.secureStorage.unlock(input.password);
    if (unlockResult.isFailure) {
      // Failure: record failed attempt
      await this.lockoutManager.recordFailedAttempt();

      // Log security event: AUTHENTICATION_FAILURE
      const failureLog = SecurityEventLogger.createFailedAuth(
        'UnlockStorageUseCase',
        `Authentication failed: ${unlockResult.error!.message}`
      );
      await this.logAggregator.add(failureLog);

      // Check if now locked out
      const isNowLockedOut = await this.lockoutManager.isLockedOut();
      if (isNowLockedOut) {
        const lockoutStatus = await this.lockoutManager.getStatus();
        const expiresAt = new Date(lockoutStatus.lockoutEndsAt || Date.now());
        const remainingTime = Math.ceil((expiresAt.getTime() - Date.now()) / 60000);
        const status = UnlockStatus.lockedOut(expiresAt);
        return Result.failure(
          `Too many failed attempts. Locked out for ${remainingTime} minute(s).`,
          status
        );
      }

      // Not locked out yet, just invalid password
      const lockoutStatus = await this.lockoutManager.getStatus();
      const status = UnlockStatus.locked();
      const remainingAttempts = Math.max(0, 5 - lockoutStatus.failedAttempts); // Assuming max 5 attempts
      return Result.failure(`Invalid password. ${remainingAttempts} attempt(s) remaining.`, status);
    }

    // Success: reset lockout counter
    await this.lockoutManager.recordSuccessfulAttempt();

    // Log security event: STORAGE_UNLOCK
    const unlockLog = SecurityEventLogger.createStorageUnlock(
      'UnlockStorageUseCase',
      'Secure storage unlocked successfully'
    );
    await this.logAggregator.addLog(unlockLog);

    // Get session expiry
    const sessionExpiresTimestamp = this.secureStorage.getSessionExpiresAt();
    const sessionExpiresAt = new Date(sessionExpiresTimestamp || Date.now() + 3600000);

    // Return unlocked status (Domain layer)
    const status = UnlockStatus.unlocked(sessionExpiresAt);
    return Result.success(status);
  }
}
