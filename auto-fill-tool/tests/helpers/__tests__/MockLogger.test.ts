/**
 * Test: Mock Logger Helper
 * Verifies that the MockLogger helper works correctly.
 */

import { createMockLogger, createSpyLogger } from '../MockLogger';

describe('MockLogger Helper', () => {
  describe('createMockLogger', () => {
    it('should create a mock logger with all required methods', () => {
      const mockLogger = createMockLogger();

      expect(mockLogger.debug).toBeDefined();
      expect(mockLogger.info).toBeDefined();
      expect(mockLogger.warn).toBeDefined();
      expect(mockLogger.error).toBeDefined();
      expect(mockLogger.createChild).toBeDefined();
      expect(mockLogger.setLevel).toBeDefined();
      expect(mockLogger.getLevel).toBeDefined();
    });

    it('should have all methods as jest mock functions', () => {
      const mockLogger = createMockLogger();

      expect(jest.isMockFunction(mockLogger.debug)).toBe(true);
      expect(jest.isMockFunction(mockLogger.info)).toBe(true);
      expect(jest.isMockFunction(mockLogger.warn)).toBe(true);
      expect(jest.isMockFunction(mockLogger.error)).toBe(true);
      expect(jest.isMockFunction(mockLogger.createChild)).toBe(true);
    });

    it('should allow verification of log calls', () => {
      const mockLogger = createMockLogger();

      mockLogger.info('Test message', { key: 'value' });

      expect(mockLogger.info).toHaveBeenCalledWith('Test message', { key: 'value' });
      expect(mockLogger.info).toHaveBeenCalledTimes(1);
    });

    it('should createChild return this', () => {
      const mockLogger = createMockLogger();

      const childLogger = mockLogger.createChild('Child');

      expect(childLogger).toBe(mockLogger);
    });

    it('should getLevel return INFO level by default', () => {
      const mockLogger = createMockLogger();

      expect(mockLogger.getLevel()).toBe(1); // INFO level
    });
  });

  describe('createSpyLogger', () => {
    it('should create a spy logger', () => {
      const spyLogger = createSpyLogger();

      expect(spyLogger.debug).toBeDefined();
      expect(spyLogger.info).toBeDefined();
      expect(spyLogger.warn).toBeDefined();
      expect(spyLogger.error).toBeDefined();
    });

    it('should track log calls', () => {
      const spyLogger = createSpyLogger();

      spyLogger.debug('Debug message');
      spyLogger.info('Info message');

      expect(spyLogger.debug).toHaveBeenCalledTimes(1);
      expect(spyLogger.info).toHaveBeenCalledTimes(1);
    });
  });
});
