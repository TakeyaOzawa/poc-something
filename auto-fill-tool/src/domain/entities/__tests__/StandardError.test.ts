/**
 * Unit Tests: StandardError Entity
 */

import { StandardError, type ErrorContext } from '../StandardError';
import type { I18nService } from '../../services/I18nService';

// Mock I18nService
const mockI18nService: I18nService = {
  getMessage: jest.fn((key: string, context?: any) => {
    // Mock message responses based on key patterns
    if (key.includes('_USER')) return 'User message for ' + key;
    if (key.includes('_DEV')) return 'Developer message for ' + key;
    if (key.includes('_RESOLUTION')) return 'Resolution message for ' + key;
    return 'Mock message for ' + key;
  }),
};

describe('StandardError Entity', () => {
  describe('constructor', () => {
    it('should create error with valid error code', () => {
      // Using a mock error code that would exist in ValidErrorCode type
      const errorCode = 'E_TEST_0001' as any; // Type assertion for test
      const context: ErrorContext = { userId: '123', action: 'test' };

      const error = new StandardError(errorCode, context);

      expect(error.errorCode).toBe(errorCode);
      expect(error.context).toEqual(context);
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.name).toBe('StandardError');
      expect(error.message).toBe(errorCode);
    });

    it('should create error with empty context by default', () => {
      const errorCode = 'E_TEST_0002' as any;

      const error = new StandardError(errorCode);

      expect(error.context).toEqual({});
    });
  });

  describe('dependency injection', () => {
    it('should set I18n service via dependency injection', () => {
      const errorCode = 'E_TEST_0001' as any;
      const error = new StandardError(errorCode);

      error.setI18nService(mockI18nService);

      // Should not throw and should use the injected service
      expect(() => error.getUserMessage()).not.toThrow();
    });

    it('should handle missing I18n service gracefully', () => {
      const errorCode = 'E_TEST_0001' as any;
      const error = new StandardError(errorCode);

      // Should return fallback message when no service is injected
      expect(error.getUserMessage()).toBe('[No I18n Service] E_TEST_0001_USER');
      expect(error.getDevMessage()).toBe('[No I18n Service] E_TEST_0001_DEV');
      expect(error.getResolutionMessage()).toBe('[No I18n Service] E_TEST_0001_RESOLUTION');
    });
  });

  describe('message key generation', () => {
    it('should generate correct message keys', () => {
      const errorCode = 'E_XPATH_0001' as any;
      const error = new StandardError(errorCode);

      expect(error.getUserMessageKey()).toBe('E_XPATH_0001_USER');
      expect(error.getDevMessageKey()).toBe('E_XPATH_0001_DEV');
      expect(error.getResolutionMessageKey()).toBe('E_XPATH_0001_RESOLUTION');
    });

    it('should generate message key for specific type', () => {
      const errorCode = 'E_AUTH_0001' as any;
      const error = new StandardError(errorCode);

      expect(error.getMessageKey('USER')).toBe('E_AUTH_0001_USER');
      expect(error.getMessageKey('DEV')).toBe('E_AUTH_0001_DEV');
      expect(error.getMessageKey('RESOLUTION')).toBe('E_AUTH_0001_RESOLUTION');
    });
  });

  describe('direct message access with I18n service', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should get localized user message', () => {
      const errorCode = 'E_XPATH_0001' as any;
      const context = { xpath: '//*[@id="test"]' };
      const error = new StandardError(errorCode, context);
      error.setI18nService(mockI18nService);

      const userMessage = error.getUserMessage();

      expect(userMessage).toBe('User message for E_XPATH_0001_USER');
      expect(mockI18nService.getMessage).toHaveBeenCalledWith('E_XPATH_0001_USER', context);
    });

    it('should get localized developer message', () => {
      const errorCode = 'E_AUTH_0001' as any;
      const error = new StandardError(errorCode);
      error.setI18nService(mockI18nService);

      const devMessage = error.getDevMessage();

      expect(devMessage).toBe('Developer message for E_AUTH_0001_DEV');
      expect(mockI18nService.getMessage).toHaveBeenCalledWith('E_AUTH_0001_DEV', {});
    });

    it('should get localized resolution message', () => {
      const errorCode = 'E_STORAGE_0001' as any;
      const error = new StandardError(errorCode);
      error.setI18nService(mockI18nService);

      const resolutionMessage = error.getResolutionMessage();

      expect(resolutionMessage).toBe('Resolution message for E_STORAGE_0001_RESOLUTION');
      expect(mockI18nService.getMessage).toHaveBeenCalledWith('E_STORAGE_0001_RESOLUTION', {});
    });
  });

  describe('getErrorCode', () => {
    it('should return error code as string', () => {
      const errorCode = 'E_SYNC_0001' as any;
      const error = new StandardError(errorCode);

      expect(error.getErrorCode()).toBe(errorCode);
    });
  });

  describe('getContext', () => {
    it('should return copy of context', () => {
      const context = { key: 'value', number: 42 };
      const errorCode = 'E_TEST_0001' as any;
      const error = new StandardError(errorCode, context);

      const returnedContext = error.getContext();

      expect(returnedContext).toEqual(context);
      expect(returnedContext).not.toBe(context); // Should be a copy
    });

    it('should return empty object when no context provided', () => {
      const errorCode = 'E_TEST_0002' as any;
      const error = new StandardError(errorCode);

      expect(error.getContext()).toEqual({});
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON with all properties', () => {
      const errorCode = 'E_XPATH_0001' as any;
      const context = { xpath: '//*[@id="test"]', url: 'https://example.com' };
      const error = new StandardError(errorCode, context);
      error.setI18nService(mockI18nService);

      const json = error.toJSON();

      expect(json).toEqual({
        name: 'StandardError',
        errorCode: errorCode,
        context: context,
        timestamp: error.timestamp.toISOString(),
        message: errorCode,
        stack: error.stack,
        userMessage: 'User message for E_XPATH_0001_USER',
        devMessage: 'Developer message for E_XPATH_0001_DEV',
        resolutionMessage: 'Resolution message for E_XPATH_0001_RESOLUTION',
      });
    });

    it('should serialize with fallback messages when no I18n service', () => {
      const errorCode = 'E_XPATH_0001' as any;
      const context = { xpath: '//*[@id="test"]' };
      const error = new StandardError(errorCode, context);

      const json = error.toJSON();

      expect(json).toEqual({
        name: 'StandardError',
        errorCode: errorCode,
        context: context,
        timestamp: error.timestamp.toISOString(),
        message: errorCode,
        stack: error.stack,
        userMessage: '[No I18n Service] E_XPATH_0001_USER',
        devMessage: '[No I18n Service] E_XPATH_0001_DEV',
        resolutionMessage: '[No I18n Service] E_XPATH_0001_RESOLUTION',
      });
    });
  });

  describe('error inheritance', () => {
    it('should be instance of Error', () => {
      const errorCode = 'E_TEST_0001' as any;
      const error = new StandardError(errorCode);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(StandardError);
    });

    it('should be catchable as Error', () => {
      const errorCode = 'E_TEST_0001' as any;

      expect(() => {
        throw new StandardError(errorCode);
      }).toThrow(Error);
    });

    it('should be identifiable as StandardError in catch block', () => {
      const errorCode = 'E_TEST_0001' as any;
      let caughtError: any;

      try {
        throw new StandardError(errorCode);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(StandardError);
      expect(caughtError.errorCode).toBe(errorCode);
    });
  });

  describe('context handling', () => {
    it('should handle various context value types', () => {
      const context: ErrorContext = {
        stringValue: 'test',
        numberValue: 42,
        booleanValue: true,
        undefinedValue: undefined,
      };
      const errorCode = 'E_TEST_0001' as any;
      const error = new StandardError(errorCode, context);

      expect(error.getContext()).toEqual(context);
    });

    it('should handle nested object context', () => {
      const context = {
        user: { id: '123', name: 'test' },
        metadata: { timestamp: 1234567890 },
      };
      const errorCode = 'E_TEST_0001' as any;
      const error = new StandardError(errorCode, context as any);

      expect(error.getContext()).toEqual(context);
    });
  });

  describe('timestamp', () => {
    it('should set timestamp on creation', () => {
      const before = new Date();
      const errorCode = 'E_TEST_0001' as any;
      const error = new StandardError(errorCode);
      const after = new Date();

      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should have consistent timestamp across multiple accesses', () => {
      const errorCode = 'E_TEST_0001' as any;
      const error = new StandardError(errorCode);

      const timestamp1 = error.timestamp;
      const timestamp2 = error.timestamp;

      expect(timestamp1).toBe(timestamp2);
      expect(timestamp1.getTime()).toBe(timestamp2.getTime());
    });
  });
});
