/**
 * Unit Tests: StandardError Entity
 */

import { StandardError } from '../StandardError';
import { ErrorCategory, ErrorCodeRegistry } from '../../constants/ErrorCodes';

describe('StandardError Entity', () => {
  beforeEach(() => {
    // Reset error code registry for clean tests
    (ErrorCodeRegistry as any).codes = new Map();
    (ErrorCodeRegistry as any).categoryCounters = new Map();
  });

  describe('constructor', () => {
    it('should create error with code and message', () => {
      const code = 'E-TEST-0001';
      const message = 'Test error message';
      const context = { userId: '123' };

      const error = new StandardError(code, context, message);

      expect(error.code).toBe(code);
      expect(error.message).toBe(message);
      expect(error.context).toEqual(context);
      expect(error.timestamp).toBeGreaterThan(0);
      expect(error.name).toBe('StandardError');
    });

    it('should use default message from registry if not provided', () => {
      const code = ErrorCodeRegistry.generateCode(ErrorCategory.XPATH, 'Default XPath error');
      
      const error = new StandardError(code);

      expect(error.message).toBe('Default XPath error');
    });

    it('should use fallback message for unknown code', () => {
      const error = new StandardError('E-UNKNOWN-9999');

      expect(error.message).toBe('Unknown error');
    });
  });

  describe('static factory methods', () => {
    it('should create XPath error', () => {
      const message = 'XPath element not found';
      const context = { xpath: '//*[@id="test"]' };

      const error = StandardError.xpath(message, context);

      expect(error.code).toMatch(/^E-XPATH-\d{4}$/);
      expect(error.message).toBe(message);
      expect(error.context).toEqual(context);
    });

    it('should create auth error', () => {
      const message = 'Authentication failed';
      const context = { username: 'testuser' };

      const error = StandardError.auth(message, context);

      expect(error.code).toMatch(/^E-AUTH-\d{4}$/);
      expect(error.message).toBe(message);
      expect(error.context).toEqual(context);
    });

    it('should create sync error', () => {
      const message = 'Sync operation failed';

      const error = StandardError.sync(message);

      expect(error.code).toMatch(/^E-SYNC-\d{4}$/);
      expect(error.message).toBe(message);
    });

    it('should create storage error', () => {
      const message = 'Storage quota exceeded';

      const error = StandardError.storage(message);

      expect(error.code).toMatch(/^E-STORAGE-\d{4}$/);
      expect(error.message).toBe(message);
    });

    it('should create validation error', () => {
      const message = 'Required field missing';

      const error = StandardError.validation(message);

      expect(error.code).toMatch(/^E-VALIDATION-\d{4}$/);
      expect(error.message).toBe(message);
    });

    it('should create network error', () => {
      const message = 'Network timeout';

      const error = StandardError.network(message);

      expect(error.code).toMatch(/^E-NETWORK-\d{4}$/);
      expect(error.message).toBe(message);
    });

    it('should create crypto error', () => {
      const message = 'Decryption failed';

      const error = StandardError.crypto(message);

      expect(error.code).toMatch(/^E-CRYPTO-\d{4}$/);
      expect(error.message).toBe(message);
    });

    it('should create system error', () => {
      const message = 'System unavailable';

      const error = StandardError.system(message);

      expect(error.code).toMatch(/^E-SYSTEM-\d{4}$/);
      expect(error.message).toBe(message);
    });
  });

  describe('getDefinition', () => {
    it('should return error definition if exists', () => {
      const code = ErrorCodeRegistry.generateCode(ErrorCategory.XPATH, 'Test message');
      const error = new StandardError(code);

      const definition = error.getDefinition();

      expect(definition).toBeDefined();
      expect(definition?.code).toBe(code);
      expect(definition?.category).toBe(ErrorCategory.XPATH);
    });

    it('should return undefined for unknown code', () => {
      const error = new StandardError('E-UNKNOWN-9999');

      const definition = error.getDefinition();

      expect(definition).toBeUndefined();
    });
  });

  describe('getI18nKey', () => {
    it('should return i18n key from definition', () => {
      const code = ErrorCodeRegistry.generateCode(ErrorCategory.AUTH, 'Auth error');
      const error = new StandardError(code);

      const i18nKey = error.getI18nKey();

      expect(i18nKey).toMatch(/^error\.auth\.\d{4}$/);
    });

    it('should return fallback key for unknown code', () => {
      const error = new StandardError('E-UNKNOWN-9999');

      const i18nKey = error.getI18nKey();

      expect(i18nKey).toBe('error.unknown');
    });
  });

  describe('serialization', () => {
    it('should convert to JSON', () => {
      const code = 'E-TEST-0001';
      const message = 'Test error';
      const context = { key: 'value' };
      const error = new StandardError(code, context, message);

      const json = error.toJSON();

      expect(json.code).toBe(code);
      expect(json.message).toBe(message);
      expect(json.context).toEqual(context);
      expect(json.timestamp).toBe(error.timestamp);
      expect(json.stack).toBeDefined();
    });

    it('should create from JSON', () => {
      const data = {
        code: 'E-TEST-0001',
        message: 'Test error',
        context: { key: 'value' },
        timestamp: Date.now(),
        stack: 'Error stack trace'
      };

      const error = StandardError.fromJSON(data);

      expect(error.code).toBe(data.code);
      expect(error.message).toBe(data.message);
      expect(error.context).toEqual(data.context);
      expect(error.stack).toBe(data.stack);
    });
  });

  describe('message formatting', () => {
    it('should format user message without technical details', () => {
      const code = ErrorCodeRegistry.generateCode(ErrorCategory.XPATH, 'XPath element not found');
      const error = new StandardError(code, { xpath: '//*[@id="secret"]' });

      const userMessage = error.toUserMessage();

      expect(userMessage).toBe('XPath element not found');
      expect(userMessage).not.toContain('secret');
    });

    it('should format developer message with all details', () => {
      const code = ErrorCodeRegistry.generateCode(ErrorCategory.AUTH, 'Authentication failed');
      const context = { username: 'testuser', ip: '192.168.1.1' };
      const error = new StandardError(code, context);

      const devMessage = error.toDeveloperMessage();

      expect(devMessage).toContain(code);
      expect(devMessage).toContain('Authentication failed');
      expect(devMessage).toContain('testuser');
      expect(devMessage).toContain('192.168.1.1');
    });

    it('should handle missing definition in user message', () => {
      const error = new StandardError('E-UNKNOWN-9999');

      const userMessage = error.toUserMessage();

      expect(userMessage).toBe('An unexpected error occurred');
    });
  });

  describe('category checking', () => {
    it('should identify error category correctly', () => {
      const xpathError = StandardError.xpath('XPath error');
      const authError = StandardError.auth('Auth error');

      expect(xpathError.isCategory(ErrorCategory.XPATH)).toBe(true);
      expect(xpathError.isCategory(ErrorCategory.AUTH)).toBe(false);
      expect(authError.isCategory(ErrorCategory.AUTH)).toBe(true);
      expect(authError.isCategory(ErrorCategory.XPATH)).toBe(false);
    });
  });

  describe('retry logic', () => {
    it('should identify retryable errors', () => {
      const networkError = StandardError.network('Network timeout');
      const syncError = StandardError.sync('Sync failed');
      const systemError = StandardError.system('System error');

      expect(networkError.isRetryable()).toBe(true);
      expect(syncError.isRetryable()).toBe(true);
      expect(systemError.isRetryable()).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      const authError = StandardError.auth('Auth failed');
      const validationError = StandardError.validation('Validation failed');
      const xpathError = StandardError.xpath('XPath not found');

      expect(authError.isRetryable()).toBe(false);
      expect(validationError.isRetryable()).toBe(false);
      expect(xpathError.isRetryable()).toBe(false);
    });
  });
});
