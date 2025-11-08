/**
 * Infrastructure Layer: Password Validator Adapter
 * Implements password validation logic
 */

import {
  PasswordValidatorPort,
  PasswordValidationResult,
  PasswordStrength,
} from '@domain/ports/PasswordValidatorPort';

export class PasswordValidatorAdapter implements PasswordValidatorPort {
  private readonly MIN_LENGTH = 12;
  private readonly COMMON_PASSWORDS = [
    'password',
    'password123',
    'admin123',
    '12345678',
    'qwerty123',
    'abc12345',
    'test1234',
    'password1!',
    'welcome123',
    'letmein123',
  ];

  validate(password: string): PasswordValidationResult {
    const errors: string[] = [];

    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters`);
    }

    if (!/[A-Za-z]/.test(password)) {
      errors.push('Password must contain at least one letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    if (this.COMMON_PASSWORDS.includes(password.toLowerCase())) {
      errors.push('This password is too common. Please use a different password');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  calculateStrength(password: string): PasswordStrength {
    const score = this.getStrengthScore(password);
    if (score <= 3) return 'weak';
    if (score <= 5) return 'medium';
    if (score <= 7) return 'strong';
    return 'very_strong';
  }

  getRequirements() {
    return {
      minLength: this.MIN_LENGTH,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    };
  }

  private getStrengthScore(password: string): number {
    let score = 0;

    score += this.calculateLengthScore(password);
    score += this.calculateCharacterTypeScore(password);
    score += this.calculateDiversityBonus(password);
    score -= this.calculatePenalties(password);

    return Math.max(0, Math.min(score, 10));
  }

  private calculateLengthScore(password: string): number {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    return score;
  }

  private calculateCharacterTypeScore(password: string): number {
    let score = 0;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }

  private calculateDiversityBonus(password: string): number {
    const uniqueChars = new Set(password).size;
    return uniqueChars >= password.length * 0.7 ? 1 : 0;
  }

  private calculatePenalties(password: string): number {
    let penalties = 0;

    if (/(.)\1{2,}/.test(password)) penalties++;

    const sequentialPattern =
      /012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/;
    if (sequentialPattern.test(password.toLowerCase())) penalties++;

    return penalties;
  }
}
