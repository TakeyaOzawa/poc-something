/**
 * LockStorageUseCase Tests
 * Tests for lock storage use case
 */

import { LockStorageUseCase } from '../LockStorageUseCase';
import { MockSecureStorage } from '@tests/helpers';

describe('LockStorageUseCase', () => {
  let mockStorage: MockSecureStorage;
  let mockLogAggregator: any;
  let useCase: LockStorageUseCase;

  beforeEach(() => {
    mockStorage = new MockSecureStorage();
    mockLogAggregator = {
      addLog: jest.fn().mockResolvedValue(undefined),
      getLogs: jest.fn().mockResolvedValue([]),
      getLogCount: jest.fn().mockResolvedValue(0),
      deleteOldLogs: jest.fn().mockResolvedValue(0),
      clearAllLogs: jest.fn().mockResolvedValue(undefined),
      deleteLog: jest.fn().mockResolvedValue(false),
      applyRotation: jest.fn().mockResolvedValue(0),
    };
    useCase = new LockStorageUseCase(mockStorage as any, mockLogAggregator);
  });

  describe('successful lock', () => {
    it('should lock storage', async () => {
      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(mockStorage.lockCalled).toBe(true);
    });

    it('should return success result with undefined value', async () => {
      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it('should lock even when already locked', async () => {
      mockStorage.isUnlockedState = false;

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(mockStorage.lockCalled).toBe(true);
    });

    it('should lock when currently unlocked', async () => {
      mockStorage.isUnlockedState = true;

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(mockStorage.isUnlockedState).toBe(false);
    });
  });

  describe('lock failures', () => {
    it('should handle storage lock error', async () => {
      mockStorage.shouldThrowError = true;
      mockStorage.errorMessage = 'Storage lock failed';

      const result = await useCase.execute();

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Failed to lock storage');
      expect(result.error).toContain('Storage lock failed');
    });

    it('should handle non-Error exceptions', async () => {
      mockStorage.lock = async () => {
        throw 'String error';
      };

      const result = await useCase.execute();

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Failed to lock storage');
    });

    it('should handle storage corruption errors', async () => {
      mockStorage.shouldThrowError = true;
      mockStorage.errorMessage = 'Storage corrupted';

      const result = await useCase.execute();

      expect(result.error).toContain('Storage corrupted');
    });

    it('should not mask storage errors', async () => {
      mockStorage.shouldThrowError = true;
      mockStorage.errorMessage = 'Database write failed';

      const result = await useCase.execute();

      expect(result.error).toContain('Database write failed');
    });
  });

  describe('multiple lock calls', () => {
    it('should handle multiple consecutive lock calls', async () => {
      const result1 = await useCase.execute();
      const result2 = await useCase.execute();
      const result3 = await useCase.execute();

      expect(result1.isSuccess).toBe(true);
      expect(result2.isSuccess).toBe(true);
      expect(result3.isSuccess).toBe(true);
    });

    it('should call storage lock each time', async () => {
      let lockCallCount = 0;
      mockStorage.lock = async () => {
        lockCallCount++;
        mockStorage.isUnlockedState = false;
      };

      await useCase.execute();
      await useCase.execute();

      expect(lockCallCount).toBe(2);
    });
  });

  describe('state transitions', () => {
    it('should transition from unlocked to locked', async () => {
      mockStorage.isUnlockedState = true;

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(mockStorage.isUnlockedState).toBe(false);
    });

    it('should maintain locked state', async () => {
      mockStorage.isUnlockedState = false;

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(mockStorage.isUnlockedState).toBe(false);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle user logout', async () => {
      mockStorage.isUnlockedState = true;

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(mockStorage.isUnlockedState).toBe(false);
    });

    it('should handle session timeout', async () => {
      mockStorage.isUnlockedState = true;

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(mockStorage.lockCalled).toBe(true);
    });

    it('should handle manual lock request', async () => {
      mockStorage.isUnlockedState = true;

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
    });

    it('should handle lock on browser close', async () => {
      mockStorage.isUnlockedState = true;

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(mockStorage.isUnlockedState).toBe(false);
    });

    it('should handle lock after successful operation', async () => {
      // Simulate: user unlocked, performed operation, now locking
      mockStorage.isUnlockedState = true;

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
    });
  });

  describe('error recovery', () => {
    it('should not change state on lock failure', async () => {
      mockStorage.isUnlockedState = true;
      mockStorage.lock = async () => {
        throw new Error('Lock failed');
        // State not changed due to error
      };

      const result = await useCase.execute();

      expect(result.isFailure).toBe(true);
      // State should remain unlocked since lock failed
      expect(mockStorage.isUnlockedState).toBe(true);
    });

    it('should allow retry after lock failure', async () => {
      mockStorage.shouldThrowError = true;

      const result1 = await useCase.execute();
      expect(result1.isFailure).toBe(true);

      // Retry after fixing the issue
      mockStorage.shouldThrowError = false;

      const result2 = await useCase.execute();
      expect(result2.isSuccess).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid lock calls', async () => {
      const promises = [useCase.execute(), useCase.execute(), useCase.execute()];

      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.isSuccess).toBe(true);
      });
    });

    it('should be idempotent', async () => {
      const result1 = await useCase.execute();
      const result2 = await useCase.execute();
      const result3 = await useCase.execute();

      expect(result1.isSuccess).toBe(true);
      expect(result2.isSuccess).toBe(true);
      expect(result3.isSuccess).toBe(true);
    });
  });

  describe('integration patterns', () => {
    it('should work in unlock-lock cycle', async () => {
      // Unlock
      await mockStorage.unlock('password');
      expect(mockStorage.isUnlockedState).toBe(true);

      // Lock
      const result = await useCase.execute();
      expect(result.isSuccess).toBe(true);
      expect(mockStorage.isUnlockedState).toBe(false);
    });

    it('should work in multiple cycles', async () => {
      for (let i = 0; i < 3; i++) {
        // Unlock
        await mockStorage.unlock('password');
        expect(mockStorage.isUnlockedState).toBe(true);

        // Lock
        const result = await useCase.execute();
        expect(result.isSuccess).toBe(true);
        expect(mockStorage.isUnlockedState).toBe(false);
      }
    });
  });
});
