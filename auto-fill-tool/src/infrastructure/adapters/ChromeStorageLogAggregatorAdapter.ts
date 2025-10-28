/**
 * Infrastructure Layer: ChromeStorageLogAggregatorPort
 * Implements centralized log aggregation using Chrome Storage
 */

import { LogAggregatorPort, LogFilterOptions } from '@domain/types/log-aggregator-port.types';
import { LogEntry, LogEntryProps } from '@domain/entities/LogEntry';

/**
 * Storage key for centralized logs
 */
const LOGS_STORAGE_KEY = 'centralized_logs';

/**
 * ChromeStorageLogAggregatorPort
 * Implements log aggregation with Chrome Storage persistence
 */
export class ChromeStorageLogAggregatorPort implements LogAggregatorPort {
  /**
   * Add a new log entry
   * Automatically applies rotation if maxStoredLogs is exceeded
   */
  async addLog(entry: LogEntry): Promise<void> {
    const logs = await this.loadLogsFromStorage();
    logs.push(entry.toJSON());

    await this.saveLogsToStorage(logs);
  }

  /**
   * Get all logs with optional filtering
   */
  async getLogs(filter?: LogFilterOptions): Promise<LogEntry[]> {
    const logs = await this.loadLogsFromStorage();
    const logEntries = logs.map((data) => LogEntry.fromJSON(data));

    return this.applyFilters(logEntries, filter);
  }

  /**
   * Get log count
   */
  async getLogCount(): Promise<number> {
    const logs = await this.loadLogsFromStorage();
    return logs.length;
  }

  /**
   * Delete logs older than specified days
   * @returns Number of deleted logs
   */
  async deleteOldLogs(retentionDays: number): Promise<number> {
    const logs = await this.loadLogsFromStorage();
    const logEntries = logs.map((data) => LogEntry.fromJSON(data));

    const remainingLogs = logEntries.filter((entry) => !entry.isOlderThan(retentionDays));
    const deletedCount = logEntries.length - remainingLogs.length;

    await this.saveLogsToStorage(remainingLogs.map((entry) => entry.toJSON()));

    return deletedCount;
  }

  /**
   * Delete all logs
   */
  async clearAllLogs(): Promise<void> {
    await this.saveLogsToStorage([]);
  }

  /**
   * Delete a specific log by ID
   * @returns true if log was found and deleted, false otherwise
   */
  async deleteLog(id: string): Promise<boolean> {
    const logs = await this.loadLogsFromStorage();
    const initialLength = logs.length;

    const remainingLogs = logs.filter((log) => log.id !== id);

    if (remainingLogs.length === initialLength) {
      return false; // Log not found
    }

    await this.saveLogsToStorage(remainingLogs);
    return true;
  }

  /**
   * Apply log rotation
   * Keeps only the most recent maxLogs entries
   * @returns Number of deleted logs
   */
  async applyRotation(maxLogs: number): Promise<number> {
    const logs = await this.loadLogsFromStorage();

    if (logs.length <= maxLogs) {
      return 0; // No rotation needed
    }

    // Sort by timestamp (newest first) and keep only maxLogs
    const sortedLogs = logs.sort((a, b) => b.timestamp - a.timestamp);
    const remainingLogs = sortedLogs.slice(0, maxLogs);
    const deletedCount = logs.length - remainingLogs.length;

    await this.saveLogsToStorage(remainingLogs);

    return deletedCount;
  }

  /**
   * Load logs from Chrome Storage
   * @private
   */
  private async loadLogsFromStorage(): Promise<LogEntryProps[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get(LOGS_STORAGE_KEY, (result) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to load logs:', chrome.runtime.lastError);
          resolve([]);
          return;
        }

        const logs = result[LOGS_STORAGE_KEY] || [];
        resolve(logs);
      });
    });
  }

  /**
   * Save logs to Chrome Storage
   * @private
   */
  private async saveLogsToStorage(logs: LogEntryProps[]): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [LOGS_STORAGE_KEY]: logs }, () => {
        if (chrome.runtime.lastError) {
          console.error('Failed to save logs:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        resolve();
      });
    });
  }

  /**
   * Apply filters to log entries
   * @private
   */
  private applyFilters(logs: LogEntry[], filter?: LogFilterOptions): LogEntry[] {
    if (!filter) {
      return logs;
    }

    let filtered = logs;

    // Filter by sources
    if (filter.sources && filter.sources.length > 0) {
      filtered = filtered.filter((log) => filter.sources!.includes(log.getSource()));
    }

    // Filter by security events only
    if (filter.securityEventsOnly) {
      filtered = filtered.filter((log) => log.isSecurityEvent());
    }

    // Filter by time range
    if (filter.startTime !== undefined) {
      filtered = filtered.filter((log) => log.getTimestamp() >= filter.startTime!);
    }

    if (filter.endTime !== undefined) {
      filtered = filtered.filter((log) => log.getTimestamp() <= filter.endTime!);
    }

    // Apply limit
    if (filter.limit !== undefined && filter.limit > 0) {
      // Sort by timestamp (newest first) before limiting
      filtered = filtered.sort((a, b) => b.getTimestamp() - a.getTimestamp());
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }
}
