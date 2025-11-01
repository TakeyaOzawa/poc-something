/**
 * SelectActionExecutor Tests
 */

import { SelectActionExecutor } from '../SelectActionExecutor';
import { XPathData } from '@domain/entities/XPathCollection';

describe('SelectActionExecutor', () => {
  let executor: SelectActionExecutor;
  let mockSelect: HTMLSelectElement;
  let sampleXPath: XPathData;

  beforeEach(() => {
    executor = new SelectActionExecutor();
    
    // DOM要素のモック - HTMLSelectElementのインスタンスとして作成
    mockSelect = new HTMLSelectElement();
    mockSelect.tagName = 'SELECT';
    
    // オプションを設定
    const option1 = { value: 'option1', text: 'Option 1', index: 0 };
    const option2 = { value: 'option2', text: 'Option 2', index: 1 };
    mockSelect.options = [option1, option2];
    mockSelect.selectedIndex = -1;
    
    // valueプロパティを設定
    Object.defineProperty(mockSelect, 'value', {
      get: function() {
        return this.selectedIndex >= 0 ? this.options[this.selectedIndex].value : '';
      },
      set: function(val) {
        const option = this.options.find(opt => opt.value === val);
        if (option) {
          this.selectedIndex = option.index;
        }
      },
      configurable: true
    });

    sampleXPath = {
      id: 'xpath-1',
      websiteId: 'website-1',
      url: 'https://example.com',
      actionType: 'select',
      value: 'option2',
      executionOrder: 1,
      selectedPathPattern: 'smart',
      retryType: 0,
      smartXPath: '//select',
      shortXPath: undefined,
      absoluteXPath: undefined,
      afterWaitSeconds: undefined,
      executionTimeoutSeconds: undefined,
      actionPattern: undefined,
    };

    // document.evaluateのモック
    jest.spyOn(document, 'evaluate').mockReturnValue({
      singleNodeValue: mockSelect,
      resultType: window.XPathResult.FIRST_ORDERED_NODE_TYPE
    } as XPathResult);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  describe('canHandle', () => {
    test('selectアクションを処理できること', () => {
      expect(executor.canHandle('select')).toBe(true);
      expect(executor.canHandle('SELECT')).toBe(true);
    });

    test('他のアクションは処理できないこと', () => {
      expect(executor.canHandle('input')).toBe(false);
      expect(executor.canHandle('click')).toBe(false);
    });
  });

  describe('execute', () => {
    test('セレクトボックスの値が正常に選択されること', async () => {
      // Act
      const result = await executor.execute(sampleXPath, 'option2');

      // Assert
      expect(result.success).toBe(true);
      expect(mockSelect.value).toBe('option2');
      expect(result.logs).toContain('Select action: value="option2", pattern="value"');
      expect(result.logs).toContain('Select action completed successfully');
    });

    test('XPathの値が使用されること', async () => {
      // Act
      const result = await executor.execute(sampleXPath);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSelect.value).toBe('option2');
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
      expect(result.errorMessage).toContain('セレクト要素が見つかりません');
    });

    test('存在しないオプションを選択した場合、エラーが返されること', async () => {
      // Act
      const result = await executor.execute(sampleXPath, 'nonexistent');

      // Assert
      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('選択に失敗しました');
    });
  });
});
