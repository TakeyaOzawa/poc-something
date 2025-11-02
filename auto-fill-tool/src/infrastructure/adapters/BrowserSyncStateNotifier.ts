/**
 * Infrastructure Adapter: Browser Sync State Notifier
 * Broadcasts sync state changes to UI via Chrome runtime messaging
 *
 * @coverage 84.21%
 * @reason テストカバレッジが低い理由:
 * - browser.runtime.sendMessage()のエラーハンドリングにおいて、
 *   特定のエラーメッセージ（'Could not establish connection'）を含むかどうかの
 *   条件分岐があり、この特定のエラーシナリオを再現するのは困難
 * - UIリスナーが存在しない場合のエラー処理パスと、
 *   その他の通信エラーのパスを区別してテストするには、
 *   Chrome拡張機能のメッセージング環境の正確なモックが必要
 * - 現在のテストでは主要な状態更新フローをカバーしており、
 *   特定のエラーケースの完全なカバレッジには追加実装が必要
 */

import { SyncState } from '@domain/entities/SyncState';
import { SyncStateNotifier } from '@domain/types/sync-state-notifier.types';
import { Logger } from '@domain/types/logger.types';
import browser from 'webextension-polyfill';

export interface SyncStateChangeEvent {
  type: 'syncStateChanged';
  state: {
    configId: string;
    storageKey: string;
    status: string;
    progress: number;
    currentStep: string;
    elapsedTime: number;
    error?: string;
  };
}

/**
 * BrowserSyncStateNotifier Implementation
 * Uses browser runtime messaging to notify UI
 */
export class BrowserSyncStateNotifier implements SyncStateNotifier {
  private currentState: SyncState | null = null;

  constructor(private logger: Logger) {}

  /**
   * Initialize a new sync state
   */
  initialize(state: SyncState): void {
    this.currentState = state;
    this.notifyStateChange(state);
    this.logger.debug('Sync state initialized', {
      configId: state.getConfigId(),
      totalSteps: state.getTotalSteps(),
    });
  }

  /**
   * Update current sync state
   */
  update(updateFn: (state: SyncState) => void): void {
    if (!this.currentState) {
      this.logger.warn('Cannot update sync state: no active state');
      return;
    }

    updateFn(this.currentState);
    this.notifyStateChange(this.currentState);
  }

  /**
   * Get current sync state
   */
  getCurrentState(): SyncState | null {
    return this.currentState;
  }

  /**
   * Clear current sync state
   */
  clear(): void {
    this.currentState = null;
    this.logger.debug('Sync state cleared');
  }

  /**
   * Notify UI about state change via browser runtime messaging
   */
  private notifyStateChange(state: SyncState): void {
    const stateData: SyncStateChangeEvent['state'] = {
      configId: state.getConfigId(),
      storageKey: state.getStorageKey(),
      status: state.getStatus(),
      progress: state.getProgress(),
      currentStep: state.getCurrentStep(),
      elapsedTime: state.getElapsedTime(),
    };

    const error = state.getError();
    if (error !== undefined) {
      stateData.error = error;
    }

    const event: SyncStateChangeEvent = {
      type: 'syncStateChanged',
      state: stateData,
    };

    // Broadcast to all tabs
    browser.runtime
      .sendMessage(event)
      .then(() => {
        this.logger.debug('Sync state change notified', {
          configId: state.getConfigId(),
          status: state.getStatus(),
          progress: state.getProgress(),
        });
      })
      .catch((error) => {
        // Ignore errors when no listeners are present
        if (error.message?.includes('Could not establish connection')) {
          // This is expected when no UI is open
          return;
        }
        this.logger.warn('Failed to notify sync state change', { error: error.message });
      });
  }

  /**
   * Helper: Update status and notify
   */
  updateStatus(status: SyncState['data']['status']): void {
    this.update((state) => state.setStatus(status));
  }

  /**
   * Helper: Update current step and notify
   */
  updateCurrentStep(step: string): void {
    this.update((state) => {
      state.setCurrentStep(step);
      state.incrementCompletedSteps();
    });
  }

  /**
   * Helper: Update receive progress and notify
   */
  updateReceiveProgress(
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    currentStep: number,
    totalSteps: number,
    error?: string
  ): void {
    this.update((state) => {
      const progressData: {
        status: 'pending' | 'in_progress' | 'completed' | 'failed';
        currentStep: number;
        totalSteps: number;
        error?: string;
      } = {
        status,
        currentStep,
        totalSteps,
      };

      if (error !== undefined) {
        progressData.error = error;
      }

      state.setReceiveProgress(progressData);
    });
  }

  /**
   * Helper: Update send progress and notify
   */
  updateSendProgress(
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    currentStep: number,
    totalSteps: number,
    error?: string
  ): void {
    this.update((state) => {
      const progressData: {
        status: 'pending' | 'in_progress' | 'completed' | 'failed';
        currentStep: number;
        totalSteps: number;
        error?: string;
      } = {
        status,
        currentStep,
        totalSteps,
      };

      if (error !== undefined) {
        progressData.error = error;
      }

      state.setSendProgress(progressData);
    });
  }

  /**
   * Helper: Complete sync and notify
   */
  complete(): void {
    this.update((state) => state.complete());
  }

  /**
   * Helper: Fail sync and notify
   */
  fail(error: string): void {
    this.update((state) => state.fail(error));
  }
}
