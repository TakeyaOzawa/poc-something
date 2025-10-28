/**
 * MasterPasswordRequirements Value Object
 * Defines requirements for master password
 * Domain layer: Pure validation logic
 */

import { PasswordStrength } from './PasswordStrength';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class MasterPasswordRequirements {
  // Constants
  static readonly MIN_LENGTH = 8;
  static readonly MAX_LENGTH = 128;
  static readonly MIN_ACCEPTABLE_STRENGTH = 2; // fair or above

  /**
   * Validate password against all requirements
   * Pure function: no side effects
   */
  static validate(password: string): ValidationResult {
    const errors: string[] = [];

    // Empty check
    if (!password || password.trim().length === 0) {
      return {
        isValid: false,
        errors: ['Password is required'],
      };
    }

    // Length requirements
    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters`);
    }

    if (password.length > this.MAX_LENGTH) {
      errors.push(`Password must be at most ${this.MAX_LENGTH} characters`);
    }

    // Strength requirements
    const strength = PasswordStrength.calculate(password);
    if (!strength.isAcceptable()) {
      errors.push('Password is too weak');
      // Include strength feedback
      errors.push(...strength.feedback);
    }

    // Whitespace check
    if (password.startsWith(' ') || password.endsWith(' ')) {
      errors.push('Password cannot start or end with whitespace');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate confirmation matches password
   * Pure function: no side effects
   */
  static validateConfirmation(password: string, confirmation: string): ValidationResult {
    if (!confirmation) {
      return {
        isValid: false,
        errors: ['Confirmation password is required'],
      };
    }

    if (password !== confirmation) {
      return {
        isValid: false,
        errors: ['Passwords do not match'],
      };
    }

    return {
      isValid: true,
      errors: [],
    };
  }

  /**
   * Validate both password and confirmation
   * Returns combined validation result
   */
  static validateBoth(password: string, confirmation: string): ValidationResult {
    const passwordValidation = this.validate(password);
    const confirmationValidation = this.validateConfirmation(password, confirmation);

    const allErrors = [...passwordValidation.errors, ...confirmationValidation.errors];

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  /**
   * Check if password meets minimum length requirement
   */
  static meetsMinLength(password: string): boolean {
    return password.length >= this.MIN_LENGTH;
  }

  /**
   * Check if password meets maximum length requirement
   */
  static meetsMaxLength(password: string): boolean {
    return password.length <= this.MAX_LENGTH;
  }

  /**
   * Check if password is strong enough
   */
  static isStrongEnough(password: string): boolean {
    const strength = PasswordStrength.calculate(password);
    return strength.score >= this.MIN_ACCEPTABLE_STRENGTH;
  }

  /**
   * Get human-readable requirement description
   */
  static getRequirementDescription(): string[] {
    return [
      `At least ${this.MIN_LENGTH} characters`,
      `At most ${this.MAX_LENGTH} characters`,
      'Mix of uppercase and lowercase letters',
      'At least one number',
      'At least one special character',
      'No common patterns or words',
    ];
  }

  /**
   * Create a summary of requirements
   */
  static getSummary(): {
    minLength: number;
    maxLength: number;
    minStrength: number;
    description: string[];
  } {
    return {
      minLength: this.MIN_LENGTH,
      maxLength: this.MAX_LENGTH,
      minStrength: this.MIN_ACCEPTABLE_STRENGTH,
      description: this.getRequirementDescription(),
    };
  }
}
