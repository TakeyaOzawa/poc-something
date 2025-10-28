/**
 * Test: Background Logger
 */

import browser from 'webextension-polyfill';
import { BackgroundLogger } from '../BackgroundLogger';
import { LogLevel } from '@domain/types/logger.types';

// Mock browser API
jest.mock('webextension-polyfill', () => ({
  runtime: {
    sendMessage: jest.fn(),
  },
}));

describe('BackgroundLogger', () => {
  let logger: BackgroundLogger;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = new BackgroundLogger('TestContext', LogLevel.DEBUG);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should initialize with default context and log level', () => {
      const defaultLogger = new BackgroundLogger();
      expect(defaultLogger.getLevel()).toBe(LogLevel.INFO);
    });

    it('should initialize with custom context and log level', () => {
      const customLogger = new BackgroundLogger('CustomContext', LogLevel.WARN);
      expect(customLogger.getLevel()).toBe(LogLevel.WARN);
    });
  });

  describe('debug', () => {
    it('should forward debug log to background script', async () => {
      (browser.runtime.sendMessage as jest.Mock).mockResolvedValue(undefined);

      logger.debug('Test debug message', { key: 'value' });

      await Promise.resolve();

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'forwardLog',
        level: 'DEBUG',
        context: 'TestContext',
        message: 'Test debug message',
        logContext: { key: 'value' },
        error: undefined,
        timestamp: expect.any(Number),
      });
    });

    it('should not log when level is above DEBUG', () => {
      const infoLogger = new BackgroundLogger('TestContext', LogLevel.INFO);
      infoLogger.debug('Should not log');

      expect(browser.runtime.sendMessage).not.toHaveBeenCalled();
    });

    it('should log without context', async () => {
      (browser.runtime.sendMessage as jest.Mock).mockResolvedValue(undefined);

      logger.debug('Test debug message');

      await Promise.resolve();

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'forwardLog',
        level: 'DEBUG',
        context: 'TestContext',
        message: 'Test debug message',
        logContext: undefined,
        error: undefined,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('info', () => {
    it('should forward info log to background script', async () => {
      (browser.runtime.sendMessage as jest.Mock).mockResolvedValue(undefined);

      logger.info('Test info message', { count: 42 });

      await Promise.resolve();

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'forwardLog',
        level: 'INFO',
        context: 'TestContext',
        message: 'Test info message',
        logContext: { count: 42 },
        error: undefined,
        timestamp: expect.any(Number),
      });
    });

    it('should not log when level is above INFO', () => {
      const warnLogger = new BackgroundLogger('TestContext', LogLevel.WARN);
      warnLogger.info('Should not log');

      expect(browser.runtime.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should forward warn log to background script', async () => {
      (browser.runtime.sendMessage as jest.Mock).mockResolvedValue(undefined);

      logger.warn('Test warn message', { warning: true });

      await Promise.resolve();

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'forwardLog',
        level: 'WARN',
        context: 'TestContext',
        message: 'Test warn message',
        logContext: { warning: true },
        error: undefined,
        timestamp: expect.any(Number),
      });
    });

    it('should not log when level is above WARN', () => {
      const errorLogger = new BackgroundLogger('TestContext', LogLevel.ERROR);
      errorLogger.warn('Should not log');

      expect(browser.runtime.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should forward error log with Error object', async () => {
      (browser.runtime.sendMessage as jest.Mock).mockResolvedValue(undefined);

      const testError = new Error('Test error');
      logger.error('Test error message', testError, { errorId: 123 });

      await Promise.resolve();

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'forwardLog',
        level: 'ERROR',
        context: 'TestContext',
        message: 'Test error message',
        logContext: { errorId: 123 },
        error: {
          message: 'Test error',
          stack: expect.any(String),
        },
        timestamp: expect.any(Number),
      });
    });

    it('should forward error log with non-Error object', async () => {
      (browser.runtime.sendMessage as jest.Mock).mockResolvedValue(undefined);

      logger.error('Test error message', 'String error');

      await Promise.resolve();

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'forwardLog',
        level: 'ERROR',
        context: 'TestContext',
        message: 'Test error message',
        logContext: undefined,
        error: {
          message: 'String error',
          stack: undefined,
        },
        timestamp: expect.any(Number),
      });
    });

    it('should forward error log without error object', async () => {
      (browser.runtime.sendMessage as jest.Mock).mockResolvedValue(undefined);

      logger.error('Test error message', undefined, { errorId: 456 });

      await Promise.resolve();

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'forwardLog',
        level: 'ERROR',
        context: 'TestContext',
        message: 'Test error message',
        logContext: { errorId: 456 },
        error: undefined,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('setLevel and getLevel', () => {
    it('should set and get log level', () => {
      logger.setLevel(LogLevel.WARN);
      expect(logger.getLevel()).toBe(LogLevel.WARN);

      logger.setLevel(LogLevel.ERROR);
      expect(logger.getLevel()).toBe(LogLevel.ERROR);
    });

    it('should respect log level filtering', () => {
      logger.setLevel(LogLevel.ERROR);

      logger.debug('Should not log');
      logger.info('Should not log');
      logger.warn('Should not log');

      expect(browser.runtime.sendMessage).not.toHaveBeenCalled();

      logger.error('Should log');
      expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('createChild', () => {
    it('should create child logger with nested context', async () => {
      (browser.runtime.sendMessage as jest.Mock).mockResolvedValue(undefined);

      const childLogger = logger.createChild('ChildContext');
      childLogger.info('Child message');

      await Promise.resolve();

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'forwardLog',
        level: 'INFO',
        context: 'TestContext:ChildContext',
        message: 'Child message',
        logContext: undefined,
        error: undefined,
        timestamp: expect.any(Number),
      });
    });

    it('should inherit log level from parent', () => {
      logger.setLevel(LogLevel.WARN);
      const childLogger = logger.createChild('ChildContext');

      expect(childLogger.getLevel()).toBe(LogLevel.WARN);
    });

    it('should create nested child loggers', async () => {
      (browser.runtime.sendMessage as jest.Mock).mockResolvedValue(undefined);

      const childLogger = logger.createChild('Child1');
      const grandChildLogger = childLogger.createChild('Child2');
      grandChildLogger.info('Nested message');

      await Promise.resolve();

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'forwardLog',
        level: 'INFO',
        context: 'TestContext:Child1:Child2',
        message: 'Nested message',
        logContext: undefined,
        error: undefined,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('error handling', () => {
    it('should handle sendMessage failure gracefully', async () => {
      const sendError = new Error('Send failed');
      (browser.runtime.sendMessage as jest.Mock).mockRejectedValue(sendError);

      logger.info('Test message');

      await Promise.resolve();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[BackgroundLogger] Failed to forward log:',
        sendError
      );
    });

    it('should not throw when sendMessage fails', () => {
      (browser.runtime.sendMessage as jest.Mock).mockRejectedValue(new Error('Send failed'));

      expect(() => {
        logger.info('Test message');
      }).not.toThrow();
    });

    it('should continue logging after a failed send', async () => {
      (browser.runtime.sendMessage as jest.Mock)
        .mockRejectedValueOnce(new Error('First send failed'))
        .mockResolvedValueOnce(undefined);

      logger.info('First message');
      await Promise.resolve();

      logger.info('Second message');
      await Promise.resolve();

      expect(browser.runtime.sendMessage).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should suppress channel closed errors', async () => {
      const channelClosedError = new Error(
        'A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received'
      );
      (browser.runtime.sendMessage as jest.Mock).mockRejectedValue(channelClosedError);

      logger.info('Test message');

      await Promise.resolve();

      // Channel closed errors should NOT be logged to console
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should suppress extension context invalidated errors', async () => {
      const contextInvalidatedError = new Error('Extension context invalidated');
      (browser.runtime.sendMessage as jest.Mock).mockRejectedValue(contextInvalidatedError);

      logger.info('Test message');

      await Promise.resolve();

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should suppress message port closed errors', async () => {
      const portClosedError = new Error('The message port closed before a response was received');
      (browser.runtime.sendMessage as jest.Mock).mockRejectedValue(portClosedError);

      logger.info('Test message');

      await Promise.resolve();

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should still log non-channel-related errors', async () => {
      const otherError = new Error('Network timeout');
      (browser.runtime.sendMessage as jest.Mock).mockRejectedValue(otherError);

      logger.info('Test message');

      await Promise.resolve();

      // Non-channel errors SHOULD be logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[BackgroundLogger] Failed to forward log:',
        otherError
      );
    });
  });

  describe('timestamp', () => {
    it('should include current timestamp in log message', async () => {
      (browser.runtime.sendMessage as jest.Mock).mockResolvedValue(undefined);

      const beforeTime = Date.now();
      logger.info('Test message');
      const afterTime = Date.now();

      await Promise.resolve();

      const call = (browser.runtime.sendMessage as jest.Mock).mock.calls[0][0];
      expect(call.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(call.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });
});
