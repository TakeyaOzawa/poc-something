/**
 * Test for LoggerFactory
 */

import { LoggerFactory } from '../LoggerFactory';
import { ConsoleLogger } from '../ConsoleLogger';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import { LogLevel } from '@domain/types/logger.types';

describe('LoggerFactory', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('createLogger', () => {
    it('should return NoOpLogger when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';

      const logger = LoggerFactory.createLogger('TestContext');

      expect(logger).toBeInstanceOf(NoOpLogger);
    });

    it('should return ConsoleLogger when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';

      const logger = LoggerFactory.createLogger('TestContext');

      expect(logger).toBeInstanceOf(ConsoleLogger);
    });

    it('should return ConsoleLogger when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';

      const logger = LoggerFactory.createLogger('TestContext');

      expect(logger).toBeInstanceOf(ConsoleLogger);
    });

    it('should return ConsoleLogger when NODE_ENV is undefined', () => {
      delete process.env.NODE_ENV;

      const logger = LoggerFactory.createLogger('TestContext');

      expect(logger).toBeInstanceOf(ConsoleLogger);
    });

    it('should create ConsoleLogger with default INFO level', () => {
      process.env.NODE_ENV = 'production';

      const logger = LoggerFactory.createLogger('TestContext') as ConsoleLogger;

      expect(logger.getLevel()).toBe(LogLevel.INFO);
    });

    it('should create ConsoleLogger with specified log level', () => {
      process.env.NODE_ENV = 'production';

      const logger = LoggerFactory.createLogger('TestContext', LogLevel.DEBUG) as ConsoleLogger;

      expect(logger.getLevel()).toBe(LogLevel.DEBUG);
    });

    it('should create ConsoleLogger with WARN level', () => {
      process.env.NODE_ENV = 'production';

      const logger = LoggerFactory.createLogger('TestContext', LogLevel.WARN) as ConsoleLogger;

      expect(logger.getLevel()).toBe(LogLevel.WARN);
    });

    it('should create ConsoleLogger with ERROR level', () => {
      process.env.NODE_ENV = 'production';

      const logger = LoggerFactory.createLogger('TestContext', LogLevel.ERROR) as ConsoleLogger;

      expect(logger.getLevel()).toBe(LogLevel.ERROR);
    });

    it('should create ConsoleLogger with NONE level', () => {
      process.env.NODE_ENV = 'production';

      const logger = LoggerFactory.createLogger('TestContext', LogLevel.NONE) as ConsoleLogger;

      expect(logger.getLevel()).toBe(LogLevel.NONE);
    });
  });

  describe('createNoOpLogger', () => {
    it('should always return NoOpLogger', () => {
      process.env.NODE_ENV = 'production';

      const logger = LoggerFactory.createNoOpLogger();

      expect(logger).toBeInstanceOf(NoOpLogger);
    });

    it('should return NoOpLogger even in test environment', () => {
      process.env.NODE_ENV = 'test';

      const logger = LoggerFactory.createNoOpLogger();

      expect(logger).toBeInstanceOf(NoOpLogger);
    });

    it('should return logger that does not log', () => {
      const logger = LoggerFactory.createNoOpLogger();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      logger.debug('test message');
      logger.info('test message');
      logger.warn('test message');
      logger.error('test message');

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('createConsoleLogger', () => {
    it('should always return ConsoleLogger', () => {
      process.env.NODE_ENV = 'test';

      const logger = LoggerFactory.createConsoleLogger('TestContext');

      expect(logger).toBeInstanceOf(ConsoleLogger);
    });

    it('should create ConsoleLogger with default INFO level', () => {
      const logger = LoggerFactory.createConsoleLogger('TestContext') as ConsoleLogger;

      expect(logger.getLevel()).toBe(LogLevel.INFO);
    });

    it('should create ConsoleLogger with specified log level', () => {
      const logger = LoggerFactory.createConsoleLogger(
        'TestContext',
        LogLevel.DEBUG
      ) as ConsoleLogger;

      expect(logger.getLevel()).toBe(LogLevel.DEBUG);
    });

    it('should create ConsoleLogger with WARN level', () => {
      const logger = LoggerFactory.createConsoleLogger(
        'TestContext',
        LogLevel.WARN
      ) as ConsoleLogger;

      expect(logger.getLevel()).toBe(LogLevel.WARN);
    });

    it('should create ConsoleLogger with ERROR level', () => {
      const logger = LoggerFactory.createConsoleLogger(
        'TestContext',
        LogLevel.ERROR
      ) as ConsoleLogger;

      expect(logger.getLevel()).toBe(LogLevel.ERROR);
    });

    it('should create ConsoleLogger with NONE level', () => {
      const logger = LoggerFactory.createConsoleLogger(
        'TestContext',
        LogLevel.NONE
      ) as ConsoleLogger;

      expect(logger.getLevel()).toBe(LogLevel.NONE);
    });
  });

  describe('logger behavior', () => {
    it('should create functional NoOpLogger in test environment', () => {
      process.env.NODE_ENV = 'test';
      const logger = LoggerFactory.createLogger('TestContext');

      // Should not throw errors
      expect(() => {
        logger.debug('debug message');
        logger.info('info message');
        logger.warn('warn message');
        logger.error('error message', new Error('test error'));
      }).not.toThrow();
    });

    it('should create child logger from NoOpLogger', () => {
      process.env.NODE_ENV = 'test';
      const logger = LoggerFactory.createLogger('TestContext');
      const childLogger = logger.createChild('ChildContext');

      expect(childLogger).toBeInstanceOf(NoOpLogger);
    });

    it('should create child logger from ConsoleLogger', () => {
      process.env.NODE_ENV = 'production';
      const logger = LoggerFactory.createLogger('TestContext');
      const childLogger = logger.createChild('ChildContext');

      expect(childLogger).toBeInstanceOf(ConsoleLogger);
    });
  });
});
