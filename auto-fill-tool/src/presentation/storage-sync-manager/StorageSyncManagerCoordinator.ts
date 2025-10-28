/* eslint-disable max-lines-per-function -- Coordinator orchestrates multiple components and handles complex initialization flow with UnifiedNavigationBar setup, gradient background application, and tab management. Breaking it down would fragment the orchestration logic. */
/**
 * Presentation Layer: Storage Sync Manager Coordinator
 * Orchestrates the Storage Sync Manager interface initialization
 */

import { UnifiedNavigationBar } from '@presentation/common/UnifiedNavigationBar';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';
import type { StorageSyncManagerCoordinatorDependencies } from '../types/storage-sync-manager.types';

/**
 * StorageSyncManagerCoordinator - Main coordinator for Storage Sync Manager page
 *
 * Responsibilities:
 * - Apply gradient background from settings
 * - Initialize UnifiedNavigationBar with export/import operations
 * - Initialize tab switching
 * - Coordinate initial setup
 */
export class StorageSyncManagerCoordinator {
  private readonly dependencies: StorageSyncManagerCoordinatorDependencies;

  constructor(dependencies: StorageSyncManagerCoordinatorDependencies) {
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

      // Initialize tab management
      this.initializeTabs();

      this.dependencies.logger.info('Storage Sync Manager Coordinator initialized');
    } catch (error) {
      this.dependencies.logger.error(
        'Failed to initialize Storage Sync Manager Coordinator',
        error
      );
      throw error;
    }
  }

  /**
   * Initialize UnifiedNavigationBar with export/import handlers
   */
  private initializeNavigationBar(unifiedNavBar: HTMLDivElement): void {
    new UnifiedNavigationBar(unifiedNavBar, {
      title: I18nAdapter.getMessage('storageSyncConfigs') || '🔄 ストレージ同期管理',
      onExportXPaths: async () => {
        const result = await this.dependencies.exportXPathsUseCase.execute();
        this.dependencies.downloadFile(
          result.csv,
          `xpaths_${this.formatDateForFilename()}.csv`,
          'text/csv'
        );
      },
      onExportWebsites: async () => {
        const result = await this.dependencies.exportWebsitesUseCase.execute();
        if (result.success && result.csvText) {
          this.dependencies.downloadFile(
            result.csvText,
            `websites_${this.formatDateForFilename()}.csv`,
            'text/csv'
          );
        }
      },
      onExportAutomationVariables: async () => {
        const result = await this.dependencies.exportAutomationVariablesUseCase.execute();
        this.dependencies.downloadFile(
          result.csvText,
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
   * Initialize tab management
   */
  private initializeTabs(): void {
    const { historyTabBtn, configTabBtn, onHistoryTabClick, onConfigTabClick } =
      this.dependencies.tabs;

    if (historyTabBtn) {
      historyTabBtn.addEventListener('click', () => {
        this.dependencies.logger.debug('History tab clicked');
        onHistoryTabClick();
      });
    }

    if (configTabBtn) {
      configTabBtn.addEventListener('click', () => {
        this.dependencies.logger.debug('Config tab clicked');
        onConfigTabClick();
      });
    }

    this.dependencies.logger.debug('Tab management initialized');
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
   * Apply gradient background to storage-sync-manager body
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
   * Format current date for filename
   */
  private formatDateForFilename(): string {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  }
}
