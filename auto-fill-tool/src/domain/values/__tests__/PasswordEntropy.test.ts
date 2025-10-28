/**
 * PasswordEntropy Tests
 *
 * Comprehensive test suite for password entropy calculation
 * Covers entropy calculation, strength levels, crack time estimation
 */

import { PasswordEntropy } from '../PasswordEntropy';

describe('PasswordEntropy', () => {
  describe('calculate() - Entropy Calculation', () => {
    describe('Empty and invalid inputs', () => {
      it('should return 0 for empty string', () => {
        expect(PasswordEntropy.calculate('')).toBe(0);
      });

      it('should return 0 for whitespace only', () => {
        expect(PasswordEntropy.calculate('   ')).toBe(0);
      });
    });

    describe('Single character type', () => {
      it('should calculate entropy for lowercase only (26 chars)', () => {
        // "abc" = 3 × log2(26) = 3 × 4.7 = 14.1 → 14 bits
        expect(PasswordEntropy.calculate('abc')).toBe(14);
      });

      it('should calculate entropy for uppercase only (26 chars)', () => {
        // "ABC" = 3 × log2(26) = 3 × 4.7 = 14.1 → 14 bits
        expect(PasswordEntropy.calculate('ABC')).toBe(14);
      });

      it('should calculate entropy for numbers only (10 chars)', () => {
        // "123" = 3 × log2(10) = 3 × 3.32 = 9.96 → 9 bits
        expect(PasswordEntropy.calculate('123')).toBe(9);
      });

      it('should calculate entropy for special chars only (32 chars)', () => {
        // "!@#" = 3 × log2(32) = 3 × 5 = 15 bits
        expect(PasswordEntropy.calculate('!@#')).toBe(15);
      });
    });

    describe('Two character types', () => {
      it('should calculate entropy for lowercase + uppercase (52 chars)', () => {
        // "aB" = 2 × log2(52) = 2 × 5.7 = 11.4 → 11 bits
        expect(PasswordEntropy.calculate('aB')).toBe(11);
      });

      it('should calculate entropy for lowercase + numbers (36 chars)', () => {
        // "a1" = 2 × log2(36) = 2 × 5.17 = 10.34 → 10 bits
        expect(PasswordEntropy.calculate('a1')).toBe(10);
      });

      it('should calculate entropy for lowercase + special (58 chars)', () => {
        // "a!" = 2 × log2(58) = 2 × 5.86 = 11.72 → 11 bits
        expect(PasswordEntropy.calculate('a!')).toBe(11);
      });

      it('should calculate entropy for uppercase + numbers (36 chars)', () => {
        // "A1" = 2 × log2(36) = 2 × 5.17 = 10.34 → 10 bits
        expect(PasswordEntropy.calculate('A1')).toBe(10);
      });

      it('should calculate entropy for numbers + special (42 chars)', () => {
        // "1!" = 2 × log2(42) = 2 × 5.39 = 10.78 → 10 bits
        expect(PasswordEntropy.calculate('1!')).toBe(10);
      });
    });

    describe('Three character types', () => {
      it('should calculate entropy for lowercase + uppercase + numbers (62 chars)', () => {
        // "aB1" = 3 × log2(62) = 3 × 5.95 = 17.85 → 17 bits
        expect(PasswordEntropy.calculate('aB1')).toBe(17);
      });

      it('should calculate entropy for lowercase + numbers + special (68 chars)', () => {
        // "a1!" = 3 × log2(68) = 3 × 6.09 = 18.27 → 18 bits
        expect(PasswordEntropy.calculate('a1!')).toBe(18);
      });

      it('should calculate entropy for uppercase + numbers + special (68 chars)', () => {
        // "A1!" = 3 × log2(68) = 3 × 6.09 = 18.27 → 18 bits
        expect(PasswordEntropy.calculate('A1!')).toBe(18);
      });
    });

    describe('All four character types', () => {
      it('should calculate entropy for all types (94 chars)', () => {
        // "aA1!" = 4 × log2(94) = 4 × 6.55 = 26.2 → 26 bits
        expect(PasswordEntropy.calculate('aA1!')).toBe(26);
      });

      it('should calculate entropy for 6-char password with all types', () => {
        // "Abc123" = 6 × log2(62) = 6 × 5.95 = 35.7 → 35 bits
        expect(PasswordEntropy.calculate('Abc123')).toBe(35);
      });

      it('should calculate entropy for 8-char password with all types', () => {
        // "Abc123!@" = 8 × log2(94) = 8 × 6.55 = 52.4 → 52 bits
        expect(PasswordEntropy.calculate('Abc123!@')).toBe(52);
      });

      it('should calculate entropy for 12-char password with all types', () => {
        // "Abc123!@#XYZ" = 12 × log2(94) = 12 × 6.55 = 78.6 → 78 bits
        expect(PasswordEntropy.calculate('Abc123!@#XYZ')).toBe(78);
      });

      it('should calculate entropy for 20-char password with all types', () => {
        // "Abc123!@#XYZ98765432" = 20 × log2(94) = 20 × 6.55 = 131 → 131 bits
        expect(PasswordEntropy.calculate('Abc123!@#XYZ98765432')).toBe(131);
      });
    });

    describe('Real-world password examples', () => {
      it('should calculate entropy for "password" (8 lowercase)', () => {
        // 8 × log2(26) = 8 × 4.7 = 37.6 → 37 bits
        expect(PasswordEntropy.calculate('password')).toBe(37);
      });

      it('should calculate entropy for "Password1" (9 chars, 3 types)', () => {
        // 9 × log2(62) = 9 × 5.95 = 53.55 → 53 bits
        expect(PasswordEntropy.calculate('Password1')).toBe(53);
      });

      it('should calculate entropy for "P@ssw0rd!" (9 chars, 4 types)', () => {
        // 9 × log2(94) = 9 × 6.55 = 58.95 → 58 bits
        expect(PasswordEntropy.calculate('P@ssw0rd!')).toBe(58);
      });

      it('should calculate entropy for "CorrectHorseBatteryStaple" (25 chars, 2 types)', () => {
        // 25 × log2(52) = 25 × 5.7 = 142.5 → 142 bits
        expect(PasswordEntropy.calculate('CorrectHorseBatteryStaple')).toBe(142);
      });
    });

    describe('Edge cases', () => {
      it('should handle single character password', () => {
        expect(PasswordEntropy.calculate('a')).toBe(4); // log2(26) = 4.7 → 4
      });

      it('should handle very long password', () => {
        const longPassword = 'a'.repeat(100);
        // 100 × log2(26) = 100 × 4.7 = 470 bits
        expect(PasswordEntropy.calculate(longPassword)).toBe(470);
      });

      it('should handle unicode characters as special chars', () => {
        // Unicode counted as special chars (32 pool size)
        // Note: '🔒🔑'.length = 4 due to UTF-16 encoding (each emoji = 2 code units)
        expect(PasswordEntropy.calculate('🔒🔑')).toBe(20); // 4 × log2(32) = 20
      });
    });
  });

  describe('getLevel() - Strength Level', () => {
    describe('Very Weak (< 28 bits)', () => {
      it('should return Very Weak for 0 bits', () => {
        expect(PasswordEntropy.getLevel(0)).toBe('Very Weak (< 28 bits)');
      });

      it('should return Very Weak for 14 bits', () => {
        expect(PasswordEntropy.getLevel(14)).toBe('Very Weak (< 28 bits)');
      });

      it('should return Very Weak for 27 bits', () => {
        expect(PasswordEntropy.getLevel(27)).toBe('Very Weak (< 28 bits)');
      });
    });

    describe('Weak (28-35 bits)', () => {
      it('should return Weak for 28 bits (boundary)', () => {
        expect(PasswordEntropy.getLevel(28)).toBe('Weak (28-35 bits)');
      });

      it('should return Weak for 32 bits', () => {
        expect(PasswordEntropy.getLevel(32)).toBe('Weak (28-35 bits)');
      });

      it('should return Weak for 35 bits (boundary)', () => {
        expect(PasswordEntropy.getLevel(35)).toBe('Weak (28-35 bits)');
      });
    });

    describe('Reasonable (36-59 bits)', () => {
      it('should return Reasonable for 36 bits (boundary)', () => {
        expect(PasswordEntropy.getLevel(36)).toBe('Reasonable (36-59 bits)');
      });

      it('should return Reasonable for 48 bits', () => {
        expect(PasswordEntropy.getLevel(48)).toBe('Reasonable (36-59 bits)');
      });

      it('should return Reasonable for 59 bits (boundary)', () => {
        expect(PasswordEntropy.getLevel(59)).toBe('Reasonable (36-59 bits)');
      });
    });

    describe('Strong (60-127 bits)', () => {
      it('should return Strong for 60 bits (boundary)', () => {
        expect(PasswordEntropy.getLevel(60)).toBe('Strong (60-127 bits)');
      });

      it('should return Strong for 85 bits', () => {
        expect(PasswordEntropy.getLevel(85)).toBe('Strong (60-127 bits)');
      });

      it('should return Strong for 127 bits (boundary)', () => {
        expect(PasswordEntropy.getLevel(127)).toBe('Strong (60-127 bits)');
      });
    });

    describe('Very Strong (≥ 128 bits)', () => {
      it('should return Very Strong for 128 bits (boundary)', () => {
        expect(PasswordEntropy.getLevel(128)).toBe('Very Strong (≥ 128 bits)');
      });

      it('should return Very Strong for 200 bits', () => {
        expect(PasswordEntropy.getLevel(200)).toBe('Very Strong (≥ 128 bits)');
      });

      it('should return Very Strong for 500 bits', () => {
        expect(PasswordEntropy.getLevel(500)).toBe('Very Strong (≥ 128 bits)');
      });
    });
  });

  describe('estimateCrackTime() - Crack Time Estimation', () => {
    describe('Zero and instant', () => {
      it('should return instant for 0 bits', () => {
        expect(PasswordEntropy.estimateCrackTime(0)).toBe('instant (0 bits)');
      });

      it('should return instant for negative bits', () => {
        expect(PasswordEntropy.estimateCrackTime(-5)).toBe('instant (0 bits)');
      });

      it('should return instant for < 1 second (very low entropy)', () => {
        // 1 bit: 2^1 = 2 combinations / 1e9 = 0.000000002 seconds
        expect(PasswordEntropy.estimateCrackTime(1)).toBe('instant (< 1 second)');
      });
    });

    describe('Seconds', () => {
      it('should return seconds for low entropy', () => {
        // 30 bits: 2^30 = 1,073,741,824 / 1e9 = 1.07 seconds
        const result = PasswordEntropy.estimateCrackTime(30);
        expect(result).toMatch(/^1 second$/);
      });

      it('should return plural seconds', () => {
        // 32 bits: 2^32 = 4,294,967,296 / 1e9 = 4.29 seconds
        const result = PasswordEntropy.estimateCrackTime(32);
        expect(result).toMatch(/^4 seconds$/);
      });
    });

    describe('Minutes', () => {
      it('should return minutes', () => {
        // 36 bits: 2^36 = 68,719,476,736 / 1e9 = 68.7 seconds = 1.14 minutes
        const result = PasswordEntropy.estimateCrackTime(36);
        expect(result).toMatch(/^1 minute$/);
      });

      it('should return plural minutes', () => {
        // 38 bits: 2^38 = 274,877,906,944 / 1e9 = 274.8 seconds = 4.58 minutes
        const result = PasswordEntropy.estimateCrackTime(38);
        expect(result).toMatch(/^5 minutes$/);
      });
    });

    describe('Hours', () => {
      it('should return hours', () => {
        // 42 bits: 2^42 = 4,398,046,511,104 / 1e9 = 4398 seconds = 1.22 hours
        const result = PasswordEntropy.estimateCrackTime(42);
        expect(result).toMatch(/^1 hour$/);
      });

      it('should return plural hours', () => {
        // 45 bits: 2^45 = 35,184,372,088,832 / 1e9 = 35184 seconds = 9.77 hours
        const result = PasswordEntropy.estimateCrackTime(45);
        expect(result).toMatch(/^10 hours$/);
      });
    });

    describe('Days', () => {
      it('should return days', () => {
        // 47 bits: 2^47 = 140,737,488,355,328 / 1e9 = 140737 seconds = 1.63 days
        const result = PasswordEntropy.estimateCrackTime(47);
        expect(result).toMatch(/^2 days$/);
      });

      it('should return plural days', () => {
        // 50 bits: 2^50 = 1,125,899,906,842,624 / 1e9 = 1125900 seconds = 13.03 days
        const result = PasswordEntropy.estimateCrackTime(50);
        expect(result).toMatch(/^13 days$/);
      });
    });

    describe('Years', () => {
      it('should return years', () => {
        // 55 bits: 2^55 = 36,028,797,018,963,968 / 1e9 = 36028797 seconds = 1.14 years
        const result = PasswordEntropy.estimateCrackTime(55);
        expect(result).toMatch(/^1 year$/);
      });

      it('should return plural years', () => {
        // 60 bits: 2^60 = 1,152,921,504,606,846,976 / 1e9 = 1152921505 seconds = 36.5 years
        const result = PasswordEntropy.estimateCrackTime(60);
        expect(result).toMatch(/^37 years$/);
      });

      it('should return thousands of years', () => {
        // 70 bits: 2^70 = 1.18e21 / 1e9 = 1.18e12 seconds = 37,411 years
        const result = PasswordEntropy.estimateCrackTime(70);
        expect(result).toMatch(/^37,411 years$/);
      });
    });

    describe('Millions of years', () => {
      it('should return millions of years', () => {
        // 80 bits: 2^80 = 1.21e24 / 1e9 = 1.21e15 seconds = 38.3 million years
        const result = PasswordEntropy.estimateCrackTime(80);
        expect(result).toMatch(/^38\.3 million years$/);
      });

      it('should return hundreds of millions of years', () => {
        // 90 bits: 2^90 = 1.24e27 / 1e9 = 1.24e18 seconds = 39.2 billion years (but < 1000 million)
        // Actually 39,196 million years = 39.2 billion years
        const result = PasswordEntropy.estimateCrackTime(90);
        expect(result).toMatch(/^39\.2 billion years$/);
      });
    });

    describe('Billions of years', () => {
      it('should return billions of years', () => {
        // 100 bits: 2^100 = 1.27e30 / 1e9 = 1.27e21 seconds = 40,169 billion years
        const result = PasswordEntropy.estimateCrackTime(100);
        expect(result).toMatch(/^40169\.\d+ billion years$/);
      });

      it('should return trillions (as billions) of years', () => {
        // 128 bits: 2^128 = 3.4e38 / 1e9 = 3.4e29 seconds = 10.8 trillion billion years
        const result = PasswordEntropy.estimateCrackTime(128);
        expect(result).toMatch(/billion years$/);
      });
    });
  });

  describe('analyze() - Comprehensive Analysis', () => {
    it('should return all metrics for weak password', () => {
      const result = PasswordEntropy.analyze('abc');
      expect(result.entropy).toBe(14);
      expect(result.level).toBe('Very Weak (< 28 bits)');
      expect(result.crackTime).toMatch(/instant/);
    });

    it('should return all metrics for medium password', () => {
      const result = PasswordEntropy.analyze('Abc123');
      expect(result.entropy).toBe(35);
      expect(result.level).toBe('Weak (28-35 bits)');
      expect(result.crackTime).toMatch(/seconds?/);
    });

    it('should return all metrics for strong password', () => {
      const result = PasswordEntropy.analyze('Abc123!@#XYZ');
      expect(result.entropy).toBe(78);
      expect(result.level).toBe('Strong (60-127 bits)');
      expect(result.crackTime).toMatch(/years$/);
    });

    it('should return all metrics for very strong password', () => {
      const result = PasswordEntropy.analyze('Abc123!@#XYZ98765432');
      expect(result.entropy).toBe(131);
      expect(result.level).toBe('Very Strong (≥ 128 bits)');
      expect(result.crackTime).toMatch(/billion years$/);
    });

    it('should return all metrics for empty password', () => {
      const result = PasswordEntropy.analyze('');
      expect(result.entropy).toBe(0);
      expect(result.level).toBe('Very Weak (< 28 bits)');
      expect(result.crackTime).toBe('instant (0 bits)');
    });
  });

  describe('Integration with real-world scenarios', () => {
    it('should correctly assess common weak passwords', () => {
      const passwords = ['123456', 'qwerty', 'abc123']; // 6 chars, Very Weak
      passwords.forEach((pwd) => {
        const result = PasswordEntropy.analyze(pwd);
        expect(result.level).toMatch(/Very Weak|Weak/);
      });
    });

    it('should correctly assess 8-char weak passwords', () => {
      const passwords = ['password']; // 8 lowercase = 37 bits = Reasonable
      passwords.forEach((pwd) => {
        const result = PasswordEntropy.analyze(pwd);
        expect(result.level).toMatch(/Reasonable/);
      });
    });

    it('should correctly assess medium strength passwords', () => {
      const passwords = ['Password1', 'Welcome123', 'Admin2024'];
      passwords.forEach((pwd) => {
        const result = PasswordEntropy.analyze(pwd);
        expect(result.level).toMatch(/Weak|Reasonable/);
      });
    });

    it('should correctly assess strong passwords', () => {
      const passwords = ['P@ssw0rd!2024', 'MyS3cr3t!Key', 'T3st!ng#P@ss'];
      passwords.forEach((pwd) => {
        const result = PasswordEntropy.analyze(pwd);
        expect(result.level).toMatch(/Reasonable|Strong/);
      });
    });

    it('should correctly assess very strong passwords', () => {
      const passwords = [
        'CorrectHorseBatteryStaple',
        'MyVeryL0ng!P@ssw0rd#2024',
        'X9$mK2@pL5vQ8#nR',
      ];
      passwords.forEach((pwd) => {
        const result = PasswordEntropy.analyze(pwd);
        expect(result.level).toMatch(/Strong|Very Strong/);
      });
    });
  });
});
