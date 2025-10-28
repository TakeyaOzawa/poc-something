/* eslint-disable max-lines-per-function -- Coordinator orchestrates multiple managers and handles complex initialization flow with tab management, navigation bar setup, and settings loading. Breaking it down would fragment the orchestration logic. */
/**
 * Presentation Layer: System Settings Coordinator
 * Orchestrates the unified system settings interface with tabs, managers, and navigation
 *
 * @coverage 0% - DOM-heavy UI component requiring E2E testing
 */

import { TabManager } from '@presentation/components/TabManager';
import { UnifiedNavigationBar } from '@presentation/common/UnifiedNavigationBar';
import { I18nAdapter } from '@infrastructure/adapters/I18nAdapter';
import { formatDateForFilename } from '@utils/dateFormatter';
import {
  CSVFormatDetectorService,
  type CSVFormat,
} from '@domain/services/CSVFormatDetectorService';
import type { SystemSettingsCoordinatorDependencies } from '../types/system-settings.types';

/**
 * SystemSettingsCoordinator - Main coordinator for system settings page
 *
 * Responsibilities:
 * - Initialize and manage tab navigation
 * - Coordinate with managers (General, Recording, Appearance, DataSync)
 * - Handle URL hash-based navigation
 * - Setup unified navigation bar with export/import
 * - Load and display all settings
 */
export class SystemSettingsCoordinator {
  private tabManager!: TabManager;
  private readonly dependencies: SystemSettingsCoordinatorDependencies;

  constructor(dependencies: SystemSettingsCoordinatorDependencies) {
    this.dependencies = dependencies;
  }

  /**
   * Initialize the coordinator
   * Main entry point called from index.ts
   */
  public async initialize(): Promise<void> {
    try {
      this.initializeTabs();
      this.initializeNavigationBar();
      await this.loadAndDisplaySettings();
      this.dependencies.logger.info('System Settings initialized');
    } catch (error) {
      this.dependencies.logger.error('Failed to initialize system settings', error);
      alert(
        I18nAdapter.format(
          'settingsInitFailed',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
    }
  }

  /**
   * Initialize tab controller and register all tabs
   */
  private initializeTabs(): void {
    const tabContainer = document.querySelector('.tab-header');
    const contentContainer = document.querySelector('.settings-container');

    if (!tabContainer || !contentContainer) {
      this.dependencies.logger.error('Tab container elements not found');
      return;
    }

    this.tabManager = new TabManager(tabContainer as HTMLElement, contentContainer as HTMLElement);

    // Register tabs
    this.registerTab('general');
    this.registerTab('recording');
    this.registerTab('appearance');
    this.registerTab('permissions');
    this.registerTab('data-sync');

    // Set default tab
    const defaultTab = this.getTabFromHash() || 'general';
    this.tabManager.switchTo(defaultTab);

    // Handle hash changes for navigation
    window.addEventListener('hashchange', () => this.handleHashChange());

    // Listen for tab changes to update URL hash and load data
    contentContainer.addEventListener('tabchange', ((event: CustomEvent) => {
      const tabId = event.detail.tabId;
      if (window.location.hash !== `#${tabId}`) {
        window.location.hash = `#${tabId}`;
      }

      // Load permission cards when switching to permissions tab
      if (tabId === 'permissions') {
        this.dependencies.permissionsSettingsManager.renderPermissionCards();
      }

      // Load data sync cards when switching to data-sync tab
      if (tabId === 'data-sync') {
        this.dependencies.dataSyncManager.renderDataSyncCards();
      }
    }) as EventListener);
  }

  /**
   * Register a tab with the tab controller
   */
  private registerTab(tabId: string): void {
    const tabButton = document.querySelector(`[data-tab-id="${tabId}"]`) as HTMLElement;
    const contentElement = document.getElementById(`${tabId}-tab`) as HTMLElement;

    if (tabButton && contentElement) {
      this.tabManager.registerTab(tabId, tabButton, contentElement);
    } else {
      this.dependencies.logger.warn(`Tab elements not found for tab ID: ${tabId}`);
    }
  }

  /**
   * Get tab ID from URL hash
   */
  private getTabFromHash(): string | null {
    const hash = window.location.hash.slice(1); // Remove '#'
    return hash || null;
  }

  /**
   * Handle URL hash changes
   */
  private handleHashChange(): void {
    const tabId = this.getTabFromHash();
    if (tabId && this.tabManager.hasTab(tabId)) {
      this.tabManager.switchTo(tabId);
    }
  }

  /**
   * Get active tab ID
   */
  public getActiveTab(): string | null {
    return this.tabManager.getActiveTab();
  }

  /**
   * Switch to a specific tab programmatically
   */
  public switchToTab(tabId: string): void {
    this.tabManager.switchTo(tabId);
  }

  /**
   * Initialize unified navigation bar with export/import functionality
   */
  private initializeNavigationBar(): void {
    const unifiedNavBar = document.getElementById('unifiedNavBar') as HTMLDivElement;
    if (unifiedNavBar) {
      new UnifiedNavigationBar(unifiedNavBar, {
        title: I18nAdapter.getMessage('systemSettings') || '⚙️ システム設定',
        onExportXPaths: async () => {
          const { csv } = await this.dependencies.exportXPathsUseCase.execute();
          this.downloadFile(csv, `xpaths_${formatDateForFilename()}.csv`, 'text/csv');
        },
        onExportWebsites: async () => {
          const { csvText } = await this.dependencies.exportWebsitesUseCase.execute();
          this.downloadFile(csvText || '', `websites_${formatDateForFilename()}.csv`, 'text/csv');
        },
        onExportAutomationVariables: async () => {
          const { csvText } = await this.dependencies.exportAutomationVariablesUseCase.execute();
          this.downloadFile(
            csvText,
            `automation-variables_${formatDateForFilename()}.csv`,
            'text/csv'
          );
        },
        onExportSystemSettings: async () => {
          const csv = await this.dependencies.presenter.exportSettings();
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
   * Load and display all settings in their respective tabs
   */
  private async loadAndDisplaySettings(): Promise<void> {
    // Load all settings with retry
    await this.loadAllSettingsWithRetry();

    // Load settings into form fields after presenter loads them
    const settings = this.dependencies.presenter.getSettings();
    if (settings) {
      const allSettings = settings.getAll();
      this.dependencies.generalSettingsManager.loadSettings(allSettings);
      this.dependencies.recordingSettingsManager.loadSettings(allSettings);
      this.dependencies.appearanceSettingsManager.loadSettings(allSettings);
    }

    // Render data sync cards if on that tab
    const currentTab = this.getTabFromHash();
    if (currentTab === 'data-sync') {
      await this.dependencies.dataSyncManager.renderDataSyncCards();
    }
  }

  /**
   * Handle import from UnifiedNavigationBar
   */
  private async handleImport(file: File, format: CSVFormat): Promise<void> {
    // System settings screen doesn't support CSV import
    // Different formats should be imported from their respective screens
    const formatName = CSVFormatDetectorService.isValidFormat(format)
      ? CSVFormatDetectorService.getFormatName(format)
      : 'Unknown';
    throw new Error(
      `Cannot import ${formatName} from System Settings screen. Please use the appropriate screen (XPath Manager, Automation Variables, etc.).`
    );
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
   * Load all settings with retry mechanism
   */
  private async loadAllSettingsWithRetry(retries: number = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        if (i > 0) {
          this.dependencies.logger.warn(`Retrying settings load (attempt ${i + 1}/${retries})`);
          await new Promise((resolve) => setTimeout(resolve, 100 * i));
        }

        await this.dependencies.presenter.loadAllSettings();
        return;
      } catch (error) {
        if (i === retries - 1) {
          throw error;
        }
        this.dependencies.logger.warn(`Failed to load settings on attempt ${i + 1}`, { error });
      }
    }
  }
}
