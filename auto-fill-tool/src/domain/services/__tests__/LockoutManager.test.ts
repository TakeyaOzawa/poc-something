/**
 * Unit Tests: LockoutManager
 */

import { LockoutManager } from '../LockoutManager';
import { LockoutStorage, LockoutStatus, LockoutState } from '@domain/types/lockout-manager.types';
import { LogAggregatorPort } from '@domain/ports/LogAggregatorPort';
import { LogEntry } from '@domain/entities/LogEntry';
import { IdGenerator } from '@domain/types/id-generator.types';

/**
 * Mock Lockout Storage for testing
 */
class MockLockoutStorage implements LockoutStorage {
  private state: { failedAttempts: number; lockoutStartedAt: number | null } | null = null;

  async save(state: { failedAttempts: number; lockoutStartedAt: number | null }): Promise<void> {
    this.state = { ...state };
  }

  async load(): Promise<{ failedAttempts: number; lockoutStartedAt: number | null } | null> {
    return this.state ? { ...this.state } : null;
  }

  async clear(): Promise<void> {
    this.state = null;
  }

  // Test helper
  getState() {
    return this.state;
  }
}

/**
 * Mock Log Aggregator for testing
 */
class MockLogAggregator implements LogAggregatorPort {
  private logs: LogEntry[] = [];

  async addLog(log: LogEntry): Promise<void> {
    this.logs.push(log);
  }

  async getLogs(): Promise<LogEntry[]> {
    return [...this.logs];
  }

  async getLogCount(): Promise<number> {
    return this.logs.length;
  }

  async deleteOldLogs(retentionDays: number): Promise<number> {
    return 0;
  }

  async clearAllLogs(): Promise<void> {
    this.logs = [];
  }

  async deleteLog(id: string): Promise<boolean> {
    const initialLength = this.logs.length;
    this.logs = this.logs.filter((log) => log.getId() !== id);
    return this.logs.length < initialLength;
  }

  async applyRotation(maxLogs: number): Promise<number> {
    const initialLength = this.logs.length;
    if (this.logs.length > maxLogs) {
      this.logs = this.logs.slice(-maxLogs);
    }
    return initialLength - this.logs.length;
  }
}

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('LockoutManager', () => {
  let storage: MockLockoutStorage;
  let logAggregator: MockLogAggregator;
  let manager: LockoutManager;
  const maxAttempts = 5;
  const lockoutDuration = 5 * 60 * 1000; // 5 minutes

  beforeEach(async () => {
    storage = new MockLockoutStorage();
    logAggregator = new MockLogAggregator();
    manager = new LockoutManager(storage, logAggregator, maxAttempts, lockoutDuration);
    await manager.initialize();
  });

  describe('constructor', () => {
    it('should create with default values', async () => {
      const defaultManager = new LockoutManager(storage, logAggregator);
      await defaultManager.initialize();

      expect(defaultManager.getMaxAttempts()).toBe(5);
      expect(defaultManager.getLockoutDuration()).toBe(5 * 60 * 1000);
    });

    it('should create with custom values', () => {
      const customManager = new LockoutManager(storage, logAggregator, 3, 10 * 60 * 1000);

      expect(customManager.getMaxAttempts()).toBe(3);
      expect(customManager.getLockoutDuration()).toBe(10 * 60 * 1000);
    });

    it('should throw error if maxAttempts is less than 1', () => {
      expect(() => new LockoutManager(storage, logAggregator, 0)).toThrow(
        'Max attempts must be at least 1'
      );
    });

    it('should throw error if lockoutDuration is less than 1 second', () => {
      expect(() => new LockoutManager(storage, logAggregator, 5, 500)).toThrow(
        'Lockout duration must be at least 1 second'
      );
    });
  });

  describe('initialize', () => {
    it('should load state from storage', async () => {
      await storage.save({ failedAttempts: 3, lockoutStartedAt: null });

      const newManager = new LockoutManager(storage, logAggregator, maxAttempts, lockoutDuration);
      await newManager.initialize();

      const status = await newManager.getStatus();
      expect(status.failedAttempts).toBe(3);
    });

    it('should start with clean state if no saved state', async () => {
      const status = await manager.getStatus();

      expect(status.failedAttempts).toBe(0);
      expect(status.isLockedOut).toBe(false);
    });
  });

  describe('recordFailedAttempt', () => {
    it('should increment failed attempts', async () => {
      await manager.recordFailedAttempt();

      const status = await manager.getStatus();
      expect(status.failedAttempts).toBe(1);
      expect(status.isLockedOut).toBe(false);
    });

    it('should lock out after max attempts', async () => {
      for (let i = 0; i < maxAttempts; i++) {
        await manager.recordFailedAttempt();
      }

      const status = await manager.getStatus();
      expect(status.failedAttempts).toBe(maxAttempts);
      expect(status.isLockedOut).toBe(true);
    });

    it('should throw error if already locked out', async () => {
      for (let i = 0; i < maxAttempts; i++) {
        await manager.recordFailedAttempt();
      }

      await expect(manager.recordFailedAttempt()).rejects.toThrow('Account is locked out');
    });

    it('should persist state to storage', async () => {
      await manager.recordFailedAttempt();

      const savedState = storage.getState();
      expect(savedState).not.toBeNull();
      expect(savedState!.failedAttempts).toBe(1);
    });
  });

  describe('recordSuccessfulAttempt', () => {
    it('should clear failed attempts', async () => {
      await manager.recordFailedAttempt();
      await manager.recordFailedAttempt();

      await manager.recordSuccessfulAttempt();

      const status = await manager.getStatus();
      expect(status.failedAttempts).toBe(0);
      expect(status.isLockedOut).toBe(false);
    });

    it('should clear lockout state', async () => {
      for (let i = 0; i < maxAttempts; i++) {
        await manager.recordFailedAttempt();
      }

      await manager.recordSuccessfulAttempt();

      const status = await manager.getStatus();
      expect(status.isLockedOut).toBe(false);
      expect(status.failedAttempts).toBe(0);
      expect(status.lockoutStartedAt).toBeNull();
    });

    it('should persist cleared state to storage', async () => {
      await manager.recordFailedAttempt();
      await manager.recordSuccessfulAttempt();

      const savedState = storage.getState();
      expect(savedState).not.toBeNull();
      expect(savedState!.failedAttempts).toBe(0);
      expect(savedState!.lockoutStartedAt).toBeNull();
    });
  });

  describe('isLockedOut', () => {
    it('should return false initially', async () => {
      expect(await manager.isLockedOut()).toBe(false);
    });

    it('should return false before max attempts', async () => {
      for (let i = 0; i < maxAttempts - 1; i++) {
        await manager.recordFailedAttempt();
      }

      expect(await manager.isLockedOut()).toBe(false);
    });

    it('should return true after max attempts', async () => {
      for (let i = 0; i < maxAttempts; i++) {
        await manager.recordFailedAttempt();
      }

      expect(await manager.isLockedOut()).toBe(true);
    });

    it('should return false after lockout expires', async () => {
      jest.useFakeTimers();

      for (let i = 0; i < maxAttempts; i++) {
        await manager.recordFailedAttempt();
      }

      expect(await manager.isLockedOut()).toBe(true);

      // Fast-forward time past lockout duration
      jest.advanceTimersByTime(lockoutDuration + 1000);

      expect(await manager.isLockedOut()).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('getStatus', () => {
    it('should return correct status initially', async () => {
      const status = await manager.getStatus();

      expect(status.isLockedOut).toBe(false);
      expect(status.failedAttempts).toBe(0);
      expect(status.lockoutStartedAt).toBeNull();
      expect(status.lockoutEndsAt).toBeNull();
      expect(status.remainingLockoutTime).toBe(0);
    });

    it('should return correct status with failed attempts', async () => {
      await manager.recordFailedAttempt();
      await manager.recordFailedAttempt();

      const status = await manager.getStatus();

      expect(status.isLockedOut).toBe(false);
      expect(status.failedAttempts).toBe(2);
      expect(status.lockoutStartedAt).toBeNull();
    });

    it('should return correct status when locked out', async () => {
      const startTime = Date.now();

      for (let i = 0; i < maxAttempts; i++) {
        await manager.recordFailedAttempt();
      }

      const status = await manager.getStatus();

      expect(status.isLockedOut).toBe(true);
      expect(status.failedAttempts).toBe(maxAttempts);
      expect(status.lockoutStartedAt).toBeGreaterThanOrEqual(startTime);
      expect(status.lockoutEndsAt).toBe(status.lockoutStartedAt! + lockoutDuration);
      expect(status.remainingLockoutTime).toBeGreaterThan(0);
      expect(status.remainingLockoutTime).toBeLessThanOrEqual(lockoutDuration);
    });

    it('should show decreasing remaining time', async () => {
      jest.useFakeTimers();

      for (let i = 0; i < maxAttempts; i++) {
        await manager.recordFailedAttempt();
      }

      const status1 = await manager.getStatus();
      const remaining1 = status1.remainingLockoutTime;

      jest.advanceTimersByTime(1000);

      const status2 = await manager.getStatus();
      const remaining2 = status2.remainingLockoutTime;

      expect(remaining2).toBeLessThan(remaining1);

      jest.useRealTimers();
    });
  });

  describe('reset', () => {
    it('should clear all failed attempts', async () => {
      await manager.recordFailedAttempt();
      await manager.recordFailedAttempt();

      await manager.reset();

      const status = await manager.getStatus();
      expect(status.failedAttempts).toBe(0);
    });

    it('should clear lockout state', async () => {
      for (let i = 0; i < maxAttempts; i++) {
        await manager.recordFailedAttempt();
      }

      await manager.reset();

      const status = await manager.getStatus();
      expect(status.isLockedOut).toBe(false);
      expect(status.lockoutStartedAt).toBeNull();
    });

    it('should clear storage', async () => {
      await manager.recordFailedAttempt();

      await manager.reset();

      const savedState = storage.getState();
      expect(savedState).toBeNull();
    });
  });

  describe('getRemainingAttempts', () => {
    it('should return max attempts initially', async () => {
      const remaining = await manager.getRemainingAttempts();
      expect(remaining).toBe(maxAttempts);
    });

    it('should decrease after failed attempts', async () => {
      await manager.recordFailedAttempt();

      const remaining = await manager.getRemainingAttempts();
      expect(remaining).toBe(maxAttempts - 1);
    });

    it('should return 0 when locked out', async () => {
      for (let i = 0; i < maxAttempts; i++) {
        await manager.recordFailedAttempt();
      }

      const remaining = await manager.getRemainingAttempts();
      expect(remaining).toBe(0);
    });

    it('should return max attempts after successful login', async () => {
      await manager.recordFailedAttempt();
      await manager.recordSuccessfulAttempt();

      const remaining = await manager.getRemainingAttempts();
      expect(remaining).toBe(maxAttempts);
    });
  });

  describe('getMaxAttempts', () => {
    it('should return configured max attempts', () => {
      expect(manager.getMaxAttempts()).toBe(maxAttempts);
    });
  });

  describe('getLockoutDuration', () => {
    it('should return configured lockout duration', () => {
      expect(manager.getLockoutDuration()).toBe(lockoutDuration);
    });
  });

  describe('edge cases', () => {
    it('should handle exactly max attempts', async () => {
      for (let i = 0; i < maxAttempts - 1; i++) {
        await manager.recordFailedAttempt();
      }

      expect(await manager.isLockedOut()).toBe(false);

      await manager.recordFailedAttempt();

      expect(await manager.isLockedOut()).toBe(true);
    });

    it('should handle rapid sequential attempts', async () => {
      const promises = [];
      for (let i = 0; i < maxAttempts - 1; i++) {
        promises.push(manager.recordFailedAttempt());
      }
      await Promise.all(promises);

      expect(await manager.isLockedOut()).toBe(false);

      await manager.recordFailedAttempt();

      expect(await manager.isLockedOut()).toBe(true);
    });

    it('should persist state across manager instances', async () => {
      await manager.recordFailedAttempt();
      await manager.recordFailedAttempt();

      const newManager = new LockoutManager(storage, logAggregator, maxAttempts, lockoutDuration);
      await newManager.initialize();

      const status = await newManager.getStatus();
      expect(status.failedAttempts).toBe(2);
    });

    it('should handle lockout expiration boundary', async () => {
      jest.useFakeTimers();

      for (let i = 0; i < maxAttempts; i++) {
        await manager.recordFailedAttempt();
      }

      expect(await manager.isLockedOut()).toBe(true);

      // Advance to just before expiration
      jest.advanceTimersByTime(lockoutDuration - 100);
      expect(await manager.isLockedOut()).toBe(true);

      // Advance past expiration
      jest.advanceTimersByTime(200);
      expect(await manager.isLockedOut()).toBe(false);

      jest.useRealTimers();
    });
  });
});
