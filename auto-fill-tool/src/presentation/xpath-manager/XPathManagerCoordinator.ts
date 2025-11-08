/* eslint-disable max-lines-per-function -- Coordinator orchestrates multiple components and handles complex initialization flow with UnifiedNavigationBar setup, gradient background application, and export/import operations. Breaking it down would fragment the orchestration logic. */
/**
 * Presentation Layer: XPath Manager Coordinator
 * Orchestrates the XPath Manager interface initialization
 */

import { UnifiedNavigationBar } from '@presentation/common/UnifiedNavigationBar';
import { BaseCoordinator } from '@presentation/common/BaseCoordinator';
import { DateFormatterService } from '@domain/services/DateFormatterService';
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
export class XPathManagerCoordinator extends BaseCoordinator {
  private readonly dependencies: XPathManagerCoordinatorDependencies;
  private readonly dateFormatter: DateFormatterService;
  private unifiedNavBar?: UnifiedNavigationBar;

  constructor(dependencies: XPathManagerCoordinatorDependencies) {
    super(dependencies.logger);
    this.dependencies = dependencies;
    this.dateFormatter = new DateFormatterService();
  }

  /**
   * Specific initialization logic for XPath Manager coordinator
   */
  protected async doInitialize(unifiedNavBar: HTMLDivElement): Promise<void> {
    // Apply gradient background with retry
    await this.applyGradientBackgroundWithRetry();

    // Initialize unified navigation bar
    this.initializeNavigationBar(unifiedNavBar);

    this.logger.info('XPath Manager Coordinator initialized');
  }

  /**
   * Cleanup navigation bar
   */
  protected doCleanup(): void {
    if (this.unifiedNavBar) {
      // UnifiedNavigationBar cleanup if it has cleanup method
      this.unifiedNavBar = undefined;
    }
    super.doCleanup();
  }

  /**
   * Initialize UnifiedNavigationBar with export/import handlers
   */
  private initializeNavigationBar(unifiedNavBar: HTMLDivElement): void {
    this.unifiedNavBar = new UnifiedNavigationBar(unifiedNavBar, {
      title: I18nAdapter.getMessage('xpathManagementTitle') || '🔍 XPath管理',
      onExportXPaths: async () => {
        try {
          const csv = await this.dependencies.presenter.exportXPaths();
          this.dependencies.downloadFile(
            csv,
            `xpaths_${this.dateFormatter.formatForFilename()}.csv`,
            'text/csv'
          );
        } catch (error) {
          this.handleError(error as Error);
        }
      },
      onExportWebsites: async () => {
        try {
          const csv = await this.dependencies.presenter.exportWebsites();
          this.dependencies.downloadFile(
            csv,
            `websites_${this.dateFormatter.formatForFilename()}.csv`,
            'text/csv'
          );
        } catch (error) {
          this.handleError(error as Error);
        }
      },
      onExportAutomationVariables: async () => {
        try {
          const csv = await this.dependencies.presenter.exportAutomationVariables();
          this.dependencies.downloadFile(
            csv,
            `automation-variables_${this.dateFormatter.formatForFilename()}.csv`,
            'text/csv'
          );
        } catch (error) {
          this.handleError(error as Error);
        }
      },
      onExportSystemSettings: async () => {
        try {
          const result = await this.dependencies.exportSystemSettingsUseCase.execute();
          if (result.isFailure) {
            throw new Error(`Failed to export system settings: ${result.error?.message}`);
          }
          const csv = result.value!;
          this.dependencies.downloadFile(
            csv,
            `system_settings_${this.dateFormatter.formatForFilename()}.csv`,
            'text/csv'
          );
        } catch (error) {
          this.handleError(error as Error);
        }
      },
      onExportStorageSyncConfigs: async () => {
        try {
          const csv = await this.dependencies.exportStorageSyncConfigsUseCase.execute();
          this.dependencies.downloadFile(
            csv,
            `storage-sync-configs_${this.dateFormatter.formatForFilename()}.csv`,
            'text/csv'
          );
        } catch (error) {
          this.handleError(error as Error);
        }
      },
      onImport: async (file, format) => {
        try {
          const text = await file.text();
          await this.dependencies.presenter.importData(text, format);
          await this.dependencies.onImportComplete();
        } catch (error) {
          this.handleError(error as Error);
        }
      },
      logger: this.logger.createChild('UnifiedNavBar'),
    });

    this.logger.debug('UnifiedNavigationBar initialized');
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
   * Apply custom gradient background to xpath-manager body
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
}
