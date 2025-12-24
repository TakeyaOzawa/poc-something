/**
 * Presentation Layer: SecurityLogViewerPresenter
 * Manages the security log viewer UI logic and data flow
 */

import { LogEntry, SecurityEventType } from '@domain/entities/LogEntry';
import { LogAggregatorPort } from '@domain/types/log-aggregator-port.types';
import { LogLevel } from '@domain/types/logger.types';

/**
 * Filter options for log entries
 */
export interface LogFilterOptions {
  sources?: string[];
  levels?: LogLevel[];
  securityEventTypes?: SecurityEventType[];
  startTime?: number;
  endTime?: number;
  securityEventsOnly?: boolean;
}

/**
 * Export format types
 */
export type ExportFormat = 'json' | 'csv';

/**
 * SecurityLogViewerPresenter
 * Handles log viewer business logic and data transformation
 */
export class SecurityLogViewerPresenter {
  private logs: LogEntry[] = [];
  private filteredLogs: LogEntry[] = [];
  private currentFilter: LogFilterOptions = {};

  constructor(private logAggregatorService: LogAggregatorPort) {}

  /**
   * Initialize the presenter and load logs
   */
  async initialize(): Promise<void> {
    await this.loadLogs();
  }

  /**
   * Load all logs from storage
   */
  async loadLogs(): Promise<void> {
    this.logs = await this.logAggregatorService.getLogs();
    this.applyFilter();
  }

  /**
   * Get all unique sources from logs
   */
  getAvailableSources(): string[] {
    const sources = new Set(this.logs.map((log) => log.getSource()));
    return Array.from(sources).sort();
  }

  /**
   * Get all security event types present in logs
   */
  getAvailableSecurityEventTypes(): SecurityEventType[] {
    const types = new Set<SecurityEventType>();
    this.logs.forEach((log) => {
      const eventType = log.getSecurityEventType();
      if (eventType) {
        types.add(eventType);
      }
    });
    return Array.from(types).sort();
  }

  /**
   * Apply filter to logs
   */
  applyFilter(filter?: LogFilterOptions): void {
    if (filter) {
      this.currentFilter = filter;
    }

    // eslint-disable-next-line complexity -- Filter function requires checking multiple independent conditions (sources, levels, security event types, time range, securityEventsOnly). Each condition is necessary for comprehensive log filtering functionality and cannot be simplified without losing filter capabilities.
    this.filteredLogs = this.logs.filter((log) => {
      // Filter by sources
      if (this.currentFilter.sources && this.currentFilter.sources.length > 0) {
        if (!this.currentFilter.sources.includes(log.getSource())) {
          return false;
        }
      }

      // Filter by levels
      if (this.currentFilter.levels && this.currentFilter.levels.length > 0) {
        if (!this.currentFilter.levels.includes(log.getLevel())) {
          return false;
        }
      }

      // Filter by security event types
      if (
        this.currentFilter.securityEventTypes &&
        this.currentFilter.securityEventTypes.length > 0
      ) {
        const eventType = log.getSecurityEventType();
        if (!eventType || !this.currentFilter.securityEventTypes.includes(eventType)) {
          return false;
        }
      }

      // Filter by time range
      if (this.currentFilter.startTime) {
        if (log.getTimestamp() < this.currentFilter.startTime) {
          return false;
        }
      }

      if (this.currentFilter.endTime) {
        if (log.getTimestamp() > this.currentFilter.endTime) {
          return false;
        }
      }

      // Filter security events only
      if (this.currentFilter.securityEventsOnly) {
        if (!log.isSecurityEvent()) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get filtered logs
   */
  getFilteredLogs(): LogEntry[] {
    return this.filteredLogs;
  }

  /**
   * Get current filter
   */
  getCurrentFilter(): LogFilterOptions {
    return { ...this.currentFilter };
  }

  /**
   * Clear all filters
   */
  clearFilter(): void {
    this.currentFilter = {};
    this.applyFilter();
  }

  /**
   * Export logs in specified format
   */
  exportLogs(format: ExportFormat): string {
    if (format === 'json') {
      return this.exportAsJSON();
    } else if (format === 'csv') {
      return this.exportAsCSV();
    }
    throw new Error(`Unsupported export format: ${format}`);
  }

  /**
   * Export logs as JSON
   */
  private exportAsJSON(): string {
    const data = this.filteredLogs.map((log) => log.toJSON());
    return JSON.stringify(data, null, 2);
  }

  /**
   * Export logs as CSV
   */
  private exportAsCSV(): string {
    if (this.filteredLogs.length === 0) {
      return '';
    }

    // CSV Header
    const headers = [
      'Timestamp',
      'Date/Time',
      'Level',
      'Source',
      'Message',
      'Security Event',
      'Event Type',
      'Error Message',
    ];

    // CSV Rows
    const rows = this.filteredLogs.map((log) => {
      const error = log.getError();
      return [
        log.getTimestamp().toString(),
        new Date(log.getTimestamp()).toISOString(),
        log.getLevel(),
        log.getSource(),
        this.escapeCsvValue(log.getMessage()),
        log.isSecurityEvent() ? 'YES' : 'NO',
        log.getSecurityEventType() || '',
        error ? this.escapeCsvValue(error.message) : '',
      ];
    });

    // Combine header and rows
    const csvLines = [headers.join(','), ...rows.map((row) => row.join(','))];

    return csvLines.join('\n');
  }

  /**
   * Escape CSV value (handle commas, quotes, newlines)
   */
  private escapeCsvValue(value: string): string {
    if (!value) {
      return '';
    }

    // If value contains comma, quote, or newline, wrap in quotes and escape existing quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }

    return value;
  }

  /**
   * Get log statistics
   */
  getStatistics() {
    const total = this.filteredLogs.length;
    const securityEvents = this.filteredLogs.filter((log) => log.isSecurityEvent()).length;

    // Count by level
    const byLevel: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
      [LogLevel.NONE]: 0,
    };

    this.filteredLogs.forEach((log) => {
      byLevel[log.getLevel()]++;
    });

    // Count by source
    const bySource: Record<string, number> = {};
    this.filteredLogs.forEach((log) => {
      const source = log.getSource();
      bySource[source] = (bySource[source] || 0) + 1;
    });

    return {
      total,
      securityEvents,
      byLevel,
      bySource,
    };
  }

  /**
   * Download file helper
   */
  downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
