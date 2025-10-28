/**
 * UnlockStatus Value Object
 * Represents the current unlock state of secure storage
 * Domain layer: Immutable state representation
 */

export class UnlockStatus {
  private constructor(
    public readonly isUnlocked: boolean,
    public readonly sessionExpiresAt: Date | null,
    public readonly isLockedOut: boolean,
    public readonly lockoutExpiresAt: Date | null
  ) {}

  /**
   * Create a locked status
   * Storage is locked, not locked out
   */
  static locked(): UnlockStatus {
    return new UnlockStatus(false, null, false, null);
  }

  /**
   * Create an unlocked status
   * @param sessionExpiresAt When the session will expire
   */
  static unlocked(sessionExpiresAt: Date): UnlockStatus {
    return new UnlockStatus(true, sessionExpiresAt, false, null);
  }

  /**
   * Create a locked out status
   * Storage is locked due to too many failed attempts
   * @param lockoutExpiresAt When the lockout will expire
   */
  static lockedOut(lockoutExpiresAt: Date): UnlockStatus {
    return new UnlockStatus(false, null, true, lockoutExpiresAt);
  }

  /**
   * Check if user can attempt to unlock
   */
  canUnlock(): boolean {
    return !this.isLockedOut;
  }

  /**
   * Check if unlock is required
   */
  needsUnlock(): boolean {
    return !this.isUnlocked;
  }

  /**
   * Check if session is active
   */
  hasActiveSession(): boolean {
    return this.isUnlocked && this.sessionExpiresAt !== null;
  }

  /**
   * Get remaining session time in milliseconds
   * Returns 0 if not unlocked or session expired
   */
  getRemainingSessionTime(): number {
    if (!this.sessionExpiresAt) return 0;
    return Math.max(0, this.sessionExpiresAt.getTime() - Date.now());
  }

  /**
   * Get remaining lockout time in milliseconds
   * Returns 0 if not locked out or lockout expired
   */
  getRemainingLockoutTime(): number {
    if (!this.lockoutExpiresAt) return 0;
    return Math.max(0, this.lockoutExpiresAt.getTime() - Date.now());
  }

  /**
   * Check if session is about to expire (within 1 minute)
   */
  isSessionExpiringSoon(): boolean {
    const remaining = this.getRemainingSessionTime();
    return remaining > 0 && remaining <= 60000; // 1 minute
  }

  /**
   * Check if session has expired
   */
  hasSessionExpired(): boolean {
    if (!this.sessionExpiresAt) return false;
    return Date.now() >= this.sessionExpiresAt.getTime();
  }

  /**
   * Check if lockout has expired
   */
  hasLockoutExpired(): boolean {
    if (!this.lockoutExpiresAt) return false;
    return Date.now() >= this.lockoutExpiresAt.getTime();
  }

  /**
   * Get status as a string
   */
  getStatusString(): string {
    if (this.isLockedOut) return 'locked_out';
    if (this.isUnlocked) return 'unlocked';
    return 'locked';
  }

  /**
   * Get human-readable status description
   */
  getDescription(): string {
    if (this.isLockedOut) {
      const remainingMinutes = Math.ceil(this.getRemainingLockoutTime() / 60000);
      return `Locked out for ${remainingMinutes} minute(s)`;
    }

    if (this.isUnlocked) {
      const remainingMinutes = Math.ceil(this.getRemainingSessionTime() / 60000);
      return `Unlocked (${remainingMinutes} minute(s) remaining)`;
    }

    return 'Locked';
  }

  /**
   * Get remaining time as formatted string (MM:SS)
   */
  getFormattedRemainingTime(): string {
    const milliseconds = this.isLockedOut
      ? this.getRemainingLockoutTime()
      : this.getRemainingSessionTime();

    if (milliseconds === 0) return '00:00';

    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  /**
   * Create a new status with updated session expiry
   * Useful for extending session
   */
  withExtendedSession(additionalTime: number): UnlockStatus {
    if (!this.sessionExpiresAt) {
      throw new Error('Cannot extend session: not unlocked');
    }

    const newExpiry = new Date(this.sessionExpiresAt.getTime() + additionalTime);
    return UnlockStatus.unlocked(newExpiry);
  }

  /**
   * Equality check
   */
  equals(other: UnlockStatus): boolean {
    return (
      this.isUnlocked === other.isUnlocked &&
      this.isLockedOut === other.isLockedOut &&
      this.sessionExpiresAt?.getTime() === other.sessionExpiresAt?.getTime() &&
      this.lockoutExpiresAt?.getTime() === other.lockoutExpiresAt?.getTime()
    );
  }

  /**
   * String representation
   */
  toString(): string {
    return `UnlockStatus(${this.getStatusString()})`;
  }

  /**
   * Convert to plain object (for serialization)
   */
  toObject(): {
    isUnlocked: boolean;
    sessionExpiresAt: string | null;
    isLockedOut: boolean;
    lockoutExpiresAt: string | null;
  } {
    return {
      isUnlocked: this.isUnlocked,
      sessionExpiresAt: this.sessionExpiresAt?.toISOString() || null,
      isLockedOut: this.isLockedOut,
      lockoutExpiresAt: this.lockoutExpiresAt?.toISOString() || null,
    };
  }

  /**
   * Create from plain object (for deserialization)
   */
  static fromObject(obj: {
    isUnlocked: boolean;
    sessionExpiresAt: string | null;
    isLockedOut: boolean;
    lockoutExpiresAt: string | null;
  }): UnlockStatus {
    return new UnlockStatus(
      obj.isUnlocked,
      obj.sessionExpiresAt ? new Date(obj.sessionExpiresAt) : null,
      obj.isLockedOut,
      obj.lockoutExpiresAt ? new Date(obj.lockoutExpiresAt) : null
    );
  }
}
