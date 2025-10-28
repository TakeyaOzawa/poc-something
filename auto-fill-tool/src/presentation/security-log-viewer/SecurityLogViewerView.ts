/**
 * Presentation Layer: SecurityLogViewerView
 * Manages the security log viewer UI rendering and DOM manipulation
 */

import { LogEntry, SecurityEventType } from '@/domain/entities/LogEntry';
import { LogLevel } from '@/domain/types/logger.types';
import {
  SecurityLogViewerPresenter,
  LogFilterOptions,
  ExportFormat,
} from './SecurityLogViewerPresenter';

/**
 * SecurityLogViewerView
 * Handles UI rendering and user interactions
 */
export class SecurityLogViewerView {
  private presenter: SecurityLogViewerPresenter;

  // DOM Elements
  private logTableBody: HTMLElement | null = null;
  private filterSourcesSelect: HTMLSelectElement | null = null;
  private filterLevelsSelect: HTMLSelectElement | null = null;
  private filterEventTypesSelect: HTMLSelectElement | null = null;
  private filterStartDateInput: HTMLInputElement | null = null;
  private filterEndDateInput: HTMLInputElement | null = null;
  private securityEventsOnlyCheckbox: HTMLInputElement | null = null;
  private applyFilterBtn: HTMLButtonElement | null = null;
  private clearFilterBtn: HTMLButtonElement | null = null;
  private exportJsonBtn: HTMLButtonElement | null = null;
  private exportCsvBtn: HTMLButtonElement | null = null;
  private refreshBtn: HTMLButtonElement | null = null;
  private totalLogsSpan: HTMLElement | null = null;
  private securityEventsSpan: HTMLElement | null = null;

  constructor(presenter: SecurityLogViewerPresenter) {
    this.presenter = presenter;
  }

  /**
   * Initialize the view and bind events
   */
  async initialize(): Promise<void> {
    this.bindDOMElements();
    this.bindEvents();
    await this.refreshData();
  }

  /**
   * Bind DOM elements
   */
  private bindDOMElements(): void {
    this.logTableBody = document.getElementById('logTableBody');
    this.filterSourcesSelect = document.getElementById('filterSources') as HTMLSelectElement;
    this.filterLevelsSelect = document.getElementById('filterLevels') as HTMLSelectElement;
    this.filterEventTypesSelect = document.getElementById('filterEventTypes') as HTMLSelectElement;
    this.filterStartDateInput = document.getElementById('filterStartDate') as HTMLInputElement;
    this.filterEndDateInput = document.getElementById('filterEndDate') as HTMLInputElement;
    this.securityEventsOnlyCheckbox = document.getElementById(
      'securityEventsOnly'
    ) as HTMLInputElement;
    this.applyFilterBtn = document.getElementById('applyFilterBtn') as HTMLButtonElement;
    this.clearFilterBtn = document.getElementById('clearFilterBtn') as HTMLButtonElement;
    this.exportJsonBtn = document.getElementById('exportJsonBtn') as HTMLButtonElement;
    this.exportCsvBtn = document.getElementById('exportCsvBtn') as HTMLButtonElement;
    this.refreshBtn = document.getElementById('refreshBtn') as HTMLButtonElement;
    this.totalLogsSpan = document.getElementById('totalLogs');
    this.securityEventsSpan = document.getElementById('securityEvents');
  }

  /**
   * Bind event listeners
   */
  private bindEvents(): void {
    this.applyFilterBtn?.addEventListener('click', () => {
      this.handleApplyFilter();
    });

    this.clearFilterBtn?.addEventListener('click', () => {
      this.handleClearFilter();
    });

    this.exportJsonBtn?.addEventListener('click', () => {
      this.handleExport('json');
    });

    this.exportCsvBtn?.addEventListener('click', () => {
      this.handleExport('csv');
    });

    this.refreshBtn?.addEventListener('click', () => {
      this.refreshData();
    });
  }

  /**
   * Refresh data from presenter
   */
  async refreshData(): Promise<void> {
    await this.presenter.loadLogs();
    this.populateFilterOptions();
    this.renderLogs();
    this.updateStatistics();
  }

  /**
   * Populate filter options from available data
   */
  private populateFilterOptions(): void {
    // Populate sources
    if (this.filterSourcesSelect) {
      const sources = this.presenter.getAvailableSources();
      this.filterSourcesSelect.innerHTML = '<option value="">All Sources</option>';
      sources.forEach((source) => {
        const option = document.createElement('option');
        option.value = source;
        option.textContent = source;
        this.filterSourcesSelect?.appendChild(option);
      });
    }

    // Populate security event types
    if (this.filterEventTypesSelect) {
      const eventTypes = this.presenter.getAvailableSecurityEventTypes();
      this.filterEventTypesSelect.innerHTML = '<option value="">All Event Types</option>';
      eventTypes.forEach((eventType) => {
        const option = document.createElement('option');
        option.value = eventType;
        option.textContent = eventType;
        this.filterEventTypesSelect?.appendChild(option);
      });
    }
  }

  /**
   * Render logs in the table
   */
  private renderLogs(): void {
    if (!this.logTableBody) {
      return;
    }

    const logs = this.presenter.getFilteredLogs();

    if (logs.length === 0) {
      this.logTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="table-cell text-center py-8 text-gray-400">
            No logs found
          </td>
        </tr>
      `;
      return;
    }

    this.logTableBody.innerHTML = logs.map((log) => this.renderLogRow(log)).join('');
  }

  /**
   * Render a single log row
   */
  private renderLogRow(log: LogEntry): string {
    const timestamp = new Date(log.getTimestamp()).toLocaleString('ja-JP');
    const level = log.getLevel();
    const source = log.getSource();
    const message = this.escapeHtml(log.getMessage());
    const isSecurityEvent = log.isSecurityEvent();
    const securityEventType = log.getSecurityEventType() || '-';

    const levelBadgeClass = this.getLevelBadgeClass(level);
    const securityBadge = isSecurityEvent
      ? `<span class="badge badge-danger">${securityEventType}</span>`
      : '-';

    return `
      <tr class="table-row">
        <td class="table-cell text-xs">${timestamp}</td>
        <td class="table-cell"><span class="badge ${levelBadgeClass}">${level}</span></td>
        <td class="table-cell text-xs">${source}</td>
        <td class="table-cell text-xs max-w-md truncate" title="${message}">${message}</td>
        <td class="table-cell text-center">${securityBadge}</td>
        <td class="table-cell text-center">
          <button class="btn-info btn-xs" onclick="window.showLogDetails('${log.getId()}')">Details</button>
        </td>
      </tr>
    `;
  }

  /**
   * Get badge class for log level
   */
  private getLevelBadgeClass(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'badge-secondary';
      case LogLevel.INFO:
        return 'badge-info';
      case LogLevel.WARN:
        return 'badge-warning';
      case LogLevel.ERROR:
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Handle apply filter button click
   */
  // eslint-disable-next-line complexity -- Method gathers filter options from multiple UI elements (sources select, levels multi-select, event types select, start/end date inputs, security events checkbox). Each UI element requires separate handling and validation, making the complexity necessary for complete filter configuration.
  private handleApplyFilter(): void {
    const filter: LogFilterOptions = {};

    // Get selected sources
    if (this.filterSourcesSelect && this.filterSourcesSelect.value) {
      filter.sources = [this.filterSourcesSelect.value];
    }

    // Get selected levels
    if (this.filterLevelsSelect) {
      const selectedOptions = Array.from(this.filterLevelsSelect.selectedOptions);
      if (selectedOptions.length > 0) {
        filter.levels = selectedOptions.map((opt) => Number(opt.value) as LogLevel);
      }
    }

    // Get selected event types
    if (this.filterEventTypesSelect && this.filterEventTypesSelect.value) {
      filter.securityEventTypes = [this.filterEventTypesSelect.value as SecurityEventType];
    }

    // Get date range
    if (this.filterStartDateInput && this.filterStartDateInput.value) {
      filter.startTime = new Date(this.filterStartDateInput.value).getTime();
    }

    if (this.filterEndDateInput && this.filterEndDateInput.value) {
      filter.endTime = new Date(this.filterEndDateInput.value).getTime();
    }

    // Get security events only checkbox
    if (this.securityEventsOnlyCheckbox) {
      filter.securityEventsOnly = this.securityEventsOnlyCheckbox.checked;
    }

    this.presenter.applyFilter(filter);
    this.renderLogs();
    this.updateStatistics();
  }

  /**
   * Handle clear filter button click
   */
  private handleClearFilter(): void {
    // Reset form inputs
    if (this.filterSourcesSelect) {
      this.filterSourcesSelect.value = '';
    }
    if (this.filterLevelsSelect) {
      this.filterLevelsSelect.selectedIndex = -1;
    }
    if (this.filterEventTypesSelect) {
      this.filterEventTypesSelect.value = '';
    }
    if (this.filterStartDateInput) {
      this.filterStartDateInput.value = '';
    }
    if (this.filterEndDateInput) {
      this.filterEndDateInput.value = '';
    }
    if (this.securityEventsOnlyCheckbox) {
      this.securityEventsOnlyCheckbox.checked = false;
    }

    this.presenter.clearFilter();
    this.renderLogs();
    this.updateStatistics();
  }

  /**
   * Handle export button click
   */
  private handleExport(format: ExportFormat): void {
    const content = this.presenter.exportLogs(format);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `security-logs-${timestamp}.${format}`;
    const mimeType = format === 'json' ? 'application/json' : 'text/csv';

    this.presenter.downloadFile(content, filename, mimeType);
  }

  /**
   * Update statistics display
   */
  private updateStatistics(): void {
    const stats = this.presenter.getStatistics();

    if (this.totalLogsSpan) {
      this.totalLogsSpan.textContent = stats.total.toString();
    }

    if (this.securityEventsSpan) {
      this.securityEventsSpan.textContent = stats.securityEvents.toString();
    }
  }

  /**
   * Show log details in a modal (to be implemented)
   */
  showLogDetails(logId: string): void {
    const logs = this.presenter.getFilteredLogs();
    const log = logs.find((l) => l.getId() === logId);

    if (!log) {
      return;
    }

    // eslint-disable-next-line no-alert -- Simple alert for now, will be replaced with modal
    alert(`Log Details:\n\n${JSON.stringify(log.toJSON(), null, 2)}`);
  }
}
