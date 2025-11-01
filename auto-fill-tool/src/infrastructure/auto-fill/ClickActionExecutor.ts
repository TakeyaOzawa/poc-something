/**
 * ClickActionExecutor
 * クリックアクションの実行
 */

import { ActionExecutor, ActionExecutionResult } from '@domain/services/ActionExecutor';
import { XPathData } from '@domain/entities/XPathCollection';

export class ClickActionExecutor implements ActionExecutor {
  canHandle(actionType: string): boolean {
    return actionType === 'click' || actionType === 'CLICK';
  }

  async execute(xpath: XPathData): Promise<ActionExecutionResult> {
    const logs: string[] = [];
    
    try {
      logs.push('Click action started');

      // 要素を取得
      const element = await this.findElement(xpath);
      if (!element) {
        return {
          success: false,
          errorMessage: 'クリック要素が見つかりません',
          logs
        };
      }

      logs.push(`Element found: ${element.tagName}`);

      // 要素が表示されているかチェック
      if (!this.isElementVisible(element)) {
        logs.push('Element is not visible, scrolling into view');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.wait(500); // スクロール完了を待機
      }

      // クリック実行
      if (element instanceof HTMLElement) {
        element.click();
        logs.push('Click executed successfully');
      } else {
        // HTMLElementでない場合はイベントを発火
        element.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
        logs.push('Click event dispatched');
      }

      return { success: true, logs };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logs.push(`Error: ${errorMessage}`);
      return {
        success: false,
        errorMessage,
        logs
      };
    }
  }

  private async findElement(xpath: XPathData): Promise<Element | null> {
    // Smart XPathを優先的に使用
    if (xpath.smartXPath) {
      const element = this.evaluateXPath(xpath.smartXPath);
      if (element) return element;
    }

    // Short XPathを試行
    if (xpath.shortXPath) {
      const element = this.evaluateXPath(xpath.shortXPath);
      if (element) return element;
    }

    // Absolute XPathを最後に試行
    if (xpath.absoluteXPath) {
      return this.evaluateXPath(xpath.absoluteXPath);
    }

    return null;
  }

  private evaluateXPath(xpathExpression: string): Element | null {
    try {
      const result = document.evaluate(
        xpathExpression,
        document,
        null,
        window.XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      return result.singleNodeValue as Element | null;
    } catch (error) {
      console.warn(`XPath evaluation failed: ${xpathExpression}`, error);
      return null;
    }
  }

  private isElementVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && 
           rect.top >= 0 && rect.left >= 0 &&
           rect.bottom <= window.innerHeight && 
           rect.right <= window.innerWidth;
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
