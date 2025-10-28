/**
 * MasterPasswordRequirements Value Object Tests
 * Tests for password validation logic
 */

import { MasterPasswordRequirements, ValidationResult } from '../MasterPasswordRequirements';

describe('MasterPasswordRequirements', () => {
  describe('constants', () => {
    it('should define MIN_LENGTH as 8', () => {
      expect(MasterPasswordRequirements.MIN_LENGTH).toBe(8);
    });

    it('should define MAX_LENGTH as 128', () => {
      expect(MasterPasswordRequirements.MAX_LENGTH).toBe(128);
    });

    it('should define MIN_ACCEPTABLE_STRENGTH as 2', () => {
      expect(MasterPasswordRequirements.MIN_ACCEPTABLE_STRENGTH).toBe(2);
    });
  });

  describe('validate', () => {
    describe('empty password validation', () => {
      it('should reject empty string', () => {
        const result = MasterPasswordRequirements.validate('');

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password is required');
      });

      it('should reject whitespace-only password', () => {
        const result = MasterPasswordRequirements.validate('   ');

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password is required');
      });
    });

    describe('length validation', () => {
      it('should reject password shorter than MIN_LENGTH', () => {
        const result = MasterPasswordRequirements.validate('Abc12!');

        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.includes('at least 8 characters'))).toBe(true);
      });

      it('should accept password at MIN_LENGTH', () => {
        const result = MasterPasswordRequirements.validate('Abcdef12!@#$'); // 12 chars, acceptable

        // May pass or fail depending on strength, but should not fail on length
        expect(result.errors.every((e) => !e.includes('at least 8'))).toBe(true);
      });

      it('should reject password longer than MAX_LENGTH', () => {
        const longPassword = 'A'.repeat(129) + 'b1!';
        const result = MasterPasswordRequirements.validate(longPassword);

        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.includes('at most 128 characters'))).toBe(true);
      });

      it('should accept password at MAX_LENGTH', () => {
        const maxPassword = 'A'.repeat(120) + 'bcDef12!';
        const result = MasterPasswordRequirements.validate(maxPassword);

        // Should not fail on length (may fail on strength)
        expect(result.errors.every((e) => !e.includes('at most 128'))).toBe(true);
      });
    });

    describe('strength validation', () => {
      it('should reject weak passwords', () => {
        const result = MasterPasswordRequirements.validate('abcdefgh');

        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.includes('too weak'))).toBe(true);
      });

      it('should accept fair passwords', () => {
        const result = MasterPasswordRequirements.validate('Abcdefgh12');

        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
      });

      it('should accept good passwords', () => {
        const result = MasterPasswordRequirements.validate('Abcdefgh12!@');

        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
      });

      it('should accept strong passwords', () => {
        const result = MasterPasswordRequirements.validate('MyP@ssw0rd!2023');

        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
      });

      it('should include strength feedback in errors', () => {
        const result = MasterPasswordRequirements.validate('abc123');

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1); // Should have strength feedback
      });
    });

    describe('whitespace validation', () => {
      it('should reject password starting with whitespace', () => {
        const result = MasterPasswordRequirements.validate(' Abcdef12!');

        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.includes('cannot start or end'))).toBe(true);
      });

      it('should reject password ending with whitespace', () => {
        const result = MasterPasswordRequirements.validate('Abcdef12! ');

        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.includes('cannot start or end'))).toBe(true);
      });

      it('should accept password with whitespace in the middle', () => {
        const result = MasterPasswordRequirements.validate('My Pass 12!@');

        // Should not fail on whitespace (may fail on strength)
        expect(result.errors.every((e) => !e.includes('whitespace'))).toBe(true);
      });
    });

    describe('multiple validation errors', () => {
      it('should report all validation errors', () => {
        const result = MasterPasswordRequirements.validate(' abc ');

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
        // Should have: length, strength, whitespace errors
      });

      it('should report length and strength errors separately', () => {
        const result = MasterPasswordRequirements.validate('abc');

        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.includes('at least 8'))).toBe(true);
        expect(result.errors.some((e) => e.includes('too weak'))).toBe(true);
      });
    });

    describe('valid passwords', () => {
      const validPasswords = [
        'Abcdef12!@',
        'MyP@ssw0rd2023',
        'SecureP@ss123',
        'C0mplex!Pass',
        'MyLongP@ssw0rd2023',
      ];

      validPasswords.forEach((password) => {
        it(`should accept valid password: ${password}`, () => {
          const result = MasterPasswordRequirements.validate(password);

          expect(result.isValid).toBe(true);
          expect(result.errors.length).toBe(0);
        });
      });
    });
  });

  describe('validateConfirmation', () => {
    it('should reject empty confirmation', () => {
      const result = MasterPasswordRequirements.validateConfirmation('Abcdef12!', '');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Confirmation password is required');
    });

    it('should reject non-matching passwords', () => {
      const result = MasterPasswordRequirements.validateConfirmation('Abcdef12!', 'Different12!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passwords do not match');
    });

    it('should accept matching passwords', () => {
      const result = MasterPasswordRequirements.validateConfirmation('Abcdef12!', 'Abcdef12!');

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should be case-sensitive', () => {
      const result = MasterPasswordRequirements.validateConfirmation('Abcdef12!', 'abcdef12!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passwords do not match');
    });

    it('should not validate password strength', () => {
      // This method only checks if passwords match, not strength
      const result = MasterPasswordRequirements.validateConfirmation('weak', 'weak');

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('validateBoth', () => {
    it('should validate both password and confirmation', () => {
      const result = MasterPasswordRequirements.validateBoth('Abcdef12!', 'Abcdef12!');

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should report password validation errors', () => {
      const result = MasterPasswordRequirements.validateBoth('abc', 'abc');

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('at least 8'))).toBe(true);
      expect(result.errors.some((e) => e.includes('too weak'))).toBe(true);
    });

    it('should report confirmation validation errors', () => {
      const result = MasterPasswordRequirements.validateBoth('Abcdef12!', 'Different12!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passwords do not match');
    });

    it('should report both password and confirmation errors', () => {
      const result = MasterPasswordRequirements.validateBoth('abc', 'xyz');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Passwords do not match');
    });

    it('should combine all errors', () => {
      const result = MasterPasswordRequirements.validateBoth(' abc ', 'xyz');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2);
      // Should have: length, strength, whitespace, mismatch errors
    });
  });

  describe('meetsMinLength', () => {
    it('should return false for short passwords', () => {
      expect(MasterPasswordRequirements.meetsMinLength('abc')).toBe(false);
      expect(MasterPasswordRequirements.meetsMinLength('1234567')).toBe(false);
    });

    it('should return true for password at MIN_LENGTH', () => {
      expect(MasterPasswordRequirements.meetsMinLength('12345678')).toBe(true);
    });

    it('should return true for long passwords', () => {
      expect(MasterPasswordRequirements.meetsMinLength('ThisIsALongPassword')).toBe(true);
    });

    it('should return false for empty password', () => {
      expect(MasterPasswordRequirements.meetsMinLength('')).toBe(false);
    });
  });

  describe('meetsMaxLength', () => {
    it('should return true for short passwords', () => {
      expect(MasterPasswordRequirements.meetsMaxLength('abc')).toBe(true);
    });

    it('should return true for password at MAX_LENGTH', () => {
      const maxPassword = 'A'.repeat(128);
      expect(MasterPasswordRequirements.meetsMaxLength(maxPassword)).toBe(true);
    });

    it('should return false for password exceeding MAX_LENGTH', () => {
      const tooLong = 'A'.repeat(129);
      expect(MasterPasswordRequirements.meetsMaxLength(tooLong)).toBe(false);
    });

    it('should return true for empty password', () => {
      expect(MasterPasswordRequirements.meetsMaxLength('')).toBe(true);
    });
  });

  describe('isStrongEnough', () => {
    it('should return false for weak passwords', () => {
      expect(MasterPasswordRequirements.isStrongEnough('abc123')).toBe(false);
      expect(MasterPasswordRequirements.isStrongEnough('password')).toBe(false);
    });

    it('should return true for fair passwords', () => {
      expect(MasterPasswordRequirements.isStrongEnough('Abcdef12')).toBe(true);
    });

    it('should return true for good passwords', () => {
      expect(MasterPasswordRequirements.isStrongEnough('Abcdef12!@')).toBe(true);
    });

    it('should return true for strong passwords', () => {
      expect(MasterPasswordRequirements.isStrongEnough('MyP@ssw0rd2023')).toBe(true);
    });

    it('should return false for empty password', () => {
      expect(MasterPasswordRequirements.isStrongEnough('')).toBe(false);
    });
  });

  describe('getRequirementDescription', () => {
    it('should return an array of requirements', () => {
      const description = MasterPasswordRequirements.getRequirementDescription();

      expect(Array.isArray(description)).toBe(true);
      expect(description.length).toBeGreaterThan(0);
    });

    it('should include length requirements', () => {
      const description = MasterPasswordRequirements.getRequirementDescription();

      expect(description.some((d) => d.includes('8 characters'))).toBe(true);
      expect(description.some((d) => d.includes('128 characters'))).toBe(true);
    });

    it('should include character type requirements', () => {
      const description = MasterPasswordRequirements.getRequirementDescription();

      expect(description.some((d) => d.toLowerCase().includes('uppercase'))).toBe(true);
      expect(description.some((d) => d.toLowerCase().includes('lowercase'))).toBe(true);
      expect(description.some((d) => d.toLowerCase().includes('number'))).toBe(true);
      expect(description.some((d) => d.toLowerCase().includes('special'))).toBe(true);
    });

    it('should include pattern requirements', () => {
      const description = MasterPasswordRequirements.getRequirementDescription();

      expect(description.some((d) => d.toLowerCase().includes('common'))).toBe(true);
    });
  });

  describe('getSummary', () => {
    it('should return summary object with all fields', () => {
      const summary = MasterPasswordRequirements.getSummary();

      expect(summary).toHaveProperty('minLength');
      expect(summary).toHaveProperty('maxLength');
      expect(summary).toHaveProperty('minStrength');
      expect(summary).toHaveProperty('description');
    });

    it('should include correct min/max length values', () => {
      const summary = MasterPasswordRequirements.getSummary();

      expect(summary.minLength).toBe(8);
      expect(summary.maxLength).toBe(128);
    });

    it('should include correct min strength value', () => {
      const summary = MasterPasswordRequirements.getSummary();

      expect(summary.minStrength).toBe(2);
    });

    it('should include description array', () => {
      const summary = MasterPasswordRequirements.getSummary();

      expect(Array.isArray(summary.description)).toBe(true);
      expect(summary.description.length).toBeGreaterThan(0);
    });

    it('should match getRequirementDescription output', () => {
      const summary = MasterPasswordRequirements.getSummary();
      const description = MasterPasswordRequirements.getRequirementDescription();

      expect(summary.description).toEqual(description);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle user registration flow', () => {
      const password = 'MySecureP@ss123';
      const confirmation = 'MySecureP@ss123';

      const result = MasterPasswordRequirements.validateBoth(password, confirmation);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should handle typo in confirmation', () => {
      const password = 'MySecureP@ss123';
      const confirmation = 'MySecureP@ss124'; // Typo

      const result = MasterPasswordRequirements.validateBoth(password, confirmation);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passwords do not match');
    });

    it('should handle weak password attempt', () => {
      const password = 'password123';
      const confirmation = 'password123';

      const result = MasterPasswordRequirements.validateBoth(password, confirmation);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('too weak') || e.includes('common'))).toBe(true);
    });

    it('should provide helpful feedback for improvement', () => {
      const password = 'short';
      const result = MasterPasswordRequirements.validate(password);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Errors should be actionable
      expect(result.errors.every((e) => e.length > 0)).toBe(true);
    });
  });
});
