/**
 * Unit Tests: URL Matching Service (Domain Service)
 */

import { URLMatchingService } from '../URLMatchingService';
import { Logger } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('URLMatchingService', () => {
  const createMockLogger = (): Logger => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    setLevel: jest.fn(),
    getLevel: jest.fn(),
    createChild: jest.fn(),
  });

  describe('matches', () => {
    describe('exact match', () => {
      it('should match exact URL', () => {
        const service = new URLMatchingService();
        const url = 'https://example.com/page';
        const pattern = 'https://example.com/page';
        expect(service.matches(url, pattern)).toBe(true);
      });

      it('should not match different URL', () => {
        const service = new URLMatchingService();
        const url = 'https://example.com/page1';
        const pattern = 'https://example.com/page2';
        expect(service.matches(url, pattern)).toBe(false);
      });

      it('should log regex match for URL with dot', () => {
        // URLs with dots are treated as regex patterns
        const url = 'https://example.com/page';
        const pattern = 'https://example.com/page';
        const mockLogger = createMockLogger();
        const service = new URLMatchingService(mockLogger);
        service.matches(url, pattern);

        expect(mockLogger.debug).toHaveBeenCalledWith(
          expect.stringContaining('[URL Matcher] Regex match:')
        );
      });
    });

    describe('prefix match', () => {
      it('should match URL with pattern as prefix', () => {
        const service = new URLMatchingService();
        const url = 'https://example.com/page/subpage';
        const pattern = 'https://example.com/';
        expect(service.matches(url, pattern)).toBe(true);
      });

      it('should match URL starting with pattern', () => {
        const service = new URLMatchingService();
        const url = 'https://example.com/products/item1';
        const pattern = 'https://example.com/products';
        expect(service.matches(url, pattern)).toBe(true);
      });

      it('should not match if URL does not start with pattern', () => {
        const service = new URLMatchingService();
        const url = 'https://other.com/page';
        const pattern = 'https://example.com/';
        expect(service.matches(url, pattern)).toBe(false);
      });

      it('should log string match for prefix match without regex chars', () => {
        // Use pattern without regex special chars like "."
        const url = 'example-test-url/subpage';
        const pattern = 'example-test-url';
        const mockLogger = createMockLogger();
        const service = new URLMatchingService(mockLogger);
        service.matches(url, pattern);

        expect(mockLogger.debug).toHaveBeenCalledWith(
          expect.stringContaining('[URL Matcher] String match:')
        );
        expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('prefix=true'));
      });

      it('should log string match for exact match without regex chars', () => {
        // Use pattern without regex special chars
        const url = 'example-test-url';
        const pattern = 'example-test-url';
        const mockLogger = createMockLogger();
        const service = new URLMatchingService(mockLogger);
        service.matches(url, pattern);

        expect(mockLogger.debug).toHaveBeenCalledWith(
          expect.stringContaining('[URL Matcher] String match:')
        );
        expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('exact=true'));
      });
    });

    describe('regex match', () => {
      it('should match URL with regex pattern', () => {
        const service = new URLMatchingService();
        const url = 'https://example.com/page123';
        const pattern = 'https://example\\.com/page\\d+';
        expect(service.matches(url, pattern)).toBe(true);
      });

      it('should match URL with wildcard pattern', () => {
        const service = new URLMatchingService();
        const url = 'https://example.com/any/path/here';
        const pattern = 'https://example\\.com/.*';
        expect(service.matches(url, pattern)).toBe(true);
      });

      it('should match URL with optional subdomain', () => {
        const service = new URLMatchingService();
        const url1 = 'https://www.example.com/page';
        const url2 = 'https://example.com/page';
        const pattern = 'https://(www\\.)?example\\.com/page';
        expect(service.matches(url1, pattern)).toBe(true);
        expect(service.matches(url2, pattern)).toBe(true);
      });

      it('should not match URL that does not satisfy regex', () => {
        const service = new URLMatchingService();
        const url = 'https://example.com/pageabc';
        const pattern = 'https://example\\.com/page\\d+';
        expect(service.matches(url, pattern)).toBe(false);
      });

      it('should log regex match', () => {
        const url = 'https://example.com/page123';
        const pattern = 'https://example\\.com/page\\d+';
        const mockLogger = createMockLogger();
        const service = new URLMatchingService(mockLogger);
        service.matches(url, pattern);

        expect(mockLogger.debug).toHaveBeenCalledWith(
          expect.stringContaining('[URL Matcher] Regex match:')
        );
      });
    });

    describe('edge cases', () => {
      it('should return false for empty pattern', () => {
        const service = new URLMatchingService();
        const url = 'https://example.com';
        expect(service.matches(url, '')).toBe(false);
      });

      it('should handle invalid regex gracefully', () => {
        const service = new URLMatchingService();
        const url = 'https://example.com';
        const pattern = 'https://example.com/[invalid';
        // Should fall back to string comparison
        expect(service.matches(url, pattern)).toBe(false);
      });

      it('should log error for invalid regex', () => {
        const url = 'https://example.com';
        const pattern = 'https://example.com/[invalid';
        const mockLogger = createMockLogger();
        const service = new URLMatchingService(mockLogger);
        service.matches(url, pattern);

        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('[URL Matcher] Error matching pattern'),
          expect.any(Error)
        );
      });

      it('should fall back to prefix match when regex fails', () => {
        const service = new URLMatchingService();
        const url = 'https://example.com/[invalid/subpage';
        const pattern = 'https://example.com/[invalid';
        // Should use startsWith as fallback
        expect(service.matches(url, pattern)).toBe(true);
      });
    });
  });

  describe('validatePattern', () => {
    it('should validate empty pattern as valid', () => {
      const service = new URLMatchingService();
      const result = service.validatePattern('');
      expect(result.isValid).toBe(true);
    });

    it('should validate string pattern as valid', () => {
      const service = new URLMatchingService();
      const result = service.validatePattern('https://example.com/page');
      expect(result.isValid).toBe(true);
    });

    it('should validate correct regex pattern as valid', () => {
      const service = new URLMatchingService();
      const result = service.validatePattern('https://example\\.com/.*');
      expect(result.isValid).toBe(true);
    });

    it('should invalidate incorrect regex pattern', () => {
      const service = new URLMatchingService();
      const result = service.validatePattern('https://example.com/[invalid');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle non-Error exceptions in regex validation', () => {
      // This tests the error handling branch where error is not an Error instance
      const originalRegExp = global.RegExp;
      (global.RegExp as any) = jest.fn().mockImplementation(() => {
        throw 'string error'; // Throwing a non-Error value
      });

      const service = new URLMatchingService();
      const result = service.validatePattern('test.*pattern');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid regular expression');

      global.RegExp = originalRegExp;
    });

    it('should validate complex regex pattern', () => {
      const service = new URLMatchingService();
      const result = service.validatePattern('https://(www\\.)?example\\.(com|net)/page\\d+');
      expect(result.isValid).toBe(true);
    });
  });
});
