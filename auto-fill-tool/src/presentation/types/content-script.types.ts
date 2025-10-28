/**
 * Content Script Types
 * Interface definitions for MVP pattern implementation
 */

import type { Logger } from '@domain/types/logger.types';
import type { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';

/**
 * View layer interface - Pure DOM operations
 */
export interface ContentScriptView {
  /**
   * Show the auto-fill overlay
   * @param showCancelButton - Whether to show cancel button
   */
  showOverlay(showCancelButton: boolean): Promise<void>;

  /**
   * Hide the auto-fill overlay
   */
  hideOverlay(): void;

  /**
   * Update progress in the overlay
   * @param current - Current step number
   * @param total - Total number of steps
   */
  updateProgress(current: number, total: number): void;

  /**
   * Update step description in the overlay
   * @param description - Description of current step
   */
  updateStepDescription(description: string): void;

  /**
   * Dispatch custom event for progress update
   * @param current - Current step number
   * @param total - Total number of steps
   * @param description - Optional description
   */
  dispatchProgressEvent(current: number, total: number, description?: string): void;
}

/**
 * Presenter layer interface - Business logic
 */
export interface ContentScriptPresenter {
  /**
   * Handle progress update from background script
   * @param current - Current step number
   * @param total - Total number of steps
   * @param description - Optional description
   */
  handleProgressUpdate(current: number, total: number, description?: string): Promise<void>;

  /**
   * Reset manual execution state
   */
  resetManualExecution(): void;

  /**
   * Clean up resources (timers, etc.)
   */
  cleanup(): void;
}

/**
 * Presenter dependencies
 */
export interface ContentScriptPresenterDependencies {
  view: ContentScriptView;
  systemSettingsRepository: SystemSettingsRepository;
  logger: Logger;
}

/**
 * Coordinator dependencies
 */
export interface ContentScriptCoordinatorDependencies {
  presenter: ContentScriptPresenter;
  logger: Logger;
  onGetXPath: () => Element | null;
  onGetClickPosition: () => { x: number; y: number };
}
