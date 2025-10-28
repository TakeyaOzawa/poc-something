/**
 * Domain Layer: Lockout Manager Interface
 * Manages account lockout after failed authentication attempts
 */

/**
 * Lockout state data
 */
export interface LockoutState {
  failedAttempts: number;
  lockoutStartedAt: number | null;
}

/**
 * Storage interface for lockout state persistence
 */
export interface LockoutStorage {
  save(state: LockoutState): Promise<void>;
  load(): Promise<LockoutState | null>;
  clear(): Promise<void>;
}

/**
 * Lockout status information
 */
export interface LockoutStatus {
  /** Whether the account is currently locked out */
  isLockedOut: boolean;
  /** Number of failed attempts */
  failedAttempts: number;
  /** Timestamp when lockout started (null if not locked out) */
  lockoutStartedAt: number | null;
  /** Timestamp when lockout will end (null if not locked out) */
  lockoutEndsAt: number | null;
  /** Remaining lockout time in milliseconds (0 if not locked out) */
  remainingLockoutTime: number;
}

/**
 * Lockout Manager
 * Tracks and manages authentication failure lockouts
 *
 * @example
 * ```typescript
 * const lockoutManager = new LockoutManager(5, 5 * 60 * 1000); // 5 attempts, 5 min lockout
 *
 * // After failed login
 * await lockoutManager.recordFailedAttempt();
 * const status = await lockoutManager.getStatus();
 * if (status.isLockedOut) {
 *   console.log(`Locked out for ${status.remainingLockoutTime}ms`);
 * }
 *
 * // After successful login
 * await lockoutManager.recordSuccessfulAttempt();
 * ```
 */
export interface LockoutManager {
  /**
   * Record a failed authentication attempt
   * @throws Error if account is locked out
   */
  recordFailedAttempt(): Promise<void>;

  /**
   * Record a successful authentication attempt
   * Clears all failed attempts and lockout state
   */
  recordSuccessfulAttempt(): Promise<void>;

  /**
   * Check if account is currently locked out
   * @returns true if locked out, false otherwise
   */
  isLockedOut(): Promise<boolean>;

  /**
   * Get current lockout status
   * @returns Current lockout status information
   */
  getStatus(): Promise<LockoutStatus>;

  /**
   * Reset lockout state (admin function)
   * Clears all failed attempts and lockout
   */
  reset(): Promise<void>;

  /**
   * Get number of remaining attempts before lockout
   * @returns Number of attempts remaining, or 0 if already locked out
   */
  getRemainingAttempts(): Promise<number>;
}
