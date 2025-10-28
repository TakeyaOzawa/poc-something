/**
 * Unit Tests: SecurityLogViewerPresenter
 */

import { SecurityLogViewerPresenter, LogFilterOptions } from '../SecurityLogViewerPresenter';
import { LogAggregatorPort } from '@/domain/types/log-aggregator-port.types';
import { LogEntry, SecurityEventType } from '@/domain/entities/LogEntry';
import { LogLevel } from '@/domain/types/logger.types';

describe('SecurityLogViewerPresenter', () => {
  let presenter: SecurityLogViewerPresenter;
  let mockLogAggregatorService: jest.Mocked<LogAggregatorPort>;

  // Mock logs
  const mockLogs: LogEntry[] = [
    LogEntry.create({
      timestamp: 1000,
      level: LogLevel.INFO,
      source: 'background',
      message: 'Test info log',
      isSecurityEvent: false,
    }),
    LogEntry.create({
      timestamp: 2000,
      level: LogLevel.WARN,
      source: 'popup',
      message: 'Test warning log',
      isSecurityEvent: true,
      securityEventType: SecurityEventType.FAILED_AUTH,
    }),
    LogEntry.create({
      timestamp: 3000,
      level: LogLevel.ERROR,
      source: 'content-script',
      message: 'Test error log',
      isSecurityEvent: true,
      securityEventType: SecurityEventType.LOCKOUT,
      error: { message: 'Test error', stack: 'stack trace' },
    }),
  ];

  beforeEach(() => {
    mockLogAggregatorService = {
      getLogs: jest.fn().mockResolvedValue(mockLogs),
      addLog: jest.fn(),
      getLogCount: jest.fn(),
      deleteOldLogs: jest.fn(),
      clearAllLogs: jest.fn(),
      deleteLog: jest.fn(),
      applyRotation: jest.fn(),
    } as any;

    presenter = new SecurityLogViewerPresenter(mockLogAggregatorService);
  });

  describe('initialize', () => {
    it('should load logs on initialization', async () => {
      await presenter.initialize();

      expect(mockLogAggregatorService.getLogs).toHaveBeenCalled();
      expect(presenter.getFilteredLogs()).toHaveLength(3);
    });
  });

  describe('loadLogs', () => {
    it('should load all logs from service', async () => {
      await presenter.loadLogs();

      expect(mockLogAggregatorService.getLogs).toHaveBeenCalled();
      expect(presenter.getFilteredLogs()).toHaveLength(3);
    });
  });

  describe('getAvailableSources', () => {
    it('should return unique sorted sources', async () => {
      await presenter.loadLogs();
      const sources = presenter.getAvailableSources();

      expect(sources).toEqual(['background', 'content-script', 'popup']);
    });

    it('should return empty array when no logs', () => {
      const sources = presenter.getAvailableSources();
      expect(sources).toEqual([]);
    });
  });

  describe('getAvailableSecurityEventTypes', () => {
    it('should return unique security event types', async () => {
      await presenter.loadLogs();
      const eventTypes = presenter.getAvailableSecurityEventTypes();

      expect(eventTypes).toEqual([SecurityEventType.FAILED_AUTH, SecurityEventType.LOCKOUT]);
    });

    it('should return empty array when no security events', async () => {
      mockLogAggregatorService.getLogs.mockResolvedValue([
        LogEntry.create({
          timestamp: 1000,
          level: LogLevel.INFO,
          source: 'background',
          message: 'Regular log',
          isSecurityEvent: false,
        }),
      ]);

      await presenter.loadLogs();
      const eventTypes = presenter.getAvailableSecurityEventTypes();

      expect(eventTypes).toEqual([]);
    });
  });

  describe('applyFilter', () => {
    beforeEach(async () => {
      await presenter.loadLogs();
    });

    it('should filter by sources', () => {
      const filter: LogFilterOptions = {
        sources: ['background'],
      };

      presenter.applyFilter(filter);
      const filtered = presenter.getFilteredLogs();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].getSource()).toBe('background');
    });

    it('should filter by levels', () => {
      const filter: LogFilterOptions = {
        levels: [LogLevel.INFO, LogLevel.ERROR],
      };

      presenter.applyFilter(filter);
      const filtered = presenter.getFilteredLogs();

      expect(filtered).toHaveLength(2);
      expect(filtered[0].getLevel()).toBe(LogLevel.INFO);
      expect(filtered[1].getLevel()).toBe(LogLevel.ERROR);
    });

    it('should filter by security event types', () => {
      const filter: LogFilterOptions = {
        securityEventTypes: [SecurityEventType.LOCKOUT],
      };

      presenter.applyFilter(filter);
      const filtered = presenter.getFilteredLogs();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].getSecurityEventType()).toBe(SecurityEventType.LOCKOUT);
    });

    it('should filter by time range', () => {
      const filter: LogFilterOptions = {
        startTime: 1500,
        endTime: 2500,
      };

      presenter.applyFilter(filter);
      const filtered = presenter.getFilteredLogs();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].getTimestamp()).toBe(2000);
    });

    it('should filter security events only', () => {
      const filter: LogFilterOptions = {
        securityEventsOnly: true,
      };

      presenter.applyFilter(filter);
      const filtered = presenter.getFilteredLogs();

      expect(filtered).toHaveLength(2);
      expect(filtered[0].isSecurityEvent()).toBe(true);
      expect(filtered[1].isSecurityEvent()).toBe(true);
    });

    it('should apply multiple filters', () => {
      const filter: LogFilterOptions = {
        sources: ['popup', 'content-script'],
        securityEventsOnly: true,
        levels: [LogLevel.ERROR],
      };

      presenter.applyFilter(filter);
      const filtered = presenter.getFilteredLogs();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].getSource()).toBe('content-script');
      expect(filtered[0].getLevel()).toBe(LogLevel.ERROR);
      expect(filtered[0].isSecurityEvent()).toBe(true);
    });

    it('should return all logs when no filter applied', () => {
      presenter.applyFilter({});
      const filtered = presenter.getFilteredLogs();

      expect(filtered).toHaveLength(3);
    });
  });

  describe('clearFilter', () => {
    it('should clear all filters and show all logs', async () => {
      await presenter.loadLogs();

      // Apply filter first
      presenter.applyFilter({ sources: ['background'] });
      expect(presenter.getFilteredLogs()).toHaveLength(1);

      // Clear filter
      presenter.clearFilter();
      expect(presenter.getFilteredLogs()).toHaveLength(3);
    });
  });

  describe('getCurrentFilter', () => {
    it('should return current filter options', async () => {
      await presenter.loadLogs();

      const filter: LogFilterOptions = {
        sources: ['background'],
        securityEventsOnly: true,
      };

      presenter.applyFilter(filter);
      const currentFilter = presenter.getCurrentFilter();

      expect(currentFilter).toEqual(filter);
    });
  });

  describe('exportLogs', () => {
    beforeEach(async () => {
      await presenter.loadLogs();
    });

    it('should export logs as JSON', () => {
      const json = presenter.exportLogs('json');
      const data = JSON.parse(json);

      expect(data).toHaveLength(3);
      expect(data[0].message).toBe('Test info log');
      expect(data[1].isSecurityEvent).toBe(true);
    });

    it('should export logs as CSV', () => {
      const csv = presenter.exportLogs('csv');
      const lines = csv.split('\n');

      // Header + 3 data rows
      expect(lines).toHaveLength(4);
      expect(lines[0]).toContain('Timestamp');
      expect(lines[0]).toContain('Level');
      expect(lines[0]).toContain('Source');
      expect(lines[0]).toContain('Message');
    });

    it('should handle CSV values with commas', async () => {
      const logWithComma = LogEntry.create({
        timestamp: 4000,
        level: LogLevel.INFO,
        source: 'test',
        message: 'Message with, comma',
        isSecurityEvent: false,
      });

      mockLogAggregatorService.getLogs.mockResolvedValue([logWithComma]);
      await presenter.loadLogs();

      const csv = presenter.exportLogs('csv');
      expect(csv).toContain('"Message with, comma"');
    });

    it('should handle CSV values with quotes', async () => {
      const logWithQuote = LogEntry.create({
        timestamp: 4000,
        level: LogLevel.INFO,
        source: 'test',
        message: 'Message with "quotes"',
        isSecurityEvent: false,
      });

      mockLogAggregatorService.getLogs.mockResolvedValue([logWithQuote]);
      await presenter.loadLogs();

      const csv = presenter.exportLogs('csv');
      expect(csv).toContain('Message with ""quotes""');
    });

    it('should throw error for unsupported format', () => {
      expect(() => {
        presenter.exportLogs('xml' as any);
      }).toThrow('Unsupported export format: xml');
    });

    it('should export empty CSV when no logs', async () => {
      mockLogAggregatorService.getLogs.mockResolvedValue([]);
      await presenter.loadLogs();

      const csv = presenter.exportLogs('csv');
      expect(csv).toBe('');
    });
  });

  describe('getStatistics', () => {
    beforeEach(async () => {
      await presenter.loadLogs();
    });

    it('should return correct statistics', () => {
      const stats = presenter.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.securityEvents).toBe(2);
      expect(stats.byLevel[LogLevel.INFO]).toBe(1);
      expect(stats.byLevel[LogLevel.WARN]).toBe(1);
      expect(stats.byLevel[LogLevel.ERROR]).toBe(1);
      expect(stats.bySource['background']).toBe(1);
      expect(stats.bySource['popup']).toBe(1);
      expect(stats.bySource['content-script']).toBe(1);
    });

    it('should reflect filtered logs in statistics', () => {
      presenter.applyFilter({ securityEventsOnly: true });
      const stats = presenter.getStatistics();

      expect(stats.total).toBe(2);
      expect(stats.securityEvents).toBe(2);
    });
  });

  describe('downloadFile', () => {
    it('should download file with correct parameters', () => {
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      } as any;

      // Mock URL.createObjectURL and URL.revokeObjectURL
      const originalCreateObjectURL = URL.createObjectURL;
      const originalRevokeObjectURL = URL.revokeObjectURL;

      URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
      URL.revokeObjectURL = jest.fn();

      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink);
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation();
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation();

      const content = 'test content';
      const filename = 'test.txt';
      const mimeType = 'text/plain';

      presenter.downloadFile(content, filename, mimeType);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(mockLink.download).toBe(filename);
      expect(mockLink.click).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

      // Restore
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });
  });
});
