/* eslint-disable max-lines-per-function -- Coordinator orchestrates multiple components and handles complex initialization flow with Alpine.js setup, gradient background application, and Alpine event listeners. Breaking it down would fragment the orchestration logic. */
/**
 * Presentation Layer: Popup Coordinator
 * Orchestrates the popup interface with Alpine.js integration and initialization
 */

import Alpine from '@alpinejs/csp';
import { initPopupAlpine } from './PopupAlpine';
import { BaseCoordinator } from '@presentation/common/BaseCoordinator';
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
export class PopupCoordinator extends BaseCoordinator {
  private readonly dependencies: PopupCoordinatorDependencies;

  constructor(dependencies: PopupCoordinatorDependencies) {
    super(dependencies.logger);
    this.dependencies = dependencies;
  }

  /**
   * Specific initialization logic for popup coordinator
   */
  protected async doInitialize(): Promise<void> {
    // Initialize Alpine.js
    this.initializeAlpine();

    // Apply gradient background with retry
    await this.applyGradientBackgroundWithRetry();

    // Attach Alpine.js custom event listeners
    this.attachAlpineEventListeners();

    this.logger.info('Popup Coordinator initialized');
  }

  /**
   * Cleanup Alpine.js and event listeners
   */
  protected doCleanup(): void {
    // Remove Alpine.js event listeners
    window.removeEventListener('websiteAction', this.handleWebsiteAction);
    window.removeEventListener('dataSyncRequest', this.handleDataSyncRequest);

    super.doCleanup();
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

      this.logger.debug('Alpine.js initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Alpine.js', error);
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

        this.applyCustomGradientBackground();

        // Verify that the style was applied
        const currentBg = document.body.style.background;
        if (currentBg && currentBg.includes('linear-gradient')) {
          this.logger.debug(`Gradient background applied successfully on attempt ${i + 1}`);
          return;
        }
      } catch (error) {
        this.logger.warn(`Failed to apply gradient background on attempt ${i + 1}`, error as Error);
      }
    }

    this.logger.error('Failed to apply gradient background after all retries');
  }

  /**
   * Apply custom gradient background to popup body
   */
  private applyCustomGradientBackground(): void {
    try {
      const settings = this.dependencies.settings;
      const startColor =
        settings.getGradientStartColor?.() || settings.gradientStartColor || '#4F46E5';
      const endColor = settings.getGradientEndColor?.() || settings.gradientEndColor || '#7C3AED';
      const angle = settings.getGradientAngle?.() || settings.gradientAngle || 135;

      const gradient = `linear-gradient(${angle}deg, ${startColor} 0%, ${endColor} 100%)`;
      document.body.style.background = gradient;

      this.logger.debug('Applied gradient background', {
        startColor,
        endColor,
        angle,
      });
    } catch (error) {
      this.logger.error('Failed to apply gradient background', error);
    }
  }

  /**
   * Attach event listeners for Alpine.js custom events
   */
  private attachAlpineEventListeners(): void {
    // Bind event handlers to maintain 'this' context
    this.registerCleanupTask(() => {
      window.removeEventListener('websiteAction', this.handleWebsiteAction);
      window.removeEventListener('dataSyncRequest', this.handleDataSyncRequest);
    });

    window.addEventListener('websiteAction', this.handleWebsiteAction);
    window.addEventListener('dataSyncRequest', this.handleDataSyncRequest);

    this.logger.debug('Alpine.js event listeners attached');
  }

  /**
   * Handle website action events from Alpine.js
   */
  private handleWebsiteAction = async (event: Event): Promise<void> => {
    try {
      const customEvent = event as CustomEvent;
      const { action, id } = customEvent.detail;

      this.logger.info('Alpine.js website action', { action, id });

      if (action === 'execute' || action === 'edit' || action === 'delete') {
        await this.dependencies.websiteListPresenter.handleWebsiteAction(action, id);
      }
    } catch (error) {
      this.handleError(error as Error);
    }
  };

  /**
   * Handle data sync request events from Alpine.js
   */
  private handleDataSyncRequest = async (): Promise<void> => {
    try {
      this.logger.info('Alpine.js data sync request received');
      await this.dependencies.onDataSyncRequest();
    } catch (error) {
      this.handleError(error as Error);
    }
  };
}
