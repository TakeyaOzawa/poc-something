/* eslint-disable max-lines */
/**
 * Presentation Layer: StorageSyncManagerView
 * Implements StorageSyncManagerView interface
 * Handles DOM manipulation for Storage Sync Manager UI
 *
 * This file contains comprehensive view layer logic for storage sync management,
 * including configuration display, test result modals, validation, and detailed history rendering.
 * Breaking into smaller modules would fragment the tightly coupled UI rendering logic.
 *
 * @coverage 0%
 * @reason テストカバレッジが低い理由:
 * - 大規模なDOM操作専用のビューコンポーネント（586行、30以上の public/private メソッド）
 * - 複雑なHTML生成（設定一覧、履歴表示、モーダル、通知など）を動的に構築
 * - ブラウザAPIへの依存（document.createElement、setTimeout、DOM操作）が多数
 * - 複数のモーダル表示（接続テスト結果、検証結果、履歴詳細）でイベントリスナーを動的に設定
 * - escapeHtml、日時フォーマット、ラベル変換など、文字列処理とDOM生成が密結合
 * - 適切なカバレッジには、JSDOM環境でのHTML要素作成、イベント発火、
 *   モーダルライフサイクル、タイマー処理のテストが必要
 * - ビジネスロジックはPresenterに分離されており、このクラスはView責務に専念
 */

import { StorageSyncManagerView } from './StorageSyncManagerPresenter';
import { StorageSyncConfigData } from '@domain/entities/StorageSyncConfig';
import { SyncHistoryData } from '@domain/entities/SyncHistory';
import { ProgressIndicator, ProgressOptions } from '@presentation/common/ProgressIndicator';
import { I18nAdapter } from '@infrastructure/adapters/I18nAdapter';
import { TemplateLoader } from '@presentation/common/TemplateLoader';
import { DataBinder } from '@presentation/common/DataBinder';

export class StorageSyncManagerViewImpl implements StorageSyncManagerView {
  private progressIndicator: ProgressIndicator | null = null;

  constructor(private container: HTMLElement) {}

  /**
   * Show sync configurations list
   */
  // eslint-disable-next-line max-lines-per-function -- Template-based rendering requires sequential DOM operations: load template, bind data for each config item, handle conditional rendering with data-bind-if, and append to container. Splitting would fragment the cohesive rendering logic.
  showConfigs(configs: StorageSyncConfigData[]): void {
    if (configs.length === 0) {
      this.showEmpty();
      return;
    }

    // Clear container
    this.container.innerHTML = '';

    // Load template and create elements for each config
    // eslint-disable-next-line max-lines-per-function, complexity -- Template-based rendering for config items requires comprehensive data binding (12+ properties), conditional display logic (hasSyncMethodDetails, hasIntervalDetails), and dynamic class manipulation. Splitting would separate tightly coupled DOM manipulation steps.
    configs.forEach((config) => {
      const template = TemplateLoader.load('storage-sync-config-item-template');
      if (!template) {
        throw new Error('storage-sync-config-item-template not found');
      }

      const element = template.cloneNode(true) as HTMLElement;

      // Prepare data for binding
      const inputsCount = config.inputs?.length || 0;
      const outputsCount = config.outputs?.length || 0;
      const hasSyncMethodDetails = inputsCount > 0 || outputsCount > 0;

      const hasIntervalDetails =
        config.syncTiming === 'periodic' && config.syncIntervalSeconds !== undefined;

      let intervalTime = '';
      if (hasIntervalDetails && config.syncIntervalSeconds) {
        const minutes = Math.floor(config.syncIntervalSeconds / 60);
        const seconds = config.syncIntervalSeconds % 60;
        intervalTime =
          minutes > 0 ? `${minutes}分${seconds > 0 ? seconds + '秒' : ''}` : `${seconds}秒`;
      }

      const data = {
        id: this.escapeHtml(config.id),
        storageKey: config.storageKey,
        testButtonText: I18nAdapter.getMessage('syncConfigTestConnectionButton'),
        syncButtonText: I18nAdapter.getMessage('syncConfigExecuteSyncButton'),
        editButtonText: I18nAdapter.getMessage('edit'),
        deleteButtonText: I18nAdapter.getMessage('delete'),
        statusClass: `status-${config.enabled ? 'enabled' : 'disabled'}`,
        statusText: config.enabled
          ? I18nAdapter.getMessage('statusEnabled')
          : I18nAdapter.getMessage('statusDisabled'),
        methodLabel: I18nAdapter.getMessage('syncConfigMethodLabel'),
        syncMethod: this.getSyncMethodLabel(config.syncMethod),
        timingLabel: I18nAdapter.getMessage('syncConfigTimingLabel'),
        syncTiming: this.getSyncTimingLabel(config.syncTiming),
        directionLabel: I18nAdapter.getMessage('syncConfigDirectionLabel'),
        syncDirection: this.getSyncDirectionLabel(config.syncDirection),
        inputsLabel: I18nAdapter.getMessage('syncConfigInputsLabel'),
        inputsCount: inputsCount.toString(),
        outputsLabel: I18nAdapter.getMessage('syncConfigOutputsLabel'),
        outputsCount: outputsCount.toString(),
        itemsUnit: I18nAdapter.getMessage('syncConfigItemsUnit'),
        intervalLabel: I18nAdapter.getMessage('syncHistorySyncInterval') + ':',
        intervalTime: intervalTime,
      };

      DataBinder.bind(element, data);
      DataBinder.bindAttributes(element, data);

      // Handle conditional sections (data-bind-if)
      const syncMethodDetailsDiv = element.querySelector(
        '[data-bind-if="hasSyncMethodDetails"]'
      ) as HTMLElement;
      if (syncMethodDetailsDiv) {
        syncMethodDetailsDiv.style.display = hasSyncMethodDetails ? '' : 'none';
      }

      const intervalDetailsDiv = element.querySelector(
        '[data-bind-if="hasIntervalDetails"]'
      ) as HTMLElement;
      if (intervalDetailsDiv) {
        intervalDetailsDiv.style.display = hasIntervalDetails ? '' : 'none';
      }

      this.container.appendChild(element);
    });
  }

  /**
   * Show error notification
   */
  showError(message: string): void {
    this.showNotification(message, 'error');
  }

  /**
   * Show success notification
   */
  showSuccess(message: string): void {
    this.showNotification(message, 'success');
  }

  /**
   * Show loading state
   */
  showLoading(): void {
    const template = TemplateLoader.load('storage-sync-loading-state-template');
    if (!template) {
      throw new Error('storage-sync-loading-state-template not found');
    }

    const element = template.cloneNode(true) as HTMLElement;
    const data = {
      loadingText: I18nAdapter.getMessage('syncConfigLoadingConfigs'),
    };

    DataBinder.bind(element, data);
    DataBinder.bindAttributes(element, data);
    this.container.innerHTML = '';
    this.container.appendChild(element);
  }

  /**
   * Hide loading state (handled by showConfigs or showEmpty)
   */
  hideLoading(): void {
    // No-op: loading state is replaced by showConfigs or showEmpty
  }

  /**
   * Show empty state
   */
  showEmpty(): void {
    const template = TemplateLoader.load('storage-sync-empty-state-template');
    if (!template) {
      throw new Error('storage-sync-empty-state-template not found');
    }

    const element = template.cloneNode(true) as HTMLElement;
    const data = {
      emptyText: I18nAdapter.getMessage('syncConfigNoConfigs'),
    };

    DataBinder.bind(element, data);
    DataBinder.bindAttributes(element, data);
    this.container.innerHTML = '';
    this.container.appendChild(element);
  }

  /**
   * Show connection test result modal
   */
  // eslint-disable-next-line max-lines-per-function, complexity -- Modal construction requires template loading, comprehensive data binding (8+ properties), conditional rendering for statusCode/responseTime/error fields, event listener setup for close actions, and DOM append. The sequential steps are necessary for complete modal functionality.
  showConnectionTestResult(result: {
    isConnectable: boolean;
    statusCode?: number;
    responseTime?: number;
    error?: string;
  }): void {
    const template = TemplateLoader.load('storage-sync-connection-test-modal-template');
    if (!template) {
      throw new Error('storage-sync-connection-test-modal-template not found');
    }

    const modal = document.createElement('div');
    modal.className = 'modal show';

    const element = template.cloneNode(true) as HTMLElement;

    const data = {
      headerText: I18nAdapter.getMessage('syncConfigConnectionTestResult'),
      successClass: result.isConnectable ? 'test-success' : 'test-failure',
      resultTitle: result.isConnectable
        ? I18nAdapter.getMessage('syncConfigConnectionSuccessTitle')
        : I18nAdapter.getMessage('syncConfigConnectionFailedTitle'),
      statusCodeLabel: I18nAdapter.getMessage('syncConfigStatusCode') + ':',
      statusCode: result.statusCode?.toString() || '',
      responseTimeLabel: I18nAdapter.getMessage('syncConfigResponseTime') + ':',
      responseTime: result.responseTime ? `${result.responseTime}ms` : '',
      errorLabel: I18nAdapter.getMessage('error') + ':',
      error: result.error || '',
      closeButtonText: I18nAdapter.getMessage('close'),
    };

    DataBinder.bind(element, data);
    DataBinder.bindAttributes(element, data);

    // Handle conditional elements (data-bind-if)
    const statusCodeP = element.querySelector('[data-bind-if="statusCode"]') as HTMLElement;
    if (statusCodeP) {
      statusCodeP.style.display = result.statusCode ? '' : 'none';
    }

    const responseTimeP = element.querySelector('[data-bind-if="responseTime"]') as HTMLElement;
    if (responseTimeP) {
      responseTimeP.style.display = result.responseTime !== undefined ? '' : 'none';
    }

    const errorP = element.querySelector('[data-bind-if="error"]') as HTMLElement;
    if (errorP) {
      errorP.style.display = result.error ? '' : 'none';
    }

    modal.appendChild(element);
    document.body.appendChild(modal);

    // Close modal on button click
    const closeBtn = modal.querySelector('.close-test-result') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    // Close modal on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * Show validation result modal
   */
  // eslint-disable-next-line max-lines-per-function -- Dynamically constructs validation result modal HTML with errors and warnings sections. Splitting would fragment the modal construction logic.
  showValidationResult(result: {
    isValid: boolean;
    errors: Array<{ field: string; message: string }>;
    warnings: Array<{ field: string; message: string }>;
  }): void {
    const template = TemplateLoader.load('storage-sync-validation-result-modal-template');
    if (!template) {
      throw new Error('storage-sync-validation-result-modal-template not found');
    }

    const modal = document.createElement('div');
    modal.className = 'modal show';

    const element = template.cloneNode(true) as HTMLElement;

    const hasErrors = result.errors.length > 0;
    const hasWarnings = result.warnings.length > 0;

    const data = {
      headerText: I18nAdapter.getMessage('syncConfigValidationResult'),
      validationClass: result.isValid ? 'validation-success' : 'validation-failure',
      resultTitle: result.isValid
        ? I18nAdapter.getMessage('syncConfigValidationSuccessTitle')
        : I18nAdapter.getMessage('syncConfigValidationFailedTitle'),
      errorsTitle: I18nAdapter.getMessage(
        'syncConfigValidationErrors',
        result.errors.length.toString()
      ),
      warningsTitle: I18nAdapter.getMessage(
        'syncConfigValidationWarnings',
        result.warnings.length.toString()
      ),
      closeButtonText: I18nAdapter.getMessage('close'),
    };

    DataBinder.bind(element, data);
    DataBinder.bindAttributes(element, data);

    // Handle conditional sections (data-bind-if)
    const errorsDiv = element.querySelector('[data-bind-if="hasErrors"]') as HTMLElement;
    if (errorsDiv) {
      if (hasErrors) {
        errorsDiv.style.display = '';
        // Populate errors list
        const errorsList = errorsDiv.querySelector('ul');
        if (errorsList) {
          errorsList.innerHTML = result.errors
            .map(
              (e) =>
                `<li><strong>${this.escapeHtml(e.field)}</strong>: ${this.escapeHtml(e.message)}</li>`
            )
            .join('');
        }
      } else {
        errorsDiv.style.display = 'none';
      }
    }

    const warningsDiv = element.querySelector('[data-bind-if="hasWarnings"]') as HTMLElement;
    if (warningsDiv) {
      if (hasWarnings) {
        warningsDiv.style.display = '';
        // Populate warnings list
        const warningsList = warningsDiv.querySelector('ul');
        if (warningsList) {
          warningsList.innerHTML = result.warnings
            .map(
              (w) =>
                `<li><strong>${this.escapeHtml(w.field)}</strong>: ${this.escapeHtml(w.message)}</li>`
            )
            .join('');
        }
      } else {
        warningsDiv.style.display = 'none';
      }
    }

    modal.appendChild(element);
    document.body.appendChild(modal);

    // Close modal on button click
    const closeBtn = modal.querySelector('.close-validation-result') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    // Close modal on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // Private helper methods

  private showNotification(message: string, type: 'success' | 'error'): void {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private getSyncMethodLabel(syncMethod: 'notion' | 'spread-sheet'): string {
    return syncMethod === 'notion'
      ? I18nAdapter.getMessage('syncMethodNotion')
      : I18nAdapter.getMessage('syncMethodSpreadsheet');
  }

  private getSyncTimingLabel(syncTiming: 'manual' | 'periodic'): string {
    return syncTiming === 'manual'
      ? I18nAdapter.getMessage('syncTimingLabelManual')
      : I18nAdapter.getMessage('syncTimingLabelPeriodic');
  }

  private getSyncDirectionLabel(
    syncDirection: 'bidirectional' | 'receive_only' | 'send_only'
  ): string {
    switch (syncDirection) {
      case 'bidirectional':
        return I18nAdapter.getMessage('syncDirectionLabelBidirectional');
      case 'receive_only':
        return I18nAdapter.getMessage('syncDirectionLabelReceiveOnly');
      case 'send_only':
        return I18nAdapter.getMessage('syncDirectionLabelSendOnly');
      default:
        return syncDirection;
    }
  }

  /**
   * Show sync histories list
   */
  // eslint-disable-next-line max-lines-per-function, complexity -- Template-based rendering requires sequential DOM operations: load template, bind data for each history item (12+ properties), handle conditional rendering with data-bind-if for hasDuration/hasResults/hasError/hasRetry states, and dynamic class manipulation. Splitting would fragment the cohesive rendering logic.
  showSyncHistories(histories: SyncHistoryData[], configId?: string): void {
    const filterLabel = configId
      ? `Config ID: ${this.escapeHtml(configId)}`
      : I18nAdapter.getMessage('syncHistoryAllHistories');

    // Create header section
    const headerHtml = `
      <div class="history-header">
        <h3>${I18nAdapter.getMessage('syncHistoryTitle', filterLabel)}</h3>
        <div class="history-actions">
          <button class="btn-cleanup" data-action="cleanup">${I18nAdapter.getMessage('syncHistoryCleanupOldHistories')}</button>
        </div>
      </div>
    `;

    // Clear container and add header
    this.container.innerHTML = headerHtml;

    // Create history list container
    const historyListContainer = document.createElement('div');
    historyListContainer.className = 'history-list';

    // Load template and create elements for each history
    // eslint-disable-next-line complexity -- Template-based rendering for history items requires comprehensive data binding (12+ properties), conditional display logic (hasDuration, hasResults, hasError, hasRetry), and dynamic class manipulation. Splitting would separate tightly coupled DOM manipulation steps.
    histories.forEach((history) => {
      const template = TemplateLoader.load('storage-sync-history-item-template');
      if (!template) {
        throw new Error('storage-sync-history-item-template not found');
      }

      const element = template.cloneNode(true) as HTMLElement;

      const hasDuration = history.endTime !== undefined;
      const hasResults = history.receiveResult || history.sendResult;
      const hasError = !!history.error;
      const hasRetry = history.retryCount > 0;

      const resultsHtml = this.renderHistoryResults(history);

      const data = {
        id: this.escapeHtml(history.id),
        storageKey: history.storageKey,
        statusClass: `status-${history.status}`,
        statusLabel: this.getStatusLabel(history.status),
        startTime: this.formatDate(history.startTime),
        duration: hasDuration ? this.formatDuration(history.startTime, history.endTime!) : '',
        directionLabel: I18nAdapter.getMessage('syncHistoryDirectionLabel'),
        syncDirection: this.getSyncDirectionLabel(history.syncDirection),
        resultsHtml: resultsHtml,
        errorLabel: I18nAdapter.getMessage('syncHistoryErrorLabel'),
        error: this.escapeHtml(history.error || ''),
        retryLabel: I18nAdapter.getMessage('syncHistoryRetryCount') + ':',
        retryCount: history.retryCount.toString(),
        viewDetailButtonText: I18nAdapter.getMessage('syncHistoryViewDetail'),
      };

      DataBinder.bind(element, data);
      DataBinder.bindAttributes(element, data);

      // Handle conditional elements (data-bind-if)
      const durationSpan = element.querySelector('[data-bind-if="hasDuration"]') as HTMLElement;
      if (durationSpan) {
        durationSpan.style.display = hasDuration ? '' : 'none';
      }

      const resultsDiv = element.querySelector('[data-bind-if="hasResults"]') as HTMLElement;
      if (resultsDiv) {
        resultsDiv.style.display = hasResults ? '' : 'none';
      }

      const errorDiv = element.querySelector('[data-bind-if="hasError"]') as HTMLElement;
      if (errorDiv) {
        errorDiv.style.display = hasError ? '' : 'none';
      }

      const retryDiv = element.querySelector('[data-bind-if="hasRetry"]') as HTMLElement;
      if (retryDiv) {
        retryDiv.style.display = hasRetry ? '' : 'none';
      }

      historyListContainer.appendChild(element);
    });

    this.container.appendChild(historyListContainer);
  }

  /**
   * Show empty history state
   */
  showHistoryEmpty(): void {
    const template = TemplateLoader.load('storage-sync-history-empty-state-template');
    if (!template) {
      throw new Error('storage-sync-history-empty-state-template not found');
    }

    const element = template.cloneNode(true) as HTMLElement;
    const data = {
      emptyText: I18nAdapter.getMessage('syncConfigNoHistories'),
    };

    DataBinder.bind(element, data);
    DataBinder.bindAttributes(element, data);
    this.container.innerHTML = '';
    this.container.appendChild(element);
  }

  /**
   * Show history detail modal
   */
  // eslint-disable-next-line max-lines-per-function, complexity -- Modal construction requires template loading, comprehensive data binding (20+ properties), conditional rendering for hasEndTime/hasError/hasRetry fields using data-bind-if, data-bind-html for detailResultsHtml, event listener setup for close actions, and DOM append. The sequential steps are necessary for complete modal functionality.
  showHistoryDetail(history: SyncHistoryData): void {
    const template = TemplateLoader.load('storage-sync-history-detail-modal-template');
    if (!template) {
      throw new Error('storage-sync-history-detail-modal-template not found');
    }

    const modal = document.createElement('div');
    modal.className = 'modal show';

    const element = template.cloneNode(true) as HTMLElement;

    const hasEndTime = history.endTime !== undefined;
    const hasError = !!history.error;
    const hasRetry = history.retryCount > 0;

    const detailResultsHtml = this.renderDetailResults(history);

    const data = {
      headerText: I18nAdapter.getMessage('syncHistoryDetail'),
      basicInfoTitle: I18nAdapter.getMessage('syncHistoryBasicInfo'),
      idLabel: I18nAdapter.getMessage('syncHistoryId') + ':',
      id: this.escapeHtml(history.id),
      configIdLabel: I18nAdapter.getMessage('syncHistoryConfigId') + ':',
      configId: this.escapeHtml(history.configId),
      storageKeyLabel: I18nAdapter.getMessage('conflictStorageKey') + ':',
      storageKey: history.storageKey,
      syncDirectionLabel: I18nAdapter.getMessage('syncHistorySyncDirection') + ':',
      syncDirection: this.getSyncDirectionLabel(history.syncDirection),
      statusLabel: I18nAdapter.getMessage('syncHistoryStatus') + ':',
      statusClass: `status-${history.status}`,
      statusText: this.getStatusLabel(history.status),
      executionTimeTitle: I18nAdapter.getMessage('syncHistoryExecutionTime'),
      startTimeLabel: I18nAdapter.getMessage('syncHistoryStartTime') + ':',
      startTime: this.formatDate(history.startTime),
      endTimeLabel: I18nAdapter.getMessage('syncHistoryEndTime') + ':',
      endTime: hasEndTime ? this.formatDate(history.endTime!) : '',
      durationLabel: I18nAdapter.getMessage('syncHistoryDuration') + ':',
      duration: hasEndTime ? this.formatDuration(history.startTime, history.endTime!) : '',
      detailResultsHtml: detailResultsHtml,
      errorInfoTitle: I18nAdapter.getMessage('syncHistoryErrorInfo'),
      error: this.escapeHtml(history.error || ''),
      retryInfoTitle: I18nAdapter.getMessage('syncHistoryRetryInfo'),
      retryCountLabel: I18nAdapter.getMessage('syncHistoryRetryCount') + ':',
      retryCount: history.retryCount.toString(),
      closeButtonText: I18nAdapter.getMessage('close'),
    };

    DataBinder.bind(element, data);
    DataBinder.bindAttributes(element, data);

    // Handle conditional elements (data-bind-if)
    const endTimeDiv = element.querySelector('[data-bind-if="hasEndTime"]') as HTMLElement;
    if (endTimeDiv) {
      endTimeDiv.style.display = hasEndTime ? '' : 'none';
    }

    const errorSection = element.querySelector('[data-bind-if="hasError"]') as HTMLElement;
    if (errorSection) {
      errorSection.style.display = hasError ? '' : 'none';
    }

    const retrySection = element.querySelector('[data-bind-if="hasRetry"]') as HTMLElement;
    if (retrySection) {
      retrySection.style.display = hasRetry ? '' : 'none';
    }

    // Handle data-bind-html for detailResultsHtml
    const detailResultsContainer = element.querySelector(
      '[data-bind-html="detailResultsHtml"]'
    ) as HTMLElement;
    if (detailResultsContainer) {
      detailResultsContainer.innerHTML = detailResultsHtml;
    }

    modal.appendChild(element);
    document.body.appendChild(modal);

    // Close modal on button click
    const closeBtn = modal.querySelector('.close-history-detail') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    // Close modal on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // Private helper methods for history display

  private getStatusLabel(status: 'success' | 'failed' | 'partial'): string {
    switch (status) {
      case 'success':
        return I18nAdapter.getMessage('syncHistoryStatusSuccess');
      case 'failed':
        return I18nAdapter.getMessage('syncHistoryStatusFailed');
      case 'partial':
        return I18nAdapter.getMessage('syncHistoryStatusPartial');
      default:
        return status;
    }
  }

  private renderHistoryResults(history: SyncHistoryData): string {
    const results: string[] = [];

    if (history.receiveResult) {
      const icon = history.receiveResult.success ? '✅' : '❌';
      const count = history.receiveResult.receivedCount || 0;
      results.push(
        `${icon} ${I18nAdapter.getMessage('received')}: ${count}${I18nAdapter.getMessage('items')}`
      );
    }

    if (history.sendResult) {
      const icon = history.sendResult.success ? '✅' : '❌';
      const count = history.sendResult.sentCount || 0;
      results.push(
        `${icon} ${I18nAdapter.getMessage('sent')}: ${count}${I18nAdapter.getMessage('items')}`
      );
    }

    return results.join(' / ');
  }

  // eslint-disable-next-line max-lines-per-function -- Generates detailed HTML for receive and send results with conditional error messages. The template string construction is clear and necessary for comprehensive result display.
  private renderDetailResults(history: SyncHistoryData): string {
    const sections: string[] = [];

    if (history.receiveResult) {
      sections.push(`
        <div class="detail-section">
          <h4>${I18nAdapter.getMessage('syncHistoryReceiveResult')}</h4>
          <div class="detail-row">
            <span class="detail-label">${I18nAdapter.getMessage('syncHistorySuccessLabel')}:</span>
            <span class="detail-value">${history.receiveResult.success ? I18nAdapter.getMessage('syncStatusYes') : I18nAdapter.getMessage('syncStatusNo')}</span>
          </div>
          ${
            history.receiveResult.receivedCount !== undefined
              ? `
            <div class="detail-row">
              <span class="detail-label">${I18nAdapter.getMessage('syncHistoryReceivedCount')}:</span>
              <span class="detail-value">${history.receiveResult.receivedCount}</span>
            </div>
          `
              : ''
          }
          ${
            history.receiveResult.error
              ? `
            <div class="detail-row">
              <span class="detail-label">${I18nAdapter.getMessage('error')}:</span>
              <span class="detail-value detail-error-text">${this.escapeHtml(history.receiveResult.error)}</span>
            </div>
          `
              : ''
          }
        </div>
      `);
    }

    if (history.sendResult) {
      sections.push(`
        <div class="detail-section">
          <h4>${I18nAdapter.getMessage('syncHistorySendResult')}</h4>
          <div class="detail-row">
            <span class="detail-label">${I18nAdapter.getMessage('syncHistorySuccessLabel')}:</span>
            <span class="detail-value">${history.sendResult.success ? I18nAdapter.getMessage('syncStatusYes') : I18nAdapter.getMessage('syncStatusNo')}</span>
          </div>
          ${
            history.sendResult.sentCount !== undefined
              ? `
            <div class="detail-row">
              <span class="detail-label">${I18nAdapter.getMessage('syncHistorySentCount')}:</span>
              <span class="detail-value">${history.sendResult.sentCount}</span>
            </div>
          `
              : ''
          }
          ${
            history.sendResult.error
              ? `
            <div class="detail-row">
              <span class="detail-label">${I18nAdapter.getMessage('error')}:</span>
              <span class="detail-value detail-error-text">${this.escapeHtml(history.sendResult.error)}</span>
            </div>
          `
              : ''
          }
        </div>
      `);
    }

    return sections.join('');
  }

  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  private formatDuration(startTime: number, endTime: number): string {
    const durationMs = endTime - startTime;
    const seconds = Math.floor(durationMs / 1000);
    const ms = durationMs % 1000;

    if (seconds < 60) {
      return `${seconds}.${Math.floor(ms / 100)}秒`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  }

  /**
   * Show conflict resolution dialog for user confirmation
   * Returns a promise that resolves to the user's choice
   */
  // eslint-disable-next-line max-lines-per-function -- Constructs comprehensive conflict resolution modal with local/remote data comparison, timestamps, and user choice buttons. The detailed modal HTML construction with event handlers requires this length for user-friendly conflict resolution UI.
  showConflictResolutionDialog(conflict: {
    storageKey: string;
    localData: unknown;
    localTimestamp: string;
    remoteData: unknown;
    remoteTimestamp: string;
    remoteSource: 'notion' | 'spread-sheet';
  }): Promise<'local' | 'remote' | 'cancel'> {
    // eslint-disable-next-line max-lines-per-function -- Promise executor for conflict resolution dialog. The function constructs a comprehensive modal with HTML, event handlers, and keyboard shortcuts. Splitting would fragment the tightly coupled DOM manipulation and Promise resolution logic.
    return new Promise((resolve) => {
      const template = TemplateLoader.load('storage-sync-conflict-resolution-modal-template');
      if (!template) {
        throw new Error('storage-sync-conflict-resolution-modal-template not found');
      }

      const modal = document.createElement('div');
      modal.className = 'modal show conflict-resolution-modal';

      const element = template.cloneNode(true) as HTMLElement;

      const localDataJson = JSON.stringify(conflict.localData, null, 2);
      const remoteDataJson = JSON.stringify(conflict.remoteData, null, 2);
      const remoteSourceLabel =
        conflict.remoteSource === 'notion'
          ? I18nAdapter.getMessage('syncMethodNotion')
          : I18nAdapter.getMessage('syncMethodSpreadsheet');

      const recommendationHtml = this.getConflictRecommendation(
        conflict.localTimestamp,
        conflict.remoteTimestamp
      );

      const data = {
        titleText: I18nAdapter.getMessage('conflictResolutionTitle'),
        descriptionText: I18nAdapter.getMessage('conflictResolutionDescription', remoteSourceLabel),
        storageKeyLabel: I18nAdapter.getMessage('conflictStorageKey') + ':',
        storageKey: conflict.storageKey,
        localDataTitle: I18nAdapter.getMessage('conflictLocalData'),
        updatedAtLabel: I18nAdapter.getMessage('conflictUpdatedAt') + ':',
        localTimestamp: this.formatISO8601(conflict.localTimestamp),
        localDataJson: this.escapeHtml(localDataJson),
        remoteDataTitle: I18nAdapter.getMessage('conflictRemoteData', remoteSourceLabel),
        remoteTimestamp: this.formatISO8601(conflict.remoteTimestamp),
        remoteDataJson: this.escapeHtml(remoteDataJson),
        recommendationHtml: recommendationHtml,
        useLocalButtonText: I18nAdapter.getMessage('conflictUseLocal'),
        useRemoteButtonText: I18nAdapter.getMessage('conflictUseRemote'),
        cancelButtonText: I18nAdapter.getMessage('cancel'),
      };

      DataBinder.bind(element, data);
      DataBinder.bindAttributes(element, data);

      // Handle data-bind-html for recommendationHtml
      const recommendationContainer = element.querySelector(
        '[data-bind-html="recommendationHtml"]'
      ) as HTMLElement;
      if (recommendationContainer) {
        recommendationContainer.innerHTML = recommendationHtml;
      }

      modal.appendChild(element);
      document.body.appendChild(modal);

      // Handle button clicks
      const handleChoice = (choice: 'local' | 'remote' | 'cancel') => {
        modal.remove();
        resolve(choice);
      };

      modal.querySelectorAll('[data-choice]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const choice = (btn as HTMLElement).getAttribute('data-choice') as
            | 'local'
            | 'remote'
            | 'cancel';
          handleChoice(choice);
        });
      });

      // Close on background click (treat as cancel)
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          handleChoice('cancel');
        }
      });

      // Close on Escape key (treat as cancel)
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', handleEscape);
          handleChoice('cancel');
        }
      };
      document.addEventListener('keydown', handleEscape);
    });
  }

  /**
   * Format ISO 8601 timestamp to human-readable format
   */
  private formatISO8601(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (error) {
      return timestamp;
    }
  }

  /**
   * Get conflict recommendation based on timestamps
   */
  private getConflictRecommendation(localTimestamp: string, remoteTimestamp: string): string {
    try {
      const localTime = new Date(localTimestamp).getTime();
      const remoteTime = new Date(remoteTimestamp).getTime();

      if (isNaN(localTime) || isNaN(remoteTime)) {
        return `<p class="recommendation">${I18nAdapter.getMessage('conflictRecommendationInvalid')}</p>`;
      }

      if (localTime > remoteTime) {
        const diffMinutes = Math.round((localTime - remoteTime) / 1000 / 60);
        return `<p class="recommendation">${I18nAdapter.getMessage('conflictRecommendationLocalNewer', String(diffMinutes))}</p>`;
      } else if (remoteTime > localTime) {
        const diffMinutes = Math.round((remoteTime - localTime) / 1000 / 60);
        return `<p class="recommendation">${I18nAdapter.getMessage('conflictRecommendationRemoteNewer', String(diffMinutes))}</p>`;
      } else {
        return `<p class="recommendation">${I18nAdapter.getMessage('conflictRecommendationEqual')}</p>`;
      }
    } catch (error) {
      return `<p class="recommendation">${I18nAdapter.getMessage('conflictRecommendationComparisonFailed')}</p>`;
    }
  }

  /**
   * Show progress indicator
   */
  showProgress(status: string, cancellable = false): void {
    // Clean up existing progress indicator
    if (this.progressIndicator) {
      this.progressIndicator.hide();
      this.progressIndicator = null;
    }

    const options: ProgressOptions = {
      cancellable,
      container: document.body,
    };

    this.progressIndicator = new ProgressIndicator(options);
    this.progressIndicator.setIndeterminate(status);
    this.progressIndicator.show();
  }

  /**
   * Update progress indicator
   */
  updateProgress(percent: number, status?: string): void {
    if (this.progressIndicator) {
      this.progressIndicator.clearIndeterminate();
      this.progressIndicator.updateProgress(percent, status);
    }
  }

  /**
   * Hide progress indicator
   */
  hideProgress(): void {
    if (this.progressIndicator) {
      this.progressIndicator.hide();
      this.progressIndicator = null;
    }
  }
}
