/**
 * ClickActionExecutor Tests
 */

import { ClickActionExecutor } from '../ClickActionExecutor';
import { XPathData } from '@domain/entities/XPathCollection';

describe('ClickActionExecutor', () => {
  let executor: ClickActionExecutor;
  let mockButton: HTMLButtonElement;
  let sampleXPath: XPathData;

  beforeEach(() => {
    executor = new ClickActionExecutor();
    
    // DOM要素のモック - HTMLElementのインスタンスとして作成
    mockButton = new HTMLElement();
    mockButton.tagName = 'BUTTON';
    mockButton.textContent = 'Click Me';
    mockButton.click = jest.fn();

    sampleXPath = {
      id: 'xpath-1',
      websiteId: 'website-1',
      url: 'https://example.com',
      actionType: 'click',
      value: '',
      executionOrder: 1,
      selectedPathPattern: 'smart',
      retryType: 0,
      smartXPath: '//button',
      shortXPath: undefined,
      absoluteXPath: undefined,
      afterWaitSeconds: undefined,
      executionTimeoutSeconds: undefined,
      actionPattern: undefined,
    };

    // document.evaluateのモック
    jest.spyOn(document, 'evaluate').mockReturnValue({
      singleNodeValue: mockButton,
      resultType: window.XPathResult.FIRST_ORDERED_NODE_TYPE
    } as XPathResult);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  describe('canHandle', () => {
    test('clickアクションを処理できること', () => {
      expect(executor.canHandle('click')).toBe(true);
      expect(executor.canHandle('CLICK')).toBe(true);
    });

    test('他のアクションは処理できないこと', () => {
      expect(executor.canHandle('input')).toBe(false);
      expect(executor.canHandle('select')).toBe(false);
    });
  });

  describe('execute', () => {
    test('ボタンが正常にクリックされること', async () => {
      // Act
      const result = await executor.execute(sampleXPath);

      // Assert
      expect(result.success).toBe(true);
      expect(mockButton.click).toHaveBeenCalledTimes(1);
      expect(result.logs).toContain('Click action started');
      expect(result.logs).toContain('Element found: BUTTON');
    });

    test('要素が見つからない場合、エラーが返されること', async () => {
      // Arrange
      jest.spyOn(document, 'evaluate').mockReturnValue({
        singleNodeValue: null,
        resultType: window.XPathResult.FIRST_ORDERED_NODE_TYPE
      } as XPathResult);

      // Act
      const result = await executor.execute(sampleXPath);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('クリック要素が見つかりません');
    });

    test('リンク要素でも動作すること', async () => {
      // Arrange
      const mockLink = new HTMLElement();
      mockLink.tagName = 'A';
      mockLink.textContent = 'Link';
      mockLink.click = jest.fn();
      
      jest.spyOn(document, 'evaluate').mockReturnValue({
        singleNodeValue: mockLink,
        resultType: window.XPathResult.FIRST_ORDERED_NODE_TYPE
      } as XPathResult);

      // Act
      const result = await executor.execute(sampleXPath);

      // Assert
      expect(result.success).toBe(true);
      expect(mockLink.click).toHaveBeenCalledTimes(1);
    });

    test('XPath評価でエラーが発生した場合、適切に処理されること', async () => {
      // Arrange
      jest.spyOn(document, 'evaluate').mockImplementation(() => {
        throw new Error('XPath evaluation failed');
      });

      // Act
      const result = await executor.execute(sampleXPath);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('クリック要素が見つかりません');
    });
  });
});
