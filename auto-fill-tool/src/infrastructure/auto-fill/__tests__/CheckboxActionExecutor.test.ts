/**
 * CheckboxActionExecutor Tests
 */

import { CheckboxActionExecutor } from '../CheckboxActionExecutor';
import { XPathData } from '@domain/entities/XPathCollection';

describe('CheckboxActionExecutor', () => {
  let executor: CheckboxActionExecutor;
  let mockCheckbox: HTMLInputElement;
  let sampleXPath: XPathData;

  beforeEach(() => {
    executor = new CheckboxActionExecutor();
    
    // DOM要素のモック - HTMLInputElementのインスタンスとして作成
    mockCheckbox = new HTMLInputElement();
    mockCheckbox.type = 'checkbox';
    mockCheckbox.tagName = 'INPUT';
    mockCheckbox.checked = false;

    sampleXPath = {
      id: 'xpath-1',
      websiteId: 'website-1',
      url: 'https://example.com',
      actionType: 'checkbox',
      value: 'true',
      executionOrder: 1,
      selectedPathPattern: 'smart',
      retryType: 0,
      smartXPath: '//input[@type="checkbox"]',
      shortXPath: undefined,
      absoluteXPath: undefined,
      afterWaitSeconds: undefined,
      executionTimeoutSeconds: undefined,
      actionPattern: undefined,
    };

    // document.evaluateのモック
    jest.spyOn(document, 'evaluate').mockReturnValue({
      singleNodeValue: mockCheckbox,
      resultType: window.XPathResult.FIRST_ORDERED_NODE_TYPE
    } as XPathResult);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  describe('canHandle', () => {
    test('checkboxアクションを処理できること', () => {
      expect(executor.canHandle('checkbox')).toBe(true);
      expect(executor.canHandle('CHECK')).toBe(true);
    });

    test('他のアクションは処理できないこと', () => {
      expect(executor.canHandle('input')).toBe(false);
      expect(executor.canHandle('click')).toBe(false);
    });
  });

  describe('execute', () => {
    test('チェックボックスが正常にチェックされること', async () => {
      // Arrange
      mockCheckbox.checked = false;

      // Act
      const result = await executor.execute(sampleXPath, 'true');

      // Assert
      expect(result.success).toBe(true);
      expect(mockCheckbox.checked).toBe(true);
      expect(result.logs).toContain('Checkbox action: check');
      expect(result.logs).toContain('Checkbox checked successfully');
    });

    test('チェックボックスが正常にチェック解除されること', async () => {
      // Arrange
      mockCheckbox.checked = true;

      // Act
      const result = await executor.execute(sampleXPath, 'false');

      // Assert
      expect(result.success).toBe(true);
      expect(mockCheckbox.checked).toBe(false);
      expect(result.logs).toContain('Checkbox action: uncheck');
      expect(result.logs).toContain('Checkbox unchecked successfully');
    });

    test('XPathの値が使用されること', async () => {
      // Arrange
      mockCheckbox.checked = false;

      // Act
      const result = await executor.execute(sampleXPath);

      // Assert
      expect(result.success).toBe(true);
      expect(mockCheckbox.checked).toBe(true);
    });

    test('既に目的の状態の場合、変更されないこと', async () => {
      // Arrange
      mockCheckbox.checked = true;

      // Act
      const result = await executor.execute(sampleXPath, 'true');

      // Assert
      expect(result.success).toBe(true);
      expect(mockCheckbox.checked).toBe(true);
      expect(result.logs).toContain('Checkbox already in desired state: true');
    });

    test('ラジオボタンでも動作すること', async () => {
      // Arrange
      const mockRadio = new HTMLInputElement();
      mockRadio.type = 'radio';
      mockRadio.tagName = 'INPUT';
      mockRadio.checked = false;
      
      jest.spyOn(document, 'evaluate').mockImplementation(() => ({
        singleNodeValue: mockRadio,
        resultType: window.XPathResult.FIRST_ORDERED_NODE_TYPE
      } as XPathResult));

      // Act
      const result = await executor.execute(sampleXPath, 'true');

      // Assert
      expect(result.success).toBe(true);
      expect(mockRadio.checked).toBe(true);
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
      expect(result.errorMessage).toBe('チェックボックス要素が見つかりません');
    });

    test('チェックボックス以外の要素の場合、エラーが返されること', async () => {
      // Arrange
      const mockDiv = document.createElement('div');
      jest.spyOn(document, 'evaluate').mockImplementation(() => ({
        singleNodeValue: mockDiv
      } as any));

      // Act
      const result = await executor.execute(sampleXPath);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errorMessage).toBe('チェックボックスまたはラジオボタンではありません');
    });
  });
});
