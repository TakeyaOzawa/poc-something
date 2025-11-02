/**
 * Test Suite: StorageSyncManagerCoordinator
 * Tests the coordinator for Storage Sync Manager page
 */

import { StorageSyncManagerCoordinator } from '../StorageSyncManagerCoordinator';
import { UnifiedNavigationBar } from '@presentation/common/UnifiedNavigationBar';
import type { StorageSyncManagerCoordinatorDependencies } from '../../types';
import { Logger } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock UnifiedNavigationBar
jest.mock('@presentation/common/UnifiedNavigationBar');

// Mock I18nAdapter
jest.mock('@/infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => {
      const messages: Record<string, string> = {
        storageSyncConfigs: 'Storage Sync Configs',
      };
      return messages[key] || key;
    }),
  },
}));

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('StorageSyncManagerCoordinator', () => {
  let coordinator: StorageSyncManagerCoordinator;
  let mockDependencies: StorageSyncManagerCoordinatorDependencies;
  let mockLogger: jest.Mocked<Logger>;
  let mockUnifiedNavBar: HTMLDivElement;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup DOM
    document.body.innerHTML = '<div></div>';
    document.body.style.background = '';

    // Create mock logger
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Logger>;

    // Create mock dependencies
    mockDependencies = {
      logger: mockLogger,
      settings: {
        getGradientStartColor: jest.fn().mockReturnValue('#667eea'),
        getGradientEndColor: jest.fn().mockReturnValue('#764ba2'),
        getGradientAngle: jest.fn().mockReturnValue(135),
      },
      exportXPathsUseCase: {
        execute: jest.fn().mockResolvedValue({ success: true, csv: 'xpath,data\ntest,value' }),
      },
      exportWebsitesUseCase: {
        execute: jest
          .fn()
          .mockResolvedValue({ success: true, csvText: 'website,url\ntest,http://test.com' }),
      },
      exportAutomationVariablesUseCase: {
        execute: jest.fn().mockResolvedValue({ csvText: 'variable,value\ntest,123' }),
      },
      exportSystemSettingsUseCase: {
        execute: jest.fn().mockResolvedValue(Result.success('setting,value\ntest,true')),
      },
      exportStorageSyncConfigsUseCase: {
        execute: jest.fn().mockResolvedValue('config,value\ntest,abc'),
      },
      presenter: {
        importData: jest.fn().mockResolvedValue(undefined),
      },
      downloadFile: jest.fn(),
      onImportComplete: jest.fn().mockResolvedValue(undefined),
      tabs: {
        historyTabBtn: document.createElement('button'),
        configTabBtn: document.createElement('button'),
        onHistoryTabClick: jest.fn(),
        onConfigTabClick: jest.fn(),
      },
    } as unknown as StorageSyncManagerCoordinatorDependencies;

    mockUnifiedNavBar = document.createElement('div');

    coordinator = new StorageSyncManagerCoordinator(mockDependencies);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await coordinator.initialize(mockUnifiedNavBar);

      expect(mockLogger.info).toHaveBeenCalledWith('Storage Sync Manager Coordinator initialized');
      expect(UnifiedNavigationBar).toHaveBeenCalled();
    });

    it('should apply gradient background', async () => {
      await coordinator.initialize(mockUnifiedNavBar);

      // Note: In JSDOM, setting document.body.style.background may not preserve exact CSS string format
      // We verify that the gradient was applied by checking that applyGradientBackground was called
      // which is validated through logger calls
      expect(mockLogger.debug).toHaveBeenCalledWith('Applied gradient background', {
        startColor: '#667eea',
        endColor: '#764ba2',
        angle: 135,
      });
    });

    it('should attach tab event listeners', async () => {
      await coordinator.initialize(mockUnifiedNavBar);

      // Simulate tab button clicks
      mockDependencies.tabs.historyTabBtn?.click();
      mockDependencies.tabs.configTabBtn?.click();

      expect(mockDependencies.tabs.onHistoryTabClick).toHaveBeenCalled();
      expect(mockDependencies.tabs.onConfigTabClick).toHaveBeenCalled();
    });

    it('should log error when gradient application fails but continue initialization', async () => {
      const error = new Error('Gradient failed');
      mockDependencies.settings.getGradientStartColor = jest.fn().mockImplementation(() => {
        throw error;
      });

      // Initialization should complete even if gradient fails (due to retry mechanism)
      await coordinator.initialize(mockUnifiedNavBar);

      // Should log error for gradient failure
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to apply gradient background', error);
      // Should still complete initialization
      expect(mockLogger.info).toHaveBeenCalledWith('Storage Sync Manager Coordinator initialized');
    });
  });

  describe('initializeNavigationBar', () => {
    it('should initialize navigation bar with all export handlers', async () => {
      await coordinator.initialize(mockUnifiedNavBar);

      expect(UnifiedNavigationBar).toHaveBeenCalledWith(
        mockUnifiedNavBar,
        expect.objectContaining({
          title: 'Storage Sync Configs',
          onExportXPaths: expect.any(Function),
          onExportWebsites: expect.any(Function),
          onExportAutomationVariables: expect.any(Function),
          onExportSystemSettings: expect.any(Function),
          onExportStorageSyncConfigs: expect.any(Function),
          onImport: expect.any(Function),
          logger: mockLogger,
        })
      );

      expect(mockLogger.debug).toHaveBeenCalledWith('UnifiedNavigationBar initialized');
    });

    it('should handle onExportXPaths correctly', async () => {
      await coordinator.initialize(mockUnifiedNavBar);

      const navBarConfig = (UnifiedNavigationBar as jest.Mock).mock.calls[0][1];
      await navBarConfig.onExportXPaths();

      expect(mockDependencies.exportXPathsUseCase.execute).toHaveBeenCalled();
      expect(mockDependencies.downloadFile).toHaveBeenCalledWith(
        'xpath,data\ntest,value',
        expect.stringMatching(/^xpaths_\d{8}_\d{4}\.csv$/),
        'text/csv'
      );
    });

    it('should handle onExportWebsites correctly', async () => {
      await coordinator.initialize(mockUnifiedNavBar);

      const navBarConfig = (UnifiedNavigationBar as jest.Mock).mock.calls[0][1];
      await navBarConfig.onExportWebsites();

      expect(mockDependencies.exportWebsitesUseCase.execute).toHaveBeenCalled();
      expect(mockDependencies.downloadFile).toHaveBeenCalledWith(
        'website,url\ntest,http://test.com',
        expect.stringMatching(/^websites_\d{8}_\d{4}\.csv$/),
        'text/csv'
      );
    });

    it('should handle onExportAutomationVariables correctly', async () => {
      await coordinator.initialize(mockUnifiedNavBar);

      const navBarConfig = (UnifiedNavigationBar as jest.Mock).mock.calls[0][1];
      await navBarConfig.onExportAutomationVariables();

      expect(mockDependencies.exportAutomationVariablesUseCase.execute).toHaveBeenCalled();
      expect(mockDependencies.downloadFile).toHaveBeenCalledWith(
        'variable,value\ntest,123',
        expect.stringMatching(/^automation-variables_\d{8}_\d{4}\.csv$/),
        'text/csv'
      );
    });

    it('should handle onExportSystemSettings correctly', async () => {
      // Ensure the mock returns the expected Result
      mockDependencies.exportSystemSettingsUseCase.execute = jest
        .fn()
        .mockResolvedValue(Result.success('setting,value\ntest,true'));

      await coordinator.initialize(mockUnifiedNavBar);

      const navBarConfig = (UnifiedNavigationBar as jest.Mock).mock.calls[0][1];
      await navBarConfig.onExportSystemSettings();

      expect(mockDependencies.exportSystemSettingsUseCase.execute).toHaveBeenCalled();
      expect(mockDependencies.downloadFile).toHaveBeenCalledWith(
        'setting,value\ntest,true',
        expect.stringMatching(/^system_settings_\d{8}_\d{4}\.csv$/),
        'text/csv'
      );
    });

    it('should handle onExportStorageSyncConfigs correctly', async () => {
      await coordinator.initialize(mockUnifiedNavBar);

      const navBarConfig = (UnifiedNavigationBar as jest.Mock).mock.calls[0][1];
      await navBarConfig.onExportStorageSyncConfigs();

      expect(mockDependencies.exportStorageSyncConfigsUseCase.execute).toHaveBeenCalled();
      expect(mockDependencies.downloadFile).toHaveBeenCalledWith(
        'config,value\ntest,abc',
        expect.stringMatching(/^storage-sync-configs_\d{8}_\d{4}\.csv$/),
        'text/csv'
      );
    });

    it('should handle onImport correctly', async () => {
      await coordinator.initialize(mockUnifiedNavBar);

      // Mock File with text() method (not available in Node.js environment)
      const file = {
        text: jest.fn().mockResolvedValue('test,data'),
        name: 'import.csv',
        type: 'text/csv',
      } as unknown as File;
      const format = 'xpaths';

      const navBarConfig = (UnifiedNavigationBar as jest.Mock).mock.calls[0][1];
      await navBarConfig.onImport(file, format);

      expect(file.text).toHaveBeenCalled();
      expect(mockDependencies.presenter.importData).toHaveBeenCalledWith('test,data', format);
      expect(mockDependencies.onImportComplete).toHaveBeenCalled();
    });
  });

  describe('initializeTabs', () => {
    it('should initialize tabs when buttons exist', async () => {
      await coordinator.initialize(mockUnifiedNavBar);

      expect(mockLogger.debug).toHaveBeenCalledWith('Tab management initialized');
    });

    it('should handle missing history tab button gracefully', async () => {
      mockDependencies.tabs.historyTabBtn = null;

      await coordinator.initialize(mockUnifiedNavBar);

      expect(mockLogger.debug).toHaveBeenCalledWith('Tab management initialized');
    });

    it('should handle missing config tab button gracefully', async () => {
      mockDependencies.tabs.configTabBtn = null;

      await coordinator.initialize(mockUnifiedNavBar);

      expect(mockLogger.debug).toHaveBeenCalledWith('Tab management initialized');
    });

    it('should handle both tabs missing gracefully', async () => {
      mockDependencies.tabs.historyTabBtn = null;
      mockDependencies.tabs.configTabBtn = null;

      await coordinator.initialize(mockUnifiedNavBar);

      expect(mockLogger.debug).toHaveBeenCalledWith('Tab management initialized');
    });
  });

  describe('applyGradientBackgroundWithRetry', () => {
    it('should apply gradient on first attempt', async () => {
      await coordinator.initialize(mockUnifiedNavBar);

      // Verify gradient was applied through logger call (JSDOM doesn't preserve CSS string format)
      expect(mockLogger.debug).toHaveBeenCalledWith('Applied gradient background', {
        startColor: '#667eea',
        endColor: '#764ba2',
        angle: 135,
      });
    });

    it('should retry when gradient application fails initially', async () => {
      // Make getGradientStartColor throw error on first call, then succeed
      let callCount = 0;
      mockDependencies.settings.getGradientStartColor = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First attempt failed');
        }
        return '#667eea';
      });

      await coordinator.initialize(mockUnifiedNavBar);

      // The error is caught internally by applyGradientBackground and logged as error
      // Then retry mechanism succeeds on second attempt
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to apply gradient background',
        expect.any(Error)
      );
      // Should succeed on retry
      expect(mockLogger.debug).toHaveBeenCalledWith('Applied gradient background', {
        startColor: '#667eea',
        endColor: '#764ba2',
        angle: 135,
      });
    });

    it('should log error after all retries fail', async () => {
      mockDependencies.settings.getGradientStartColor = jest.fn().mockImplementation(() => {
        throw new Error('Always fails');
      });

      await coordinator.initialize(mockUnifiedNavBar);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to apply gradient background after all retries'
      );
    });
  });

  describe('applyGradientBackground', () => {
    it('should apply gradient with correct colors and angle', async () => {
      await coordinator.initialize(mockUnifiedNavBar);

      expect(mockLogger.debug).toHaveBeenCalledWith('Applied gradient background', {
        startColor: '#667eea',
        endColor: '#764ba2',
        angle: 135,
      });
    });

    it('should handle errors during gradient application', async () => {
      const error = new Error('Settings error');
      mockDependencies.settings.getGradientStartColor = jest.fn().mockImplementation(() => {
        throw error;
      });

      // Should not throw, just log error
      await coordinator.initialize(mockUnifiedNavBar);

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to apply gradient background', error);
    });
  });

  describe('formatDateForFilename', () => {
    it('should format date correctly for filename', async () => {
      const mockDate = new Date('2024-03-15T14:30:00');
      jest.spyOn(global, 'Date').mockImplementation((() => mockDate) as any);

      await coordinator.initialize(mockUnifiedNavBar);

      const navBarConfig = (UnifiedNavigationBar as jest.Mock).mock.calls[0][1];
      await navBarConfig.onExportXPaths();

      expect(mockDependencies.downloadFile).toHaveBeenCalledWith(
        expect.any(String),
        'xpaths_20240315_1430.csv',
        'text/csv'
      );

      jest.restoreAllMocks();
    });

    it('should pad single digit months and days', async () => {
      const mockDate = new Date('2024-01-05T09:05:00');
      jest.spyOn(global, 'Date').mockImplementation((() => mockDate) as any);

      await coordinator.initialize(mockUnifiedNavBar);

      const navBarConfig = (UnifiedNavigationBar as jest.Mock).mock.calls[0][1];
      await navBarConfig.onExportWebsites();

      expect(mockDependencies.downloadFile).toHaveBeenCalledWith(
        expect.any(String),
        'websites_20240105_0905.csv',
        'text/csv'
      );

      jest.restoreAllMocks();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined tab callbacks', async () => {
      mockDependencies.tabs.onHistoryTabClick = undefined as any;
      mockDependencies.tabs.onConfigTabClick = undefined as any;

      await expect(coordinator.initialize(mockUnifiedNavBar)).resolves.not.toThrow();
    });

    it('should handle failed export operations', async () => {
      const error = new Error('Export failed');
      mockDependencies.exportXPathsUseCase.execute = jest.fn().mockRejectedValue(error);

      await coordinator.initialize(mockUnifiedNavBar);

      const navBarConfig = (UnifiedNavigationBar as jest.Mock).mock.calls[0][1];

      await expect(navBarConfig.onExportXPaths()).rejects.toThrow('Export failed');
    });

    it('should handle failed import operations', async () => {
      const error = new Error('Import failed');
      mockDependencies.presenter.importData = jest.fn().mockRejectedValue(error);

      await coordinator.initialize(mockUnifiedNavBar);

      // Mock File with text() method
      const file = {
        text: jest.fn().mockResolvedValue('test'),
        name: 'test.csv',
        type: 'text/csv',
      } as unknown as File;
      const navBarConfig = (UnifiedNavigationBar as jest.Mock).mock.calls[0][1];

      await expect(navBarConfig.onImport(file, 'xpaths')).rejects.toThrow('Import failed');
    });
  });
});
