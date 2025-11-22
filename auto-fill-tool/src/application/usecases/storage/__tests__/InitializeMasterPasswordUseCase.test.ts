/**
 * InitializeMasterPasswordUseCase Tests
 * Tests for master password initialization use case
 */

import { InitializeMasterPasswordUseCase } from '../InitializeMasterPasswordUseCase';
import { MasterPasswordPolicy } from '@domain/entities/MasterPasswordPolicy';
import { SecureStorage } from '@domain/ports/SecureStoragePort';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('InitializeMasterPasswordUseCase', () => {
  // Mock SecureStorage
  class MockSecureStorage implements SecureStorage {
    initializeCalled = false;
    initializePassword = '';
    shouldThrowError = false;
    errorMessage = 'Mock error';
    private isUnlockedState = false;
    private isInitializedState = false;
    private storage: Map<string, any> = new Map();

    async initialize(password: string): Promise<Result<void, Error>> {
      this.initializeCalled = true;
      this.initializePassword = password;
      if (this.shouldThrowError) {
        return Result.failure(new Error(this.errorMessage));
      }
      this.isInitializedState = true;
      return Result.success(undefined);
    }

    async isInitialized(): Promise<boolean> {
      return this.isInitializedState;
    }

    async unlock(password: string): Promise<void> {
      this.isUnlockedState = true;
    }

    lock(): void {
      this.isUnlockedState = false;
    }

    isUnlocked(): boolean {
      return this.isUnlockedState;
    }

    getSessionExpiresAt(): number | null {
      return this.isUnlockedState ? Date.now() + 3600000 : null;
    }

    extendSession(): void {
      // No-op in mock
    }

    async saveEncrypted(key: string, data: any): Promise<void> {
      if (!this.isUnlockedState) {
        throw new Error('Storage is locked');
      }
      this.storage.set(key, data);
    }

    async loadEncrypted<T>(key: string): Promise<T | null> {
      if (!this.isUnlockedState) {
        throw new Error('Storage is locked');
      }
      return this.storage.get(key) || null;
    }

    async removeEncrypted(key: string): Promise<void> {
      if (!this.isUnlockedState) {
        throw new Error('Storage is locked');
      }
      this.storage.delete(key);
    }

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
    }

    async reset(): Promise<void> {
      this.isUnlockedState = false;
      this.isInitializedState = false;
      this.storage.clear();
    }
  }

  let mockStorage: MockSecureStorage;
  let useCase: InitializeMasterPasswordUseCase;

  beforeEach(() => {
    mockStorage = new MockSecureStorage();
    useCase = new InitializeMasterPasswordUseCase(mockStorage, MasterPasswordPolicy.default());
  });

  describe('successful initialization', () => {
    it('should initialize with valid password and confirmation', async () => {
      const result = await useCase.execute({
        password: 'MySecureP@ss123',
        confirmation: 'MySecureP@ss123',
      });

      expect(result.isSuccess).toBe(true);
      expect(mockStorage.initializeCalled).toBe(true);
      expect(mockStorage.initializePassword).toBe('MySecureP@ss123');
    });

    it('should return success result with undefined value', async () => {
      const result = await useCase.execute({
        password: 'MySecureP@ss123',
        confirmation: 'MySecureP@ss123',
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it('should work with different valid passwords', async () => {
      const passwords = ['Abcdefgh12!@', 'MyP@ssw0rd2023', 'SecureP@ss123', 'C0mplex!Password'];

      for (const password of passwords) {
        mockStorage = new MockSecureStorage();
        useCase = new InitializeMasterPasswordUseCase(mockStorage, MasterPasswordPolicy.default());

        const result = await useCase.execute({
          password,
          confirmation: password,
        });

        expect(result.isSuccess).toBe(true);
      }
    });
  });

  describe('password validation failures', () => {
    it('should reject empty password', async () => {
      const result = await useCase.execute({
        password: '',
        confirmation: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('required');
      expect(mockStorage.initializeCalled).toBe(false);
    });

    it('should reject short password', async () => {
      const result = await useCase.execute({
        password: 'Abc12!',
        confirmation: 'Abc12!',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('at least 8 characters');
      expect(mockStorage.initializeCalled).toBe(false);
    });

    it('should reject weak password', async () => {
      const result = await useCase.execute({
        password: 'abcdefgh',
        confirmation: 'abcdefgh',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('too weak');
      expect(mockStorage.initializeCalled).toBe(false);
    });

    it('should reject password with leading whitespace', async () => {
      const result = await useCase.execute({
        password: ' MySecureP@ss123',
        confirmation: ' MySecureP@ss123',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('whitespace');
      expect(mockStorage.initializeCalled).toBe(false);
    });

    it('should reject password with trailing whitespace', async () => {
      const result = await useCase.execute({
        password: 'MySecureP@ss123 ',
        confirmation: 'MySecureP@ss123 ',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('whitespace');
      expect(mockStorage.initializeCalled).toBe(false);
    });

    it('should reject password exceeding max length', async () => {
      const longPassword = 'A'.repeat(129) + 'b1!';
      const result = await useCase.execute({
        password: longPassword,
        confirmation: longPassword,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('at most 128 characters');
      expect(mockStorage.initializeCalled).toBe(false);
    });

    it('should include multiple error messages', async () => {
      const result = await useCase.execute({
        password: ' abc ',
        confirmation: ' abc ',
      });

      expect(result.isFailure).toBe(true);
      // Should have multiple errors (length, strength, whitespace)
      expect(result.error?.split('\n').length).toBeGreaterThan(1);
    });
  });

  describe('confirmation validation failures', () => {
    it('should reject empty confirmation', async () => {
      const result = await useCase.execute({
        password: 'MySecureP@ss123',
        confirmation: '',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Confirmation password is required');
      expect(mockStorage.initializeCalled).toBe(false);
    });

    it('should reject non-matching confirmation', async () => {
      const result = await useCase.execute({
        password: 'MySecureP@ss123',
        confirmation: 'DifferentP@ss123',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('do not match');
      expect(mockStorage.initializeCalled).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const result = await useCase.execute({
        password: 'MySecureP@ss123',
        confirmation: 'mysecurep@ss123',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('do not match');
      expect(mockStorage.initializeCalled).toBe(false);
    });

    it('should detect typo in confirmation', async () => {
      const result = await useCase.execute({
        password: 'MySecureP@ss123',
        confirmation: 'MySecureP@ss124', // Last digit different
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('do not match');
      expect(mockStorage.initializeCalled).toBe(false);
    });
  });

  describe('storage initialization failures', () => {
    it('should handle storage initialization error', async () => {
      mockStorage.shouldThrowError = true;
      mockStorage.errorMessage = 'Storage error';

      const result = await useCase.execute({
        password: 'MySecureP@ss123',
        confirmation: 'MySecureP@ss123',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Failed to initialize');
      expect(result.error).toContain('Storage error');
    });

    it('should handle non-Error exceptions', async () => {
      mockStorage.initialize = async () => {
        return Result.failure(new Error('String error'));
      };

      const result = await useCase.execute({
        password: 'MySecureP@ss123',
        confirmation: 'MySecureP@ss123',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Failed to initialize');
    });

    it('should not mask storage errors', async () => {
      mockStorage.shouldThrowError = true;
      mockStorage.errorMessage = 'Database connection failed';

      const result = await useCase.execute({
        password: 'MySecureP@ss123',
        confirmation: 'MySecureP@ss123',
      });

      expect(result.error).toContain('Database connection failed');
    });
  });

  describe('policy usage', () => {
    it('should use default policy when not specified', () => {
      const useCaseWithDefault = new InitializeMasterPasswordUseCase(mockStorage);

      // Default policy should be used (maxAttempts: 5)
      expect(useCaseWithDefault).toBeDefined();
    });

    it('should use custom policy when specified', async () => {
      const strictPolicy = MasterPasswordPolicy.strict();
      const useCaseWithStrict = new InitializeMasterPasswordUseCase(mockStorage, strictPolicy);

      const result = await useCaseWithStrict.execute({
        password: 'MySecureP@ss123',
        confirmation: 'MySecureP@ss123',
      });

      expect(result.isSuccess).toBe(true);
    });

    it('should use lenient policy when specified', async () => {
      const lenientPolicy = MasterPasswordPolicy.lenient();
      const useCaseWithLenient = new InitializeMasterPasswordUseCase(mockStorage, lenientPolicy);

      const result = await useCaseWithLenient.execute({
        password: 'MySecureP@ss123',
        confirmation: 'MySecureP@ss123',
      });

      expect(result.isSuccess).toBe(true);
    });
  });

  describe('validation order', () => {
    it('should validate password before confirmation', async () => {
      const result = await useCase.execute({
        password: 'abc', // Invalid
        confirmation: 'xyz', // Also doesn't match
      });

      expect(result.isFailure).toBe(true);
      // Should report password validation errors, not just mismatch
      expect(result.error).toContain('at least 8');
    });

    it('should not initialize storage if password validation fails', async () => {
      await useCase.execute({
        password: 'weak',
        confirmation: 'weak',
      });

      expect(mockStorage.initializeCalled).toBe(false);
    });

    it('should not initialize storage if confirmation validation fails', async () => {
      await useCase.execute({
        password: 'MySecureP@ss123',
        confirmation: 'Different',
      });

      expect(mockStorage.initializeCalled).toBe(false);
    });

    it('should only initialize storage if both validations pass', async () => {
      await useCase.execute({
        password: 'MySecureP@ss123',
        confirmation: 'MySecureP@ss123',
      });

      expect(mockStorage.initializeCalled).toBe(true);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle user registration flow', async () => {
      const password = 'MyFirstSecureP@ss123';
      const result = await useCase.execute({
        password,
        confirmation: password,
      });

      expect(result.isSuccess).toBe(true);
      expect(mockStorage.initializeCalled).toBe(true);
      expect(mockStorage.initializePassword).toBe(password);
    });

    it('should handle user typo in confirmation', async () => {
      const result = await useCase.execute({
        password: 'MySecureP@ss123',
        confirmation: 'MySecureP@ss124',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('do not match');
    });

    it('should handle weak password attempt', async () => {
      const result = await useCase.execute({
        password: 'password123',
        confirmation: 'password123',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('too weak');
    });

    it('should provide helpful error messages', async () => {
      const result = await useCase.execute({
        password: 'short',
        confirmation: 'short',
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeTruthy();
      expect(result.error!.length).toBeGreaterThan(0);
    });

    it('should handle complex valid passwords', async () => {
      const complexPasswords = [
        'MyC0mpl3x!P@ssw0rd',
        'Sup3r$ecure#2023',
        'V3ry&Long*Password+2023',
        '!@#Abc123xyz!@#',
      ];

      for (const password of complexPasswords) {
        mockStorage = new MockSecureStorage();
        useCase = new InitializeMasterPasswordUseCase(mockStorage, MasterPasswordPolicy.default());

        const result = await useCase.execute({
          password,
          confirmation: password,
        });

        expect(result.isSuccess).toBe(true);
      }
    });
  });
});
