/**
 * Infrastructure Layer: Password Validator
 * Validates password strength and provides strength scoring
 */

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Password strength levels
 */
export type PasswordStrength = 'weak' | 'medium' | 'strong' | 'very_strong';

/**
 * Password Validator
 * Validates password requirements and calculates strength score
 */
export class PasswordValidator {
  private readonly MIN_LENGTH = 12; // セキュリティ強化: 8文字から12文字に変更
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

  /**
   * Validate password against requirements
   * @param password Password to validate
   * @returns Validation result with errors if any
   */
  validate(password: string): PasswordValidationResult {
    const errors: string[] = [];

    // Minimum length
    if (password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters`);
    }

    // Contains letter
    if (!/[A-Za-z]/.test(password)) {
      errors.push('Password must contain at least one letter');
    }

    // Contains number
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Contains special character
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Block common passwords
    if (this.COMMON_PASSWORDS.includes(password.toLowerCase())) {
      errors.push('This password is too common. Please use a different password');
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Calculate password strength score (0-10)
   * @param password Password to evaluate
   * @returns Strength score from 0 (weakest) to 10 (strongest)
   */
  getStrengthScore(password: string): number {
    let score = 0;

    score += this.calculateLengthScore(password);
    score += this.calculateCharacterTypeScore(password);
    score += this.calculateDiversityBonus(password);
    score -= this.calculatePenalties(password);

    // Ensure score is between 0 and 10
    return Math.max(0, Math.min(score, 10));
  }

  /**
   * Calculate score based on password length
   */
  private calculateLengthScore(password: string): number {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    return score;
  }

  /**
   * Calculate score based on character types
   */
  private calculateCharacterTypeScore(password: string): number {
    let score = 0;
    if (/[a-z]/.test(password)) score++; // Lowercase
    if (/[A-Z]/.test(password)) score++; // Uppercase
    if (/[0-9]/.test(password)) score++; // Numbers
    if (/[^A-Za-z0-9]/.test(password)) score++; // Special characters
    return score;
  }

  /**
   * Calculate bonus for character diversity
   */
  private calculateDiversityBonus(password: string): number {
    const uniqueChars = new Set(password).size;
    return uniqueChars >= password.length * 0.7 ? 1 : 0;
  }

  /**
   * Calculate penalties for weak patterns
   */
  private calculatePenalties(password: string): number {
    let penalties = 0;

    // Repeated characters (3+ in a row)
    if (/(.)\1{2,}/.test(password)) penalties++;

    // Sequential characters
    const sequentialPattern =
      /012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/;
    if (sequentialPattern.test(password.toLowerCase())) penalties++;

    return penalties;
  }

  /**
   * Get password strength label
   * @param score Strength score (0-10)
   * @returns Human-readable strength label
   */
  getStrengthLabel(score: number): PasswordStrength {
    if (score <= 3) return 'weak';
    if (score <= 5) return 'medium';
    if (score <= 7) return 'strong';
    return 'very_strong';
  }

  /**
   * Get localized password strength label (Japanese)
   * @param score Strength score (0-10)
   * @returns Japanese label
   */
  getStrengthLabelJa(score: number): string {
    if (score <= 3) return '弱い';
    if (score <= 5) return '中程度';
    if (score <= 7) return '強い';
    return '非常に強い';
  }

  /**
   * Validate and get strength in one call
   * @param password Password to evaluate
   * @returns Combined validation result and strength score
   */
  validateWithStrength(password: string): {
    validation: PasswordValidationResult;
    score: number;
    strength: PasswordStrength;
  } {
    const validation = this.validate(password);
    const score = this.getStrengthScore(password);
    const strength = this.getStrengthLabel(score);

    return { validation, score, strength };
  }
}
