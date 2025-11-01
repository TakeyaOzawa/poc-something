/**
 * Mock SecureStorage for Testing
 * Shared mock implementation of SecureStorage interface
 */

import { SecureStorage } from '@domain/types/secure-storage-port.types';
import { Result } from '@domain/values/result.value';

export class MockSecureStorage implements SecureStorage {
  // State properties
  isUnlockedState = false;
  sessionTimeout = 3600000; // 1 hour (default)
  isInitializedState = true;
  correctPassword = 'TestPassword123!@#'; // Default test password

  // Tracking properties for assertions
  unlockCalled = false;
  unlockPassword = '';
  lockCalled = false;
  shouldThrowError = false;
  errorMessage = 'Invalid password';

  // Encrypted storage
  private storage: Map<string, any> = new Map();

  async initialize(password: string): Promise<Result<void, Error>> {
    this.isInitializedState = true;
    return Result.success(undefined);
  }

  async unlock(password: string): Promise<Result<void, Error>> {
    this.unlockCalled = true;
    this.unlockPassword = password;

    if (this.shouldThrowError) {
      return Result.failure(new Error(this.errorMessage));
    }

    // Validate password
    if (password !== this.correctPassword) {
      return Result.failure(new Error('Invalid password'));
    }

    this.isUnlockedState = true;
    return Result.success(undefined);
  }

  lock(): void {
    this.lockCalled = true;

    if (this.shouldThrowError) {
      throw new Error(this.errorMessage);
    }

    this.isUnlockedState = false;
  }

  isUnlocked(): boolean {
    return this.isUnlockedState;
  }

  async isInitialized(): Promise<Result<boolean, Error>> {
    return Result.success(this.isInitializedState);
  }

  getSessionExpiresAt(): number | null {
    if (!this.isUnlockedState) return null;
    return Date.now() + this.sessionTimeout;
  }

  extendSession(): void {
    // No-op in mock
  }

  saveEncrypted = jest.fn(async (key: string, data: any): Promise<Result<void, Error>> => {
    if (!this.isUnlockedState) {
      return Result.failure(new Error('Storage is locked'));
    }
    this.storage.set(key, data);
    return Result.success(undefined);
  });

  loadEncrypted = jest.fn(async (key: string): Promise<Result<any, Error>> => {
    if (!this.isUnlockedState) {
      return Result.failure(new Error('Storage is locked'));
    }
    return Result.success(this.storage.get(key) || null);
  });

  removeEncrypted = jest.fn(async (key: string): Promise<Result<void, Error>> => {
    if (!this.isUnlockedState) {
      return Result.failure(new Error('Storage is locked'));
    }
    this.storage.delete(key);
    return Result.success(undefined);
  });

  async clearAllEncrypted(): Promise<Result<void, Error>> {
    if (!this.isUnlockedState) {
      return Result.failure(new Error('Storage is locked'));
    }
    this.storage.clear();
    return Result.success(undefined);
  }

  async changeMasterPassword(
    oldPassword: string,
    newPassword: string
  ): Promise<Result<void, Error>> {
    if (!this.isUnlockedState) {
      return Result.failure(new Error('Storage is locked'));
    }
    return Result.success(undefined);
  }

  async reset(): Promise<Result<void, Error>> {
    this.isUnlockedState = false;
    this.isInitializedState = false;
    this.storage.clear();
    return Result.success(undefined);
  }

  getSessionTimeout(): number {
    return this.sessionTimeout;
  }

  // Helper methods for test setup
  setSessionTimeout(timeout: number): void {
    this.sessionTimeout = timeout;
  }

  setThrowError(shouldThrow: boolean, message?: string): void {
    this.shouldThrowError = shouldThrow;
    if (message) {
      this.errorMessage = message;
    }
  }

  setUnlocked(unlocked: boolean): void {
    this.isUnlockedState = unlocked;
  }

  setInitialized(initialized: boolean): void {
    this.isInitializedState = initialized;
  }

  setCorrectPassword(password: string): void {
    this.correctPassword = password;
  }

  resetTracking(): void {
    this.unlockCalled = false;
    this.unlockPassword = '';
    this.lockCalled = false;
    this.shouldThrowError = false;
    this.errorMessage = 'Invalid password';
    this.saveEncrypted.mockClear();
    this.loadEncrypted.mockClear();
    this.removeEncrypted.mockClear();
  }
}
