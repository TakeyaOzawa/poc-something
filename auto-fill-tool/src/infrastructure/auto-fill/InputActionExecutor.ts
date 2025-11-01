/**
 * InputActionExecutor
 * テキスト入力アクションの実行
 */

import { ActionExecutor, ActionExecutionResult } from '@domain/services/ActionExecutor';
import { XPathData } from '@domain/entities/XPathCollection';

export class InputActionExecutor implements ActionExecutor {
  canHandle(actionType: string): boolean {
    return actionType === 'input' || actionType === 'TYPE';
  }

  async execute(xpath: XPathData, value?: string): Promise<ActionExecutionResult> {
    const logs: string[] = [];
    
    try {
      const inputValue = value || xpath.value || '';
      logs.push(`Input action: value="${inputValue}"`);

      // 要素を取得
      const element = await this.findElement(xpath);
      if (!element) {
        return {
          success: false,
          errorMessage: '入力要素が見つかりません',
          logs
        };
      }

      logs.push(`Element found: ${element.tagName}`);

      // 既存の値をクリア
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.value = '';
        element.dispatchEvent(new Event('input', { bubbles: true }));
        logs.push('Cleared existing value');
      }

      // 新しい値を入力
      if (inputValue) {
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
          element.value = inputValue;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          logs.push(`Input completed: "${inputValue}"`);
        } else {
          element.textContent = inputValue;
          logs.push(`Text content set: "${inputValue}"`);
        }
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
