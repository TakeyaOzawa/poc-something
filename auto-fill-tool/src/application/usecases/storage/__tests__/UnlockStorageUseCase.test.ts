import { UnlockStorageUseCase } from '../UnlockStorageUseCase';
import { MockSecureStorage, MockLockoutManager } from '@tests/helpers';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('UnlockStorageUseCase', () => {
  it('should exist', () => {
    expect(UnlockStorageUseCase).toBeDefined();
  });

  it('should be constructable', () => {
    const mockStorage = new MockSecureStorage();
    const mockLockoutManager = new MockLockoutManager();
    const mockLogAggregator = {
      addLog: jest.fn().mockResolvedValue(undefined),
    };

    expect(() => {
      new UnlockStorageUseCase(
        mockStorage as any,
        mockLockoutManager as any,
        mockLogAggregator as any
      );
    }).not.toThrow();
  });
});
