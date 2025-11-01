/**
 * CheckboxActionExecutor
 * チェックボックスアクションの実行
 */

import { ActionExecutor, ActionExecutionResult } from '@domain/services/ActionExecutor';
import { XPathData } from '@domain/entities/XPathCollection';

export class CheckboxActionExecutor implements ActionExecutor {
  canHandle(actionType: string): boolean {
    return actionType === 'checkbox' || actionType === 'CHECK';
  }

  async execute(xpath: XPathData, value?: string): Promise<ActionExecutionResult> {
    const logs: string[] = [];
    
    try {
      const checkValue = value || xpath.value || 'true';
      const shouldCheck = checkValue.toLowerCase() === 'true' || checkValue === '1';
      logs.push(`Checkbox action: ${shouldCheck ? 'check' : 'uncheck'}`);

      // 要素を取得
      const element = await this.findElement(xpath);
      if (!element) {
        return {
          success: false,
          errorMessage: 'チェックボックス要素が見つかりません',
          logs
        };
      }

      logs.push(`Element found: ${element.tagName}`);

      // チェックボックスかラジオボタンかを確認
      if (!(element instanceof HTMLInputElement) || 
          (element.type !== 'checkbox' && element.type !== 'radio')) {
        return {
          success: false,
          errorMessage: 'チェックボックスまたはラジオボタンではありません',
          logs
        };
      }

      // 現在の状態をログ
      logs.push(`Current checked state: ${element.checked}`);

      // チェック状態を設定
      if (element.checked !== shouldCheck) {
        element.checked = shouldCheck;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        logs.push(`Checkbox ${shouldCheck ? 'checked' : 'unchecked'} successfully`);
      } else {
        logs.push(`Checkbox already in desired state: ${shouldCheck}`);
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
}
