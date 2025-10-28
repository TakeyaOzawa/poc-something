/**
 * Domain Layer: LogAggregatorPort Interface
 * Service for aggregating and managing logs from all UI components
 */

import { LogEntry } from '@domain/entities/LogEntry';

/**
 * Filter options for querying logs
 */
export interface LogFilterOptions {
  sources?: string[]; // Filter by log sources
  securityEventsOnly?: boolean; // Show only security events
  startTime?: number; // Filter logs after this timestamp
  endTime?: number; // Filter logs before this timestamp
  limit?: number; // Maximum number of logs to return
}

/**
 * LogAggregatorPort Interface
 * Manages centralized log storage, rotation, and retrieval
 */
export interface LogAggregatorPort {
  /**
   * Add a new log entry
   * Automatically applies rotation if maxStoredLogs is exceeded
   */
  addLog(entry: LogEntry): Promise<void>;

  /**
   * Get all logs with optional filtering
   */
  getLogs(filter?: LogFilterOptions): Promise<LogEntry[]>;

  /**
   * Get log count
   */
  getLogCount(): Promise<number>;

  /**
   * Delete logs older than specified days
   */
  deleteOldLogs(retentionDays: number): Promise<number>;

  /**
   * Delete all logs
   */
  clearAllLogs(): Promise<void>;

  /**
   * Delete a specific log by ID
   */
  deleteLog(id: string): Promise<boolean>;

  /**
   * Apply log rotation
   * Keeps only the most recent maxLogs entries
   */
  applyRotation(maxLogs: number): Promise<number>;
}
