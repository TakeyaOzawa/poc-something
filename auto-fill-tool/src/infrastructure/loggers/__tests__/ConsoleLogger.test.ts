/**
 * Unit Tests: ConsoleLogger
 */

import { ConsoleLogger } from '../ConsoleLogger';
import { LogLevel } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ConsoleLogger', () => {
  let consoleDebugSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create logger with default context and level', () => {
      const logger = new ConsoleLogger();
      expect(logger.getLevel()).toBe(LogLevel.INFO);
    });

    it('should create logger with custom context and level', () => {
      const logger = new ConsoleLogger('TestContext', LogLevel.DEBUG);
      expect(logger.getLevel()).toBe(LogLevel.DEBUG);
    });
  });

  describe('log level control', () => {
    it('should log debug message when level is DEBUG', () => {
      const logger = new ConsoleLogger('Test', LogLevel.DEBUG);
      logger.debug('Debug message');

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test]'),
        'Debug message'
      );
    });

    it('should not log debug message when level is INFO', () => {
      const logger = new ConsoleLogger('Test', LogLevel.INFO);
      logger.debug('Debug message');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should log info message when level is INFO', () => {
      const logger = new ConsoleLogger('Test', LogLevel.INFO);
      logger.info('Info message');

      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test]'),
        'Info message'
      );
    });

    it('should not log info message when level is WARN', () => {
      const logger = new ConsoleLogger('Test', LogLevel.WARN);
      logger.info('Info message');

      expect(consoleInfoSpy).not.toHaveBeenCalled();
    });

    it('should log warn message when level is WARN', () => {
      const logger = new ConsoleLogger('Test', LogLevel.WARN);
      logger.warn('Warning message');

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test]'),
        'Warning message'
      );
    });

    it('should not log warn message when level is ERROR', () => {
      const logger = new ConsoleLogger('Test', LogLevel.ERROR);
      logger.warn('Warning message');

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should log error message when level is ERROR', () => {
      const logger = new ConsoleLogger('Test', LogLevel.ERROR);
      logger.error('Error message');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test]'),
        'Error message'
      );
    });

    it('should not log any message when level is NONE', () => {
      const logger = new ConsoleLogger('Test', LogLevel.NONE);
      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('setLevel', () => {
    it('should change log level dynamically', () => {
      const logger = new ConsoleLogger('Test', LogLevel.NONE);
      logger.info('Should not log');
      expect(consoleInfoSpy).not.toHaveBeenCalled();

      logger.setLevel(LogLevel.INFO);
      logger.info('Should log');
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('message formatting', () => {
    it('should include timestamp in message', () => {
      const logger = new ConsoleLogger('Test', LogLevel.INFO);
      logger.info('Test message');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{2}:\d{2}:\d{2}\.\d{3}\]/),
        'Test message'
      );
    });

    it('should include context in message', () => {
      const logger = new ConsoleLogger('MyContext', LogLevel.INFO);
      logger.info('Test message');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MyContext]'),
        'Test message'
      );
    });

    it('should include log level in message', () => {
      const logger = new ConsoleLogger('Test', LogLevel.INFO);
      logger.info('Test message');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        'Test message'
      );
    });

    it('should include context object when provided', () => {
      const logger = new ConsoleLogger('Test', LogLevel.INFO);
      const context = { userId: 123, action: 'login' };
      logger.info('User logged in', context);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test]'),
        'User logged in',
        expect.stringContaining('"userId": 123')
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test]'),
        'User logged in',
        expect.stringContaining('"action": "login"')
      );
    });
  });

  describe('error logging', () => {
    it('should log error with Error object', () => {
      const logger = new ConsoleLogger('Test', LogLevel.ERROR);
      const error = new Error('Test error');
      logger.error('An error occurred', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test]'),
        'An error occurred',
        error
      );
    });

    it('should log error with context and Error object', () => {
      const logger = new ConsoleLogger('Test', LogLevel.ERROR);
      const error = new Error('Test error');
      const context = { operation: 'save' };
      logger.error('Save failed', error, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test]'),
        'Save failed',
        expect.stringContaining('"operation": "save"'),
        error
      );
    });

    it('should log error without Error object', () => {
      const logger = new ConsoleLogger('Test', LogLevel.ERROR);
      logger.error('Error message');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Test]'),
        'Error message'
      );
    });
  });

  describe('createChild', () => {
    it('should create child logger with extended context', () => {
      const parentLogger = new ConsoleLogger('Parent', LogLevel.INFO);
      const childLogger = parentLogger.createChild('Child');

      childLogger.info('Test message');

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Parent:Child]'),
        'Test message'
      );
    });

    it('should inherit log level from parent', () => {
      const parentLogger = new ConsoleLogger('Parent', LogLevel.WARN);
      const childLogger = parentLogger.createChild('Child');

      childLogger.info('Should not log');
      expect(consoleInfoSpy).not.toHaveBeenCalled();

      childLogger.warn('Should log');
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });

    it('should allow child to change log level independently', () => {
      const parentLogger = new ConsoleLogger('Parent', LogLevel.WARN);
      const childLogger = parentLogger.createChild('Child');

      childLogger.setLevel(LogLevel.INFO);
      childLogger.info('Should log in child');
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);

      parentLogger.info('Should not log in parent');
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1); // Still 1, parent didn't log
    });
  });

  describe('all log methods', () => {
    it('should log all levels when DEBUG level is set', () => {
      const logger = new ConsoleLogger('Test', LogLevel.DEBUG);

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1); // debug
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1); // info
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });
});
