/**
 * CheckUnlockStatusUseCase Tests
 * Tests for checking unlock status use case
 */

import { CheckUnlockStatusUseCase } from '../CheckUnlockStatusUseCase';
import { MockSecureStorage, MockLockoutManager } from '@tests/helpers';

describe('CheckUnlockStatusUseCase', () => {
  let mockStorage: MockSecureStorage;
  let mockLockoutManager: MockLockoutManager;
  let useCase: CheckUnlockStatusUseCase;

  beforeEach(() => {
    mockStorage = new MockSecureStorage();
    mockLockoutManager = new MockLockoutManager();
    useCase = new CheckUnlockStatusUseCase(mockStorage as any, mockLockoutManager as any);
  });

  describe('locked status', () => {
    it('should return locked status when not unlocked and not locked out', async () => {
      mockStorage.setUnlocked(false);
      mockLockoutManager.setLockedOut(false);

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.value?.isUnlocked).toBe(false);
      expect(result.value?.isLockedOut).toBe(false);
    });

    it('should have null expiry dates for locked status', async () => {
      mockStorage.setUnlocked(false);
      mockLockoutManager.setLockedOut(false);

      const result = await useCase.execute();

      expect(result.value?.sessionExpiresAt).toBeNull();
      expect(result.value?.lockoutExpiresAt).toBeNull();
    });

    it('should allow unlock for locked status', async () => {
      const result = await useCase.execute();

      expect(result.value?.canUnlock()).toBe(true);
    });

    it('should need unlock for locked status', async () => {
      const result = await useCase.execute();

      expect(result.value?.needsUnlock()).toBe(true);
    });
  });

  describe('unlocked status', () => {
    beforeEach(() => {
      mockStorage.setUnlocked(true);
      mockLockoutManager.setLockedOut(false);
    });

    it('should return unlocked status when storage is unlocked', async () => {
      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.value?.isUnlocked).toBe(true);
      expect(result.value?.isLockedOut).toBe(false);
    });

    it('should include session expiry', async () => {
      const result = await useCase.execute();

      expect(result.value?.sessionExpiresAt).toBeDefined();
      expect(result.value?.sessionExpiresAt).toBeInstanceOf(Date);
    });

    it('should calculate session expiry from timeout', async () => {
      mockStorage.setSessionTimeout(1800000); // 30 minutes
      const beforeTime = Date.now();

      const result = await useCase.execute();

      const afterTime = Date.now();
      const expiryTime = result.value?.sessionExpiresAt?.getTime() || 0;

      expect(expiryTime).toBeGreaterThanOrEqual(beforeTime + 1800000);
      expect(expiryTime).toBeLessThanOrEqual(afterTime + 1800000);
    });

    it('should not need unlock', async () => {
      const result = await useCase.execute();

      expect(result.value?.needsUnlock()).toBe(false);
    });

    it('should have active session', async () => {
      const result = await useCase.execute();

      expect(result.value?.hasActiveSession()).toBe(true);
    });

    it('should have null lockout expiry', async () => {
      const result = await useCase.execute();

      expect(result.value?.lockoutExpiresAt).toBeNull();
    });
  });

  describe('locked out status', () => {
    beforeEach(() => {
      mockStorage.setUnlocked(false);
      mockLockoutManager.setLockedOut(true);
    });

    it('should return locked out status when locked out', async () => {
      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.value?.isUnlocked).toBe(false);
      expect(result.value?.isLockedOut).toBe(true);
    });

    it('should include lockout expiry', async () => {
      const result = await useCase.execute();

      expect(result.value?.lockoutExpiresAt).toBeDefined();
      expect(result.value?.lockoutExpiresAt).toBeInstanceOf(Date);
      expect(result.value?.lockoutExpiresAt).toEqual(mockLockoutManager.lockoutExpiry);
    });

    it('should not allow unlock', async () => {
      const result = await useCase.execute();

      expect(result.value?.canUnlock()).toBe(false);
    });

    it('should need unlock', async () => {
      const result = await useCase.execute();

      expect(result.value?.needsUnlock()).toBe(true);
    });

    it('should have null session expiry', async () => {
      const result = await useCase.execute();

      expect(result.value?.sessionExpiresAt).toBeNull();
    });

    it('should not have active session', async () => {
      const result = await useCase.execute();

      expect(result.value?.hasActiveSession()).toBe(false);
    });
  });

  describe('priority handling', () => {
    it('should prioritize lockout over unlocked state', async () => {
      // Even if storage reports unlocked, lockout should take precedence
      mockStorage.setUnlocked(true);
      mockLockoutManager.setLockedOut(true);

      const result = await useCase.execute();

      expect(result.value?.isLockedOut).toBe(true);
      expect(result.value?.isUnlocked).toBe(false);
    });

    it('should check lockout before checking unlocked state', async () => {
      let lockoutCheckCalled = false;
      let unlockedCheckCalled = false;

      mockLockoutManager.isLockedOut = async () => {
        lockoutCheckCalled = true;
        return true;
      };

      mockStorage.isUnlocked = () => {
        unlockedCheckCalled = true;
        return false;
      };

      await useCase.execute();

      expect(lockoutCheckCalled).toBe(true);
      // Unlocked check should not be called if locked out
    });
  });

  describe('session timeout handling', () => {
    beforeEach(() => {
      mockStorage.setUnlocked(true);
      mockLockoutManager.setLockedOut(false);
    });

    it('should use default session timeout', async () => {
      mockStorage.setSessionTimeout(3600000); // 1 hour

      const result = await useCase.execute();

      const remaining = result.value?.getRemainingSessionTime() || 0;
      expect(remaining).toBeGreaterThan(3599000);
      expect(remaining).toBeLessThanOrEqual(3600000);
    });

    it('should support custom session timeout', async () => {
      mockStorage.setSessionTimeout(1800000); // 30 minutes

      const result = await useCase.execute();

      const remaining = result.value?.getRemainingSessionTime() || 0;
      expect(remaining).toBeGreaterThan(1799000);
      expect(remaining).toBeLessThanOrEqual(1800000);
    });

    it('should support short session timeout', async () => {
      mockStorage.setSessionTimeout(300000); // 5 minutes

      const result = await useCase.execute();

      const remaining = result.value?.getRemainingSessionTime() || 0;
      expect(remaining).toBeGreaterThan(299000);
      expect(remaining).toBeLessThanOrEqual(300000);
    });

    it('should support long session timeout', async () => {
      mockStorage.setSessionTimeout(7200000); // 2 hours

      const result = await useCase.execute();

      const remaining = result.value?.getRemainingSessionTime() || 0;
      expect(remaining).toBeGreaterThan(7199000);
      expect(remaining).toBeLessThanOrEqual(7200000);
    });
  });

  describe('error handling', () => {
    it('should handle lockout check errors', async () => {
      mockLockoutManager.isLockedOut = async () => {
        throw new Error('Lockout check failed');
      };

      const result = await useCase.execute();

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Failed to check unlock status');
    });

    it('should handle storage check errors', async () => {
      mockStorage.isUnlocked = () => {
        throw new Error('Storage check failed');
      };

      const result = await useCase.execute();

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Failed to check unlock status');
    });

    it('should handle non-Error exceptions', async () => {
      mockLockoutManager.isLockedOut = async () => {
        throw 'String error';
      };

      const result = await useCase.execute();

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Failed to check unlock status');
    });

    it('should not mask error details', async () => {
      mockLockoutManager.isLockedOut = async () => {
        throw new Error('Database connection lost');
      };

      const result = await useCase.execute();

      expect(result.error).toContain('Database connection lost');
    });
  });

  describe('state transitions', () => {
    it('should detect transition from locked to unlocked', async () => {
      // Check initially locked
      const result1 = await useCase.execute();
      expect(result1.value?.isUnlocked).toBe(false);

      // Unlock
      mockStorage.setUnlocked(true);

      // Check now unlocked
      const result2 = await useCase.execute();
      expect(result2.value?.isUnlocked).toBe(true);
    });

    it('should detect transition from unlocked to locked', async () => {
      // Start unlocked
      mockStorage.setUnlocked(true);

      const result1 = await useCase.execute();
      expect(result1.value?.isUnlocked).toBe(true);

      // Lock
      mockStorage.setUnlocked(false);

      const result2 = await useCase.execute();
      expect(result2.value?.isUnlocked).toBe(false);
    });

    it('should detect transition to locked out', async () => {
      const result1 = await useCase.execute();
      expect(result1.value?.isLockedOut).toBe(false);

      // Become locked out
      mockLockoutManager.setLockedOut(true);

      const result2 = await useCase.execute();
      expect(result2.value?.isLockedOut).toBe(true);
    });

    it('should detect lockout expiry', async () => {
      // Start locked out
      mockLockoutManager.setLockedOut(true);

      const result1 = await useCase.execute();
      expect(result1.value?.isLockedOut).toBe(true);

      // Lockout expires
      mockLockoutManager.setLockedOut(false);

      const result2 = await useCase.execute();
      expect(result2.value?.isLockedOut).toBe(false);
    });
  });

  describe('real-world scenarios', () => {
    it('should check status after application start', async () => {
      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
    });

    it('should check status during active session', async () => {
      mockStorage.setUnlocked(true);

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.value?.isUnlocked).toBe(true);
      expect(result.value?.hasActiveSession()).toBe(true);
    });

    it('should check status after failed login attempts', async () => {
      mockLockoutManager.setLockedOut(true);

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.value?.isLockedOut).toBe(true);
      expect(result.value?.canUnlock()).toBe(false);
    });

    it('should check status periodically', async () => {
      // Simulate periodic checks
      for (let i = 0; i < 5; i++) {
        const result = await useCase.execute();
        expect(result.isSuccess).toBe(true);
      }
    });

    it('should provide UI with status information', async () => {
      mockStorage.setUnlocked(true);

      const result = await useCase.execute();

      // UI can use this information
      expect(result.value?.getStatusString()).toBe('unlocked');
      expect(result.value?.getDescription()).toContain('Unlocked');
      expect(result.value?.getFormattedRemainingTime()).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should handle status check before sensitive operation', async () => {
      mockStorage.setUnlocked(true);

      const result = await useCase.execute();

      if (result.value?.isUnlocked) {
        // Proceed with sensitive operation
        expect(result.value.hasActiveSession()).toBe(true);
      }
    });
  });

  describe('multiple status checks', () => {
    it('should handle rapid consecutive checks', async () => {
      const promises = [useCase.execute(), useCase.execute(), useCase.execute()];

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.isSuccess).toBe(true);
      });
    });

    it('should return consistent results for same state', async () => {
      mockStorage.setUnlocked(true);

      const result1 = await useCase.execute();
      const result2 = await useCase.execute();

      expect(result1.value?.isUnlocked).toBe(result2.value?.isUnlocked);
      expect(result1.value?.isLockedOut).toBe(result2.value?.isLockedOut);
    });

    it('should reflect state changes immediately', async () => {
      const result1 = await useCase.execute();
      expect(result1.value?.isUnlocked).toBe(false);

      mockStorage.setUnlocked(true);

      const result2 = await useCase.execute();
      expect(result2.value?.isUnlocked).toBe(true);
    });
  });

  describe('status object validation', () => {
    it('should return valid UnlockStatus for locked', async () => {
      const result = await useCase.execute();

      expect(result.value).toBeDefined();
      expect(result.value?.getStatusString()).toBe('locked');
    });

    it('should return valid UnlockStatus for unlocked', async () => {
      mockStorage.setUnlocked(true);

      const result = await useCase.execute();

      expect(result.value).toBeDefined();
      expect(result.value?.getStatusString()).toBe('unlocked');
    });

    it('should return valid UnlockStatus for locked out', async () => {
      mockLockoutManager.setLockedOut(true);

      const result = await useCase.execute();

      expect(result.value).toBeDefined();
      expect(result.value?.getStatusString()).toBe('locked_out');
    });
  });
});
