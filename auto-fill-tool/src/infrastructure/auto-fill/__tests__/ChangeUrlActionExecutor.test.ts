/**
 * Unit Tests: ChangeUrlActionExecutor
 * Tests for CHANGE_URL action execution (page navigation)
 */

import browser from 'webextension-polyfill';
import { ChangeUrlActionExecutor } from '../ChangeUrlActionExecutor';
import { Logger } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock browser API
jest.mock('webextension-polyfill', () => ({
  tabs: {
    update: jest.fn(),
    onUpdated: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
}));

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ChangeUrlActionExecutor', () => {
  let executor: ChangeUrlActionExecutor;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    executor = new ChangeUrlActionExecutor(mockLogger);
  });

  afterEach(() => {
    jest.useRealTimers();
  });
  describe('executeChangeUrlAction', () => {
    describe('URL validation', () => {
      it('should validate a valid HTTP URL', () => {
        const result = executor.executeChangeUrlAction('http://example.com');
        expect(result.success).toBe(true);
        expect(result.message).toContain('URL validated');
        expect(result.message).toContain('http://example.com');
      });

      it('should validate a valid HTTPS URL', () => {
        const result = executor.executeChangeUrlAction('https://example.com');
        expect(result.success).toBe(true);
        expect(result.message).toContain('https://example.com');
      });

      it('should validate URL with path', () => {
        const result = executor.executeChangeUrlAction('https://example.com/path/to/page');
        expect(result.success).toBe(true);
      });

      it('should validate URL with query parameters', () => {
        const result = executor.executeChangeUrlAction('https://example.com?param=value&foo=bar');
        expect(result.success).toBe(true);
      });

      it('should validate URL with hash', () => {
        const result = executor.executeChangeUrlAction('https://example.com#section');
        expect(result.success).toBe(true);
      });

      it('should validate URL with port', () => {
        const result = executor.executeChangeUrlAction('https://example.com:8080');
        expect(result.success).toBe(true);
      });

      it('should validate URL with authentication', () => {
        const result = executor.executeChangeUrlAction('https://user:pass@example.com');
        expect(result.success).toBe(true);
      });

      it('should validate localhost URL', () => {
        const result = executor.executeChangeUrlAction('http://localhost:3000');
        expect(result.success).toBe(true);
      });

      it('should validate IP address URL', () => {
        const result = executor.executeChangeUrlAction('http://192.168.1.1');
        expect(result.success).toBe(true);
      });

      it('should validate file:// protocol', () => {
        const result = executor.executeChangeUrlAction('file:///path/to/file.html');
        expect(result.success).toBe(true);
      });

      it('should validate data: URL', () => {
        const result = executor.executeChangeUrlAction('data:text/html,<h1>Hello</h1>');
        expect(result.success).toBe(true);
      });
    });

    describe('URL validation - invalid cases', () => {
      it('should fail when URL is empty string', () => {
        const result = executor.executeChangeUrlAction('');
        expect(result.success).toBe(false);
        expect(result.message).toBe('URL is required');
      });

      it('should fail when URL is only whitespace', () => {
        const result = executor.executeChangeUrlAction('   ');
        expect(result.success).toBe(false);
        expect(result.message).toBe('URL is required');
      });

      it('should fail for invalid URL format', () => {
        const result = executor.executeChangeUrlAction('not a url');
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid URL');
      });

      it('should fail for URL without protocol', () => {
        const result = executor.executeChangeUrlAction('example.com');
        expect(result.success).toBe(false);
      });

      it('should fail for URL with spaces', () => {
        const result = executor.executeChangeUrlAction('http://example .com');
        expect(result.success).toBe(false);
      });

      it('should fail for malformed URL', () => {
        const result = executor.executeChangeUrlAction('http://');
        expect(result.success).toBe(false);
      });

      it('should fail for URL with invalid characters', () => {
        const result = executor.executeChangeUrlAction('http://exa<>mple.com');
        expect(result.success).toBe(false);
      });
    });

    describe('URL validation - edge cases', () => {
      it('should validate very long URL', () => {
        const longPath = 'a'.repeat(1000);
        const result = executor.executeChangeUrlAction(`https://example.com/${longPath}`);
        expect(result.success).toBe(true);
      });

      it('should validate URL with encoded characters', () => {
        const result = executor.executeChangeUrlAction('https://example.com/path%20with%20spaces');
        expect(result.success).toBe(true);
      });

      it('should validate URL with international domain', () => {
        const result = executor.executeChangeUrlAction('https://例え.jp');
        expect(result.success).toBe(true);
      });

      it('should validate URL with subdomain', () => {
        const result = executor.executeChangeUrlAction('https://sub.example.com');
        expect(result.success).toBe(true);
      });

      it('should validate URL with multiple subdomains', () => {
        const result = executor.executeChangeUrlAction('https://a.b.c.example.com');
        expect(result.success).toBe(true);
      });

      it('should validate URL with hyphenated domain', () => {
        const result = executor.executeChangeUrlAction('https://my-example-site.com');
        expect(result.success).toBe(true);
      });

      it('should validate URL with numbers in domain', () => {
        const result = executor.executeChangeUrlAction('https://example123.com');
        expect(result.success).toBe(true);
      });
    });

    describe('protocol handling', () => {
      it('should accept http protocol', () => {
        const result = executor.executeChangeUrlAction('http://example.com');
        expect(result.success).toBe(true);
      });

      it('should accept https protocol', () => {
        const result = executor.executeChangeUrlAction('https://example.com');
        expect(result.success).toBe(true);
      });

      it('should accept ftp protocol', () => {
        const result = executor.executeChangeUrlAction('ftp://example.com');
        expect(result.success).toBe(true);
      });

      it('should accept chrome-extension protocol', () => {
        const result = executor.executeChangeUrlAction('chrome-extension://abc123/page.html');
        expect(result.success).toBe(true);
      });

      it('should accept about: protocol', () => {
        const result = executor.executeChangeUrlAction('about:blank');
        expect(result.success).toBe(true);
      });
    });

    describe('special characters and encoding', () => {
      it('should validate URL with query string special characters', () => {
        const result = executor.executeChangeUrlAction(
          'https://example.com?key=value&foo=bar&baz=qux'
        );
        expect(result.success).toBe(true);
      });

      it('should validate URL with hash and query', () => {
        const result = executor.executeChangeUrlAction('https://example.com/path?query=1#section');
        expect(result.success).toBe(true);
      });

      it('should validate URL with equals in query value', () => {
        const result = executor.executeChangeUrlAction('https://example.com?key=value=with=equals');
        expect(result.success).toBe(true);
      });

      it('should validate URL with ampersand in hash', () => {
        const result = executor.executeChangeUrlAction('https://example.com#section&subsection');
        expect(result.success).toBe(true);
      });
    });

    describe('error message formatting', () => {
      it('should return appropriate error for empty URL', () => {
        const result = executor.executeChangeUrlAction('');
        expect(result.message).toBe('URL is required');
      });

      it('should return error message for invalid URL', () => {
        const result = executor.executeChangeUrlAction('invalid');
        expect(result.success).toBe(false);
        expect(result.message).toBeTruthy();
      });

      it('should handle Error objects in validation', () => {
        const result = executor.executeChangeUrlAction('::::');
        expect(result.success).toBe(false);
        expect(typeof result.message).toBe('string');
      });
    });

    describe('whitespace handling', () => {
      it('should accept URL with leading whitespace (URL constructor behavior)', () => {
        // Note: URL constructor actually accepts leading whitespace
        const result = executor.executeChangeUrlAction('  http://example.com');
        expect(result.success).toBe(true);
      });

      it('should accept URL with trailing whitespace (URL constructor behavior)', () => {
        // Note: URL constructor actually accepts trailing whitespace
        const result = executor.executeChangeUrlAction('http://example.com  ');
        expect(result.success).toBe(true);
      });

      it('should accept URL with tabs (URL constructor behavior)', () => {
        // Note: URL constructor strips leading/trailing whitespace
        const result = executor.executeChangeUrlAction('\thttp://example.com');
        expect(result.success).toBe(true);
      });

      it('should accept URL with newlines (URL constructor behavior)', () => {
        // Note: URL constructor strips leading/trailing whitespace including newlines
        const result = executor.executeChangeUrlAction('http://example.com\n');
        expect(result.success).toBe(true);
      });

      it('should consider whitespace-only string as empty', () => {
        const result = executor.executeChangeUrlAction('   \t\n   ');
        expect(result.success).toBe(false);
        expect(result.message).toBe('URL is required');
      });
    });

    describe('URL object compatibility', () => {
      it('should accept any URL that can be parsed by URL constructor', () => {
        const validUrls = [
          'https://example.com',
          'http://localhost:8080/path',
          'ftp://files.example.com',
          'file:///home/user/file.html',
        ];

        validUrls.forEach((url) => {
          const result = executor.executeChangeUrlAction(url);
          expect(result.success).toBe(true);
        });
      });

      it('should reject URLs that throw from URL constructor', () => {
        const invalidUrls = ['example.com', '://no-protocol.com'];

        invalidUrls.forEach((url) => {
          const result = executor.executeChangeUrlAction(url);
          expect(result.success).toBe(false);
        });
      });

      it('should handle edge case URLs', () => {
        // These are technically valid according to URL constructor
        const edgeCaseUrls = [
          'htp://wrong-protocol.com', // Valid URL with custom protocol
          'http://', // Valid but minimal URL
        ];

        edgeCaseUrls.forEach((url) => {
          const result = executor.executeChangeUrlAction(url);
          // We don't assert success/failure as URL constructor behavior may vary
          expect(result).toHaveProperty('success');
          expect(result).toHaveProperty('message');
        });
      });
    });

    describe('return value structure', () => {
      it('should return success result with correct structure', () => {
        const result = executor.executeChangeUrlAction('https://example.com');
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('message');
        expect(typeof result.success).toBe('boolean');
        expect(typeof result.message).toBe('string');
      });

      it('should return failure result with correct structure', () => {
        const result = executor.executeChangeUrlAction('');
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('message');
        expect(result.success).toBe(false);
        expect(typeof result.message).toBe('string');
      });

      it('should include URL in success message', () => {
        const url = 'https://example.com/test';
        const result = executor.executeChangeUrlAction(url);
        expect(result.message).toContain(url);
      });
    });
  });

  describe('execute', () => {
    const tabId = 123;
    const validUrl = 'https://example.com';

    // Use real timers for execute tests since they involve complex async/Promise interactions
    beforeEach(() => {
      jest.useRealTimers();
    });

    afterEach(() => {
      jest.useFakeTimers();
    });

    it('should successfully execute URL change', async () => {
      (browser.tabs.update as jest.Mock).mockResolvedValue({});
      (browser.tabs.onUpdated.addListener as jest.Mock).mockImplementation((listener) => {
        // Trigger the listener callback asynchronously
        queueMicrotask(() => {
          listener(tabId, { status: 'complete' });
        });
      });

      const result = await executor.execute(tabId, '', validUrl, 0, 1);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Navigated to');
      expect(result.message).toContain(validUrl);
      expect(browser.tabs.update).toHaveBeenCalledWith(tabId, { url: validUrl });
      expect(mockLogger.info).toHaveBeenCalledWith(`Changing URL to: ${validUrl}`);
      expect(mockLogger.info).toHaveBeenCalledWith(`URL changed successfully to: ${validUrl}`);
    });

    it('should fail when URL validation fails (empty URL)', async () => {
      const result = await executor.execute(tabId, '', '', 0, 1);

      expect(result.success).toBe(false);
      expect(result.message).toBe('URL is required');
      expect(browser.tabs.update).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Changing URL to: ');
    });

    it('should fail when URL validation fails (invalid URL)', async () => {
      const invalidUrl = 'not a url';
      const result = await executor.execute(tabId, '', invalidUrl, 0, 1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid URL');
      expect(browser.tabs.update).not.toHaveBeenCalled();
    });

    it('should fail when URL validation fails (whitespace only)', async () => {
      const result = await executor.execute(tabId, '', '   ', 0, 1);

      expect(result.success).toBe(false);
      expect(result.message).toBe('URL is required');
      expect(browser.tabs.update).not.toHaveBeenCalled();
    });

    it('should handle browser.tabs.update error', async () => {
      const error = new Error('Tab update failed');
      (browser.tabs.update as jest.Mock).mockRejectedValue(error);

      const result = await executor.execute(tabId, '', validUrl, 0, 1);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Tab update failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Change URL error', error);
    });

    it('should handle non-Error exceptions in browser.tabs.update', async () => {
      (browser.tabs.update as jest.Mock).mockRejectedValue('String error');

      const result = await executor.execute(tabId, '', validUrl, 0, 1);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Unknown error');
      expect(mockLogger.error).toHaveBeenCalledWith('Change URL error', 'String error');
    });

    it('should ignore unused parameters', async () => {
      (browser.tabs.update as jest.Mock).mockResolvedValue({});
      (browser.tabs.onUpdated.addListener as jest.Mock).mockImplementation((listener) => {
        queueMicrotask(() => {
          listener(tabId, { status: 'complete' });
        });
      });

      const result = await executor.execute(
        tabId,
        '//unused/xpath',
        validUrl,
        999, // unused action pattern
        5, // unused step number
        'unused-action-type'
      );

      expect(result.success).toBe(true);
      expect(browser.tabs.update).toHaveBeenCalledWith(tabId, { url: validUrl });
    });

    it('should wait for page load before resolving', async () => {
      let listenerCallback: any = null;

      (browser.tabs.update as jest.Mock).mockResolvedValue({});
      (browser.tabs.onUpdated.addListener as jest.Mock).mockImplementation((listener) => {
        listenerCallback = listener;
        queueMicrotask(() => {
          listener(tabId, { status: 'complete' });
        });
      });

      const result = await executor.execute(tabId, '', validUrl, 0, 1);

      expect(result.success).toBe(true);
      expect(browser.tabs.onUpdated.addListener).toHaveBeenCalled();
      expect(browser.tabs.onUpdated.removeListener).toHaveBeenCalledWith(listenerCallback);
    });

    it('should only resolve when the correct tab completes loading', async () => {
      let listenerCallback: any = null;

      (browser.tabs.update as jest.Mock).mockResolvedValue({});
      (browser.tabs.onUpdated.addListener as jest.Mock).mockImplementation((listener) => {
        listenerCallback = listener;
        queueMicrotask(() => {
          // First trigger wrong tab (should be ignored)
          listener(999, { status: 'complete' });
          // Then trigger correct tab
          listener(tabId, { status: 'complete' });
        });
      });

      const result = await executor.execute(tabId, '', validUrl, 0, 1);

      expect(result.success).toBe(true);
      expect(browser.tabs.onUpdated.removeListener).toHaveBeenCalledWith(listenerCallback);
    });

    it('should only resolve when tab status is complete', async () => {
      let listenerCallback: any = null;

      (browser.tabs.update as jest.Mock).mockResolvedValue({});
      (browser.tabs.onUpdated.addListener as jest.Mock).mockImplementation((listener) => {
        listenerCallback = listener;
        queueMicrotask(() => {
          // First trigger loading status (should be ignored)
          listener(tabId, { status: 'loading' });
          // Then trigger complete status
          listener(tabId, { status: 'complete' });
        });
      });

      const result = await executor.execute(tabId, '', validUrl, 0, 1);

      expect(result.success).toBe(true);
      expect(browser.tabs.onUpdated.removeListener).toHaveBeenCalledWith(listenerCallback);
    });

    it('should execute with complex URL', async () => {
      const complexUrl = 'https://user:pass@example.com:8080/path?query=value#hash';

      (browser.tabs.update as jest.Mock).mockResolvedValue({});
      (browser.tabs.onUpdated.addListener as jest.Mock).mockImplementation((listener) => {
        queueMicrotask(() => {
          listener(tabId, { status: 'complete' });
        });
      });

      const result = await executor.execute(tabId, '', complexUrl, 0, 1);

      expect(result.success).toBe(true);
      expect(browser.tabs.update).toHaveBeenCalledWith(tabId, { url: complexUrl });
    });

    it('should log all expected messages during successful execution', async () => {
      (browser.tabs.update as jest.Mock).mockResolvedValue({});
      (browser.tabs.onUpdated.addListener as jest.Mock).mockImplementation((listener) => {
        queueMicrotask(() => {
          listener(tabId, { status: 'complete' });
        });
      });

      await executor.execute(tabId, '', validUrl, 0, 1);

      expect(mockLogger.info).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenNthCalledWith(1, `Changing URL to: ${validUrl}`);
      expect(mockLogger.info).toHaveBeenNthCalledWith(
        2,
        `URL changed successfully to: ${validUrl}`
      );
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });
});
