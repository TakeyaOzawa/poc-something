/**
 * Domain Service Interface: Sync State Notifier
 * Broadcasts sync state changes to UI
 *
 * NOTE: This is a port (interface) in Clean Architecture.
 * The actual implementation (adapter) should be in the Infrastructure layer.
 */

import { SyncState } from '@domain/entities/SyncState';

/**
 * SyncStateNotifier Interface
 * Manages sync state notifications to UI
 */
export interface SyncStateNotifier {
  /**
   * Initialize a new sync state
   */
  initialize(state: SyncState): void;

  /**
   * Update current sync state
   */
  update(updateFn: (state: SyncState) => void): void;

  /**
   * Get current sync state
   */
  getCurrentState(): SyncState | null;

  /**
   * Clear current sync state
   */
  clear(): void;

  /**
   * Helper: Update status and notify
   */
  updateStatus(status: SyncState['data']['status']): void;

  /**
   * Helper: Update current step and notify
   */
  updateCurrentStep(step: string): void;

  /**
   * Helper: Update receive progress and notify
   */
  updateReceiveProgress(
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    currentStep: number,
    totalSteps: number,
    error?: string
  ): void;

  /**
   * Helper: Update send progress and notify
   */
  updateSendProgress(
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    currentStep: number,
    totalSteps: number,
    error?: string
  ): void;

  /**
   * Helper: Complete sync and notify
   */
  complete(): void;

  /**
   * Helper: Fail sync and notify
   */
  fail(error: string): void;
}
