/**
 * PageOperation Value Object
 * ページ操作を表す値オブジェクト
 */

export type PageOperationType = 'CLICK' | 'SCROLL' | 'WAIT' | 'CHECK_EXISTENCE';

export interface PageOperationData {
  type: PageOperationType;
  selector?: string;
  scrollX?: number;
  scrollY?: number;
  waitTime?: number;
  expectedResult?: boolean;
}

export class PageOperation {
  private data: PageOperationData;

  constructor(data: PageOperationData) {
    this.validateData(data);
    this.data = { ...data };
  }

  static click(selector: string): PageOperation {
    return new PageOperation({
      type: 'CLICK',
      selector
    });
  }

  static scroll(x: number, y: number): PageOperation {
    return new PageOperation({
      type: 'SCROLL',
      scrollX: x,
      scrollY: y
    });
  }

  static wait(milliseconds: number): PageOperation {
    return new PageOperation({
      type: 'WAIT',
      waitTime: milliseconds
    });
  }

  static checkExistence(selector: string, expectedResult: boolean = true): PageOperation {
    return new PageOperation({
      type: 'CHECK_EXISTENCE',
      selector,
      expectedResult
    });
  }

  static fromData(data: PageOperationData): PageOperation {
    return new PageOperation(data);
  }

  getType(): PageOperationType {
    return this.data.type;
  }

  getSelector(): string | undefined {
    return this.data.selector;
  }

  getScrollX(): number | undefined {
    return this.data.scrollX;
  }

  getScrollY(): number | undefined {
    return this.data.scrollY;
  }

  getWaitTime(): number | undefined {
    return this.data.waitTime;
  }

  getExpectedResult(): boolean | undefined {
    return this.data.expectedResult;
  }

  isClick(): boolean {
    return this.data.type === 'CLICK';
  }

  isScroll(): boolean {
    return this.data.type === 'SCROLL';
  }

  isWait(): boolean {
    return this.data.type === 'WAIT';
  }

  isCheckExistence(): boolean {
    return this.data.type === 'CHECK_EXISTENCE';
  }

  toData(): PageOperationData {
    return { ...this.data };
  }

  private validateData(data: PageOperationData): void {
    switch (data.type) {
      case 'CLICK':
      case 'CHECK_EXISTENCE':
        if (!data.selector) {
          throw new Error(`${data.type}操作にはselectorが必要です`);
        }
        break;
      case 'SCROLL':
        if (data.scrollX === undefined || data.scrollY === undefined) {
          throw new Error('SCROLL操作にはscrollXとscrollYが必要です');
        }
        break;
      case 'WAIT':
        if (!data.waitTime || data.waitTime < 0) {
          throw new Error('WAIT操作には正の待機時間が必要です');
        }
        break;
      default:
        throw new Error(`未知の操作タイプ: ${data.type}`);
    }
  }
}
