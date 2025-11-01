/**
 * ChangeUrlActionExecutor Tests
 */

import { ChangeUrlActionExecutor } from '../ChangeUrlActionExecutor';
import { XPathData } from '@domain/entities/XPathCollection';

describe('ChangeUrlActionExecutor', () => {
  let executor: ChangeUrlActionExecutor;
  let sampleXPath: XPathData;

  beforeEach(() => {
    executor = new ChangeUrlActionExecutor();

    sampleXPath = {
      id: 'xpath-1',
      websiteId: 'website-1',
      url: 'https://example.com',
      actionType: 'change_url',
      value: 'https://example.com/next-page',
      executionOrder: 1,
      selectedPathPattern: 'smart',
      retryType: 0
    };

    // window.locationのモック
    delete (window as any).location;
    (window as any).location = { href: 'https://example.com' };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('canHandle', () => {
    test('change_urlアクションを処理できること', () => {
      expect(executor.canHandle('change_url')).toBe(true);
      expect(executor.canHandle('CHANGE_URL')).toBe(true);
    });

    test('他のアクションは処理できないこと', () => {
      expect(executor.canHandle('input')).toBe(false);
      expect(executor.canHandle('click')).toBe(false);
    });
  });

  describe('execute', () => {
    test('URLが正常に変更されること', async () => {
      // Act
      const result = await executor.execute(sampleXPath, 'https://example.com/new-page');

      // Assert
      expect(result.success).toBe(true);
      expect(window.location.href).toBe('https://example.com/new-page');
      expect(result.logs).toContain('Change URL action: target="https://example.com/new-page"');
      expect(result.logs).toContain('URL changed to: "https://example.com/new-page"');
    });

    test('XPathの値が使用されること', async () => {
      // Act
      const result = await executor.execute(sampleXPath);

      // Assert
      expect(result.success).toBe(true);
      expect(window.location.href).toBe('https://example.com/next-page');
    });

    test('空のURLの場合、エラーが返されること', async () => {
      // Arrange
      const emptyXPath = { ...sampleXPath, value: '' };

      // Act
      const result = await executor.execute(emptyXPath, '');

      // Assert
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('変更先のURLが指定されていません');
    });

    test('無効なURLの場合、エラーが返されること', async () => {
      // Act
      const result = await executor.execute(sampleXPath, 'invalid-url');

      // Assert
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('無効なURLです');
    });

    test('現在のURLと同じ場合、スキップされること', async () => {
      // Arrange
      (window as any).location = { href: 'https://example.com/same-page' };

      // Act
      const result = await executor.execute(sampleXPath, 'https://example.com/same-page');

      // Assert
      expect(result.success).toBe(true);
      expect(result.logs).toContain('Target URL is same as current URL, skipping');
    });

    test('URL変更でエラーが発生した場合、適切に処理されること', async () => {
      // Arrange
      const originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = {
        href: 'https://example.com',
        set href(value) {
          throw new Error('Navigation failed');
        }
      };

      // Act
      const result = await executor.execute(sampleXPath);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('Navigation failed');

      // Cleanup
      (window as any).location = originalLocation;
    });
  });
});
