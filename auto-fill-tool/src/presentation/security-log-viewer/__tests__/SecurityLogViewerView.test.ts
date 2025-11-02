/**
 * Unit Tests: SecurityLogViewerView
 */

import { SecurityLogViewerView } from '../SecurityLogViewerView';
import { SecurityLogViewerPresenter } from '../SecurityLogViewerPresenter';
import { LogEntry, SecurityEventType } from '@/domain/entities/LogEntry';
import { LogLevel } from '@/domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('SecurityLogViewerView', () => {
  let view: SecurityLogViewerView;
  let mockPresenter: jest.Mocked<SecurityLogViewerPresenter>;

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
  ];

  beforeEach(() => {
    // Mock DOM
    document.body.innerHTML = `
      <table>
        <tbody id="logTableBody"></tbody>
      </table>
      <select id="filterSources"></select>
      <select id="filterLevels" multiple></select>
      <select id="filterEventTypes"></select>
      <input type="datetime-local" id="filterStartDate" />
      <input type="datetime-local" id="filterEndDate" />
      <input type="checkbox" id="securityEventsOnly" />
      <button id="applyFilterBtn"></button>
      <button id="clearFilterBtn"></button>
      <button id="exportJsonBtn"></button>
      <button id="exportCsvBtn"></button>
      <button id="refreshBtn"></button>
      <span id="totalLogs">0</span>
      <span id="securityEvents">0</span>
    `;

    mockPresenter = {
      loadLogs: jest.fn().mockResolvedValue(undefined),
      getAvailableSources: jest.fn().mockReturnValue(['background', 'popup']),
      getAvailableSecurityEventTypes: jest.fn().mockReturnValue([SecurityEventType.FAILED_AUTH]),
      getFilteredLogs: jest.fn().mockReturnValue(mockLogs),
      applyFilter: jest.fn(),
      clearFilter: jest.fn(),
      getCurrentFilter: jest.fn().mockReturnValue({}),
      exportLogs: jest.fn().mockReturnValue('export data'),
      downloadFile: jest.fn(),
      getStatistics: jest.fn().mockReturnValue({
        total: 2,
        securityEvents: 1,
        byLevel: {
          [LogLevel.DEBUG]: 0,
          [LogLevel.INFO]: 1,
          [LogLevel.WARN]: 1,
          [LogLevel.ERROR]: 0,
          [LogLevel.NONE]: 0,
        },
        bySource: {},
      }),
    } as any;

    view = new SecurityLogViewerView(mockPresenter);
  });

  describe('initialize', () => {
    it('should initialize view and load data', async () => {
      await view.initialize();

      expect(mockPresenter.loadLogs).toHaveBeenCalled();
      expect(mockPresenter.getAvailableSources).toHaveBeenCalled();
      expect(mockPresenter.getAvailableSecurityEventTypes).toHaveBeenCalled();
      expect(mockPresenter.getFilteredLogs).toHaveBeenCalled();
    });

    it('should populate filter options', async () => {
      await view.initialize();

      const sourcesSelect = document.getElementById('filterSources') as HTMLSelectElement;
      expect(sourcesSelect.options.length).toBeGreaterThan(0);

      const eventTypesSelect = document.getElementById('filterEventTypes') as HTMLSelectElement;
      expect(eventTypesSelect.options.length).toBeGreaterThan(0);
    });

    it('should render logs in table', async () => {
      await view.initialize();

      const tableBody = document.getElementById('logTableBody');
      expect(tableBody?.children.length).toBe(2);
    });

    it('should display statistics', async () => {
      await view.initialize();

      const totalLogs = document.getElementById('totalLogs');
      const securityEvents = document.getElementById('securityEvents');

      expect(totalLogs?.textContent).toBe('2');
      expect(securityEvents?.textContent).toBe('1');
    });
  });

  describe('renderLogs', () => {
    it('should render empty state when no logs', async () => {
      mockPresenter.getFilteredLogs.mockReturnValue([]);
      await view.initialize();

      const tableBody = document.getElementById('logTableBody');
      expect(tableBody?.textContent).toContain('No logs found');
    });

    it('should render security event badge', async () => {
      await view.initialize();

      const tableBody = document.getElementById('logTableBody');
      expect(tableBody?.innerHTML).toContain('FAILED_AUTH');
    });

    it('should escape HTML in messages', async () => {
      const maliciousLog = LogEntry.create({
        timestamp: 3000,
        level: LogLevel.INFO,
        source: 'test',
        message: '<script>alert("xss")</script>',
        isSecurityEvent: false,
      });

      mockPresenter.getFilteredLogs.mockReturnValue([maliciousLog]);
      await view.initialize();

      const tableBody = document.getElementById('logTableBody');
      const cellContent = tableBody?.textContent || '';
      // Check that the cell content contains escaped version
      expect(cellContent).toContain('<script>');
      // Check that it's properly escaped in the HTML structure
      expect(tableBody?.innerHTML).toContain('&lt;script&gt;');
    });
  });

  describe('handleApplyFilter', () => {
    it('should apply filter with sources', async () => {
      await view.initialize();

      const sourcesSelect = document.getElementById('filterSources') as HTMLSelectElement;
      sourcesSelect.value = 'background';

      const applyBtn = document.getElementById('applyFilterBtn') as HTMLButtonElement;
      applyBtn.click();

      expect(mockPresenter.applyFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          sources: ['background'],
        })
      );
    });

    it('should apply filter with levels', async () => {
      await view.initialize();

      const levelsSelect = document.getElementById('filterLevels') as HTMLSelectElement;
      const option = document.createElement('option');
      option.value = String(LogLevel.INFO);
      option.selected = true;
      levelsSelect.appendChild(option);

      const applyBtn = document.getElementById('applyFilterBtn') as HTMLButtonElement;
      applyBtn.click();

      expect(mockPresenter.applyFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          levels: [LogLevel.INFO],
        })
      );
    });

    it('should apply filter with event types', async () => {
      await view.initialize();

      const eventTypesSelect = document.getElementById('filterEventTypes') as HTMLSelectElement;
      eventTypesSelect.value = SecurityEventType.FAILED_AUTH;

      const applyBtn = document.getElementById('applyFilterBtn') as HTMLButtonElement;
      applyBtn.click();

      expect(mockPresenter.applyFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          securityEventTypes: [SecurityEventType.FAILED_AUTH],
        })
      );
    });

    it('should apply filter with date range', async () => {
      await view.initialize();

      const startDateInput = document.getElementById('filterStartDate') as HTMLInputElement;
      const endDateInput = document.getElementById('filterEndDate') as HTMLInputElement;

      startDateInput.value = '2025-01-01T00:00';
      endDateInput.value = '2025-01-31T23:59';

      const applyBtn = document.getElementById('applyFilterBtn') as HTMLButtonElement;
      applyBtn.click();

      expect(mockPresenter.applyFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: expect.any(Number),
          endTime: expect.any(Number),
        })
      );
    });

    it('should apply filter with security events only checkbox', async () => {
      await view.initialize();

      const checkbox = document.getElementById('securityEventsOnly') as HTMLInputElement;
      checkbox.checked = true;

      const applyBtn = document.getElementById('applyFilterBtn') as HTMLButtonElement;
      applyBtn.click();

      expect(mockPresenter.applyFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          securityEventsOnly: true,
        })
      );
    });
  });

  describe('handleClearFilter', () => {
    it('should clear all filter inputs', async () => {
      await view.initialize();

      // Set filter values
      const sourcesSelect = document.getElementById('filterSources') as HTMLSelectElement;
      const eventTypesSelect = document.getElementById('filterEventTypes') as HTMLSelectElement;
      const startDateInput = document.getElementById('filterStartDate') as HTMLInputElement;
      const endDateInput = document.getElementById('filterEndDate') as HTMLInputElement;
      const checkbox = document.getElementById('securityEventsOnly') as HTMLInputElement;

      sourcesSelect.value = 'background';
      eventTypesSelect.value = SecurityEventType.FAILED_AUTH;
      startDateInput.value = '2025-01-01T00:00';
      endDateInput.value = '2025-01-31T23:59';
      checkbox.checked = true;

      // Clear filter
      const clearBtn = document.getElementById('clearFilterBtn') as HTMLButtonElement;
      clearBtn.click();

      expect(sourcesSelect.value).toBe('');
      expect(eventTypesSelect.value).toBe('');
      expect(startDateInput.value).toBe('');
      expect(endDateInput.value).toBe('');
      expect(checkbox.checked).toBe(false);
      expect(mockPresenter.clearFilter).toHaveBeenCalled();
    });
  });

  describe('handleExport', () => {
    it('should export as JSON', async () => {
      await view.initialize();

      const exportJsonBtn = document.getElementById('exportJsonBtn') as HTMLButtonElement;
      exportJsonBtn.click();

      expect(mockPresenter.exportLogs).toHaveBeenCalledWith('json');
      expect(mockPresenter.downloadFile).toHaveBeenCalledWith(
        'export data',
        expect.stringContaining('.json'),
        'application/json'
      );
    });

    it('should export as CSV', async () => {
      await view.initialize();

      const exportCsvBtn = document.getElementById('exportCsvBtn') as HTMLButtonElement;
      exportCsvBtn.click();

      expect(mockPresenter.exportLogs).toHaveBeenCalledWith('csv');
      expect(mockPresenter.downloadFile).toHaveBeenCalledWith(
        'export data',
        expect.stringContaining('.csv'),
        'text/csv'
      );
    });
  });

  describe('refreshData', () => {
    it('should reload logs and update UI', async () => {
      await view.initialize();

      mockPresenter.loadLogs.mockClear();
      mockPresenter.getFilteredLogs.mockClear();

      const refreshBtn = document.getElementById('refreshBtn') as HTMLButtonElement;
      refreshBtn.click();

      // Wait for async operation
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPresenter.loadLogs).toHaveBeenCalled();
      expect(mockPresenter.getFilteredLogs).toHaveBeenCalled();
    });
  });

  describe('showLogDetails', () => {
    beforeEach(() => {
      // Mock window.alert
      global.alert = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should show log details in alert', async () => {
      await view.initialize();

      // Expose showLogDetails to window
      (window as any).showLogDetails = (logId: string) => {
        view.showLogDetails(logId);
      };

      const logId = mockLogs[0].getId();
      view.showLogDetails(logId);

      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('Log Details'));
    });

    it('should handle non-existent log ID', async () => {
      await view.initialize();

      view.showLogDetails('non-existent-id');

      expect(global.alert).not.toHaveBeenCalled();
    });
  });

  describe('populateFilterOptions', () => {
    it('should populate sources dropdown', async () => {
      await view.initialize();

      const sourcesSelect = document.getElementById('filterSources') as HTMLSelectElement;
      const options = Array.from(sourcesSelect.options).map((opt) => opt.value);

      expect(options).toContain('');
      expect(options).toContain('background');
      expect(options).toContain('popup');
    });

    it('should populate event types dropdown', async () => {
      await view.initialize();

      const eventTypesSelect = document.getElementById('filterEventTypes') as HTMLSelectElement;
      const options = Array.from(eventTypesSelect.options).map((opt) => opt.value);

      expect(options).toContain('');
      expect(options).toContain(SecurityEventType.FAILED_AUTH);
    });
  });

  describe('updateStatistics', () => {
    it('should update statistics display', async () => {
      mockPresenter.getStatistics.mockReturnValue({
        total: 10,
        securityEvents: 5,
        byLevel: {
          [LogLevel.DEBUG]: 0,
          [LogLevel.INFO]: 0,
          [LogLevel.WARN]: 0,
          [LogLevel.ERROR]: 0,
          [LogLevel.NONE]: 0,
        },
        bySource: {},
      });

      await view.initialize();

      const totalLogs = document.getElementById('totalLogs');
      const securityEvents = document.getElementById('securityEvents');

      expect(totalLogs?.textContent).toBe('10');
      expect(securityEvents?.textContent).toBe('5');
    });
  });
});
