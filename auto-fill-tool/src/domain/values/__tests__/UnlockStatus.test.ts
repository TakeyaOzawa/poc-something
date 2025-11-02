/**
 * UnlockStatus Value Object Tests
 * Tests for unlock state representation
 */

import { UnlockStatus } from '../UnlockStatus';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('UnlockStatus', () => {
  describe('locked', () => {
    it('should create locked status', () => {
      const status = UnlockStatus.locked();

      expect(status.isUnlocked).toBe(false);
      expect(status.sessionExpiresAt).toBeNull();
      expect(status.isLockedOut).toBe(false);
      expect(status.lockoutExpiresAt).toBeNull();
    });

    it('should allow unlock', () => {
      const status = UnlockStatus.locked();

      expect(status.canUnlock()).toBe(true);
    });

    it('should need unlock', () => {
      const status = UnlockStatus.locked();

      expect(status.needsUnlock()).toBe(true);
    });
  });

  describe('unlocked', () => {
    it('should create unlocked status with session expiry', () => {
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
      const status = UnlockStatus.unlocked(expiresAt);

      expect(status.isUnlocked).toBe(true);
      expect(status.sessionExpiresAt).toEqual(expiresAt);
      expect(status.isLockedOut).toBe(false);
      expect(status.lockoutExpiresAt).toBeNull();
    });

    it('should not need unlock', () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const status = UnlockStatus.unlocked(expiresAt);

      expect(status.needsUnlock()).toBe(false);
    });

    it('should have active session', () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const status = UnlockStatus.unlocked(expiresAt);

      expect(status.hasActiveSession()).toBe(true);
    });

    it('should allow unlock (already unlocked)', () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const status = UnlockStatus.unlocked(expiresAt);

      expect(status.canUnlock()).toBe(true);
    });
  });

  describe('lockedOut', () => {
    it('should create locked out status with lockout expiry', () => {
      const expiresAt = new Date(Date.now() + 300000); // 5 minutes from now
      const status = UnlockStatus.lockedOut(expiresAt);

      expect(status.isUnlocked).toBe(false);
      expect(status.sessionExpiresAt).toBeNull();
      expect(status.isLockedOut).toBe(true);
      expect(status.lockoutExpiresAt).toEqual(expiresAt);
    });

    it('should not allow unlock', () => {
      const expiresAt = new Date(Date.now() + 300000);
      const status = UnlockStatus.lockedOut(expiresAt);

      expect(status.canUnlock()).toBe(false);
    });

    it('should need unlock', () => {
      const expiresAt = new Date(Date.now() + 300000);
      const status = UnlockStatus.lockedOut(expiresAt);

      expect(status.needsUnlock()).toBe(true);
    });

    it('should not have active session', () => {
      const expiresAt = new Date(Date.now() + 300000);
      const status = UnlockStatus.lockedOut(expiresAt);

      expect(status.hasActiveSession()).toBe(false);
    });
  });

  describe('getRemainingSessionTime', () => {
    it('should return 0 for locked status', () => {
      const status = UnlockStatus.locked();

      expect(status.getRemainingSessionTime()).toBe(0);
    });

    it('should return remaining time for unlocked status', () => {
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
      const status = UnlockStatus.unlocked(expiresAt);

      const remaining = status.getRemainingSessionTime();
      expect(remaining).toBeGreaterThan(3599000);
      expect(remaining).toBeLessThanOrEqual(3600000);
    });

    it('should return 0 for expired session', () => {
      const expiresAt = new Date(Date.now() - 1000); // 1 second ago
      const status = UnlockStatus.unlocked(expiresAt);

      expect(status.getRemainingSessionTime()).toBe(0);
    });

    it('should return 0 for locked out status', () => {
      const expiresAt = new Date(Date.now() + 300000);
      const status = UnlockStatus.lockedOut(expiresAt);

      expect(status.getRemainingSessionTime()).toBe(0);
    });
  });

  describe('getRemainingLockoutTime', () => {
    it('should return 0 for locked status', () => {
      const status = UnlockStatus.locked();

      expect(status.getRemainingLockoutTime()).toBe(0);
    });

    it('should return 0 for unlocked status', () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const status = UnlockStatus.unlocked(expiresAt);

      expect(status.getRemainingLockoutTime()).toBe(0);
    });

    it('should return remaining time for locked out status', () => {
      const expiresAt = new Date(Date.now() + 300000); // 5 minutes from now
      const status = UnlockStatus.lockedOut(expiresAt);

      const remaining = status.getRemainingLockoutTime();
      expect(remaining).toBeGreaterThan(299000);
      expect(remaining).toBeLessThanOrEqual(300000);
    });

    it('should return 0 for expired lockout', () => {
      const expiresAt = new Date(Date.now() - 1000); // 1 second ago
      const status = UnlockStatus.lockedOut(expiresAt);

      expect(status.getRemainingLockoutTime()).toBe(0);
    });
  });

  describe('isSessionExpiringSoon', () => {
    it('should return false for locked status', () => {
      const status = UnlockStatus.locked();

      expect(status.isSessionExpiringSoon()).toBe(false);
    });

    it('should return true when session expires in less than 1 minute', () => {
      const expiresAt = new Date(Date.now() + 30000); // 30 seconds from now
      const status = UnlockStatus.unlocked(expiresAt);

      expect(status.isSessionExpiringSoon()).toBe(true);
    });

    it('should return false when session expires in more than 1 minute', () => {
      const expiresAt = new Date(Date.now() + 120000); // 2 minutes from now
      const status = UnlockStatus.unlocked(expiresAt);

      expect(status.isSessionExpiringSoon()).toBe(false);
    });

    it('should return false for expired session', () => {
      const expiresAt = new Date(Date.now() - 1000);
      const status = UnlockStatus.unlocked(expiresAt);

      expect(status.isSessionExpiringSoon()).toBe(false);
    });
  });

  describe('hasSessionExpired', () => {
    it('should return false for locked status', () => {
      const status = UnlockStatus.locked();

      expect(status.hasSessionExpired()).toBe(false);
    });

    it('should return false for active session', () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const status = UnlockStatus.unlocked(expiresAt);

      expect(status.hasSessionExpired()).toBe(false);
    });

    it('should return true for expired session', () => {
      const expiresAt = new Date(Date.now() - 1000);
      const status = UnlockStatus.unlocked(expiresAt);

      expect(status.hasSessionExpired()).toBe(true);
    });
  });

  describe('hasLockoutExpired', () => {
    it('should return false for locked status', () => {
      const status = UnlockStatus.locked();

      expect(status.hasLockoutExpired()).toBe(false);
    });

    it('should return false for active lockout', () => {
      const expiresAt = new Date(Date.now() + 300000);
      const status = UnlockStatus.lockedOut(expiresAt);

      expect(status.hasLockoutExpired()).toBe(false);
    });

    it('should return true for expired lockout', () => {
      const expiresAt = new Date(Date.now() - 1000);
      const status = UnlockStatus.lockedOut(expiresAt);

      expect(status.hasLockoutExpired()).toBe(true);
    });
  });

  describe('getStatusString', () => {
    it('should return "locked" for locked status', () => {
      const status = UnlockStatus.locked();

      expect(status.getStatusString()).toBe('locked');
    });

    it('should return "unlocked" for unlocked status', () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const status = UnlockStatus.unlocked(expiresAt);

      expect(status.getStatusString()).toBe('unlocked');
    });

    it('should return "locked_out" for locked out status', () => {
      const expiresAt = new Date(Date.now() + 300000);
      const status = UnlockStatus.lockedOut(expiresAt);

      expect(status.getStatusString()).toBe('locked_out');
    });
  });

  describe('getDescription', () => {
    it('should return "Locked" for locked status', () => {
      const status = UnlockStatus.locked();

      expect(status.getDescription()).toBe('Locked');
    });

    it('should return unlocked description with remaining time', () => {
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour
      const status = UnlockStatus.unlocked(expiresAt);

      const description = status.getDescription();
      expect(description).toContain('Unlocked');
      expect(description).toContain('minute');
    });

    it('should return locked out description with remaining time', () => {
      const expiresAt = new Date(Date.now() + 300000); // 5 minutes
      const status = UnlockStatus.lockedOut(expiresAt);

      const description = status.getDescription();
      expect(description).toContain('Locked out');
      expect(description).toContain('minute');
    });
  });

  describe('getFormattedRemainingTime', () => {
    it('should return "00:00" for locked status', () => {
      const status = UnlockStatus.locked();

      expect(status.getFormattedRemainingTime()).toBe('00:00');
    });

    it('should format time as MM:SS for unlocked status', () => {
      const expiresAt = new Date(Date.now() + 125000); // 2 minutes 5 seconds
      const status = UnlockStatus.unlocked(expiresAt);

      const formatted = status.getFormattedRemainingTime();
      expect(formatted).toMatch(/^\d{2}:\d{2}$/);
      expect(formatted).toContain('02:0');
    });

    it('should format time as MM:SS for locked out status', () => {
      const expiresAt = new Date(Date.now() + 305000); // 5 minutes 5 seconds
      const status = UnlockStatus.lockedOut(expiresAt);

      const formatted = status.getFormattedRemainingTime();
      expect(formatted).toMatch(/^\d{2}:\d{2}$/);
      expect(formatted).toContain('05:0');
    });

    it('should handle large time values', () => {
      const expiresAt = new Date(Date.now() + 3660000); // 61 minutes
      const status = UnlockStatus.unlocked(expiresAt);

      const formatted = status.getFormattedRemainingTime();
      expect(formatted).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('withExtendedSession', () => {
    it('should extend session expiry', () => {
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour
      const status = UnlockStatus.unlocked(expiresAt);

      const extended = status.withExtendedSession(1800000); // Add 30 minutes

      expect(extended.isUnlocked).toBe(true);
      expect(extended.sessionExpiresAt!.getTime()).toBe(expiresAt.getTime() + 1800000);
    });

    it('should throw error for locked status', () => {
      const status = UnlockStatus.locked();

      expect(() => status.withExtendedSession(3600000)).toThrow('Cannot extend session');
    });

    it('should throw error for locked out status', () => {
      const expiresAt = new Date(Date.now() + 300000);
      const status = UnlockStatus.lockedOut(expiresAt);

      expect(() => status.withExtendedSession(3600000)).toThrow('Cannot extend session');
    });

    it('should create new instance (immutability)', () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const status = UnlockStatus.unlocked(expiresAt);

      const extended = status.withExtendedSession(1800000);

      expect(extended).not.toBe(status);
      expect(status.sessionExpiresAt!.getTime()).toBe(expiresAt.getTime());
    });
  });

  describe('equals', () => {
    it('should return true for identical locked statuses', () => {
      const status1 = UnlockStatus.locked();
      const status2 = UnlockStatus.locked();

      expect(status1.equals(status2)).toBe(true);
    });

    it('should return true for identical unlocked statuses', () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const status1 = UnlockStatus.unlocked(expiresAt);
      const status2 = UnlockStatus.unlocked(expiresAt);

      expect(status1.equals(status2)).toBe(true);
    });

    it('should return true for identical locked out statuses', () => {
      const expiresAt = new Date(Date.now() + 300000);
      const status1 = UnlockStatus.lockedOut(expiresAt);
      const status2 = UnlockStatus.lockedOut(expiresAt);

      expect(status1.equals(status2)).toBe(true);
    });

    it('should return false for different statuses', () => {
      const status1 = UnlockStatus.locked();
      const status2 = UnlockStatus.unlocked(new Date(Date.now() + 3600000));

      expect(status1.equals(status2)).toBe(false);
    });

    it('should return false for different expiry times', () => {
      const status1 = UnlockStatus.unlocked(new Date(Date.now() + 3600000));
      const status2 = UnlockStatus.unlocked(new Date(Date.now() + 7200000));

      expect(status1.equals(status2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should format locked status', () => {
      const status = UnlockStatus.locked();

      expect(status.toString()).toBe('UnlockStatus(locked)');
    });

    it('should format unlocked status', () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const status = UnlockStatus.unlocked(expiresAt);

      expect(status.toString()).toBe('UnlockStatus(unlocked)');
    });

    it('should format locked out status', () => {
      const expiresAt = new Date(Date.now() + 300000);
      const status = UnlockStatus.lockedOut(expiresAt);

      expect(status.toString()).toBe('UnlockStatus(locked_out)');
    });
  });

  describe('toObject and fromObject', () => {
    it('should serialize locked status', () => {
      const status = UnlockStatus.locked();
      const obj = status.toObject();

      expect(obj.isUnlocked).toBe(false);
      expect(obj.sessionExpiresAt).toBeNull();
      expect(obj.isLockedOut).toBe(false);
      expect(obj.lockoutExpiresAt).toBeNull();
    });

    it('should serialize unlocked status', () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const status = UnlockStatus.unlocked(expiresAt);
      const obj = status.toObject();

      expect(obj.isUnlocked).toBe(true);
      expect(obj.sessionExpiresAt).toBe(expiresAt.toISOString());
      expect(obj.isLockedOut).toBe(false);
      expect(obj.lockoutExpiresAt).toBeNull();
    });

    it('should serialize locked out status', () => {
      const expiresAt = new Date(Date.now() + 300000);
      const status = UnlockStatus.lockedOut(expiresAt);
      const obj = status.toObject();

      expect(obj.isUnlocked).toBe(false);
      expect(obj.sessionExpiresAt).toBeNull();
      expect(obj.isLockedOut).toBe(true);
      expect(obj.lockoutExpiresAt).toBe(expiresAt.toISOString());
    });

    it('should deserialize locked status', () => {
      const obj = {
        isUnlocked: false,
        sessionExpiresAt: null,
        isLockedOut: false,
        lockoutExpiresAt: null,
      };

      const status = UnlockStatus.fromObject(obj);

      expect(status.isUnlocked).toBe(false);
      expect(status.isLockedOut).toBe(false);
    });

    it('should deserialize unlocked status', () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const obj = {
        isUnlocked: true,
        sessionExpiresAt: expiresAt.toISOString(),
        isLockedOut: false,
        lockoutExpiresAt: null,
      };

      const status = UnlockStatus.fromObject(obj);

      expect(status.isUnlocked).toBe(true);
      expect(status.sessionExpiresAt?.getTime()).toBe(expiresAt.getTime());
    });

    it('should round-trip serialize and deserialize', () => {
      const original = UnlockStatus.unlocked(new Date(Date.now() + 3600000));
      const obj = original.toObject();
      const restored = UnlockStatus.fromObject(obj);

      expect(restored.equals(original)).toBe(true);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle session expiration check', () => {
      const expiresAt = new Date(Date.now() + 100); // 100ms from now
      const status = UnlockStatus.unlocked(expiresAt);

      expect(status.hasActiveSession()).toBe(true);

      // Wait for expiration
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(status.hasSessionExpired()).toBe(true);
          resolve(undefined);
        }, 150);
      });
    }, 1000);

    it('should handle lockout expiration check', () => {
      const expiresAt = new Date(Date.now() + 100); // 100ms from now
      const status = UnlockStatus.lockedOut(expiresAt);

      expect(status.canUnlock()).toBe(false);

      // Wait for expiration
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(status.hasLockoutExpired()).toBe(true);
          resolve(undefined);
        }, 150);
      });
    }, 1000);

    it('should handle session extension', () => {
      const initialExpiry = new Date(Date.now() + 3600000);
      const status = UnlockStatus.unlocked(initialExpiry);

      const extended = status.withExtendedSession(1800000);

      expect(extended.getRemainingSessionTime()).toBeGreaterThan(status.getRemainingSessionTime());
    });
  });
});
