/**
 * JudgeActionExecutor
 * 判定アクションの実行
 */

import { ActionExecutor, ActionExecutionResult } from '@domain/services/ActionExecutor';
import { XPathData } from '@domain/entities/XPathCollection';

export class JudgeActionExecutor implements ActionExecutor {
  canHandle(actionType: string): boolean {
    return actionType === 'judge' || actionType === 'JUDGE' || actionType === 'check';
  }

  async execute(xpath: XPathData, value?: string): Promise<ActionExecutionResult> {
    const logs: string[] = [];
    
    try {
      const expectedValue = value || xpath.value || '';
      const comparisonPattern = xpath.actionPattern || 'equals';
      logs.push(`Judge action: expected="${expectedValue}", pattern="${comparisonPattern}"`);

      // 要素を取得
      const element = await this.findElement(xpath);
      if (!element) {
        return {
          success: false,
          errorMessage: '判定対象の要素が見つかりません',
          logs
        };
      }

      logs.push(`Element found: ${element.tagName}`);

      // 要素の値を取得
      const actualValue = this.getElementValue(element);
      logs.push(`Actual value: "${actualValue}"`);

      // 比較実行
      const comparisonResult = this.compareValues(actualValue, expectedValue, comparisonPattern);
      logs.push(`Comparison result: ${comparisonResult}`);

      if (comparisonResult) {
        logs.push('Judge action succeeded');
        return { success: true, logs };
      } else {
        return {
          success: false,
          errorMessage: `判定に失敗しました: 期待値="${expectedValue}", 実際の値="${actualValue}", 比較方法="${comparisonPattern}"`,
          logs
        };
      }
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

  private getElementValue(element: Element): string {
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox' || element.type === 'radio') {
        return element.checked ? 'true' : 'false';
      }
      return element.value;
    }
    
    if (element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      return element.value;
    }
    
    return element.textContent?.trim() || '';
  }

  private compareValues(actual: string, expected: string, pattern: string): boolean {
    switch (pattern.toLowerCase()) {
      case 'equals':
      case '等しい':
        return actual === expected;
      
      case 'not_equals':
      case '等しくない':
        return actual !== expected;
      
      case 'contains':
      case '含む':
        return actual.includes(expected);
      
      case 'not_contains':
      case '含まない':
        return !actual.includes(expected);
      
      case 'greater_than':
      case '大なり':
        return parseFloat(actual) > parseFloat(expected);
      
      case 'less_than':
      case '小なり':
        return parseFloat(actual) < parseFloat(expected);
      
      case 'greater_equal':
      case '以上':
        return parseFloat(actual) >= parseFloat(expected);
      
      case 'less_equal':
      case '以下':
        return parseFloat(actual) <= parseFloat(expected);
      
      default:
        // デフォルトは等しい比較
        return actual === expected;
    }
  }
}
