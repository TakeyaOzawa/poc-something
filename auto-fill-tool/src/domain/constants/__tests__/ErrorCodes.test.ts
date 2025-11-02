/**
 * Unit Tests: Error Code Registry
 */

import { ErrorCodeRegistry, ErrorCategory, ERROR_CODES } from '../ErrorCodes';

describe('ErrorCodeRegistry', () => {
  beforeEach(() => {
    // Reset registry for clean tests
    (ErrorCodeRegistry as any).codes = new Map();
    (ErrorCodeRegistry as any).categoryCounters = new Map();
  });

  describe('generateCode', () => {
    it('should generate sequential error codes by category', () => {
      const code1 = ErrorCodeRegistry.generateCode(ErrorCategory.XPATH, 'First XPath error');
      const code2 = ErrorCodeRegistry.generateCode(ErrorCategory.XPATH, 'Second XPath error');
      const code3 = ErrorCodeRegistry.generateCode(ErrorCategory.AUTH, 'First Auth error');

      expect(code1).toBe('E-XPATH-0001');
      expect(code2).toBe('E-XPATH-0002');
      expect(code3).toBe('E-AUTH-0001');
    });

    it('should store error definition with generated code', () => {
      const message = 'Test error message';
      const code = ErrorCodeRegistry.generateCode(ErrorCategory.SYNC, message);

      const definition = ErrorCodeRegistry.getDefinition(code);

      expect(definition).toBeDefined();
      expect(definition?.code).toBe(code);
      expect(definition?.category).toBe(ErrorCategory.SYNC);
      expect(definition?.number).toBe(1);
      expect(definition?.defaultMessage).toBe(message);
      expect(definition?.i18nKey).toBe('error.sync.0001');
    });

    it('should pad numbers with leading zeros', () => {
      // Generate 10 codes to test padding
      for (let i = 1; i <= 10; i++) {
        const code = ErrorCodeRegistry.generateCode(ErrorCategory.VALIDATION, `Error ${i}`);
        const expectedCode = `E-VALIDATION-${i.toString().padStart(4, '0')}`;
        expect(code).toBe(expectedCode);
      }
    });
  });

  describe('getDefinition', () => {
    it('should return definition for existing code', () => {
      const message = 'Storage error';
      const code = ErrorCodeRegistry.generateCode(ErrorCategory.STORAGE, message);

      const definition = ErrorCodeRegistry.getDefinition(code);

      expect(definition).toBeDefined();
      expect(definition?.defaultMessage).toBe(message);
    });

    it('should return undefined for non-existing code', () => {
      const definition = ErrorCodeRegistry.getDefinition('E-NONEXISTENT-9999');

      expect(definition).toBeUndefined();
    });
  });

  describe('getByCategory', () => {
    it('should return all codes for a category', () => {
      ErrorCodeRegistry.generateCode(ErrorCategory.NETWORK, 'Network error 1');
      ErrorCodeRegistry.generateCode(ErrorCategory.NETWORK, 'Network error 2');
      ErrorCodeRegistry.generateCode(ErrorCategory.CRYPTO, 'Crypto error 1');

      const networkCodes = ErrorCodeRegistry.getByCategory(ErrorCategory.NETWORK);
      const cryptoCodes = ErrorCodeRegistry.getByCategory(ErrorCategory.CRYPTO);

      expect(networkCodes).toHaveLength(2);
      expect(cryptoCodes).toHaveLength(1);
      expect(networkCodes[0].category).toBe(ErrorCategory.NETWORK);
      expect(networkCodes[1].category).toBe(ErrorCategory.NETWORK);
      expect(cryptoCodes[0].category).toBe(ErrorCategory.CRYPTO);
    });

    it('should return empty array for category with no codes', () => {
      const codes = ErrorCodeRegistry.getByCategory(ErrorCategory.I18N);

      expect(codes).toHaveLength(0);
    });
  });

  describe('exportForI18n', () => {
    it('should export all codes as i18n key-value pairs', () => {
      ErrorCodeRegistry.generateCode(ErrorCategory.XPATH, 'XPath not found');
      ErrorCodeRegistry.generateCode(ErrorCategory.AUTH, 'Authentication failed');

      const i18nData = ErrorCodeRegistry.exportForI18n();

      expect(i18nData['error.xpath.0001']).toBe('XPath not found');
      expect(i18nData['error.auth.0001']).toBe('Authentication failed');
    });

    it('should return empty object when no codes exist', () => {
      const i18nData = ErrorCodeRegistry.exportForI18n();

      expect(i18nData).toEqual({});
    });
  });

  describe('ERROR_CODES constants', () => {
    it('should define XPath error codes', () => {
      expect(ERROR_CODES.XPATH_NOT_FOUND).toMatch(/^E-XPATH-\d{4}$/);
      expect(ERROR_CODES.XPATH_INVALID).toMatch(/^E-XPATH-\d{4}$/);
      expect(ERROR_CODES.XPATH_TIMEOUT).toMatch(/^E-XPATH-\d{4}$/);
    });

    it('should define Auth error codes', () => {
      expect(ERROR_CODES.AUTH_FAILED).toMatch(/^E-AUTH-\d{4}$/);
      expect(ERROR_CODES.AUTH_LOCKED).toMatch(/^E-AUTH-\d{4}$/);
      expect(ERROR_CODES.AUTH_EXPIRED).toMatch(/^E-AUTH-\d{4}$/);
    });

    it('should define Sync error codes', () => {
      expect(ERROR_CODES.SYNC_FAILED).toMatch(/^E-SYNC-\d{4}$/);
      expect(ERROR_CODES.SYNC_CONFLICT).toMatch(/^E-SYNC-\d{4}$/);
      expect(ERROR_CODES.SYNC_TIMEOUT).toMatch(/^E-SYNC-\d{4}$/);
    });

    it('should define Storage error codes', () => {
      expect(ERROR_CODES.STORAGE_FULL).toMatch(/^E-STORAGE-\d{4}$/);
      expect(ERROR_CODES.STORAGE_CORRUPTED).toMatch(/^E-STORAGE-\d{4}$/);
      expect(ERROR_CODES.STORAGE_LOCKED).toMatch(/^E-STORAGE-\d{4}$/);
    });

    it('should define Validation error codes', () => {
      expect(ERROR_CODES.VALIDATION_FAILED).toMatch(/^E-VALIDATION-\d{4}$/);
      expect(ERROR_CODES.VALIDATION_REQUIRED).toMatch(/^E-VALIDATION-\d{4}$/);
      expect(ERROR_CODES.VALIDATION_FORMAT).toMatch(/^E-VALIDATION-\d{4}$/);
    });

    it('should define Network error codes', () => {
      expect(ERROR_CODES.NETWORK_TIMEOUT).toMatch(/^E-NETWORK-\d{4}$/);
      expect(ERROR_CODES.NETWORK_OFFLINE).toMatch(/^E-NETWORK-\d{4}$/);
      expect(ERROR_CODES.NETWORK_ERROR).toMatch(/^E-NETWORK-\d{4}$/);
    });

    it('should define Crypto error codes', () => {
      expect(ERROR_CODES.CRYPTO_DECRYPT_FAILED).toMatch(/^E-CRYPTO-\d{4}$/);
      expect(ERROR_CODES.CRYPTO_ENCRYPT_FAILED).toMatch(/^E-CRYPTO-\d{4}$/);
      expect(ERROR_CODES.CRYPTO_KEY_INVALID).toMatch(/^E-CRYPTO-\d{4}$/);
    });

    it('should define System error codes', () => {
      expect(ERROR_CODES.SYSTEM_ERROR).toMatch(/^E-SYSTEM-\d{4}$/);
      expect(ERROR_CODES.SYSTEM_UNAVAILABLE).toMatch(/^E-SYSTEM-\d{4}$/);
      expect(ERROR_CODES.SYSTEM_MAINTENANCE).toMatch(/^E-SYSTEM-\d{4}$/);
    });

    it('should have unique error codes', () => {
      const codes = Object.values(ERROR_CODES);
      const uniqueCodes = new Set(codes);

      expect(codes.length).toBe(uniqueCodes.size);
    });
  });

  describe('category counters', () => {
    it('should maintain separate counters for each category', () => {
      // Generate multiple codes for different categories
      const xpath1 = ErrorCodeRegistry.generateCode(ErrorCategory.XPATH, 'XPath 1');
      const auth1 = ErrorCodeRegistry.generateCode(ErrorCategory.AUTH, 'Auth 1');
      const xpath2 = ErrorCodeRegistry.generateCode(ErrorCategory.XPATH, 'XPath 2');
      const auth2 = ErrorCodeRegistry.generateCode(ErrorCategory.AUTH, 'Auth 2');

      expect(xpath1).toBe('E-XPATH-0001');
      expect(auth1).toBe('E-AUTH-0001');
      expect(xpath2).toBe('E-XPATH-0002');
      expect(auth2).toBe('E-AUTH-0002');
    });
  });
});
