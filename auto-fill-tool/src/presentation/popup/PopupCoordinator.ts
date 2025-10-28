/* eslint-disable max-lines-per-function -- Coordinator orchestrates multiple components and handles complex initialization flow with Alpine.js setup, gradient background application, and Alpine event listeners. Breaking it down would fragment the orchestration logic. */
/**
 * Presentation Layer: Popup Coordinator
 * Orchestrates the popup interface with Alpine.js integration and initialization
 */

import Alpine from '@alpinejs/csp';
import { initPopupAlpine } from './PopupAlpine';
import type { PopupCoordinatorDependencies } from '../types/popup.types';

/**
 * PopupCoordinator - Main coordinator for popup page
 *
 * Responsibilities:
 * - Initialize Alpine.js with CSP compatibility
 * - Apply gradient background from settings
 * - Attach Alpine.js custom event listeners
 * - Coordinate initial data loading
 */
export class PopupCoordinator {
  private readonly dependencies: PopupCoordinatorDependencies;

  constructor(dependencies: PopupCoordinatorDependencies) {
    this.dependencies = dependencies;
  }

  /**
   * Initialize the coordinator
   * Main entry point called from index.ts
   */
  public async initialize(): Promise<void> {
    try {
      // Initialize Alpine.js
      this.initializeAlpine();

      // Apply gradient background with retry
      await this.applyGradientBackgroundWithRetry();

      // Attach Alpine.js custom event listeners
      this.attachAlpineEventListeners();

      this.dependencies.logger.info('Popup Coordinator initialized');
    } catch (error) {
      this.dependencies.logger.error('Failed to initialize Popup Coordinator', error);
      throw error;
    }
  }

  /**
   * Initialize Alpine.js with CSP compatibility
   */
  private initializeAlpine(): void {
    try {
      // Make Alpine available globally for HTML x-data
      window.Alpine = Alpine;

      // Initialize Alpine.js popup component
      initPopupAlpine();

      // Start Alpine.js
      Alpine.start();

      this.dependencies.logger.debug('Alpine.js initialized');
    } catch (error) {
      this.dependencies.logger.error('Failed to initialize Alpine.js', error);
      throw error;
    }
  }

  /**
   * Apply gradient background with retry mechanism
   */
  private async applyGradientBackgroundWithRetry(retries: number = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        // Wait a bit to ensure DOM is fully ready
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 100 * i));
        }

        this.applyGradientBackground();

        // Verify that the style was applied
        const currentBg = document.body.style.background;
        if (currentBg && currentBg.includes('linear-gradient')) {
          this.dependencies.logger.debug(
            `Gradient background applied successfully on attempt ${i + 1}`
          );
          return;
        }
      } catch (error) {
        this.dependencies.logger.warn(
          `Failed to apply gradient background on attempt ${i + 1}`,
          error as Error
        );
      }
    }

    this.dependencies.logger.error('Failed to apply gradient background after all retries');
  }

  /**
   * Apply gradient background to popup body
   */
  private applyGradientBackground(): void {
    try {
      const settings = this.dependencies.settings;
      const startColor = settings.getGradientStartColor();
      const endColor = settings.getGradientEndColor();
      const angle = settings.getGradientAngle();

      const gradient = `linear-gradient(${angle}deg, ${startColor} 0%, ${endColor} 100%)`;
      document.body.style.background = gradient;

      this.dependencies.logger.debug('Applied gradient background', {
        startColor,
        endColor,
        angle,
      });
    } catch (error) {
      this.dependencies.logger.error('Failed to apply gradient background', error);
    }
  }

  /**
   * Attach event listeners for Alpine.js custom events
   */
  private attachAlpineEventListeners(): void {
    // Handle website actions from Alpine.js (execute, edit, delete)
    window.addEventListener('websiteAction', async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { action, id } = customEvent.detail;

      this.dependencies.logger.info('Alpine.js website action', { action, id });

      if (action === 'execute' || action === 'edit' || action === 'delete') {
        await this.dependencies.websiteListPresenter.handleWebsiteAction(action, id);
      }
    });

    // Handle data sync request from Alpine.js
    window.addEventListener('dataSyncRequest', async () => {
      this.dependencies.logger.info('Alpine.js data sync request received');
      await this.dependencies.onDataSyncRequest();
    });

    this.dependencies.logger.debug('Alpine.js event listeners attached');
  }
}
