/**
 * Mock LockoutManager for Testing
 * Shared mock implementation of LockoutManager interface
 */

import {
  LockoutManager as ILockoutManager,
  LockoutStatus,
} from '@domain/types/lockout-manager.types';

export class MockLockoutManager implements ILockoutManager {
  // State properties
  isLockedOutState = false;
  lockoutExpiry = new Date(Date.now() + 300000); // 5 minutes from now (default)
  failedAttempts = 0;
  remainingAttempts = 5;
  lockoutStartedAt: number | null = null;

  // Tracking properties for assertions
  resetCalled = false;
  recordFailedAttemptCalled = false;
  recordSuccessfulAttemptCalled = false;

  async isLockedOut(): Promise<boolean> {
    return this.isLockedOutState;
  }

  async getStatus(): Promise<LockoutStatus> {
    const lockoutEndsAt = this.isLockedOutState ? this.lockoutExpiry.getTime() : null;
    const remainingLockoutTime = lockoutEndsAt ? Math.max(0, lockoutEndsAt - Date.now()) : 0;

    return {
      isLockedOut: this.isLockedOutState,
      failedAttempts: this.failedAttempts,
      lockoutStartedAt: this.lockoutStartedAt,
      lockoutEndsAt,
      remainingLockoutTime,
    };
  }

  async recordFailedAttempt(): Promise<void> {
    this.recordFailedAttemptCalled = true;
    this.failedAttempts++;

    // Trigger lockout after 5 failed attempts
    if (this.failedAttempts >= 5) {
      this.isLockedOutState = true;
      this.lockoutStartedAt = Date.now();
      this.lockoutExpiry = new Date(Date.now() + 300000); // 5 minutes from now
    }
  }

  async recordSuccessfulAttempt(): Promise<void> {
    this.recordSuccessfulAttemptCalled = true;
    this.failedAttempts = 0;
    this.isLockedOutState = false;
    this.lockoutStartedAt = null;
  }

  async reset(): Promise<void> {
    this.resetCalled = true;
    this.failedAttempts = 0;
    this.isLockedOutState = false;
    this.lockoutStartedAt = null;
  }

  async getRemainingAttempts(): Promise<number> {
    return this.remainingAttempts;
  }

  // Helper methods for test setup
  setLockedOut(lockedOut: boolean): void {
    this.isLockedOutState = lockedOut;
    if (lockedOut && !this.lockoutStartedAt) {
      this.lockoutStartedAt = Date.now();
    }
  }

  setRemainingAttempts(attempts: number): void {
    this.remainingAttempts = attempts;
  }

  setLockoutExpiry(expiry: Date): void {
    this.lockoutExpiry = expiry;
  }

  resetTracking(): void {
    this.resetCalled = false;
    this.recordFailedAttemptCalled = false;
    this.recordSuccessfulAttemptCalled = false;
    this.failedAttempts = 0;
  }
}
