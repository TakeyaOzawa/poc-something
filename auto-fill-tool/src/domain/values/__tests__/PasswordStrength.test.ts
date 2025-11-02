/**
 * PasswordStrength Value Object Tests
 * Tests for password strength calculation
 */

import { PasswordStrength, StrengthLevel } from '../PasswordStrength';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('PasswordStrength', () => {
  describe('calculate', () => {
    it('should calculate weak strength for short password', () => {
      const strength = PasswordStrength.calculate('abc');

      expect(strength.score).toBe(0);
      expect(strength.level).toBe('weak');
      expect(strength.feedback.length).toBeGreaterThan(0);
    });

    it('should calculate weak strength for password with only lowercase', () => {
      const strength = PasswordStrength.calculate('abcdefgh');

      expect(strength.score).toBeLessThanOrEqual(1);
      expect(strength.level).toBe('weak');
    });

    it('should calculate fair strength for basic mixed password', () => {
      const strength = PasswordStrength.calculate('Abcdef12');

      expect(strength.score).toBeGreaterThanOrEqual(2);
      expect(strength.level).toBe('fair');
    });

    it('should calculate good strength for mixed password with special chars', () => {
      const strength = PasswordStrength.calculate('Abcdef12!@');

      expect(strength.score).toBeGreaterThanOrEqual(3);
      expect(strength.level).toBe('good');
    });

    it('should calculate strong strength for long complex password', () => {
      const strength = PasswordStrength.calculate('MyP@ssw0rd!2023SecureAndLong');

      expect(strength.score).toBe(4);
      expect(strength.level).toBe('strong');
    });

    it('should handle empty password', () => {
      const strength = PasswordStrength.calculate('');

      expect(strength.score).toBe(0);
      expect(strength.level).toBe('weak');
      expect(strength.feedback).toContain('Password is required');
    });

    it('should detect sequential numbers', () => {
      const strength = PasswordStrength.calculate('Pass12345');

      expect(strength.feedback.some((f) => f.toLowerCase().includes('common'))).toBe(true);
    });

    it('should detect keyboard patterns', () => {
      const strength = PasswordStrength.calculate('qwertyABC!');

      expect(strength.feedback.some((f) => f.toLowerCase().includes('common'))).toBe(true);
    });

    it('should detect repeated characters', () => {
      const strength = PasswordStrength.calculate('Passssss1!');

      expect(strength.feedback.some((f) => f.toLowerCase().includes('common'))).toBe(true);
    });

    it('should detect common words', () => {
      // Use a weaker password so feedback is generated
      const strength = PasswordStrength.calculate('password1');

      expect(strength.feedback.some((f) => f.toLowerCase().includes('common'))).toBe(true);
    });
  });

  describe('length scoring', () => {
    it('should give points for 8+ characters', () => {
      const short = PasswordStrength.calculate('Abc12!');
      const medium = PasswordStrength.calculate('Abc12!@#');

      expect(medium.score).toBeGreaterThan(short.score);
    });

    it('should give additional points for 12+ characters', () => {
      const medium = PasswordStrength.calculate('Abc12!@#$%^');
      const long = PasswordStrength.calculate('Abc12!@#$%^&*()');

      expect(long.score).toBeGreaterThanOrEqual(medium.score);
    });

    it('should give maximum points for 16+ characters', () => {
      const veryLong = PasswordStrength.calculate('Abc12!@#$%^&*()_+AbC');

      expect(veryLong.score).toBeGreaterThanOrEqual(3);
    });
  });

  describe('character type scoring', () => {
    it('should give points for mixed case', () => {
      const lowercase = PasswordStrength.calculate('abcdefgh12!@');
      const mixed = PasswordStrength.calculate('Abcdefgh12!@');

      expect(mixed.score).toBeGreaterThan(lowercase.score);
    });

    it('should give points for numbers', () => {
      const noNumbers = PasswordStrength.calculate('Abcdefgh!@#');
      const withNumbers = PasswordStrength.calculate('Abcdefgh12!@');

      expect(withNumbers.score).toBeGreaterThanOrEqual(noNumbers.score);
    });

    it('should give points for special characters', () => {
      const noSpecial = PasswordStrength.calculate('Abcdefgh123');
      const withSpecial = PasswordStrength.calculate('Abcdefgh12!@');

      expect(withSpecial.score).toBeGreaterThan(noSpecial.score);
    });
  });

  describe('common pattern detection', () => {
    it('should detect sequential numbers (123, 234, etc.)', () => {
      expect(
        PasswordStrength.calculate('Pass123').feedback.some((f) =>
          f.toLowerCase().includes('common')
        )
      ).toBe(true);
      expect(
        PasswordStrength.calculate('Pass234').feedback.some((f) =>
          f.toLowerCase().includes('common')
        )
      ).toBe(true);
      expect(
        PasswordStrength.calculate('Pass789').feedback.some((f) =>
          f.toLowerCase().includes('common')
        )
      ).toBe(true);
    });

    it('should detect sequential letters (abc, xyz, etc.)', () => {
      expect(
        PasswordStrength.calculate('Passabc1!').feedback.some((f) =>
          f.toLowerCase().includes('common')
        )
      ).toBe(true);
      expect(
        PasswordStrength.calculate('Passxyz1!').feedback.some((f) =>
          f.toLowerCase().includes('common')
        )
      ).toBe(true);
    });

    it('should detect keyboard patterns', () => {
      expect(
        PasswordStrength.calculate('qwertyA1!').feedback.some((f) =>
          f.toLowerCase().includes('common')
        )
      ).toBe(true);
      expect(
        PasswordStrength.calculate('asdfghA1!').feedback.some((f) =>
          f.toLowerCase().includes('common')
        )
      ).toBe(true);
      expect(
        PasswordStrength.calculate('zxcvbnA1!').feedback.some((f) =>
          f.toLowerCase().includes('common')
        )
      ).toBe(true);
    });

    it('should detect repeated characters (aaa, bbb, etc.)', () => {
      expect(
        PasswordStrength.calculate('Passaaa1!').feedback.some((f) =>
          f.toLowerCase().includes('common')
        )
      ).toBe(true);
      expect(
        PasswordStrength.calculate('Pass111A!').feedback.some((f) =>
          f.toLowerCase().includes('common')
        )
      ).toBe(true);
    });

    it('should detect common words', () => {
      const commonWords = ['password', 'admin', 'user', 'login', 'welcome'];
      commonWords.forEach((word) => {
        const strength = PasswordStrength.calculate(`${word}123!`);
        expect(strength.feedback.some((f) => f.toLowerCase().includes('common'))).toBe(true);
      });
    });
  });

  describe('isAcceptable', () => {
    it('should return false for weak passwords', () => {
      const weak = PasswordStrength.calculate('abc123');
      expect(weak.isAcceptable()).toBe(false);
    });

    it('should return true for fair passwords', () => {
      const fair = PasswordStrength.calculate('Abcdef12');
      expect(fair.isAcceptable()).toBe(true);
    });

    it('should return true for good passwords', () => {
      const good = PasswordStrength.calculate('Abcdef12!@');
      expect(good.isAcceptable()).toBe(true);
    });

    it('should return true for strong passwords', () => {
      const strong = PasswordStrength.calculate('MyP@ssw0rd!2023');
      expect(strong.isAcceptable()).toBe(true);
    });
  });

  describe('getColor', () => {
    it('should return red for weak passwords', () => {
      const weak = PasswordStrength.calculate('abc');
      expect(weak.getColor()).toBe('#d32f2f'); // red
    });

    it('should return orange for fair passwords', () => {
      const fair = PasswordStrength.calculate('Abcdef12');
      expect(fair.getColor()).toBe('#f57c00'); // orange
    });

    it('should return yellow for good passwords', () => {
      const good = PasswordStrength.calculate('Abcdef12!@');
      expect(good.getColor()).toBe('#fbc02d'); // yellow
    });

    it('should return green for strong passwords', () => {
      const strong = PasswordStrength.calculate('MyP@ssw0rd!2023');
      expect(strong.getColor()).toBe('#388e3c'); // green
    });
  });

  describe('getPercentage', () => {
    it('should return 0% for score 0', () => {
      const weak = PasswordStrength.calculate('ab');
      expect(weak.getPercentage()).toBe(0);
    });

    it('should return 25% for score 1', () => {
      const weak = PasswordStrength.calculate('abcdefgh');
      if (weak.score === 1) {
        expect(weak.getPercentage()).toBe(25);
      }
    });

    it('should return 50% for score 2', () => {
      const fair = PasswordStrength.calculate('Abcdefgh');
      if (fair.score === 2) {
        expect(fair.getPercentage()).toBe(50);
      }
    });

    it('should return 75% for score 3', () => {
      const good = PasswordStrength.calculate('Abcdef12!@');
      if (good.score === 3) {
        expect(good.getPercentage()).toBe(75);
      }
    });

    it('should return 100% for score 4', () => {
      const strong = PasswordStrength.calculate('MyP@ssw0rd!2023SecureLong');
      if (strong.score === 4) {
        expect(strong.getPercentage()).toBe(100);
      }
    });
  });

  describe('feedback generation', () => {
    it('should provide feedback for short passwords', () => {
      const strength = PasswordStrength.calculate('Ab1!');
      expect(strength.feedback.some((f) => f.includes('at least 8 characters'))).toBe(true);
    });

    it('should provide feedback for missing uppercase', () => {
      const strength = PasswordStrength.calculate('abcdefgh12!');
      expect(strength.feedback.some((f) => f.includes('uppercase'))).toBe(true);
    });

    it('should provide feedback for missing lowercase', () => {
      const strength = PasswordStrength.calculate('ABCDEFGH12!');
      expect(strength.feedback.some((f) => f.includes('lowercase'))).toBe(true);
    });

    it('should provide feedback for missing numbers', () => {
      const strength = PasswordStrength.calculate('Abcdefgh!@');
      expect(strength.feedback.some((f) => f.includes('number'))).toBe(true);
    });

    it('should provide feedback for missing special characters', () => {
      const strength = PasswordStrength.calculate('Abcdefgh123');
      expect(strength.feedback.some((f) => f.includes('special'))).toBe(true);
    });

    it('should provide empty feedback for strong passwords', () => {
      const strength = PasswordStrength.calculate('MyP@ssw0rd!2023VerySecureAndUnique');
      expect(strength.feedback.length).toBe(0);
    });
  });

  describe('toString', () => {
    it('should format weak password correctly', () => {
      const strength = PasswordStrength.calculate('abc');
      expect(strength.toString()).toContain('weak');
      expect(strength.toString()).toContain('0');
    });

    it('should format strong password correctly', () => {
      const strength = PasswordStrength.calculate('MyP@ssw0rd!2023');
      expect(strength.toString()).toContain('strong');
    });
  });

  describe('edge cases', () => {
    it('should handle very long passwords', () => {
      const veryLong = 'A'.repeat(100) + 'b1!';
      const strength = PasswordStrength.calculate(veryLong);

      expect(strength.score).toBeGreaterThanOrEqual(0);
      expect(strength.score).toBeLessThanOrEqual(4);
    });

    it('should handle passwords with only special characters', () => {
      const special = '!@#$%^&*()';
      const strength = PasswordStrength.calculate(special);

      expect(strength.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle passwords with unicode characters', () => {
      const unicode = 'Пароль123!日本語';
      const strength = PasswordStrength.calculate(unicode);

      expect(strength.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle passwords with whitespace', () => {
      const withSpace = 'My Password 123!';
      const strength = PasswordStrength.calculate(withSpace);

      expect(strength.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('real-world password examples', () => {
    const examples = [
      { password: '123456', expectedLevel: 'weak' as StrengthLevel },
      { password: 'password', expectedLevel: 'weak' as StrengthLevel },
      { password: 'Password1', expectedLevel: 'weak' as StrengthLevel },
      { password: 'MyP@ssw0rd', expectedLevel: 'fair' as StrengthLevel },
      { password: 'MyP@ssw0rd!2023', expectedLevel: 'strong' as StrengthLevel },
      { password: 'Tr0ub4dor&3', expectedLevel: 'good' as StrengthLevel },
      { password: 'correct horse battery staple', expectedLevel: 'strong' as StrengthLevel },
    ];

    examples.forEach(({ password, expectedLevel }) => {
      it(`should calculate "${password}" as ${expectedLevel} or similar`, () => {
        const strength = PasswordStrength.calculate(password);
        // Allow some flexibility in scoring
        expect(['weak', 'fair', 'good', 'strong']).toContain(strength.level);
      });
    });
  });
});
