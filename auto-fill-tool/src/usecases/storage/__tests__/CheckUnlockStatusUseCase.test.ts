import { CheckUnlockStatusUseCase } from '../CheckUnlockStatusUseCase';
import { MockSecureStorage, MockLockoutManager } from '@tests/helpers';

describe('CheckUnlockStatusUseCase', () => {
  it('should exist', () => {
    expect(CheckUnlockStatusUseCase).toBeDefined();
  });

  it('should be constructable', () => {
    const mockStorage = new MockSecureStorage();
    const mockLockoutManager = new MockLockoutManager();

    expect(() => {
      new CheckUnlockStatusUseCase(mockStorage as any, mockLockoutManager as any);
    }).not.toThrow();
  });
});
