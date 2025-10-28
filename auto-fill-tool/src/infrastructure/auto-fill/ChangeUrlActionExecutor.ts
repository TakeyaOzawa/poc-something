/**
 * Change URL Action Executor
 * Handles CHANGE_URL action execution (page navigation)
 *
 * @coverage 78.33%
 * @reason テストカバレッジが低い理由:
 * - waitForPageLoad メソッドがPromise、タイマー、イベントリスナーを組み合わせた
 *   複雑な非同期処理を含み、全ての分岐（キャンセル、タイムアウト、正常完了）を
 *   正確にテストするには高度な時間制御とモックが必要
 * - browser.tabs APIの動作（tabs.update、tabs.onUpdatedイベント）を
 *   完全にモックするのは困難で、特にイベントリスナーの追加・削除と
 *   cleanup ロジックのテストは複雑
 * - 100msごとのキャンセルチェックと30秒のタイムアウト処理を含む
 *   タイミング依存のロジックは、テスト環境での再現が難しい
 */

import browser from 'webextension-polyfill';
import { ActionExecutor, ActionExecutionResult } from '../../domain/types/action.types';
import { Logger } from '@domain/types/logger.types';

export class ChangeUrlActionExecutor implements ActionExecutor {
  constructor(private logger: Logger) {}

  /**
   * Execute change URL action logic (extracted for testing)
   * This is a simple validation method since URL changes are handled by browser API
   */
  executeChangeUrlAction(url: string): ActionExecutionResult {
    if (!url || url.trim() === '') {
      return { success: false, message: 'URL is required' };
    }

    try {
      // Basic URL validation
      new URL(url);
      return { success: true, message: `URL validated: ${url}` };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Invalid URL',
      };
    }
  }

  // eslint-disable-next-line max-params
  async execute(
    tabId: number,
    _xpath: string, // Not used for URL change
    url: string, // The value parameter contains the URL
    _actionPattern: number, // Not used for URL change
    _stepNumber: number,
    _actionType?: string,
    getCancellationStatus?: () => boolean
  ): Promise<ActionExecutionResult> {
    try {
      this.logger.info(`Changing URL to: ${url}`);

      // Validate URL first
      const validation = this.executeChangeUrlAction(url);
      if (!validation.success) {
        return validation;
      }

      // Navigate to the URL
      await browser.tabs.update(tabId, { url });

      // Wait for page to load with cancellation support
      const loadResult = await this.waitForPageLoad(tabId, getCancellationStatus);

      if (loadResult.cancelled) {
        this.logger.info('URL change cancelled by user during page load');
        return { success: false, message: 'Auto-fill cancelled by user' };
      }

      if (!loadResult.success) {
        this.logger.warn('Page load timeout or failed');
        return { success: false, message: 'Page load timeout after 30 seconds' };
      }

      this.logger.info(`URL changed successfully to: ${url}`);
      return { success: true, message: `Navigated to ${url}` };
    } catch (error) {
      this.logger.error('Change URL error', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private waitForPageLoad(
    tabId: number,
    getCancellationStatus?: () => boolean
  ): Promise<{ success: boolean; cancelled: boolean }> {
    return new Promise((resolve) => {
      const MAX_WAIT_TIME = 30000; // 30 seconds timeout
      const CHECK_INTERVAL = 100; // Check cancellation every 100ms
      let elapsed = 0;
      let checkInterval: NodeJS.Timeout | null = null;
      let listenerAdded = false;

      const cleanup = () => {
        if (checkInterval) {
          clearInterval(checkInterval);
          checkInterval = null;
        }
        if (listenerAdded) {
          browser.tabs.onUpdated.removeListener(listener);
          listenerAdded = false;
        }
      };

      // Periodically check for cancellation and timeout
      checkInterval = setInterval(() => {
        // Check if cancelled
        if (getCancellationStatus && getCancellationStatus()) {
          cleanup();
          resolve({ success: false, cancelled: true });
          return;
        }

        // Check if timeout exceeded
        elapsed += CHECK_INTERVAL;
        if (elapsed >= MAX_WAIT_TIME) {
          cleanup();
          this.logger.warn(`Page load timeout after ${MAX_WAIT_TIME / 1000}s`);
          resolve({ success: false, cancelled: false });
        }
      }, CHECK_INTERVAL);

      const listener = (updatedTabId: number, changeInfo: browser.Tabs.OnUpdatedChangeInfoType) => {
        if (updatedTabId === tabId && changeInfo.status === 'complete') {
          cleanup();
          // Add a small delay to ensure page is fully loaded
          setTimeout(() => resolve({ success: true, cancelled: false }), 1000);
        }
      };

      browser.tabs.onUpdated.addListener(listener);
      listenerAdded = true;
    });
  }
}
