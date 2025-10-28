/**
 * Domain Layer: Lockout Manager Implementation
 * Manages account lockout after failed authentication attempts
 */

import {
  LockoutManager as ILockoutManager,
  LockoutStatus,
  LockoutStorage,
  LockoutState,
} from '@domain/types/lockout-manager.types';
import { LogAggregatorPort } from '@domain/types/log-aggregator-port.types';
import { SecurityEventLogger } from '@domain/services/SecurityEventLogger';

/**
 * Lockout Manager Implementation
 * Pure domain logic for managing authentication lockouts
 */
export class LockoutManager implements ILockoutManager {
  private state: LockoutState;
  private readonly maxAttempts: number;
  private readonly lockoutDuration: number;
  private readonly storage: LockoutStorage;
  private readonly logAggregator: LogAggregatorPort;

  /**
   * Constructor
   * @param storage Storage interface for persistence
   * @param logAggregator Log aggregator for security events
   * @param maxAttempts Maximum failed attempts before lockout (default: 5)
   * @param lockoutDurationMs Lockout duration in milliseconds (default: 5 minutes)
   */
  constructor(
    storage: LockoutStorage,
    logAggregator: LogAggregatorPort,
    maxAttempts: number = 5,
    lockoutDurationMs: number = 5 * 60 * 1000
  ) {
    if (maxAttempts < 1) {
      throw new Error('Max attempts must be at least 1');
    }
    if (lockoutDurationMs < 1000) {
      throw new Error('Lockout duration must be at least 1 second');
    }

    this.storage = storage;
    this.logAggregator = logAggregator;
    this.maxAttempts = maxAttempts;
    this.lockoutDuration = lockoutDurationMs;
    this.state = {
      failedAttempts: 0,
      lockoutStartedAt: null,
    };
  }

  /**
   * Initialize by loading state from storage
   */
  async initialize(): Promise<void> {
    const savedState = await this.storage.load();
    if (savedState) {
      this.state = savedState;
    }
  }

  /**
   * Record a failed authentication attempt
   * @throws Error if account is locked out
   */
  async recordFailedAttempt(): Promise<void> {
    // Check if locked out
    if (await this.isLockedOut()) {
      throw new Error('Account is locked out');
    }

    // Increment failed attempts
    this.state.failedAttempts += 1;

    // Check if should lock out
    if (this.state.failedAttempts >= this.maxAttempts) {
      this.state.lockoutStartedAt = Date.now();

      // Log security event: LOCKOUT
      const lockoutEndsAt = new Date(this.state.lockoutStartedAt + this.lockoutDuration);
      const remainingTime = Math.ceil(this.lockoutDuration / 60000);
      const lockoutLog = SecurityEventLogger.createLockout(
        'LockoutManager',
        `Account locked out for ${remainingTime} minute(s) after ${this.maxAttempts} failed attempts`,
        {
          lockoutEndsAt: lockoutEndsAt.toISOString(),
          failedAttempts: this.state.failedAttempts,
          maxAttempts: this.maxAttempts,
        }
      );
      await this.logAggregator.addLog(lockoutLog);
    }

    // Persist state
    await this.storage.save(this.state);
  }

  /**
   * Record a successful authentication attempt
   * Clears all failed attempts and lockout state
   */
  async recordSuccessfulAttempt(): Promise<void> {
    this.state = {
      failedAttempts: 0,
      lockoutStartedAt: null,
    };
    await this.storage.save(this.state);
  }

  /**
   * Check if account is currently locked out
   * @returns true if locked out, false otherwise
   */
  async isLockedOut(): Promise<boolean> {
    if (this.state.lockoutStartedAt === null) {
      return false;
    }

    const now = Date.now();
    const lockoutEndsAt = this.state.lockoutStartedAt + this.lockoutDuration;

    // Check if lockout has expired
    if (now >= lockoutEndsAt) {
      // Lockout expired, reset state
      this.state = {
        failedAttempts: 0,
        lockoutStartedAt: null,
      };
      await this.storage.save(this.state);
      return false;
    }

    return true;
  }

  /**
   * Get current lockout status
   * @returns Current lockout status information
   */
  async getStatus(): Promise<LockoutStatus> {
    const isLockedOut = await this.isLockedOut();

    let lockoutEndsAt: number | null = null;
    let remainingLockoutTime = 0;

    if (isLockedOut && this.state.lockoutStartedAt !== null) {
      lockoutEndsAt = this.state.lockoutStartedAt + this.lockoutDuration;
      remainingLockoutTime = Math.max(0, lockoutEndsAt - Date.now());
    }

    return {
      isLockedOut,
      failedAttempts: this.state.failedAttempts,
      lockoutStartedAt: this.state.lockoutStartedAt,
      lockoutEndsAt,
      remainingLockoutTime,
    };
  }

  /**
   * Reset lockout state (admin function)
   * Clears all failed attempts and lockout
   */
  async reset(): Promise<void> {
    this.state = {
      failedAttempts: 0,
      lockoutStartedAt: null,
    };
    await this.storage.clear();
  }

  /**
   * Get number of remaining attempts before lockout
   * @returns Number of attempts remaining, or 0 if already locked out
   */
  async getRemainingAttempts(): Promise<number> {
    if (await this.isLockedOut()) {
      return 0;
    }

    return Math.max(0, this.maxAttempts - this.state.failedAttempts);
  }

  /**
   * Get maximum allowed attempts
   */
  getMaxAttempts(): number {
    return this.maxAttempts;
  }

  /**
   * Get lockout duration in milliseconds
   */
  getLockoutDuration(): number {
    return this.lockoutDuration;
  }
}
