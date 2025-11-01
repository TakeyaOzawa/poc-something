/**
 * InputActionExecutor Tests
 */

import { InputActionExecutor } from '../InputActionExecutor';
import { XPathData } from '@domain/entities/XPathCollection';

describe('InputActionExecutor', () => {
  let executor: InputActionExecutor;
  let mockInput: HTMLInputElement;
  let sampleXPath: XPathData;

  beforeEach(() => {
    executor = new InputActionExecutor();
    
    // DOM要素のモック - HTMLInputElementのインスタンスとして作成
    mockInput = new HTMLInputElement();
    mockInput.type = 'text';
    mockInput.tagName = 'INPUT';

    sampleXPath = {
      id: 'xpath-1',
      websiteId: 'website-1',
      url: 'https://example.com',
      actionType: 'input',
      value: 'test value',
      executionOrder: 1,
      selectedPathPattern: 'smart',
      retryType: 0,
      smartXPath: '//input[@type="text"]',
      shortXPath: undefined,
      absoluteXPath: undefined,
      afterWaitSeconds: undefined,
      executionTimeoutSeconds: undefined,
      actionPattern: undefined,
    };

    // document.evaluateのモック
    jest.spyOn(document, 'evaluate').mockReturnValue({
      singleNodeValue: mockInput,
      resultType: window.XPathResult.FIRST_ORDERED_NODE_TYPE
    } as XPathResult);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  describe('canHandle', () => {
    test('inputアクションを処理できること', () => {
      expect(executor.canHandle('input')).toBe(true);
      expect(executor.canHandle('TYPE')).toBe(true);
    });

    test('他のアクションは処理できないこと', () => {
      expect(executor.canHandle('click')).toBe(false);
      expect(executor.canHandle('CLICK')).toBe(false);
    });
  });

  describe('execute', () => {
    test('テキスト入力が正常に実行されること', async () => {
      // Arrange
      const inputValue = 'test input';

      // Act
      const result = await executor.execute(sampleXPath, inputValue);

      // Assert
      expect(result.success).toBe(true);
      expect(mockInput.value).toBe(inputValue);
      expect(result.logs).toContain('Input action: value="test input"');
      expect(result.logs).toContain('Input completed: "test input"');
    });

    test('XPathの値が使用されること', async () => {
      // Act
      const result = await executor.execute(sampleXPath);

      // Assert
      expect(result.success).toBe(true);
      expect(mockInput.value).toBe('test value');
    });

    test('要素が見つからない場合、エラーが返されること', async () => {
      // Arrange
      jest.spyOn(document, 'evaluate').mockImplementation(() => ({
        singleNodeValue: null
      } as any));

      // Act
      const result = await executor.execute(sampleXPath);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('入力要素が見つかりません');
    });

    test('既存の値がクリアされること', async () => {
      // Arrange
      const inputValue = 'new value';
      // 既存の値を設定
      mockInput.value = 'existing value';
      
      // 新しいモック要素を作成してdocument.evaluateに設定
      const mockInputWithExistingValue = new HTMLInputElement();
      mockInputWithExistingValue.value = 'existing value';
      mockInputWithExistingValue.tagName = 'INPUT';
      
      jest.spyOn(document, 'evaluate').mockReturnValue({
        singleNodeValue: mockInputWithExistingValue,
        resultType: window.XPathResult.FIRST_ORDERED_NODE_TYPE
      } as XPathResult);

      // Act
      const result = await executor.execute(sampleXPath, inputValue);

      // Assert
      expect(result.success).toBe(true);
      expect(mockInputWithExistingValue.value).toBe(inputValue);
      expect(result.logs).toContain('Cleared existing value');
    });

    test('textareaでも動作すること', async () => {
      // Arrange
      const mockTextarea = document.createElement('textarea');
      document.body.appendChild(mockTextarea);
      jest.spyOn(document, 'evaluate').mockImplementation(() => ({
        singleNodeValue: mockTextarea
      } as any));

      // Act
      const result = await executor.execute(sampleXPath, 'textarea content');

      // Assert
      expect(result.success).toBe(true);
      expect(mockTextarea.value).toBe('textarea content');
    });

    test('XPath評価でエラーが発生した場合、適切に処理されること', async () => {
      // Arrange
      jest.spyOn(document, 'evaluate').mockImplementation(() => {
        throw new Error('XPath error');
      });

      // Act
      const result = await executor.execute(sampleXPath);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('入力要素が見つかりません');
    });
  });
});
