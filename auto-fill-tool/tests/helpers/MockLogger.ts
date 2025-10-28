/**
 * Test Helper: Mock Logger
 * Provides a standardized mock implementation of the Logger interface for testing.
 */

import { Logger } from '@domain/types/logger.types';

/**
 * Creates a mock Logger instance for testing.
 * All methods are Jest mock functions that can be spied on and verified.
 *
 * @example
 * ```typescript
 * import { createMockLogger } from '@tests/helpers/MockLogger';
 *
 * describe('MyComponent', () => {
 *   let mockLogger: jest.Mocked<Logger>;
 *
 *   beforeEach(() => {
 *     mockLogger = createMockLogger();
 *   });
 *
 *   it('should log info message', () => {
 *     // ... test code ...
 *     expect(mockLogger.info).toHaveBeenCalledWith('Expected message');
 *   });
 * });
 * ```
 */
export function createMockLogger(): jest.Mocked<Logger> {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    createChild: jest.fn().mockReturnThis(),
    setLevel: jest.fn(),
    getLevel: jest.fn().mockReturnValue(1), // Default: INFO level
  } as any;
}

/**
 * Creates a mock Logger (alias for createMockLogger).
 * All mock functions in Jest automatically track calls.
 *
 * @example
 * ```typescript
 * const mockLogger = createSpyLogger();
 * myService.doSomething();
 *
 * expect(mockLogger.debug).toHaveBeenNthCalledWith(1, 'First debug message');
 * expect(mockLogger.info).toHaveBeenCalledTimes(1);
 * ```
 */
export function createSpyLogger(): jest.Mocked<Logger> {
  return createMockLogger();
}
