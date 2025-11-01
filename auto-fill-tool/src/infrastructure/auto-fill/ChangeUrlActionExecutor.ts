/**
 * ChangeUrlActionExecutor
 * URL変更アクションの実行
 */

import { ActionExecutor, ActionExecutionResult } from '@domain/services/ActionExecutor';
import { XPathData } from '@domain/entities/XPathCollection';

export class ChangeUrlActionExecutor implements ActionExecutor {
  canHandle(actionType: string): boolean {
    return actionType === 'change_url' || actionType === 'CHANGE_URL';
  }

  async execute(xpath: XPathData, value?: string): Promise<ActionExecutionResult> {
    const logs: string[] = [];
    
    try {
      const targetUrl = value || xpath.value || '';
      if (!targetUrl) {
        return {
          success: false,
          errorMessage: '変更先のURLが指定されていません',
          logs
        };
      }

      logs.push(`Change URL action: target="${targetUrl}"`);
      logs.push(`Current URL: "${window.location.href}"`);

      // URLの妥当性をチェック
      if (!this.isValidUrl(targetUrl)) {
        return {
          success: false,
          errorMessage: `無効なURLです: ${targetUrl}`,
          logs
        };
      }

      // 現在のURLと同じ場合はスキップ
      if (window.location.href === targetUrl) {
        logs.push('Target URL is same as current URL, skipping');
        return { success: true, logs };
      }

      // URL変更実行
      window.location.href = targetUrl;
      logs.push(`URL changed to: "${targetUrl}"`);

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

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      // 相対URLの場合もチェック
      try {
        new URL(url, window.location.origin);
        return true;
      } catch {
        return false;
      }
    }
  }
}
