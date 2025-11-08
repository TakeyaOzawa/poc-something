/**
 * Domain Layer: Password Validator Port
 * Defines the interface for password validation
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
 * Password Validator Port
 */
export interface PasswordValidatorPort {
  /**
   * Validate password against security requirements
   */
  validate(password: string): PasswordValidationResult;

  /**
   * Calculate password strength
   */
  calculateStrength(password: string): PasswordStrength;

  /**
   * Get minimum password requirements
   */
  getRequirements(): {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
}
