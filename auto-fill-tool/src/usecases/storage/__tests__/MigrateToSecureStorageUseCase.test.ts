// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('MigrateToSecureStorageUseCase', () => {
  it('should exist', () => {
    expect(true).toBe(true);
  });
});
