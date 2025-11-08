/**
 * Presentation Layer: Data Sync Manager
 * Manages data synchronization cards and operations
 */

import { Logger } from '@domain/types/logger.types';
import { SystemSettingsPresenter } from './SystemSettingsPresenter';
import {
  ListSyncConfigsUseCase,
  ListSyncConfigsOutput,
} from '@usecases/sync/ListSyncConfigsUseCase';
import { I18nAdapter } from '@infrastructure/adapters/I18nAdapter';
import { StorageSyncConfig, SyncDirection, SyncTiming } from '@domain/entities/StorageSyncConfig';
import { StorageSyncConfigOutputDto } from '@application/dtos/StorageSyncConfigOutputDto';
import { TemplateLoader } from '@/presentation/common/TemplateLoader';
import { DataBinder } from '@/presentation/common/DataBinder';

interface StorageKeyConfig {
  key: string;
  icon: string;
  titleKey: string;
}

export class DataSyncManager {
  private syncCardsContainer: HTMLDivElement;
  private syncAllButton: HTMLButtonElement;

  private readonly SYNC_STORAGE_KEYS: StorageKeyConfig[] = [
    { key: 'automationVariables', icon: '📋', titleKey: 'automationVariables' },
    { key: 'websiteConfigs', icon: '🌐', titleKey: 'websiteConfigs' },
    { key: 'xpaths', icon: '🔍', titleKey: 'xpaths' },
    { key: 'systemSettings', icon: '⚙️', titleKey: 'systemSettings' },
    { key: 'storageSyncConfigs', icon: '🔄', titleKey: 'storageSyncConfigs' },
  ];

  constructor(
    private presenter: SystemSettingsPresenter,
    private listSyncConfigsUseCase: ListSyncConfigsUseCase,
    private logger: Logger
  ) {
    this.syncCardsContainer = document.getElementById('syncConfigList') as HTMLDivElement;
    this.syncAllButton = document.getElementById('syncAllBtn') as HTMLButtonElement;

    if (!this.syncCardsContainer) {
      this.logger.error('Sync cards container element not found (id: syncConfigList)');
    }
    if (!this.syncAllButton) {
      this.logger.error('Sync all button element not found (id: syncAllBtn)');
    }

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    this.syncAllButton?.addEventListener('click', () => this.executeAllDataSync());
  }

  /**
   * Render data sync cards for all storage keys
   */
  async renderDataSyncCards(): Promise<void> {
    if (!this.syncCardsContainer) {
      this.logger.error('Cannot render sync cards: container element not found');
      return;
    }

    try {
      const result = await this.listSyncConfigsUseCase.execute({});

      if (!result.success || !result.configs) {
        this.logger.error('Failed to load sync configurations');
        return;
      }

      this.syncCardsContainer.innerHTML = '';

      for (const storageKeyConfig of this.SYNC_STORAGE_KEYS) {
        const config = result.configs.find(
          (c: StorageSyncConfigOutputDto) => c.storageKey === storageKeyConfig.key
        );
        const card = this.createSyncCard(storageKeyConfig, config);
        this.syncCardsContainer.appendChild(card);
      }
    } catch (error) {
      this.logger.error('Failed to render data sync cards', error);
      this.showError(I18nAdapter.getMessage('configurationsLoadFailed'));
    }
  }

  private createSyncCard(
    storageKeyConfig: StorageKeyConfig,
    config?: StorageSyncConfigOutputDto
  ): HTMLDivElement {
    // Load template
    const fragment = TemplateLoader.load('sync-card-template');
    const container = document.createElement('div');
    container.appendChild(fragment);
    const card = container.firstElementChild as HTMLDivElement;

    // Prepare data for binding
    const data = this.prepareSyncCardData(storageKeyConfig, config);

    // Bind data to template
    DataBinder.bind(card, data);
    DataBinder.bindAttributes(card, data);

    // Show/hide sections based on config
    this.toggleCardSections(card, config);

    // Attach event listeners
    this.attachCardEventListeners(card, storageKeyConfig, config);

    return card;
  }

  private prepareSyncCardData(
    storageKeyConfig: StorageKeyConfig,
    config?: StorageSyncConfigOutputDto
  ): Record<string, any> {
    return {
      icon: storageKeyConfig.icon,
      title: I18nAdapter.getMessage(storageKeyConfig.titleKey as any),
      storageKey: storageKeyConfig.key,
      configureHeaderText: I18nAdapter.getMessage('configure'),
      configureTitle: I18nAdapter.getMessage(storageKeyConfig.titleKey as any),
      resultDivId: `sync-result-${storageKeyConfig.key}`,

      // Labels
      syncMethodLabel: I18nAdapter.getMessage('syncMethod'),
      syncTimingLabel: I18nAdapter.getMessage('syncTiming'),
      syncDirectionLabel: I18nAdapter.getMessage('syncDirection'),
      statusLabel: I18nAdapter.getMessage('status'),

      // Values (when configured)
      syncMethod: config
        ? this.formatSyncMethod(config.syncMethod as 'notion' | 'spread-sheet')
        : '',
      syncTiming: config
        ? this.formatSyncTiming(config.syncTiming as SyncTiming, config.syncIntervalSeconds)
        : '',
      syncDirection: config ? this.formatSyncDirection(config.syncDirection as SyncDirection) : '',
      statusText: config
        ? I18nAdapter.getMessage('enabled') // DTOには enabled プロパティがないため、常に有効として扱う
        : '',

      // Empty state
      emptyStateText: I18nAdapter.getMessage('syncNotConfigured'),

      // Button texts
      syncNowText: I18nAdapter.getMessage('syncNow'),
      configureButtonText: config
        ? I18nAdapter.getMessage('editConfig')
        : I18nAdapter.getMessage('createConfig'),
    };
  }

  private toggleCardSections(card: HTMLDivElement, config?: StorageSyncConfigOutputDto): void {
    const configuredSection = card.querySelector('.sync-card-configured') as HTMLDivElement;
    const emptySection = card.querySelector('.sync-card-empty') as HTMLDivElement;
    const syncNowContainer = card.querySelector('.sync-now-button-container') as HTMLDivElement;

    if (config) {
      // Show configured state
      if (configuredSection) configuredSection.style.display = 'grid';
      if (emptySection) emptySection.style.display = 'none';

      // Show sync now button if enabled
      if (syncNowContainer) {
        syncNowContainer.style.display = 'block'; // DTOには enabled プロパティがないため、常に表示
      }
    } else {
      // Show empty state
      if (configuredSection) configuredSection.style.display = 'none';
      if (emptySection) emptySection.style.display = 'block';
      if (syncNowContainer) syncNowContainer.style.display = 'none';
    }
  }

  private attachCardEventListeners(
    card: HTMLDivElement,
    storageKeyConfig: StorageKeyConfig,
    config?: StorageSyncConfigOutputDto
  ): void {
    // Header settings button
    const headerSettingsButton = card.querySelector(
      '.card-header .btn-settings'
    ) as HTMLButtonElement;
    if (headerSettingsButton) {
      headerSettingsButton.addEventListener('click', () => {
        this.openSyncConfigManager(storageKeyConfig.key);
      });
    }

    // Sync now button
    const syncNowButton = card.querySelector('.sync-now-btn') as HTMLButtonElement;
    if (syncNowButton && config) {
      // DTOには enabled プロパティがないため、configがあれば有効として扱う
      syncNowButton.addEventListener('click', () => {
        this.executeSingleSync(storageKeyConfig.key, syncNowButton);
      });
    }

    // Configure button
    const configureButton = card.querySelector('.configure-sync-btn') as HTMLButtonElement;
    if (configureButton) {
      configureButton.addEventListener('click', () => {
        this.openSyncConfigManager(storageKeyConfig.key);
      });
    }
  }

  private formatSyncMethod(method: 'notion' | 'spread-sheet'): string {
    switch (method) {
      case 'notion':
        return I18nAdapter.getMessage('syncMethodNotion') || 'Notion';
      case 'spread-sheet':
        return I18nAdapter.getMessage('syncMethodSpreadsheet') || 'Google Sheets';
      default:
        return method;
    }
  }

  private openSyncConfigManager(storageKey: string): void {
    // Open storage-sync-manager.html in a new tab
    const url = chrome.runtime.getURL(`storage-sync-manager.html?storageKey=${storageKey}`);
    chrome.tabs.create({ url });
    this.logger.info(`Opening sync config manager for storage key: ${storageKey}`);
  }

  private formatSyncTiming(timing: SyncTiming, intervalSeconds?: number): string {
    if (timing === 'manual') {
      return I18nAdapter.getMessage('syncTimingManual');
    } else if (timing === 'periodic' && intervalSeconds) {
      return I18nAdapter.format('syncTimingPeriodic', intervalSeconds.toString());
    }
    return I18nAdapter.getMessage('syncTimingNotSet');
  }

  private formatSyncDirection(direction: SyncDirection): string {
    switch (direction) {
      case 'bidirectional':
        return I18nAdapter.getMessage('syncDirectionBidirectional');
      case 'send_only':
        return I18nAdapter.getMessage('syncDirectionSendOnly');
      case 'receive_only':
        return I18nAdapter.getMessage('syncDirectionReceiveOnly');
      default:
        return direction;
    }
  }

  // eslint-disable-next-line complexity -- Executes sync for storage key and formats result messages based on direction (bidirectional/receive/send). The conditional logic for UI feedback is necessary and clear.
  private async executeSingleSync(storageKey: string, button: HTMLButtonElement): Promise<void> {
    const resultDiv = document.getElementById(`sync-result-${storageKey}`);
    const originalText = button.textContent;

    try {
      button.textContent = I18nAdapter.getMessage('syncing');
      button.disabled = true;

      const result = await this.presenter.executeDataSync();

      if (!result) {
        if (resultDiv) {
          resultDiv.innerHTML = `<span class="sync-status error">${I18nAdapter.getMessage('configNotFound')}</span>`;
        }
        return;
      }

      if (resultDiv) {
        let resultText = '';
        if (result.syncDirection === 'bidirectional') {
          const receivedCount = result.receiveResult?.receivedCount || 0;
          const sentCount = result.sendResult?.sentCount || 0;
          resultText = I18nAdapter.format(
            'syncBidirectionalResult',
            receivedCount.toString(),
            sentCount.toString()
          );
        } else if (result.syncDirection === 'receive_only') {
          const receivedCount = result.receiveResult?.receivedCount || 0;
          resultText = I18nAdapter.format('syncReceiveOnlyResult', receivedCount.toString());
        } else if (result.syncDirection === 'send_only') {
          const sentCount = result.sendResult?.sentCount || 0;
          resultText = I18nAdapter.format('syncSendOnlyResult', sentCount.toString());
        }

        resultDiv.innerHTML = `
          <span class="sync-status success">${I18nAdapter.getMessage('syncSuccess')}</span>
          <span class="sync-details">${resultText}</span>
        `;
      }
    } catch (error) {
      this.logger.error(`Sync failed for ${storageKey}`, error);
      if (resultDiv) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        resultDiv.innerHTML = `
          <span class="sync-status error">${I18nAdapter.format('syncFailed', errorMessage)}</span>
        `;
      }
    } finally {
      button.textContent = originalText || I18nAdapter.getMessage('execute');
      button.disabled = false;
    }
  }

  private async executeAllDataSync(): Promise<void> {
    if (!this.syncAllButton) {
      this.logger.error('Cannot execute all sync: button element not found');
      return;
    }

    const originalText = this.syncAllButton.textContent;

    try {
      this.syncAllButton.textContent = I18nAdapter.getMessage('syncing');
      this.syncAllButton.disabled = true;

      const results = await this.presenter.executeDataSync();

      let message = I18nAdapter.getMessage('syncCompletedAll');
      if (!results.success) {
        message += `\n${I18nAdapter.getMessage('syncFailed')}: ${results.error || 'Unknown error'}`;
        this.showError(message);
      } else {
        this.showSuccess(message);
      }

      // Re-render cards to show updated results
      await this.renderDataSyncCards();
    } catch (error) {
      this.logger.error('Failed to execute all sync', error);
      this.showError(I18nAdapter.getMessage('syncAllFailed'));
    } finally {
      this.syncAllButton.textContent = originalText || 'Sync All';
      this.syncAllButton.disabled = false;
    }
  }

  private showSuccess(message: string): void {
    alert(message); // TODO: Replace with better UI notification
  }

  private showError(message: string): void {
    alert(message); // TODO: Replace with better UI notification
  }
}
