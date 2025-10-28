/**
 * UnlockStorageUseCase Tests
 * Tests for unlock storage use case with lockout management
 */

import { UnlockStorageUseCase } from '../UnlockStorageUseCase';
import { MockSecureStorage, MockLockoutManager } from '@tests/helpers';
import { SecureStorage } from '@domain/types/secure-storage-port.types';
import { LockoutManager } from '@domain/types/lockout-manager.types';

describe('UnlockStorageUseCase', () => {
  let mockStorage: MockSecureStorage;
  let mockLockoutManager: MockLockoutManager;
  let mockLogAggregator: any;
  let useCase: UnlockStorageUseCase;

  beforeEach(() => {
    mockStorage = new MockSecureStorage();
    mockLockoutManager = new MockLockoutManager();
    mockLogAggregator = {
      addLog: jest.fn().mockResolvedValue(undefined),
      getLogs: jest.fn().mockResolvedValue([]),
      getLogCount: jest.fn().mockResolvedValue(0),
      deleteOldLogs: jest.fn().mockResolvedValue(0),
      clearAllLogs: jest.fn().mockResolvedValue(undefined),
      deleteLog: jest.fn().mockResolvedValue(false),
      applyRotation: jest.fn().mockResolvedValue(0),
    };
    useCase = new UnlockStorageUseCase(
      mockStorage as unknown as SecureStorage,
      mockLockoutManager as unknown as LockoutManager,
      mockLogAggregator
    );
  });

  describe('successful unlock', () => {
    it('should unlock with correct password', async () => {
      const result = await useCase.execute({ password: 'MySecureP@ss123' });

      expect(result.isSuccess).toBe(true);
      expect(mockStorage.unlockCalled).toBe(true);
      expect(mockStorage.unlockPassword).toBe('MySecureP@ss123');
    });

    it('should reset lockout counter on success', async () => {
      await useCase.execute({ password: 'MySecureP@ss123' });

      expect(mockLockoutManager.recordSuccessfulAttemptCalled).toBe(true);
    });

    it('should return unlocked status', async () => {
      const result = await useCase.execute({ password: 'MySecureP@ss123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.isUnlocked).toBe(true);
      expect(result.value?.isLockedOut).toBe(false);
    });

    it('should include session expiry in status', async () => {
      const result = await useCase.execute({ password: 'MySecureP@ss123' });

      expect(result.value?.sessionExpiresAt).toBeDefined();
      expect(result.value?.sessionExpiresAt).toBeInstanceOf(Date);
    });

    it('should calculate session expiry from timeout', async () => {
      mockStorage.setSessionTimeout(1800000); // 30 minutes
      const beforeTime = Date.now();

      const result = await useCase.execute({ password: 'MySecureP@ss123' });

      const afterTime = Date.now();
      const expiryTime = result.value?.sessionExpiresAt?.getTime() || 0;

      expect(expiryTime).toBeGreaterThanOrEqual(beforeTime + 1800000);
      expect(expiryTime).toBeLessThanOrEqual(afterTime + 1800000);
    });
  });

  describe('lockout check', () => {
    it('should check lockout before attempting unlock', async () => {
      mockLockoutManager.setLockedOut(true);

      await useCase.execute({ password: 'MySecureP@ss123' });

      expect(mockStorage.unlockCalled).toBe(false);
    });

    it('should return locked out status when locked out', async () => {
      mockLockoutManager.setLockedOut(true);

      const result = await useCase.execute({ password: 'MySecureP@ss123' });

      expect(result.isFailure).toBe(true);
      expect(result.data?.isLockedOut).toBe(true);
    });

    it('should include lockout expiry in status', async () => {
      mockLockoutManager.setLockedOut(true);

      const result = await useCase.execute({ password: 'MySecureP@ss123' });

      expect(result.data?.lockoutExpiresAt).toBeDefined();
      expect(result.data?.lockoutExpiresAt).toEqual(mockLockoutManager.lockoutExpiry);
    });

    it('should return appropriate error message when locked out', async () => {
      mockLockoutManager.setLockedOut(true);

      const result = await useCase.execute({ password: 'MySecureP@ss123' });

      expect(result.error).toContain('Too many failed attempts');
    });
  });

  describe('failed unlock attempts', () => {
    beforeEach(() => {
      mockStorage.setThrowError(true);
    });

    it('should record failed attempt on unlock failure', async () => {
      await useCase.execute({ password: 'WrongPassword' });

      expect(mockLockoutManager.recordFailedAttemptCalled).toBe(true);
    });

    it('should not reset lockout on failure', async () => {
      await useCase.execute({ password: 'WrongPassword' });

      expect(mockLockoutManager.resetCalled).toBe(false);
    });

    it('should return locked status on failure (not locked out yet)', async () => {
      mockLockoutManager.setLockedOut(false);

      const result = await useCase.execute({ password: 'WrongPassword' });

      expect(result.isFailure).toBe(true);
      expect(result.data?.isUnlocked).toBe(false);
      expect(result.data?.isLockedOut).toBe(false);
    });

    it('should return remaining attempts in error message', async () => {
      mockLockoutManager.setRemainingAttempts(3);

      const result = await useCase.execute({ password: 'WrongPassword' });

      expect(result.error).toContain('3 attempt(s) remaining');
    });

    it('should handle transition to locked out state', async () => {
      // First call: not locked out yet
      mockLockoutManager.setLockedOut(false);

      await useCase.execute({ password: 'WrongPassword' });

      // Simulate lockout manager detecting too many attempts
      mockLockoutManager.setLockedOut(true);

      const result = await useCase.execute({ password: 'WrongPassword' });

      expect(result.data?.isLockedOut).toBe(true);
    });

    it('should return locked out status immediately after threshold', async () => {
      // Simulate just becoming locked out
      mockLockoutManager.setLockedOut(false);

      // This call will record attempt and check if now locked out
      mockLockoutManager.recordFailedAttempt = async function () {
        this.recordFailedAttemptCalled = true;
        this.failedAttempts++;
        this.isLockedOutState = true; // Now locked out
      };

      const result = await useCase.execute({ password: 'WrongPassword' });

      expect(result.isFailure).toBe(true);
      expect(result.data?.isLockedOut).toBe(true);
    });

    it('should include lockout duration in error message', async () => {
      mockLockoutManager.setLockedOut(false);
      mockLockoutManager.recordFailedAttempt = async function () {
        this.recordFailedAttemptCalled = true;
        this.isLockedOutState = true;
      };
      mockLockoutManager.setLockoutExpiry(new Date(Date.now() + 300000)); // 5 minutes

      const result = await useCase.execute({ password: 'WrongPassword' });

      expect(result.error).toContain('minute');
    });
  });

  describe('password handling', () => {
    it('should pass password to storage unlock', async () => {
      await useCase.execute({ password: 'TestP@ssw0rd' });

      expect(mockStorage.unlockPassword).toBe('TestP@ssw0rd');
    });

    it('should handle empty password', async () => {
      mockStorage.setThrowError(true);
      mockStorage.setThrowError(true, 'Password cannot be empty');

      const result = await useCase.execute({ password: '' });

      expect(result.isFailure).toBe(true);
    });

    it('should handle special characters in password', async () => {
      const specialPassword = 'P@$$w0rd!#%&*()';

      await useCase.execute({ password: specialPassword });

      expect(mockStorage.unlockPassword).toBe(specialPassword);
    });

    it('should handle long passwords', async () => {
      const longPassword = 'MyVeryLongP@ssw0rdWithMany Characters123!';

      await useCase.execute({ password: longPassword });

      expect(mockStorage.unlockPassword).toBe(longPassword);
    });
  });

  describe('error handling', () => {
    it('should handle storage unlock errors', async () => {
      mockStorage.setThrowError(true);
      mockStorage.setThrowError(true, 'Invalid password');

      const result = await useCase.execute({ password: 'WrongPassword' });

      expect(result.isFailure).toBe(true);
    });

    it('should not leak sensitive error details', async () => {
      mockStorage.setThrowError(true);
      mockStorage.setThrowError(true, 'Database connection failed: password123');

      const result = await useCase.execute({ password: 'test' });

      // Should not contain the actual password
      expect(result.error).not.toContain('test');
    });

    it('should handle non-Error exceptions', async () => {
      mockStorage.unlock = async () => {
        throw 'String error';
      };

      const result = await useCase.execute({ password: 'test' });

      expect(result.isFailure).toBe(true);
    });
  });

  describe('session timeout', () => {
    it('should use default session timeout', async () => {
      mockStorage.setSessionTimeout(3600000); // 1 hour

      const result = await useCase.execute({ password: 'MySecureP@ss123' });

      const remaining = result.value?.getRemainingSessionTime() || 0;
      expect(remaining).toBeGreaterThan(3599000);
      expect(remaining).toBeLessThanOrEqual(3600000);
    });

    it('should support custom session timeout', async () => {
      mockStorage.setSessionTimeout(1800000); // 30 minutes

      const result = await useCase.execute({ password: 'MySecureP@ss123' });

      const remaining = result.value?.getRemainingSessionTime() || 0;
      expect(remaining).toBeGreaterThan(1799000);
      expect(remaining).toBeLessThanOrEqual(1800000);
    });

    it('should support short session timeout', async () => {
      mockStorage.setSessionTimeout(300000); // 5 minutes

      const result = await useCase.execute({ password: 'MySecureP@ss123' });

      const remaining = result.value?.getRemainingSessionTime() || 0;
      expect(remaining).toBeGreaterThan(299000);
      expect(remaining).toBeLessThanOrEqual(300000);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle successful login flow', async () => {
      const result = await useCase.execute({ password: 'MySecureP@ss123' });

      expect(result.isSuccess).toBe(true);
      expect(result.value?.isUnlocked).toBe(true);
      expect(mockLockoutManager.recordSuccessfulAttemptCalled).toBe(true);
    });

    it('should handle failed login with remaining attempts', async () => {
      mockStorage.setThrowError(true);
      mockLockoutManager.setRemainingAttempts(4);

      const result = await useCase.execute({ password: 'WrongPassword' });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('4 attempt(s) remaining');
      expect(mockLockoutManager.recordFailedAttemptCalled).toBe(true);
    });

    it('should handle progressive lockout', async () => {
      mockStorage.setThrowError(true);

      // Attempt 1-4: Not locked out
      for (let i = 5; i > 1; i--) {
        mockLockoutManager.setRemainingAttempts(i - 1);
        mockLockoutManager.setLockedOut(false);

        const result = await useCase.execute({ password: 'WrongPassword' });

        expect(result.isFailure).toBe(true);
        expect(result.data?.isLockedOut).toBe(false);
      }

      // Attempt 5: Now locked out
      mockLockoutManager.recordFailedAttempt = async function () {
        this.recordFailedAttemptCalled = true;
        this.isLockedOutState = true;
      };

      const result = await useCase.execute({ password: 'WrongPassword' });

      expect(result.isFailure).toBe(true);
      expect(result.data?.isLockedOut).toBe(true);
    });

    it('should handle lockout expiry', async () => {
      // User is locked out
      mockLockoutManager.setLockedOut(true);
      mockLockoutManager.setLockoutExpiry(new Date(Date.now() + 100)); // 100ms

      const result1 = await useCase.execute({ password: 'MySecureP@ss123' });
      expect(result1.isFailure).toBe(true);
      expect(result1.data?.isLockedOut).toBe(true);

      // Wait for lockout to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Lockout should have expired (in real implementation)
      mockLockoutManager.setLockedOut(false);

      const result2 = await useCase.execute({ password: 'MySecureP@ss123' });
      expect(result2.isSuccess).toBe(true);
    });

    it('should handle rapid unlock attempts', async () => {
      mockStorage.setThrowError(true);

      const attempts = 3;
      for (let i = 0; i < attempts; i++) {
        await useCase.execute({ password: 'WrongPassword' });
      }

      expect(mockLockoutManager.failedAttempts).toBe(attempts);
    });

    it('should reset counter after successful unlock', async () => {
      mockStorage.setThrowError(true);

      // Failed attempts
      await useCase.execute({ password: 'Wrong1' });
      await useCase.execute({ password: 'Wrong2' });

      // Successful unlock
      mockStorage.setThrowError(false);
      await useCase.execute({ password: 'Correct' });

      expect(mockLockoutManager.recordSuccessfulAttemptCalled).toBe(true);
      expect(mockLockoutManager.failedAttempts).toBe(0); // Reset by recordSuccessfulAttempt
    });
  });

  describe('status object validation', () => {
    it('should return valid UnlockStatus on success', async () => {
      const result = await useCase.execute({ password: 'MySecureP@ss123' });

      expect(result.value).toBeDefined();
      expect(result.value?.isUnlocked).toBe(true);
      expect(result.value?.isLockedOut).toBe(false);
      expect(result.value?.sessionExpiresAt).toBeInstanceOf(Date);
      expect(result.value?.lockoutExpiresAt).toBeNull();
    });

    it('should return valid UnlockStatus on failure (not locked out)', async () => {
      mockStorage.setThrowError(true);

      const result = await useCase.execute({ password: 'Wrong' });

      expect(result.data).toBeDefined();
      expect(result.data?.isUnlocked).toBe(false);
      expect(result.data?.isLockedOut).toBe(false);
      expect(result.data?.sessionExpiresAt).toBeNull();
      expect(result.data?.lockoutExpiresAt).toBeNull();
    });

    it('should return valid UnlockStatus on lockout', async () => {
      mockLockoutManager.setLockedOut(true);

      const result = await useCase.execute({ password: 'test' });

      expect(result.data).toBeDefined();
      expect(result.data?.isUnlocked).toBe(false);
      expect(result.data?.isLockedOut).toBe(true);
      expect(result.data?.sessionExpiresAt).toBeNull();
      expect(result.data?.lockoutExpiresAt).toBeInstanceOf(Date);
    });
  });
});
