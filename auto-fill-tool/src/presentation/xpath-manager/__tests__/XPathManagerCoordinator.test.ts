/**
 * Test Suite: XPathManagerCoordinator
 * Tests the coordinator for XPath Manager page
 */

import { XPathManagerCoordinator } from '../XPathManagerCoordinator';
import { UnifiedNavigationBar } from '@presentation/common/UnifiedNavigationBar';
import type { XPathManagerCoordinatorDependencies } from '../../types';
import { Logger } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';

// Mock UnifiedNavigationBar
jest.mock('@presentation/common/UnifiedNavigationBar');

// Mock I18nAdapter
jest.mock('@/infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => {
      const messages: Record<string, string> = {
        xpathManagementTitle: 'XPath Management',
      };
      return messages[key] || key;
    }),
  },
}));

describe('XPathManagerCoordinator', () => {
  let coordinator: XPathManagerCoordinator;
  let mockDependencies: XPathManagerCoordinatorDependencies;
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
      presenter: {
        exportXPaths: jest.fn().mockResolvedValue('xpath,data\ntest,value'),
        exportWebsites: jest.fn().mockResolvedValue('website,url\ntest,http://test.com'),
        exportAutomationVariables: jest.fn().mockResolvedValue('variable,value\ntest,123'),
        importData: jest.fn().mockResolvedValue(undefined),
      },
      exportSystemSettingsUseCase: {
        execute: jest.fn().mockResolvedValue(Result.success('setting,value\ntest,true')),
      },
      exportStorageSyncConfigsUseCase: {
        execute: jest.fn().mockResolvedValue('config,value\ntest,abc'),
      },
      downloadFile: jest.fn(),
      onImportComplete: jest.fn().mockResolvedValue(undefined),
    } as unknown as XPathManagerCoordinatorDependencies;

    mockUnifiedNavBar = document.createElement('div');

    coordinator = new XPathManagerCoordinator(mockDependencies);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('initialize', () => {
    it('should initialize successfully', async () => {
      await coordinator.initialize(mockUnifiedNavBar);

      expect(mockLogger.info).toHaveBeenCalledWith('XPath Manager Coordinator initialized');
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
      expect(mockLogger.info).toHaveBeenCalledWith('XPath Manager Coordinator initialized');
    });
  });

  describe('initializeNavigationBar', () => {
    it('should initialize navigation bar with all export handlers', async () => {
      await coordinator.initialize(mockUnifiedNavBar);

      expect(UnifiedNavigationBar).toHaveBeenCalledWith(
        mockUnifiedNavBar,
        expect.objectContaining({
          title: 'XPath Management',
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

      expect(mockDependencies.presenter.exportXPaths).toHaveBeenCalled();
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

      expect(mockDependencies.presenter.exportWebsites).toHaveBeenCalled();
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

      expect(mockDependencies.presenter.exportAutomationVariables).toHaveBeenCalled();
      expect(mockDependencies.downloadFile).toHaveBeenCalledWith(
        'variable,value\ntest,123',
        expect.stringMatching(/^automation-variables_\d{8}_\d{4}\.csv$/),
        'text/csv'
      );
    });

    it('should handle onExportSystemSettings correctly', async () => {
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

    it('should apply gradient with different angle', async () => {
      mockDependencies.settings.getGradientAngle = jest.fn().mockReturnValue(90);

      await coordinator.initialize(mockUnifiedNavBar);

      expect(mockLogger.debug).toHaveBeenCalledWith('Applied gradient background', {
        startColor: '#667eea',
        endColor: '#764ba2',
        angle: 90,
      });
    });

    it('should apply gradient with different colors', async () => {
      mockDependencies.settings.getGradientStartColor = jest.fn().mockReturnValue('#ff0000');
      mockDependencies.settings.getGradientEndColor = jest.fn().mockReturnValue('#00ff00');

      await coordinator.initialize(mockUnifiedNavBar);

      expect(mockLogger.debug).toHaveBeenCalledWith('Applied gradient background', {
        startColor: '#ff0000',
        endColor: '#00ff00',
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

    it('should format midnight correctly', async () => {
      const mockDate = new Date('2024-12-31T00:00:00');
      jest.spyOn(global, 'Date').mockImplementation((() => mockDate) as any);

      await coordinator.initialize(mockUnifiedNavBar);

      const navBarConfig = (UnifiedNavigationBar as jest.Mock).mock.calls[0][1];
      await navBarConfig.onExportAutomationVariables();

      expect(mockDependencies.downloadFile).toHaveBeenCalledWith(
        expect.any(String),
        'automation-variables_20241231_0000.csv',
        'text/csv'
      );

      jest.restoreAllMocks();
    });
  });

  describe('edge cases', () => {
    it('should handle failed export operations for XPaths', async () => {
      const error = new Error('Export failed');
      mockDependencies.presenter.exportXPaths = jest.fn().mockRejectedValue(error);

      await coordinator.initialize(mockUnifiedNavBar);

      const navBarConfig = (UnifiedNavigationBar as jest.Mock).mock.calls[0][1];

      await expect(navBarConfig.onExportXPaths()).rejects.toThrow('Export failed');
    });

    it('should handle failed export operations for Websites', async () => {
      const error = new Error('Export failed');
      mockDependencies.presenter.exportWebsites = jest.fn().mockRejectedValue(error);

      await coordinator.initialize(mockUnifiedNavBar);

      const navBarConfig = (UnifiedNavigationBar as jest.Mock).mock.calls[0][1];

      await expect(navBarConfig.onExportWebsites()).rejects.toThrow('Export failed');
    });

    it('should handle failed export operations for AutomationVariables', async () => {
      const error = new Error('Export failed');
      mockDependencies.presenter.exportAutomationVariables = jest.fn().mockRejectedValue(error);

      await coordinator.initialize(mockUnifiedNavBar);

      const navBarConfig = (UnifiedNavigationBar as jest.Mock).mock.calls[0][1];

      await expect(navBarConfig.onExportAutomationVariables()).rejects.toThrow('Export failed');
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

    it('should handle failed onImportComplete callback', async () => {
      const error = new Error('Import complete callback failed');
      mockDependencies.onImportComplete = jest.fn().mockRejectedValue(error);

      await coordinator.initialize(mockUnifiedNavBar);

      // Mock File with text() method
      const file = {
        text: jest.fn().mockResolvedValue('test'),
        name: 'test.csv',
        type: 'text/csv',
      } as unknown as File;
      const navBarConfig = (UnifiedNavigationBar as jest.Mock).mock.calls[0][1];

      await expect(navBarConfig.onImport(file, 'xpaths')).rejects.toThrow(
        'Import complete callback failed'
      );
    });

    it('should handle null document.body.style.background', async () => {
      Object.defineProperty(document.body.style, 'background', {
        get: () => null,
        set: jest.fn(),
        configurable: true,
      });

      await coordinator.initialize(mockUnifiedNavBar);

      // Should complete without errors
      expect(mockLogger.info).toHaveBeenCalledWith('XPath Manager Coordinator initialized');
    });
  });
});
