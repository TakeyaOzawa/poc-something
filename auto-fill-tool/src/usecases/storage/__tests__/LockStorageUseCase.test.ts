import { LockStorageUseCase } from '../LockStorageUseCase';
import { MockSecureStorage } from '@tests/helpers';

describe('LockStorageUseCase', () => {
  it('should exist', () => {
    expect(LockStorageUseCase).toBeDefined();
  });

  it('should be constructable', () => {
    const mockStorage = new MockSecureStorage();
    const mockLogAggregator = {
      addLog: jest.fn().mockResolvedValue(undefined),
    };

    expect(() => {
      new LockStorageUseCase(mockStorage as any, mockLogAggregator as any);
    }).not.toThrow();
  });
});
