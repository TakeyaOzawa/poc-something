/**
 * MasterPasswordPolicy Entity
 * Manages password policy and lockout rules
 * Domain layer: Business rules for master password
 */

import { MasterPasswordRequirements, ValidationResult } from '../values/MasterPasswordRequirements';
import { PasswordStrength } from '../values/PasswordStrength';

export interface LockoutPolicy {
  maxAttempts: number;
  lockoutDurations: number[]; // milliseconds, progressive lockout
}

export class MasterPasswordPolicy {
  constructor(
    public readonly requirements: typeof MasterPasswordRequirements,
    public readonly lockoutPolicy: LockoutPolicy
  ) {}

  /**
   * Create default policy
   */
  static default(): MasterPasswordPolicy {
    return new MasterPasswordPolicy(MasterPasswordRequirements, {
      maxAttempts: 5,
      lockoutDurations: [
        60000, // 1 minute (1st lockout)
        300000, // 5 minutes (2nd lockout)
        900000, // 15 minutes (3rd+ lockout)
      ],
    });
  }

  /**
   * Create strict policy (for high security environments)
   */
  static strict(): MasterPasswordPolicy {
    return new MasterPasswordPolicy(MasterPasswordRequirements, {
      maxAttempts: 3,
      lockoutDurations: [
        300000, // 5 minutes (1st lockout)
        1800000, // 30 minutes (2nd lockout)
        3600000, // 1 hour (3rd+ lockout)
      ],
    });
  }

  /**
   * Create lenient policy (for development/testing)
   */
  static lenient(): MasterPasswordPolicy {
    return new MasterPasswordPolicy(MasterPasswordRequirements, {
      maxAttempts: 10,
      lockoutDurations: [
        30000, // 30 seconds (1st lockout)
        120000, // 2 minutes (2nd lockout)
        300000, // 5 minutes (3rd+ lockout)
      ],
    });
  }

  /**
   * Validate password against policy requirements
   */
  validatePassword(password: string): ValidationResult {
    return this.requirements.validate(password);
  }

  /**
   * Validate password confirmation
   */
  validateConfirmation(password: string, confirmation: string): ValidationResult {
    return this.requirements.validateConfirmation(password, confirmation);
  }

  /**
   * Validate both password and confirmation
   */
  validateBoth(password: string, confirmation: string): ValidationResult {
    return this.requirements.validateBoth(password, confirmation);
  }

  /**
   * Calculate password strength
   */
  calculateStrength(password: string): PasswordStrength {
    return PasswordStrength.calculate(password);
  }

  /**
   * Get lockout duration for a given lockout count
   * @param lockoutCount Number of times already locked out (0-based)
   */
  getLockoutDuration(lockoutCount: number): number {
    const { lockoutDurations } = this.lockoutPolicy;

    if (lockoutCount < 0) {
      return lockoutDurations[0] || 300; // Default 5 minutes
    }

    // Use the last duration for all subsequent lockouts
    const index = Math.min(lockoutCount, lockoutDurations.length - 1);
    return lockoutDurations[index] || 300; // Default 5 minutes
  }

  /**
   * Check if attempts should trigger lockout
   */
  shouldLockout(failedAttempts: number): boolean {
    return failedAttempts >= this.lockoutPolicy.maxAttempts;
  }

  /**
   * Get remaining attempts before lockout
   */
  getRemainingAttempts(failedAttempts: number): number {
    return Math.max(0, this.lockoutPolicy.maxAttempts - failedAttempts);
  }

  /**
   * Get policy summary
   */
  getSummary(): {
    requirements: ReturnType<typeof MasterPasswordRequirements.getSummary>;
    lockout: {
      maxAttempts: number;
      durations: string[]; // Human-readable durations
    };
  } {
    return {
      requirements: this.requirements.getSummary(),
      lockout: {
        maxAttempts: this.lockoutPolicy.maxAttempts,
        durations: this.lockoutPolicy.lockoutDurations.map((ms) => this.formatDuration(ms)),
      },
    };
  }

  /**
   * Format duration in milliseconds to human-readable string
   */
  private formatDuration(milliseconds: number): string {
    const seconds = milliseconds / 1000;
    const minutes = seconds / 60;
    const hours = minutes / 60;

    if (hours >= 1) {
      return `${Math.round(hours)} hour(s)`;
    }
    if (minutes >= 1) {
      return `${Math.round(minutes)} minute(s)`;
    }
    return `${Math.round(seconds)} second(s)`;
  }

  /**
   * Equality check
   */
  equals(other: MasterPasswordPolicy): boolean {
    return (
      this.lockoutPolicy.maxAttempts === other.lockoutPolicy.maxAttempts &&
      JSON.stringify(this.lockoutPolicy.lockoutDurations) ===
        JSON.stringify(other.lockoutPolicy.lockoutDurations)
    );
  }

  /**
   * String representation
   */
  toString(): string {
    const summary = this.getSummary();
    return `MasterPasswordPolicy(maxAttempts=${summary.lockout.maxAttempts}, lockoutDurations=[${summary.lockout.durations.join(', ')}])`;
  }
}
