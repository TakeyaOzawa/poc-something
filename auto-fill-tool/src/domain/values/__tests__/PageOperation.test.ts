/**
 * PageOperation Value Object Tests
 */

import { PageOperation, PageOperationData, PageOperationType } from '../PageOperation';

describe('PageOperation', () => {
  describe('click', () => {
    test('クリック操作が作成されること', () => {
      const operation = PageOperation.click('#button');
      
      expect(operation.getType()).toBe('CLICK');
      expect(operation.getSelector()).toBe('#button');
      expect(operation.isClick()).toBe(true);
      expect(operation.isScroll()).toBe(false);
      expect(operation.isWait()).toBe(false);
      expect(operation.isCheckExistence()).toBe(false);
    });
  });

  describe('scroll', () => {
    test('スクロール操作が作成されること', () => {
      const operation = PageOperation.scroll(100, 200);
      
      expect(operation.getType()).toBe('SCROLL');
      expect(operation.getScrollX()).toBe(100);
      expect(operation.getScrollY()).toBe(200);
      expect(operation.isScroll()).toBe(true);
      expect(operation.isClick()).toBe(false);
    });
  });

  describe('wait', () => {
    test('待機操作が作成されること', () => {
      const operation = PageOperation.wait(5000);
      
      expect(operation.getType()).toBe('WAIT');
      expect(operation.getWaitTime()).toBe(5000);
      expect(operation.isWait()).toBe(true);
      expect(operation.isClick()).toBe(false);
    });
  });

  describe('checkExistence', () => {
    test('存在チェック操作が作成されること', () => {
      const operation = PageOperation.checkExistence('.element', true);
      
      expect(operation.getType()).toBe('CHECK_EXISTENCE');
      expect(operation.getSelector()).toBe('.element');
      expect(operation.getExpectedResult()).toBe(true);
      expect(operation.isCheckExistence()).toBe(true);
      expect(operation.isClick()).toBe(false);
    });

    test('デフォルトで存在を期待すること', () => {
      const operation = PageOperation.checkExistence('.element');
      expect(operation.getExpectedResult()).toBe(true);
    });
  });

  describe('fromData', () => {
    test('データから操作が作成されること', () => {
      const data: PageOperationData = {
        type: 'CLICK',
        selector: '#test'
      };
      
      const operation = PageOperation.fromData(data);
      
      expect(operation.getType()).toBe('CLICK');
      expect(operation.getSelector()).toBe('#test');
    });
  });

  describe('validation', () => {
    test('CLICKでselectorが未設定の場合、エラーが発生すること', () => {
      expect(() => {
        new PageOperation({ type: 'CLICK' });
      }).toThrow('CLICK操作にはselectorが必要です');
    });

    test('CHECK_EXISTENCEでselectorが未設定の場合、エラーが発生すること', () => {
      expect(() => {
        new PageOperation({ type: 'CHECK_EXISTENCE' });
      }).toThrow('CHECK_EXISTENCE操作にはselectorが必要です');
    });

    test('SCROLLで座標が未設定の場合、エラーが発生すること', () => {
      expect(() => {
        new PageOperation({ type: 'SCROLL', scrollX: 100 });
      }).toThrow('SCROLL操作にはscrollXとscrollYが必要です');
      
      expect(() => {
        new PageOperation({ type: 'SCROLL', scrollY: 200 });
      }).toThrow('SCROLL操作にはscrollXとscrollYが必要です');
    });

    test('WAITで待機時間が未設定または負の場合、エラーが発生すること', () => {
      expect(() => {
        new PageOperation({ type: 'WAIT' });
      }).toThrow('WAIT操作には正の待機時間が必要です');
      
      expect(() => {
        new PageOperation({ type: 'WAIT', waitTime: -1000 });
      }).toThrow('WAIT操作には正の待機時間が必要です');
    });

    test('未知の操作タイプの場合、エラーが発生すること', () => {
      expect(() => {
        new PageOperation({ type: 'UNKNOWN' as PageOperationType });
      }).toThrow('未知の操作タイプ: UNKNOWN');
    });
  });

  describe('toData', () => {
    test('データ形式で取得できること', () => {
      const operation = PageOperation.click('#button');
      const data = operation.toData();
      
      expect(data.type).toBe('CLICK');
      expect(data.selector).toBe('#button');
    });
  });
});
