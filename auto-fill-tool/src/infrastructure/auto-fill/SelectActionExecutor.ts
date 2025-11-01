/**
 * SelectActionExecutor
 * セレクトボックスアクションの実行
 */

import { ActionExecutor, ActionExecutionResult } from '@domain/services/ActionExecutor';
import { XPathData } from '@domain/entities/XPathCollection';

export class SelectActionExecutor implements ActionExecutor {
  canHandle(actionType: string): boolean {
    return actionType === 'select' || actionType === 'SELECT' || 
           actionType === 'select_by_value' || actionType === 'select_by_text' ||
           actionType === 'select_by_index';
  }

  async execute(xpath: XPathData, value?: string): Promise<ActionExecutionResult> {
    const logs: string[] = [];
    
    try {
      const selectValue = value || xpath.value || '';
      const selectionPattern = xpath.actionPattern || 'value';
      logs.push(`Select action: value="${selectValue}", pattern="${selectionPattern}"`);

      // 要素を取得
      const element = await this.findElement(xpath);
      if (!element) {
        return {
          success: false,
          errorMessage: 'セレクト要素が見つかりません',
          logs
        };
      }

      logs.push(`Element found: ${element.tagName}`);

      // セレクト要素かを確認
      if (!(element instanceof HTMLSelectElement)) {
        return {
          success: false,
          errorMessage: 'セレクト要素ではありません',
          logs
        };
      }

      // 選択実行
      const success = this.selectOption(element, selectValue, selectionPattern, logs);
      
      if (success) {
        element.dispatchEvent(new Event('change', { bubbles: true }));
        logs.push('Select action completed successfully');
        return { success: true, logs };
      } else {
        return {
          success: false,
          errorMessage: `選択に失敗しました: 値="${selectValue}", パターン="${selectionPattern}"`,
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

  private selectOption(selectElement: HTMLSelectElement, value: string, pattern: string, logs: string[]): boolean {
    const options = Array.from(selectElement.options);
    logs.push(`Available options: ${options.length}`);

    switch (pattern.toLowerCase()) {
      case 'value':
      case 'select_by_value':
        return this.selectByValue(selectElement, value, logs);
      
      case 'text':
      case 'select_by_text':
        return this.selectByText(selectElement, value, logs);
      
      case 'index':
      case 'select_by_index':
        return this.selectByIndex(selectElement, parseInt(value), logs);
      
      default:
        // デフォルトは値による選択
        return this.selectByValue(selectElement, value, logs);
    }
  }

  private selectByValue(selectElement: HTMLSelectElement, value: string, logs: string[]): boolean {
    const option = Array.from(selectElement.options).find(opt => opt.value === value);
    if (option) {
      selectElement.selectedIndex = option.index;
      logs.push(`Selected by value: "${value}" (index: ${option.index})`);
      return true;
    }
    logs.push(`Option with value "${value}" not found`);
    return false;
  }

  private selectByText(selectElement: HTMLSelectElement, text: string, logs: string[]): boolean {
    const option = Array.from(selectElement.options).find(opt => 
      opt.textContent?.trim() === text || opt.text === text
    );
    if (option) {
      selectElement.selectedIndex = option.index;
      logs.push(`Selected by text: "${text}" (index: ${option.index})`);
      return true;
    }
    logs.push(`Option with text "${text}" not found`);
    return false;
  }

  private selectByIndex(selectElement: HTMLSelectElement, index: number, logs: string[]): boolean {
    if (index >= 0 && index < selectElement.options.length) {
      selectElement.selectedIndex = index;
      const selectedOption = selectElement.options[index];
      if (selectedOption) {
        logs.push(`Selected by index: ${index} (value: "${selectedOption.value}", text: "${selectedOption.text}")`);
      } else {
        logs.push(`Selected by index: ${index} (option not found)`);
      }
      return true;
    }
    logs.push(`Invalid index: ${index} (available: 0-${selectElement.options.length - 1})`);
    return false;
  }
}
