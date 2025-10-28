/* eslint-disable max-lines-per-function -- Coordinator orchestrates multiple components and handles complex initialization flow with navigation bar setup, gradient background application, and data loading. Breaking it down would fragment the orchestration logic. */
/**
 * Presentation Layer: AutomationVariables Manager Coordinator
 * Orchestrates the automation variables management interface with navigation and initialization
 *
 * @coverage 0% - DOM-heavy UI component requiring E2E testing
 */

import { UnifiedNavigationBar } from '@presentation/common/UnifiedNavigationBar';
import { I18nAdapter } from '@infrastructure/adapters/I18nAdapter';
import { formatDateForFilename } from '@utils/dateFormatter';
import {
  CSVFormatDetectorService,
  CSV_FORMAT,
  type CSVFormat,
} from '@domain/services/CSVFormatDetectorService';
import type { AutomationVariablesManagerCoordinatorDependencies } from '../types/automation-variables-manager.types';

/**
 * AutomationVariablesManagerCoordinator - Main coordinator for automation variables page
 *
 * Responsibilities:
 * - Initialize unified navigation bar with export/import
 * - Apply gradient background from settings
 * - Load websites and automation variables
 * - Handle file downloads for exports
 */
export class AutomationVariablesManagerCoordinator {
  private readonly dependencies: AutomationVariablesManagerCoordinatorDependencies;

  constructor(dependencies: AutomationVariablesManagerCoordinatorDependencies) {
    this.dependencies = dependencies;
  }

  /**
   * Initialize the coordinator
   * Main entry point called from index.ts
   */
  public async initialize(): Promise<void> {
    try {
      // Apply gradient background with retry
      await this.applyGradientBackgroundWithRetry();

      // Initialize navigation bar
      this.initializeNavigationBar();

      // Load websites and variables
      await this.loadWebsitesAndVariables();

      this.dependencies.logger.info('AutomationVariables Manager initialized');
    } catch (error) {
      this.dependencies.logger.error('Failed to initialize AutomationVariables Manager', error);
      alert(
        I18nAdapter.format(
          'automationVariablesInitFailed',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
    }
  }

  /**
   * Initialize unified navigation bar with export/import functionality
   */
  private initializeNavigationBar(): void {
    const unifiedNavBar = document.getElementById('unifiedNavBar') as HTMLDivElement;
    if (unifiedNavBar) {
      new UnifiedNavigationBar(unifiedNavBar, {
        title: I18nAdapter.getMessage('automationVariablesManagerTitle') || '📋 実行履歴',
        onExportXPaths: async () => {
          const { csv } = await this.dependencies.exportXPathsUseCase.execute();
          this.downloadFile(csv, `xpaths_${formatDateForFilename()}.csv`, 'text/csv');
        },
        onExportWebsites: async () => {
          const { csvText } = await this.dependencies.exportWebsitesUseCase.execute();
          this.downloadFile(csvText || '', `websites_${formatDateForFilename()}.csv`, 'text/csv');
        },
        onExportAutomationVariables: async () => {
          const csv = await this.dependencies.presenter.exportVariables();
          this.downloadFile(csv, `automation-variables_${formatDateForFilename()}.csv`, 'text/csv');
        },
        onExportSystemSettings: async () => {
          const csvResult = await this.dependencies.exportSystemSettingsUseCase.execute();
          if (csvResult.isFailure) {
            throw new Error(`Failed to export system settings: ${csvResult.error?.message}`);
          }
          const csv = csvResult.value!;
          this.downloadFile(csv, `system-settings_${formatDateForFilename()}.csv`, 'text/csv');
        },
        onExportStorageSyncConfigs: async () => {
          const csv = await this.dependencies.exportStorageSyncConfigsUseCase.execute();
          this.downloadFile(csv, `storage-sync-configs_${formatDateForFilename()}.csv`, 'text/csv');
        },
        onImport: async (file: File, format: CSVFormat) => {
          await this.handleImport(file, format);
        },
        logger: this.dependencies.logger.createChild('UnifiedNavBar'),
      });
    }
  }

  /**
   * Load websites and automation variables
   */
  private async loadWebsitesAndVariables(): Promise<void> {
    // Note: Websites are loaded by the Controller's loadWebsites() method
    // Variables are loaded by the Presenter through Controller's loadVariables()
    // This method is a placeholder for future centralized loading if needed
  }

  /**
   * Handle import from UnifiedNavigationBar
   */
  private async handleImport(file: File, format: CSVFormat): Promise<void> {
    // Validate format is Automation Variables
    if (format !== CSV_FORMAT.AUTOMATION_VARIABLES) {
      const expectedFormat = CSVFormatDetectorService.getFormatName(
        CSV_FORMAT.AUTOMATION_VARIABLES
      );
      const detectedFormat = CSVFormatDetectorService.isValidFormat(format)
        ? CSVFormatDetectorService.getFormatName(format)
        : 'Unknown';

      const errorMessage = `Invalid file format. Expected ${expectedFormat}, but got ${detectedFormat}.`;
      this.dependencies.logger.error(errorMessage, {
        expected: expectedFormat,
        detected: detectedFormat,
      });
      alert(I18nAdapter.format('importFailed', errorMessage));
      return;
    }

    const text = await file.text();
    await this.dependencies.presenter.importVariables(text);
    // Note: Controller will call loadVariables() after import
  }

  /**
   * Helper method to download a file
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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
   * Apply gradient background to automation-variables-manager body
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
}
