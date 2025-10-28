/**
 * Content Script Presenter Implementation
 * Business logic for progress tracking and overlay management
 */

import type {
  ContentScriptPresenter as ContentScriptPresenterInterface,
  ContentScriptPresenterDependencies,
  ContentScriptView,
} from '../types/content-script.types';
import type { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import type { Logger } from '@domain/types/logger.types';

/**
 * AutoFillToolContentScriptPresenter - Presenter layer for content script MVP
 *
 * Responsibilities:
 * - Manage manual execution state (progress tracking)
 * - Load settings and determine overlay visibility
 * - Coordinate progress updates with view
 * - Set up watchdog timer for stalled executions
 * - Dispatch custom events for progress updates
 */
export class AutoFillToolContentScriptPresenter implements ContentScriptPresenterInterface {
  private readonly view: ContentScriptView;
  private readonly systemSettingsRepository: SystemSettingsRepository;
  private readonly logger: Logger;

  // Manual execution state
  private isManualExecutionInProgress = false;
  private hasCheckedSettings = false;
  private shouldShowOverlay = false;
  private lastProgressUpdateTime = 0;
  private progressTimeoutId: number | null = null;

  constructor(dependencies: ContentScriptPresenterDependencies) {
    this.view = dependencies.view;
    this.systemSettingsRepository = dependencies.systemSettingsRepository;
    this.logger = dependencies.logger;
  }

  /**
   * Handle progress update from background script
   * @param current - Current step number
   * @param total - Total number of steps
   * @param description - Optional description of current step
   */
  public async handleProgressUpdate(
    current: number,
    total: number,
    description?: string
  ): Promise<void> {
    // Update last progress time for watchdog
    this.lastProgressUpdateTime = Date.now();

    // Handle first progress update (load settings and show overlay)
    if (!this.isManualExecutionInProgress) {
      await this.handleFirstProgressUpdate(current, total, description);
    } else if (this.hasCheckedSettings && this.shouldShowOverlay) {
      // Update overlay for subsequent progress updates
      this.updateOverlayProgress(current, total, description);
    }

    // Check if execution is complete
    if (current >= total) {
      this.handleExecutionComplete();
    }

    // Dispatch custom event for external listeners
    this.view.dispatchProgressEvent(current, total, description);
  }

  /**
   * Reset manual execution state
   * Called when execution completes or is cancelled
   */
  public resetManualExecution(): void {
    this.logger.info('Resetting manual execution state');

    if (this.shouldShowOverlay) {
      this.view.hideOverlay();
    }

    this.isManualExecutionInProgress = false;
    this.hasCheckedSettings = false;
    this.shouldShowOverlay = false;
    this.lastProgressUpdateTime = 0;

    if (this.progressTimeoutId !== null) {
      clearTimeout(this.progressTimeoutId);
      this.progressTimeoutId = null;
    }
  }

  /**
   * Clean up resources (timers, etc.)
   * Called when content script is unloaded
   */
  public cleanup(): void {
    if (this.progressTimeoutId !== null) {
      clearTimeout(this.progressTimeoutId);
      this.progressTimeoutId = null;
    }
  }

  /**
   * Handle first progress update
   * Load settings and determine whether to show overlay
   */
  private async handleFirstProgressUpdate(
    current: number,
    total: number,
    description?: string
  ): Promise<void> {
    this.isManualExecutionInProgress = true;
    this.hasCheckedSettings = false;

    try {
      // Load settings to determine overlay visibility
      const settingsResult = await this.systemSettingsRepository.load();
      if (settingsResult.isFailure) {
        throw new Error(`Failed to load system settings: ${settingsResult.error?.message}`);
      }
      const settings = settingsResult.value!;
      const dialogMode = settings.getAutoFillProgressDialogMode();
      this.shouldShowOverlay = dialogMode !== 'hidden';

      this.logger.info('Manual execution started, autoFillProgressDialogMode:', {
        dialogMode,
        shouldShowOverlay: this.shouldShowOverlay,
      });

      if (this.shouldShowOverlay) {
        const showCancelButton = dialogMode === 'withCancel';
        this.logger.info('Showing overlay for manual execution', { showCancelButton });

        // Show overlay and update progress
        this.view.showOverlay(showCancelButton);
        this.view.updateProgress(current, total);

        if (description !== undefined) {
          this.view.updateStepDescription(description);
        }
      }

      this.hasCheckedSettings = true;
      this.setupProgressWatchdog();
    } catch (error) {
      this.logger.error('Failed to load settings for manual execution overlay', error);
      this.shouldShowOverlay = false;
      this.hasCheckedSettings = true;
    }
  }

  /**
   * Update overlay progress
   * Called for subsequent progress updates after first update
   */
  private updateOverlayProgress(current: number, total: number, description?: string): void {
    this.view.updateProgress(current, total);

    if (description !== undefined) {
      this.view.updateStepDescription(description);
    }

    // Reset watchdog timer
    this.setupProgressWatchdog();
  }

  /**
   * Handle execution complete
   * Hide overlay after a short delay
   */
  private handleExecutionComplete(): void {
    this.logger.info('Auto-fill execution complete, hiding overlay');

    if (this.shouldShowOverlay) {
      // Add a short delay before hiding overlay to allow user to see completion
      setTimeout(() => {
        this.resetManualExecution();
      }, 500);
    } else {
      this.resetManualExecution();
    }
  }

  /**
   * Set up a watchdog to detect stalled auto-fill
   * If no progress updates for 10 seconds, assume execution finished or failed
   */
  private setupProgressWatchdog(): void {
    // Clear existing timeout
    if (this.progressTimeoutId !== null) {
      clearTimeout(this.progressTimeoutId);
    }

    // Set new timeout
    this.progressTimeoutId = window.setTimeout(() => {
      const timeSinceLastUpdate = Date.now() - this.lastProgressUpdateTime;

      if (timeSinceLastUpdate >= 10000 && this.isManualExecutionInProgress) {
        this.logger.warn(
          'No progress updates for 10 seconds, assuming auto-fill finished or failed'
        );
        this.resetManualExecution();
      }
    }, 10000);
  }
}
