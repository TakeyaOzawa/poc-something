/**
 * PasswordStrength Value Object
 * Represents password strength with immutable state
 * Domain layer: Pure business logic, no dependencies
 */

import { CommonPasswordDictionary } from './CommonPasswordDictionary';

export type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

export class PasswordStrength {
  private constructor(
    public readonly score: number, // 0-4
    public readonly level: StrengthLevel,
    public readonly feedback: string[]
  ) {
    // Invariant: score must be 0-4
    if (score < 0 || score > 4) {
      throw new Error(`Invalid score: ${score}. Must be 0-4`);
    }
  }

  /**
   * Calculate password strength
   * Pure function: no side effects
   */
  static calculate(password: string): PasswordStrength {
    if (!password) {
      return new PasswordStrength(0, 'weak', ['Password is required']);
    }

    const score = this.calculateScore(password);
    const level = this.scoreToLevel(score);
    const feedback = this.generateFeedback(password, score);

    return new PasswordStrength(score, level, feedback);
  }

  /**
   * Check if password strength is acceptable
   * Minimum acceptable score is 2 (fair)
   */
  isAcceptable(): boolean {
    return this.score >= 2;
  }

  /**
   * Get color for UI display
   */
  getColor(): string {
    switch (this.level) {
      case 'weak':
        return '#d32f2f'; // red
      case 'fair':
        return '#f57c00'; // orange
      case 'good':
        return '#fbc02d'; // yellow
      case 'strong':
        return '#388e3c'; // green
    }
  }

  /**
   * Get percentage (0-100) for progress bar
   */
  getPercentage(): number {
    return (this.score / 4) * 100;
  }

  /**
   * Calculate raw score (0-4)
   * Based on length and character diversity
   */
  private static calculateScore(password: string): number {
    let score = 0;

    // Length scoring
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;

    // Character type scoring
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++; // Mixed case
    if (/[0-9]/.test(password)) score++; // Numbers
    if (/[^a-zA-Z0-9]/.test(password)) score++; // Special chars

    // Common patterns penalty
    if (this.hasCommonPatterns(password)) {
      score = Math.max(0, score - 1);
    }

    return Math.min(score, 4);
  }

  /**
   * Convert score to level
   */
  private static scoreToLevel(score: number): StrengthLevel {
    if (score <= 1) return 'weak';
    if (score === 2) return 'fair';
    if (score === 3) return 'good';
    return 'strong';
  }

  /**
   * Generate feedback messages
   */
  // eslint-disable-next-line complexity -- Multiple conditional feedback checks required to provide comprehensive password strength guidance covering length, character types (lowercase, uppercase, numbers, special chars), and common patterns. Each condition provides specific actionable feedback to users.
  private static generateFeedback(password: string, score: number): string[] {
    const feedback: string[] = [];

    // Only provide feedback if strength is not strong
    if (score >= 4) {
      return [];
    }

    // Length feedback
    if (password.length < 8) {
      feedback.push('Use at least 8 characters');
    } else if (password.length < 12 && score < 3) {
      feedback.push('Use at least 12 characters for better security');
    }

    // Character type feedback
    if (!/[a-z]/.test(password)) {
      feedback.push('Add lowercase letters (a-z)');
    }
    if (!/[A-Z]/.test(password)) {
      feedback.push('Add uppercase letters (A-Z)');
    }
    if (!/[0-9]/.test(password)) {
      feedback.push('Add numbers (0-9)');
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      feedback.push('Add special characters (!@#$%...)');
    }

    // Pattern feedback with detailed reason
    const dictionaryCheck = CommonPasswordDictionary.check(password);
    if (dictionaryCheck.isWeak && dictionaryCheck.reason) {
      feedback.push(dictionaryCheck.reason);
    } else if (this.hasCommonPatterns(password)) {
      feedback.push('Avoid common patterns (123, abc, qwerty...)');
    }

    return feedback;
  }

  /**
   * Check for common weak patterns
   * Uses CommonPasswordDictionary for comprehensive checking
   */
  private static hasCommonPatterns(password: string): boolean {
    // Check against comprehensive dictionary (Top 100 + patterns)
    const dictionaryCheck = CommonPasswordDictionary.check(password);
    if (dictionaryCheck.isWeak) {
      return true;
    }

    const lowerPassword = password.toLowerCase();

    // Keep existing pattern checks as additional layer
    // Sequential numbers
    if (/012|123|234|345|456|567|678|789/.test(lowerPassword)) {
      return true;
    }

    // Sequential letters
    if (
      /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/.test(
        lowerPassword
      )
    ) {
      return true;
    }

    // Repeated characters
    if (/(.)\1{2,}/.test(password)) {
      return true;
    }

    return false;
  }

  /**
   * Create a weak strength instance (for testing)
   */
  static weak(feedback: string[] = []): PasswordStrength {
    return new PasswordStrength(0, 'weak', feedback);
  }

  /**
   * Create a fair strength instance (for testing)
   */
  static fair(feedback: string[] = []): PasswordStrength {
    return new PasswordStrength(2, 'fair', feedback);
  }

  /**
   * Create a good strength instance (for testing)
   */
  static good(feedback: string[] = []): PasswordStrength {
    return new PasswordStrength(3, 'good', feedback);
  }

  /**
   * Create a strong strength instance (for testing)
   */
  static strong(): PasswordStrength {
    return new PasswordStrength(4, 'strong', []);
  }

  /**
   * Equality check
   */
  equals(other: PasswordStrength): boolean {
    return (
      this.score === other.score &&
      this.level === other.level &&
      JSON.stringify(this.feedback) === JSON.stringify(other.feedback)
    );
  }

  /**
   * String representation
   */
  toString(): string {
    return `PasswordStrength(score=${this.score}, level=${this.level}, feedback=[${this.feedback.join(', ')}])`;
  }
}
