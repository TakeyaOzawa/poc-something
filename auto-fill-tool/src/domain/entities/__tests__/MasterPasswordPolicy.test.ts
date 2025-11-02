/**
 * MasterPasswordPolicy Entity Tests
 * Tests for password policy management
 */

import { MasterPasswordPolicy } from '../MasterPasswordPolicy';
import { MasterPasswordRequirements } from '@domain/values/MasterPasswordRequirements';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('MasterPasswordPolicy', () => {
  describe('factory methods', () => {
    describe('default', () => {
      it('should create default policy', () => {
        const policy = MasterPasswordPolicy.default();

        expect(policy).toBeInstanceOf(MasterPasswordPolicy);
        expect(policy.lockoutPolicy.maxAttempts).toBe(5);
        expect(policy.lockoutPolicy.lockoutDurations.length).toBe(3);
      });

      it('should have default lockout durations', () => {
        const policy = MasterPasswordPolicy.default();

        expect(policy.lockoutPolicy.lockoutDurations).toEqual([
          60000, // 1 minute
          300000, // 5 minutes
          900000, // 15 minutes
        ]);
      });

      it('should use MasterPasswordRequirements', () => {
        const policy = MasterPasswordPolicy.default();

        expect(policy.requirements).toBe(MasterPasswordRequirements);
      });
    });

    describe('strict', () => {
      it('should create strict policy', () => {
        const policy = MasterPasswordPolicy.strict();

        expect(policy).toBeInstanceOf(MasterPasswordPolicy);
        expect(policy.lockoutPolicy.maxAttempts).toBe(3);
      });

      it('should have longer lockout durations than default', () => {
        const strict = MasterPasswordPolicy.strict();
        const defaultPolicy = MasterPasswordPolicy.default();

        expect(strict.lockoutPolicy.lockoutDurations[0]).toBeGreaterThan(
          defaultPolicy.lockoutPolicy.lockoutDurations[0]
        );
      });

      it('should have strict lockout durations', () => {
        const policy = MasterPasswordPolicy.strict();

        expect(policy.lockoutPolicy.lockoutDurations).toEqual([
          300000, // 5 minutes
          1800000, // 30 minutes
          3600000, // 1 hour
        ]);
      });
    });

    describe('lenient', () => {
      it('should create lenient policy', () => {
        const policy = MasterPasswordPolicy.lenient();

        expect(policy).toBeInstanceOf(MasterPasswordPolicy);
        expect(policy.lockoutPolicy.maxAttempts).toBe(10);
      });

      it('should have shorter lockout durations than default', () => {
        const lenient = MasterPasswordPolicy.lenient();
        const defaultPolicy = MasterPasswordPolicy.default();

        expect(lenient.lockoutPolicy.lockoutDurations[0]).toBeLessThan(
          defaultPolicy.lockoutPolicy.lockoutDurations[0]
        );
      });

      it('should have lenient lockout durations', () => {
        const policy = MasterPasswordPolicy.lenient();

        expect(policy.lockoutPolicy.lockoutDurations).toEqual([
          30000, // 30 seconds
          120000, // 2 minutes
          300000, // 5 minutes
        ]);
      });
    });
  });

  describe('validatePassword', () => {
    it('should delegate to MasterPasswordRequirements', () => {
      const policy = MasterPasswordPolicy.default();
      const result = policy.validatePassword('Abcdef12!');

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
    });

    it('should validate strong password', () => {
      const policy = MasterPasswordPolicy.default();
      const result = policy.validatePassword('MyP@ssw0rd2023');

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject weak password', () => {
      const policy = MasterPasswordPolicy.default();
      const result = policy.validatePassword('abc123');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateConfirmation', () => {
    it('should delegate to MasterPasswordRequirements', () => {
      const policy = MasterPasswordPolicy.default();
      const result = policy.validateConfirmation('Abcdef12!', 'Abcdef12!');

      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
    });

    it('should accept matching passwords', () => {
      const policy = MasterPasswordPolicy.default();
      const result = policy.validateConfirmation('MyP@ssw0rd', 'MyP@ssw0rd');

      expect(result.isValid).toBe(true);
    });

    it('should reject non-matching passwords', () => {
      const policy = MasterPasswordPolicy.default();
      const result = policy.validateConfirmation('MyP@ssw0rd', 'Different');

      expect(result.isValid).toBe(false);
    });
  });

  describe('validateBoth', () => {
    it('should validate both password and confirmation', () => {
      const policy = MasterPasswordPolicy.default();
      const result = policy.validateBoth('MyP@ssw0rd2023', 'MyP@ssw0rd2023');

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should report password errors', () => {
      const policy = MasterPasswordPolicy.default();
      const result = policy.validateBoth('weak', 'weak');

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('at least 8') || e.includes('too weak'))).toBe(
        true
      );
    });

    it('should report confirmation errors', () => {
      const policy = MasterPasswordPolicy.default();
      const result = policy.validateBoth('MyP@ssw0rd', 'Different');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passwords do not match');
    });
  });

  describe('calculateStrength', () => {
    it('should calculate password strength', () => {
      const policy = MasterPasswordPolicy.default();
      const strength = policy.calculateStrength('MyP@ssw0rd2023');

      expect(strength).toHaveProperty('score');
      expect(strength).toHaveProperty('level');
      expect(strength).toHaveProperty('feedback');
    });

    it('should calculate weak strength', () => {
      const policy = MasterPasswordPolicy.default();
      const strength = policy.calculateStrength('abc123');

      expect(strength.level).toBe('weak');
    });

    it('should calculate strong strength', () => {
      const policy = MasterPasswordPolicy.default();
      const strength = policy.calculateStrength('MyP@ssw0rd!2023SecureAndLong');

      expect(strength.level).toBe('strong');
    });
  });

  describe('getLockoutDuration', () => {
    it('should return first duration for first lockout', () => {
      const policy = MasterPasswordPolicy.default();
      const duration = policy.getLockoutDuration(0);

      expect(duration).toBe(60000); // 1 minute
    });

    it('should return second duration for second lockout', () => {
      const policy = MasterPasswordPolicy.default();
      const duration = policy.getLockoutDuration(1);

      expect(duration).toBe(300000); // 5 minutes
    });

    it('should return third duration for third lockout', () => {
      const policy = MasterPasswordPolicy.default();
      const duration = policy.getLockoutDuration(2);

      expect(duration).toBe(900000); // 15 minutes
    });

    it('should return last duration for subsequent lockouts', () => {
      const policy = MasterPasswordPolicy.default();
      const duration3 = policy.getLockoutDuration(3);
      const duration10 = policy.getLockoutDuration(10);

      expect(duration3).toBe(900000);
      expect(duration10).toBe(900000);
    });

    it('should handle negative lockout count', () => {
      const policy = MasterPasswordPolicy.default();
      const duration = policy.getLockoutDuration(-1);

      expect(duration).toBe(60000); // First duration
    });

    it('should have progressive lockout in strict policy', () => {
      const policy = MasterPasswordPolicy.strict();

      expect(policy.getLockoutDuration(0)).toBe(300000); // 5 min
      expect(policy.getLockoutDuration(1)).toBe(1800000); // 30 min
      expect(policy.getLockoutDuration(2)).toBe(3600000); // 1 hour
    });

    it('should have progressive lockout in lenient policy', () => {
      const policy = MasterPasswordPolicy.lenient();

      expect(policy.getLockoutDuration(0)).toBe(30000); // 30 sec
      expect(policy.getLockoutDuration(1)).toBe(120000); // 2 min
      expect(policy.getLockoutDuration(2)).toBe(300000); // 5 min
    });
  });

  describe('shouldLockout', () => {
    it('should return false when below max attempts (default)', () => {
      const policy = MasterPasswordPolicy.default();

      expect(policy.shouldLockout(0)).toBe(false);
      expect(policy.shouldLockout(4)).toBe(false);
    });

    it('should return true when at max attempts (default)', () => {
      const policy = MasterPasswordPolicy.default();

      expect(policy.shouldLockout(5)).toBe(true);
    });

    it('should return true when above max attempts (default)', () => {
      const policy = MasterPasswordPolicy.default();

      expect(policy.shouldLockout(6)).toBe(true);
      expect(policy.shouldLockout(10)).toBe(true);
    });

    it('should use strict max attempts', () => {
      const policy = MasterPasswordPolicy.strict();

      expect(policy.shouldLockout(2)).toBe(false);
      expect(policy.shouldLockout(3)).toBe(true);
    });

    it('should use lenient max attempts', () => {
      const policy = MasterPasswordPolicy.lenient();

      expect(policy.shouldLockout(9)).toBe(false);
      expect(policy.shouldLockout(10)).toBe(true);
    });
  });

  describe('getRemainingAttempts', () => {
    it('should return max attempts when no failed attempts (default)', () => {
      const policy = MasterPasswordPolicy.default();

      expect(policy.getRemainingAttempts(0)).toBe(5);
    });

    it('should decrease with failed attempts (default)', () => {
      const policy = MasterPasswordPolicy.default();

      expect(policy.getRemainingAttempts(1)).toBe(4);
      expect(policy.getRemainingAttempts(2)).toBe(3);
      expect(policy.getRemainingAttempts(4)).toBe(1);
    });

    it('should return 0 when at max attempts (default)', () => {
      const policy = MasterPasswordPolicy.default();

      expect(policy.getRemainingAttempts(5)).toBe(0);
    });

    it('should not go negative', () => {
      const policy = MasterPasswordPolicy.default();

      expect(policy.getRemainingAttempts(10)).toBe(0);
    });

    it('should use strict max attempts', () => {
      const policy = MasterPasswordPolicy.strict();

      expect(policy.getRemainingAttempts(0)).toBe(3);
      expect(policy.getRemainingAttempts(1)).toBe(2);
      expect(policy.getRemainingAttempts(3)).toBe(0);
    });

    it('should use lenient max attempts', () => {
      const policy = MasterPasswordPolicy.lenient();

      expect(policy.getRemainingAttempts(0)).toBe(10);
      expect(policy.getRemainingAttempts(5)).toBe(5);
      expect(policy.getRemainingAttempts(10)).toBe(0);
    });
  });

  describe('getSummary', () => {
    it('should return summary object', () => {
      const policy = MasterPasswordPolicy.default();
      const summary = policy.getSummary();

      expect(summary).toHaveProperty('requirements');
      expect(summary).toHaveProperty('lockout');
    });

    it('should include requirements summary', () => {
      const policy = MasterPasswordPolicy.default();
      const summary = policy.getSummary();

      expect(summary.requirements).toHaveProperty('minLength');
      expect(summary.requirements).toHaveProperty('maxLength');
      expect(summary.requirements).toHaveProperty('minStrength');
    });

    it('should include lockout summary', () => {
      const policy = MasterPasswordPolicy.default();
      const summary = policy.getSummary();

      expect(summary.lockout.maxAttempts).toBe(5);
      expect(Array.isArray(summary.lockout.durations)).toBe(true);
    });

    it('should format durations as human-readable strings', () => {
      const policy = MasterPasswordPolicy.default();
      const summary = policy.getSummary();

      expect(summary.lockout.durations).toEqual(['1 minute(s)', '5 minute(s)', '15 minute(s)']);
    });

    it('should format hour durations correctly', () => {
      const policy = MasterPasswordPolicy.strict();
      const summary = policy.getSummary();

      expect(summary.lockout.durations).toContain('1 hour(s)');
    });

    it('should format second durations correctly', () => {
      const policy = MasterPasswordPolicy.lenient();
      const summary = policy.getSummary();

      expect(summary.lockout.durations).toContain('30 second(s)');
    });
  });

  describe('equals', () => {
    it('should return true for identical default policies', () => {
      const policy1 = MasterPasswordPolicy.default();
      const policy2 = MasterPasswordPolicy.default();

      expect(policy1.equals(policy2)).toBe(true);
    });

    it('should return true for identical strict policies', () => {
      const policy1 = MasterPasswordPolicy.strict();
      const policy2 = MasterPasswordPolicy.strict();

      expect(policy1.equals(policy2)).toBe(true);
    });

    it('should return false for different policy types', () => {
      const defaultPolicy = MasterPasswordPolicy.default();
      const strictPolicy = MasterPasswordPolicy.strict();

      expect(defaultPolicy.equals(strictPolicy)).toBe(false);
    });

    it('should return false for different max attempts', () => {
      const policy1 = MasterPasswordPolicy.default();
      const policy2 = new MasterPasswordPolicy(MasterPasswordRequirements, {
        maxAttempts: 10,
        lockoutDurations: [60000, 300000, 900000],
      });

      expect(policy1.equals(policy2)).toBe(false);
    });

    it('should return false for different lockout durations', () => {
      const policy1 = MasterPasswordPolicy.default();
      const policy2 = new MasterPasswordPolicy(MasterPasswordRequirements, {
        maxAttempts: 5,
        lockoutDurations: [120000, 600000, 1800000],
      });

      expect(policy1.equals(policy2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should format default policy', () => {
      const policy = MasterPasswordPolicy.default();
      const str = policy.toString();

      expect(str).toContain('MasterPasswordPolicy');
      expect(str).toContain('maxAttempts=5');
    });

    it('should format strict policy', () => {
      const policy = MasterPasswordPolicy.strict();
      const str = policy.toString();

      expect(str).toContain('maxAttempts=3');
    });

    it('should include lockout durations', () => {
      const policy = MasterPasswordPolicy.default();
      const str = policy.toString();

      expect(str).toContain('1 minute(s)');
      expect(str).toContain('5 minute(s)');
      expect(str).toContain('15 minute(s)');
    });
  });

  describe('real-world scenarios', () => {
    it('should handle password initialization flow', () => {
      const policy = MasterPasswordPolicy.default();
      const password = 'MySecureP@ss123';
      const confirmation = 'MySecureP@ss123';

      const result = policy.validateBoth(password, confirmation);

      expect(result.isValid).toBe(true);
    });

    it('should handle failed login attempts', () => {
      const policy = MasterPasswordPolicy.default();

      // Track failed attempts
      let failedAttempts = 0;

      // Attempt 1-4: Not locked out yet
      for (let i = 1; i <= 4; i++) {
        failedAttempts++;
        expect(policy.shouldLockout(failedAttempts)).toBe(false);
        expect(policy.getRemainingAttempts(failedAttempts)).toBeGreaterThan(0);
      }

      // Attempt 5: Now locked out
      failedAttempts++;
      expect(policy.shouldLockout(failedAttempts)).toBe(true);
      expect(policy.getRemainingAttempts(failedAttempts)).toBe(0);
    });

    it('should handle progressive lockout', () => {
      const policy = MasterPasswordPolicy.default();

      // First lockout
      const firstLockout = policy.getLockoutDuration(0);
      expect(firstLockout).toBe(60000); // 1 minute

      // Second lockout (after first expires and user fails again)
      const secondLockout = policy.getLockoutDuration(1);
      expect(secondLockout).toBe(300000); // 5 minutes

      // Third lockout (after second expires and user fails again)
      const thirdLockout = policy.getLockoutDuration(2);
      expect(thirdLockout).toBe(900000); // 15 minutes

      // Progressive lockout: each is longer
      expect(secondLockout).toBeGreaterThan(firstLockout);
      expect(thirdLockout).toBeGreaterThan(secondLockout);
    });

    it('should handle strict security requirements', () => {
      const policy = MasterPasswordPolicy.strict();

      // Fewer attempts allowed
      expect(policy.shouldLockout(3)).toBe(true);

      // Longer lockout durations
      expect(policy.getLockoutDuration(0)).toBe(300000); // 5 minutes (vs 1 minute in default)
    });

    it('should handle lenient development environment', () => {
      const policy = MasterPasswordPolicy.lenient();

      // More attempts allowed
      expect(policy.shouldLockout(9)).toBe(false);
      expect(policy.shouldLockout(10)).toBe(true);

      // Shorter lockout durations
      expect(policy.getLockoutDuration(0)).toBe(30000); // 30 seconds (vs 1 minute in default)
    });

    it('should provide detailed policy summary for UI', () => {
      const policy = MasterPasswordPolicy.default();
      const summary = policy.getSummary();

      // Can be used to display policy to user
      expect(summary.lockout.maxAttempts).toBeDefined();
      expect(summary.lockout.durations.length).toBeGreaterThan(0);
      expect(summary.requirements.description.length).toBeGreaterThan(0);
    });
  });
});
