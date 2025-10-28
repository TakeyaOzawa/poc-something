/**
 * CheckUnlockStatusUseCase
 * Checks current unlock status of secure storage
 * Use Case layer: Orchestration only, business logic in Domain
 */

import { Result } from '@domain/values/result.value';
import { UnlockStatus } from '@domain/values/UnlockStatus';
import { SecureStorage } from '@domain/types/secure-storage-port.types';
import { LockoutManager } from '@domain/types/lockout-manager.types';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Empty input interface for consistency with other UseCases
export interface CheckUnlockStatusInput {}

export class CheckUnlockStatusUseCase {
  constructor(
    private readonly secureStorage: SecureStorage,
    private readonly lockoutManager: LockoutManager
  ) {}

  /**
   * Execute status check
   * Returns Result<UnlockStatus> with current status
   */
  async execute(_input: CheckUnlockStatusInput = {}): Promise<Result<UnlockStatus>> {
    try {
      // 1. Check if locked out (Domain layer)
      const isLockedOut = await this.lockoutManager.isLockedOut();
      if (isLockedOut) {
        const lockoutStatus = await this.lockoutManager.getStatus();
        const expiresAt = new Date(lockoutStatus.lockoutEndsAt || Date.now());
        const status = UnlockStatus.lockedOut(expiresAt);
        return Result.success(status);
      }

      // 2. Check if unlocked (Infrastructure layer)
      const isUnlocked = this.secureStorage.isUnlocked();
      if (isUnlocked) {
        const sessionExpiresTimestamp = this.secureStorage.getSessionExpiresAt();
        const sessionExpiresAt = new Date(sessionExpiresTimestamp || Date.now() + 3600000);
        const status = UnlockStatus.unlocked(sessionExpiresAt);
        return Result.success(status);
      }

      // 3. Default: locked (Domain layer)
      const status = UnlockStatus.locked();
      return Result.success(status);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.failure(`Failed to check unlock status: ${message}`);
    }
  }
}
