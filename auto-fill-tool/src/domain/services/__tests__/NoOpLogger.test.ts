/**
 * Unit Tests: NoOpLogger
 */

import { NoOpLogger } from '@domain/services/NoOpLogger';
import { LogLevel } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('NoOpLogger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create logger with default level NONE', () => {
      const logger = new NoOpLogger();
      expect(logger.getLevel()).toBe(LogLevel.NONE);
    });
  });

  describe('logging methods', () => {
    it('should not log debug messages', () => {
      const logger = new NoOpLogger();
      logger.debug('Debug message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should not log info messages', () => {
      const logger = new NoOpLogger();
      logger.info('Info message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should not log warn messages', () => {
      const logger = new NoOpLogger();
      logger.warn('Warning message');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should not log error messages', () => {
      const logger = new NoOpLogger();
      logger.error('Error message');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should not log with context objects', () => {
      const logger = new NoOpLogger();
      const context = { userId: 123 };
      logger.info('Message', context);
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should not log with error objects', () => {
      const logger = new NoOpLogger();
      const error = new Error('Test error');
      logger.error('Error message', error);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('setLevel and getLevel', () => {
    it('should update level but still not log', () => {
      const logger = new NoOpLogger();

      logger.setLevel(LogLevel.DEBUG);
      expect(logger.getLevel()).toBe(LogLevel.DEBUG);
      logger.debug('Debug message');
      expect(consoleLogSpy).not.toHaveBeenCalled();

      logger.setLevel(LogLevel.INFO);
      expect(logger.getLevel()).toBe(LogLevel.INFO);
      logger.info('Info message');
      expect(consoleLogSpy).not.toHaveBeenCalled();

      logger.setLevel(LogLevel.WARN);
      expect(logger.getLevel()).toBe(LogLevel.WARN);
      logger.warn('Warning message');
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      logger.setLevel(LogLevel.ERROR);
      expect(logger.getLevel()).toBe(LogLevel.ERROR);
      logger.error('Error message');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('createChild', () => {
    it('should create new NoOpLogger instance', () => {
      const logger = new NoOpLogger();
      const childLogger = logger.createChild('Child');

      expect(childLogger).toBeInstanceOf(NoOpLogger);
      expect(childLogger).not.toBe(logger);
    });

    it('should create child logger that does not log', () => {
      const logger = new NoOpLogger();
      const childLogger = logger.createChild('Child');

      childLogger.info('Test message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should create child logger with default level NONE', () => {
      const logger = new NoOpLogger();
      logger.setLevel(LogLevel.DEBUG);

      const childLogger = logger.createChild('Child');
      expect(childLogger.getLevel()).toBe(LogLevel.NONE);
    });
  });
});
