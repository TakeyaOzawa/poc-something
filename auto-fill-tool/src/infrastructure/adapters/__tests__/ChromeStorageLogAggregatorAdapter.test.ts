/**
 * Tests for ChromeStorageLogAggregatorPort
 */

import { ChromeStorageLogAggregatorPort } from '../ChromeStorageLogAggregatorAdapter';
import { LogEntry, LogEntryProps, SecurityEventType } from '@domain/entities/LogEntry';
import { LogLevel } from '@domain/types/logger.types';

describe('ChromeStorageLogAggregatorPort', () => {
  let service: ChromeStorageLogAggregatorPort;
  let mockStorageData: Record<string, any>;

  beforeEach(() => {
    service = new ChromeStorageLogAggregatorPort();
    mockStorageData = {};

    // Mock chrome.storage.local
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((key: string, callback: (result: any) => void) => {
            callback({ [key]: mockStorageData[key] || [] });
          }),
          set: jest.fn((data: any, callback?: () => void) => {
            Object.assign(mockStorageData, data);
            if (callback) callback();
          }),
        },
      },
      runtime: {
        lastError: undefined,
      },
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addLog', () => {
    it('should add a log entry to storage', async () => {
      const logEntry = LogEntry.create({
        timestamp: Date.now(),
        level: LogLevel.INFO,
        source: 'TestSource',
        message: 'Test message',
        isSecurityEvent: false,
      });

      await service.addLog(logEntry);

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          centralized_logs: expect.arrayContaining([
            expect.objectContaining({
              message: 'Test message',
              source: 'TestSource',
            }),
          ]),
        }),
        expect.any(Function)
      );
    });

    it('should append to existing logs', async () => {
      const existingLog = LogEntry.create({
        timestamp: Date.now(),
        level: LogLevel.INFO,
        source: 'Source1',
        message: 'Message 1',
        isSecurityEvent: false,
      });

      mockStorageData['centralized_logs'] = [existingLog.toJSON()];

      const newLog = LogEntry.create({
        timestamp: Date.now(),
        level: LogLevel.WARN,
        source: 'Source2',
        message: 'Message 2',
        isSecurityEvent: false,
      });

      await service.addLog(newLog);

      const savedLogs = mockStorageData['centralized_logs'];
      expect(savedLogs).toHaveLength(2);
      expect(savedLogs[0].message).toBe('Message 1');
      expect(savedLogs[1].message).toBe('Message 2');
    });

    it('should handle chrome.storage get errors gracefully', async () => {
      // Override the mock to simulate get error
      (chrome.storage.local.get as jest.Mock).mockImplementation(
        (key: string, callback: (result: any) => void) => {
          (chrome.runtime as any).lastError = { message: 'Storage get error' };
          callback({});
          // Clear error after callback to prevent affecting subsequent calls
          (chrome.runtime as any).lastError = undefined;
        }
      );

      console.error = jest.fn();

      const logEntry = LogEntry.create({
        timestamp: Date.now(),
        level: LogLevel.ERROR,
        source: 'TestSource',
        message: 'Test message',
        isSecurityEvent: false,
      });

      await service.addLog(logEntry);

      expect(console.error).toHaveBeenCalledWith(
        'Failed to load logs:',
        expect.objectContaining({ message: 'Storage get error' })
      );

      // Reset the mock to normal behavior
      (chrome.storage.local.get as jest.Mock).mockImplementation(
        (key: string, callback: (result: any) => void) => {
          callback({ [key]: mockStorageData[key] || [] });
        }
      );
    });
  });

  describe('getLogs', () => {
    beforeEach(() => {
      const now = Date.now();
      const logs: LogEntryProps[] = [
        {
          id: 'log_1',
          timestamp: now - 1000,
          level: LogLevel.INFO,
          source: 'Source1',
          message: 'Message 1',
          isSecurityEvent: false,
        },
        {
          id: 'log_2',
          timestamp: now - 500,
          level: LogLevel.WARN,
          source: 'Source2',
          message: 'Message 2',
          isSecurityEvent: true,
          securityEventType: SecurityEventType.FAILED_AUTH,
        },
        {
          id: 'log_3',
          timestamp: now,
          level: LogLevel.ERROR,
          source: 'Source1',
          message: 'Message 3',
          isSecurityEvent: false,
        },
      ];

      mockStorageData['centralized_logs'] = logs;
    });

    it('should return all logs without filter', async () => {
      const logs = await service.getLogs();

      expect(logs).toHaveLength(3);
      expect(logs[0].getMessage()).toBe('Message 1');
      expect(logs[1].getMessage()).toBe('Message 2');
      expect(logs[2].getMessage()).toBe('Message 3');
    });

    it('should filter logs by sources', async () => {
      const logs = await service.getLogs({ sources: ['Source1'] });

      expect(logs).toHaveLength(2);
      expect(logs[0].getSource()).toBe('Source1');
      expect(logs[1].getSource()).toBe('Source1');
    });

    it('should filter logs by security events only', async () => {
      const logs = await service.getLogs({ securityEventsOnly: true });

      expect(logs).toHaveLength(1);
      expect(logs[0].isSecurityEvent()).toBe(true);
      expect(logs[0].getSecurityEventType()).toBe(SecurityEventType.FAILED_AUTH);
    });

    it('should filter logs by start time', async () => {
      const now = Date.now();
      const logs = await service.getLogs({ startTime: now - 600 });

      expect(logs).toHaveLength(2);
      expect(logs[0].getMessage()).toBe('Message 2');
      expect(logs[1].getMessage()).toBe('Message 3');
    });

    it('should filter logs by end time', async () => {
      const now = Date.now();
      const logs = await service.getLogs({ endTime: now - 600 });

      expect(logs).toHaveLength(1);
      expect(logs[0].getMessage()).toBe('Message 1');
    });

    it('should filter logs by time range', async () => {
      const now = Date.now();
      const logs = await service.getLogs({
        startTime: now - 800,
        endTime: now - 400,
      });

      expect(logs).toHaveLength(1);
      expect(logs[0].getMessage()).toBe('Message 2');
    });

    it('should limit number of returned logs', async () => {
      const logs = await service.getLogs({ limit: 2 });

      expect(logs).toHaveLength(2);
      // Should return newest first
      expect(logs[0].getMessage()).toBe('Message 3');
      expect(logs[1].getMessage()).toBe('Message 2');
    });

    it('should combine multiple filters', async () => {
      const now = Date.now();
      const logs = await service.getLogs({
        sources: ['Source1', 'Source2'],
        securityEventsOnly: false,
        startTime: now - 1500,
        limit: 2,
      });

      expect(logs).toHaveLength(2);
    });

    it('should return empty array when no logs match filter', async () => {
      const logs = await service.getLogs({ sources: ['NonExistentSource'] });

      expect(logs).toHaveLength(0);
    });

    it('should return empty array when storage is empty', async () => {
      mockStorageData['centralized_logs'] = [];
      const logs = await service.getLogs();

      expect(logs).toHaveLength(0);
    });
  });

  describe('getLogCount', () => {
    it('should return 0 for empty storage', async () => {
      const count = await service.getLogCount();
      expect(count).toBe(0);
    });

    it('should return correct count of logs', async () => {
      const logs: LogEntryProps[] = [
        {
          id: 'log_1',
          timestamp: Date.now(),
          level: LogLevel.INFO,
          source: 'Source1',
          message: 'Message 1',
          isSecurityEvent: false,
        },
        {
          id: 'log_2',
          timestamp: Date.now(),
          level: LogLevel.WARN,
          source: 'Source2',
          message: 'Message 2',
          isSecurityEvent: false,
        },
      ];

      mockStorageData['centralized_logs'] = logs;

      const count = await service.getLogCount();
      expect(count).toBe(2);
    });
  });

  describe('deleteOldLogs', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1609459200000); // 2021-01-01 00:00:00 UTC
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should delete logs older than specified days', async () => {
      const logs: LogEntryProps[] = [
        {
          id: 'log_1',
          timestamp: 1609459200000 - 10 * 24 * 60 * 60 * 1000, // 10 days ago
          level: LogLevel.INFO,
          source: 'Source1',
          message: 'Old message',
          isSecurityEvent: false,
        },
        {
          id: 'log_2',
          timestamp: 1609459200000 - 5 * 24 * 60 * 60 * 1000, // 5 days ago
          level: LogLevel.INFO,
          source: 'Source2',
          message: 'Recent message',
          isSecurityEvent: false,
        },
        {
          id: 'log_3',
          timestamp: 1609459200000, // Now
          level: LogLevel.INFO,
          source: 'Source3',
          message: 'Current message',
          isSecurityEvent: false,
        },
      ];

      mockStorageData['centralized_logs'] = logs;

      const deletedCount = await service.deleteOldLogs(7);

      expect(deletedCount).toBe(1);

      const remainingLogs = mockStorageData['centralized_logs'];
      expect(remainingLogs).toHaveLength(2);
      expect(remainingLogs[0].message).toBe('Recent message');
      expect(remainingLogs[1].message).toBe('Current message');
    });

    it('should return 0 when no logs are old enough', async () => {
      const logs: LogEntryProps[] = [
        {
          id: 'log_1',
          timestamp: 1609459200000 - 5 * 24 * 60 * 60 * 1000, // 5 days ago
          level: LogLevel.INFO,
          source: 'Source1',
          message: 'Recent message',
          isSecurityEvent: false,
        },
      ];

      mockStorageData['centralized_logs'] = logs;

      const deletedCount = await service.deleteOldLogs(7);

      expect(deletedCount).toBe(0);
      expect(mockStorageData['centralized_logs']).toHaveLength(1);
    });

    it('should handle empty storage', async () => {
      const deletedCount = await service.deleteOldLogs(7);

      expect(deletedCount).toBe(0);
    });
  });

  describe('clearAllLogs', () => {
    it('should clear all logs from storage', async () => {
      const logs: LogEntryProps[] = [
        {
          id: 'log_1',
          timestamp: Date.now(),
          level: LogLevel.INFO,
          source: 'Source1',
          message: 'Message 1',
          isSecurityEvent: false,
        },
        {
          id: 'log_2',
          timestamp: Date.now(),
          level: LogLevel.WARN,
          source: 'Source2',
          message: 'Message 2',
          isSecurityEvent: false,
        },
      ];

      mockStorageData['centralized_logs'] = logs;

      await service.clearAllLogs();

      expect(mockStorageData['centralized_logs']).toHaveLength(0);
    });

    it('should handle already empty storage', async () => {
      await service.clearAllLogs();

      expect(mockStorageData['centralized_logs']).toHaveLength(0);
    });
  });

  describe('deleteLog', () => {
    beforeEach(() => {
      const logs: LogEntryProps[] = [
        {
          id: 'log_1',
          timestamp: Date.now(),
          level: LogLevel.INFO,
          source: 'Source1',
          message: 'Message 1',
          isSecurityEvent: false,
        },
        {
          id: 'log_2',
          timestamp: Date.now(),
          level: LogLevel.WARN,
          source: 'Source2',
          message: 'Message 2',
          isSecurityEvent: false,
        },
      ];

      mockStorageData['centralized_logs'] = logs;
    });

    it('should delete a specific log by ID', async () => {
      const deleted = await service.deleteLog('log_1');

      expect(deleted).toBe(true);
      expect(mockStorageData['centralized_logs']).toHaveLength(1);
      expect(mockStorageData['centralized_logs'][0].id).toBe('log_2');
    });

    it('should return false when log ID not found', async () => {
      const deleted = await service.deleteLog('non_existent_id');

      expect(deleted).toBe(false);
      expect(mockStorageData['centralized_logs']).toHaveLength(2);
    });

    it('should handle empty storage', async () => {
      mockStorageData['centralized_logs'] = [];
      const deleted = await service.deleteLog('log_1');

      expect(deleted).toBe(false);
    });
  });

  describe('applyRotation', () => {
    it('should keep only maxLogs most recent entries', async () => {
      const now = Date.now();
      const logs: LogEntryProps[] = [
        {
          id: 'log_1',
          timestamp: now - 4000,
          level: LogLevel.INFO,
          source: 'Source1',
          message: 'Message 1',
          isSecurityEvent: false,
        },
        {
          id: 'log_2',
          timestamp: now - 3000,
          level: LogLevel.INFO,
          source: 'Source2',
          message: 'Message 2',
          isSecurityEvent: false,
        },
        {
          id: 'log_3',
          timestamp: now - 2000,
          level: LogLevel.INFO,
          source: 'Source3',
          message: 'Message 3',
          isSecurityEvent: false,
        },
        {
          id: 'log_4',
          timestamp: now - 1000,
          level: LogLevel.INFO,
          source: 'Source4',
          message: 'Message 4',
          isSecurityEvent: false,
        },
        {
          id: 'log_5',
          timestamp: now,
          level: LogLevel.INFO,
          source: 'Source5',
          message: 'Message 5',
          isSecurityEvent: false,
        },
      ];

      mockStorageData['centralized_logs'] = logs;

      const deletedCount = await service.applyRotation(3);

      expect(deletedCount).toBe(2);
      expect(mockStorageData['centralized_logs']).toHaveLength(3);

      // Should keep the 3 most recent logs
      const remainingLogs = mockStorageData['centralized_logs'];
      expect(remainingLogs[0].id).toBe('log_5');
      expect(remainingLogs[1].id).toBe('log_4');
      expect(remainingLogs[2].id).toBe('log_3');
    });

    it('should return 0 when log count is below maxLogs', async () => {
      const logs: LogEntryProps[] = [
        {
          id: 'log_1',
          timestamp: Date.now(),
          level: LogLevel.INFO,
          source: 'Source1',
          message: 'Message 1',
          isSecurityEvent: false,
        },
        {
          id: 'log_2',
          timestamp: Date.now(),
          level: LogLevel.INFO,
          source: 'Source2',
          message: 'Message 2',
          isSecurityEvent: false,
        },
      ];

      mockStorageData['centralized_logs'] = logs;

      const deletedCount = await service.applyRotation(5);

      expect(deletedCount).toBe(0);
      expect(mockStorageData['centralized_logs']).toHaveLength(2);
    });

    it('should return 0 when log count equals maxLogs', async () => {
      const logs: LogEntryProps[] = [
        {
          id: 'log_1',
          timestamp: Date.now(),
          level: LogLevel.INFO,
          source: 'Source1',
          message: 'Message 1',
          isSecurityEvent: false,
        },
        {
          id: 'log_2',
          timestamp: Date.now(),
          level: LogLevel.INFO,
          source: 'Source2',
          message: 'Message 2',
          isSecurityEvent: false,
        },
      ];

      mockStorageData['centralized_logs'] = logs;

      const deletedCount = await service.applyRotation(2);

      expect(deletedCount).toBe(0);
      expect(mockStorageData['centralized_logs']).toHaveLength(2);
    });

    it('should handle empty storage', async () => {
      const deletedCount = await service.applyRotation(10);

      expect(deletedCount).toBe(0);
    });

    it('should sort by timestamp descending', async () => {
      const now = Date.now();
      const logs: LogEntryProps[] = [
        {
          id: 'log_1',
          timestamp: now - 2000,
          level: LogLevel.INFO,
          source: 'Source1',
          message: 'Middle',
          isSecurityEvent: false,
        },
        {
          id: 'log_2',
          timestamp: now,
          level: LogLevel.INFO,
          source: 'Source2',
          message: 'Newest',
          isSecurityEvent: false,
        },
        {
          id: 'log_3',
          timestamp: now - 4000,
          level: LogLevel.INFO,
          source: 'Source3',
          message: 'Oldest',
          isSecurityEvent: false,
        },
      ];

      mockStorageData['centralized_logs'] = logs;

      await service.applyRotation(2);

      const remainingLogs = mockStorageData['centralized_logs'];
      expect(remainingLogs[0].message).toBe('Newest');
      expect(remainingLogs[1].message).toBe('Middle');
    });
  });

  describe('chrome.storage error handling', () => {
    it('should handle storage.get errors', async () => {
      (chrome.runtime as any).lastError = { message: 'Get error' };
      console.error = jest.fn();

      const logs = await service.getLogs();

      expect(console.error).toHaveBeenCalledWith('Failed to load logs:', expect.any(Object));
      expect(logs).toHaveLength(0);

      (chrome.runtime as any).lastError = undefined;
    });

    it('should handle storage.set errors', async () => {
      (chrome.runtime as any).lastError = { message: 'Set error' };
      console.error = jest.fn();

      const logEntry = LogEntry.create({
        timestamp: Date.now(),
        level: LogLevel.ERROR,
        source: 'TestSource',
        message: 'Test message',
        isSecurityEvent: false,
      });

      await expect(service.addLog(logEntry)).rejects.toThrow('Set error');

      (chrome.runtime as any).lastError = undefined;
    });
  });

  describe('data integrity', () => {
    it('should preserve all log properties through save and load', async () => {
      const originalLog = LogEntry.create({
        timestamp: 1234567890,
        level: LogLevel.WARN,
        source: 'TestSource',
        message: 'Test message',
        context: { userId: '123', action: 'login' },
        error: { message: 'Test error', stack: 'Error stack' },
        isSecurityEvent: true,
        securityEventType: SecurityEventType.FAILED_AUTH,
      });

      await service.addLog(originalLog);

      const logs = await service.getLogs();
      expect(logs).toHaveLength(1);

      const retrievedLog = logs[0];
      expect(retrievedLog.getId()).toBe(originalLog.getId());
      expect(retrievedLog.getTimestamp()).toBe(originalLog.getTimestamp());
      expect(retrievedLog.getLevel()).toBe(originalLog.getLevel());
      expect(retrievedLog.getSource()).toBe(originalLog.getSource());
      expect(retrievedLog.getMessage()).toBe(originalLog.getMessage());
      expect(retrievedLog.getContext()).toEqual(originalLog.getContext());
      expect(retrievedLog.getError()).toEqual(originalLog.getError());
      expect(retrievedLog.isSecurityEvent()).toBe(originalLog.isSecurityEvent());
      expect(retrievedLog.getSecurityEventType()).toBe(originalLog.getSecurityEventType());
    });
  });
});
