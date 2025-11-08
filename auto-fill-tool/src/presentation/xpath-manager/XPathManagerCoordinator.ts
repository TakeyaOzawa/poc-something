/* eslint-disable max-lines-per-function -- Coordinator orchestrates multiple components and handles complex initialization flow with UnifiedNavigationBar setup, gradient background application, and export/import operations. Breaking it down would fragment the orchestration logic. */
/**
 * Presentation Layer: XPath Manager Coordinator
 * Orchestrates the XPath Manager interface initialization
 */

import { UnifiedNavigationBar } from '@presentation/common/UnifiedNavigationBar';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';
import type { XPathManagerCoordinatorDependencies } from '../types/xpath-manager.types';

/**
 * XPathManagerCoordinator - Main coordinator for XPath Manager page
 *
 * Responsibilities:
 * - Apply gradient background from settings
 * - Initialize UnifiedNavigationBar with export/import operations
 * - Coordinate initial setup
 */
export class XPathManagerCoordinator {
  private readonly dependencies: XPathManagerCoordinatorDependencies;

  constructor(dependencies: XPathManagerCoordinatorDependencies) {
    this.dependencies = dependencies;
  }

  /**
   * Initialize the coordinator
   * Main entry point called from index.ts
   */
  public async initialize(unifiedNavBar: HTMLDivElement): Promise<void> {
    try {
      // Apply gradient background with retry
      await this.applyGradientBackgroundWithRetry();

      // Initialize unified navigation bar
      this.initializeNavigationBar(unifiedNavBar);

      this.dependencies.logger.info('XPath Manager Coordinator initialized');
    } catch (error) {
      this.dependencies.logger.error('Failed to initialize XPath Manager Coordinator', error);
      throw error;
    }
  }

  /**
   * Initialize UnifiedNavigationBar with export/import handlers
   */
  private initializeNavigationBar(unifiedNavBar: HTMLDivElement): void {
    new UnifiedNavigationBar(unifiedNavBar, {
      title: I18nAdapter.getMessage('xpathManagementTitle') || '🔍 XPath管理',
      onExportXPaths: async () => {
        const csv = await this.dependencies.presenter.exportXPaths();
        this.dependencies.downloadFile(
          csv,
          `xpaths_${this.formatDateForFilename()}.csv`,
          'text/csv'
        );
      },
      onExportWebsites: async () => {
        const csv = await this.dependencies.presenter.exportWebsites();
        this.dependencies.downloadFile(
          csv,
          `websites_${this.formatDateForFilename()}.csv`,
          'text/csv'
        );
      },
      onExportAutomationVariables: async () => {
        const csv = await this.dependencies.presenter.exportAutomationVariables();
        this.dependencies.downloadFile(
          csv,
          `automation-variables_${this.formatDateForFilename()}.csv`,
          'text/csv'
        );
      },
      onExportSystemSettings: async () => {
        const result = await this.dependencies.exportSystemSettingsUseCase.execute();
        if (result.isFailure) {
          throw new Error(`Failed to export system settings: ${result.error?.message}`);
        }
        const csv = result.value!;
        this.dependencies.downloadFile(
          csv,
          `system_settings_${this.formatDateForFilename()}.csv`,
          'text/csv'
        );
      },
      onExportStorageSyncConfigs: async () => {
        const csv = await this.dependencies.exportStorageSyncConfigsUseCase.execute();
        this.dependencies.downloadFile(
          csv,
          `storage-sync-configs_${this.formatDateForFilename()}.csv`,
          'text/csv'
        );
      },
      onImport: async (file, format) => {
        const text = await file.text();
        await this.dependencies.presenter.importData(text, format);
        await this.dependencies.onImportComplete();
      },
      logger: this.dependencies.logger.createChild('UnifiedNavBar'),
    });

    this.dependencies.logger.debug('UnifiedNavigationBar initialized');
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
   * Apply gradient background to xpath-manager body
   */
  private applyGradientBackground(): void {
    try {
      const settings = this.dependencies.settings;
      const startColor =
        settings.getGradientStartColor?.() || settings.gradientStartColor || '#4F46E5';
      const endColor = settings.getGradientEndColor?.() || settings.gradientEndColor || '#7C3AED';
      const angle = settings.getGradientAngle?.() || settings.gradientAngle || 135;

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
   * Format current date for filename
   */
  private formatDateForFilename(): string {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  }
}
