/**
 * Mock SecureStorage for Testing
 * Shared mock implementation of SecureStorage interface
 */

import { SecureStorage } from '@domain/types/secure-storage-port.types';

export class MockSecureStorage implements SecureStorage {
  // State properties
  isUnlockedState = false;
  sessionTimeout = 3600000; // 1 hour (default)
  isInitializedState = true;

  // Tracking properties for assertions
  unlockCalled = false;
  unlockPassword = '';
  lockCalled = false;
  shouldThrowError = false;
  errorMessage = 'Invalid password';

  // Encrypted storage
  private storage: Map<string, any> = new Map();

  async initialize(password: string): Promise<void> {
    this.isInitializedState = true;
  }

  async unlock(password: string): Promise<void> {
    this.unlockCalled = true;
    this.unlockPassword = password;

    if (this.shouldThrowError) {
      throw new Error(this.errorMessage);
    }

    this.isUnlockedState = true;
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

  async isInitialized(): Promise<boolean> {
    return this.isInitializedState;
  }

  getSessionExpiresAt(): number | null {
    if (!this.isUnlockedState) return null;
    return Date.now() + this.sessionTimeout;
  }

  extendSession(): void {
    // No-op in mock
  }

  saveEncrypted = jest.fn(async (key: string, data: any): Promise<void> => {
    if (!this.isUnlockedState) {
      throw new Error('Storage is locked');
    }
    this.storage.set(key, data);
  });

  loadEncrypted = jest.fn(async (key: string): Promise<any> => {
    if (!this.isUnlockedState) {
      throw new Error('Storage is locked');
    }
    return this.storage.get(key) || null;
  });

  removeEncrypted = jest.fn(async (key: string): Promise<void> => {
    if (!this.isUnlockedState) {
      throw new Error('Storage is locked');
    }
    this.storage.delete(key);
  });

  async clearAllEncrypted(): Promise<void> {
    if (!this.isUnlockedState) {
      throw new Error('Storage is locked');
    }
    this.storage.clear();
  }

  async changeMasterPassword(oldPassword: string, newPassword: string): Promise<void> {
    if (!this.isUnlockedState) {
      throw new Error('Storage is locked');
    }
    // No-op in mock
  }

  async reset(): Promise<void> {
    this.isUnlockedState = false;
    this.isInitializedState = false;
    this.storage.clear();
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
