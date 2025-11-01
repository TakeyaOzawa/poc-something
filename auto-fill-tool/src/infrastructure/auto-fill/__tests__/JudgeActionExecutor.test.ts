/**
 * JudgeActionExecutor Tests
 */

import { JudgeActionExecutor } from '../JudgeActionExecutor';
import { XPathData } from '@domain/entities/XPathCollection';

describe('JudgeActionExecutor', () => {
  let executor: JudgeActionExecutor;
  let mockElement: HTMLElement;
  let sampleXPath: XPathData;

  beforeEach(() => {
    executor = new JudgeActionExecutor();
    
    // DOM要素のモック
    mockElement = document.createElement('div');
    mockElement.textContent = 'test content';
    document.body.appendChild(mockElement);

    sampleXPath = {
      id: 'xpath-1',
      websiteId: 'website-1',
      url: 'https://example.com',
      actionType: 'judge',
      value: 'test content',
      executionOrder: 1,
      selectedPathPattern: 'smart',
      retryType: 0,
      smartXPath: '//div',
      actionPattern: 'equals'
    };

    // document.evaluateのモック
    jest.spyOn(document, 'evaluate').mockReturnValue({
      singleNodeValue: mockElement,
      resultType: window.XPathResult.FIRST_ORDERED_NODE_TYPE
    } as XPathResult);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  describe('canHandle', () => {
    test('judgeアクションを処理できること', () => {
      expect(executor.canHandle('judge')).toBe(true);
      expect(executor.canHandle('JUDGE')).toBe(true);
      expect(executor.canHandle('check')).toBe(true);
    });

    test('他のアクションは処理できないこと', () => {
      expect(executor.canHandle('input')).toBe(false);
      expect(executor.canHandle('click')).toBe(false);
    });
  });

  describe('execute', () => {
    test('等しい比較が正常に動作すること', async () => {
      // Act
      const result = await executor.execute(sampleXPath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.logs).toContain('Judge action: expected="test content", pattern="equals"');
      expect(result.logs).toContain('Actual value: "test content"');
      expect(result.logs).toContain('Comparison result: true');
    });

    test('等しくない比較が正常に動作すること', async () => {
      // Arrange
      const xpath = { ...sampleXPath, actionPattern: 'not_equals', value: 'different' };

      // Act
      const result = await executor.execute(xpath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.logs).toContain('Comparison result: true');
    });

    test('含む比較が正常に動作すること', async () => {
      // Arrange
      const xpath = { ...sampleXPath, actionPattern: 'contains', value: 'test' };

      // Act
      const result = await executor.execute(xpath);

      // Assert
      expect(result.success).toBe(true);
    });

    test('数値比較が正常に動作すること', async () => {
      // Arrange
      mockElement.textContent = '100';
      const xpath = { ...sampleXPath, actionPattern: 'greater_than', value: '50' };

      // Act
      const result = await executor.execute(xpath);

      // Assert
      expect(result.success).toBe(true);
    });

    test('入力要素の値が取得されること', async () => {
      // Arrange
      const mockInput = new HTMLInputElement();
      mockInput.value = 'input value';
      mockInput.tagName = 'INPUT';
      jest.spyOn(document, 'evaluate').mockImplementation(() => ({
        singleNodeValue: mockInput,
        resultType: window.XPathResult.FIRST_ORDERED_NODE_TYPE
      } as XPathResult));

      const xpath = { ...sampleXPath, value: 'input value' };

      // Act
      const result = await executor.execute(xpath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.logs).toContain('Actual value: "input value"');
    });

    test('チェックボックスの状態が取得されること', async () => {
      // Arrange
      const mockCheckbox = new HTMLInputElement();
      mockCheckbox.type = 'checkbox';
      mockCheckbox.tagName = 'INPUT';
      mockCheckbox.checked = true;
      jest.spyOn(document, 'evaluate').mockImplementation(() => ({
        singleNodeValue: mockCheckbox,
        resultType: window.XPathResult.FIRST_ORDERED_NODE_TYPE
      } as XPathResult));

      const xpath = { ...sampleXPath, value: 'true' };

      // Act
      const result = await executor.execute(xpath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.logs).toContain('Actual value: "true"');
    });

    test('比較に失敗した場合、エラーが返されること', async () => {
      // Arrange
      const xpath = { ...sampleXPath, value: 'different content' };

      // Act
      const result = await executor.execute(xpath);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('判定に失敗しました');
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
      expect(result.errorMessage).toBe('判定対象の要素が見つかりません');
    });

    test('未知の比較パターンの場合、デフォルトで等しい比較が使用されること', async () => {
      // Arrange
      const xpath = { ...sampleXPath, actionPattern: 'unknown_pattern' };

      // Act
      const result = await executor.execute(xpath);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});
