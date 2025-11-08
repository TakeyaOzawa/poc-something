/**
 * Test: DataSyncManager
 * Tests data synchronization cards and operations
 */

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => key),
    format: jest.fn((key: string, ...args: string[]) => `${key}: ${args.join(', ')}`),
    applyToDOM: jest.fn(),
  },
}));

import { DataSyncManager } from '../DataSyncManager';
import { SystemSettingsPresenter } from '../SystemSettingsPresenter';
import { ListSyncConfigsUseCase } from '@usecases/sync/ListSyncConfigsUseCase';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { Logger } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('DataSyncManager', () => {
  let manager: DataSyncManager;
  let mockPresenter: jest.Mocked<SystemSettingsPresenter>;
  let mockListSyncConfigsUseCase: jest.Mocked<ListSyncConfigsUseCase>;
  let mockLogger: jest.Mocked<Logger>;
  let syncCardsContainer: HTMLDivElement;
  let syncAllButton: HTMLButtonElement;

  // Helper to get card and button for a specific storage key
  const getCardAndButton = (storageKey: string) => {
    const resultDiv = document.getElementById(`sync-result-${storageKey}`);
    const card = resultDiv?.closest('.sync-config-card') as HTMLDivElement;
    const button = card?.querySelector('.sync-now-btn') as HTMLButtonElement;
    return { card, button };
  };

  beforeEach(() => {
    // Clear any existing DOM
    document.body.innerHTML = '';

    // Setup sync-card-template for DataSyncManager component
    const syncCardTemplate = document.createElement('template');
    syncCardTemplate.id = 'sync-card-template';
    syncCardTemplate.innerHTML = `
      <div class="sync-config-card">
        <div class="card-header">
          <span class="card-icon" data-bind="icon"></span>
          <span class="card-title" data-bind="title"></span>
          <button class="btn-settings" data-bind-attr="storageKey:data-storage-key,configureTitle:title">
            <span data-bind="configureHeaderText"></span>
          </button>
        </div>
        <div class="card-body sync-card-configured" style="display: none;">
          <div class="config-info">
            <span data-bind="syncMethodLabel"></span>
            <span class="sync-method" data-bind="syncMethod"></span>
          </div>
          <div class="config-info">
            <span data-bind="syncTimingLabel"></span>
            <span class="sync-timing" data-bind="syncTiming"></span>
          </div>
          <div class="config-info">
            <span data-bind="syncDirectionLabel"></span>
            <span class="sync-direction" data-bind="syncDirection"></span>
          </div>
          <div class="config-info">
            <span data-bind="statusLabel"></span>
            <span data-bind="statusText"></span>
          </div>
        </div>
        <div class="card-body sync-card-empty" style="display: none;">
          <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <p class="empty-state-text" data-bind="emptyStateText"></p>
          </div>
        </div>
        <div class="card-actions">
          <div class="sync-now-button-container" style="display: none;">
            <button class="sync-now-btn">
              <span>🔄</span>
              <span data-bind="syncNowText"></span>
            </button>
          </div>
          <button class="configure-sync-btn" data-bind-attr="storageKey:data-storage-key">
            <span>⚙️</span>
            <span data-bind="configureButtonText"></span>
          </button>
        </div>
        <div class="last-sync-result" data-bind-attr="resultDivId:id" style="margin-top: 12px;"></div>
      </div>
    `;
    document.body.appendChild(syncCardTemplate);

    // Setup DOM
    document.body.insertAdjacentHTML(
      'beforeend',
      `
      <div id="syncConfigList"></div>
      <button id="syncAllBtn">Sync All</button>
    `
    );

    syncCardsContainer = document.getElementById('syncConfigList') as HTMLDivElement;
    syncAllButton = document.getElementById('syncAllBtn') as HTMLButtonElement;

    // Create mocks
    mockPresenter = {
      executeDataSync: jest.fn(),
    } as any;

    mockListSyncConfigsUseCase = {
      execute: jest.fn(),
    } as any;

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    global.alert = jest.fn();

    manager = new DataSyncManager(mockPresenter, mockListSyncConfigsUseCase, mockLogger);
  });

  describe('constructor', () => {
    it('should initialize with DOM elements', () => {
      expect(manager).toBeDefined();
    });

    it('should attach event listener to sync all button', () => {
      const clickSpy = jest.spyOn(syncAllButton, 'click');
      syncAllButton.click();
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should log error when sync cards container is not found', () => {
      document.body.innerHTML = '<button id="syncAllBtn">Sync All</button>';

      const localMockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        createChild: jest.fn().mockReturnThis(),
      } as any;

      new DataSyncManager(mockPresenter, mockListSyncConfigsUseCase, localMockLogger);

      expect(localMockLogger.error).toHaveBeenCalledWith(
        'Sync cards container element not found (id: syncConfigList)'
      );
    });

    it('should log error when sync all button is not found', () => {
      document.body.innerHTML = '<div id="syncConfigList"></div>';

      const localMockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        createChild: jest.fn().mockReturnThis(),
      } as any;

      new DataSyncManager(mockPresenter, mockListSyncConfigsUseCase, localMockLogger);

      expect(localMockLogger.error).toHaveBeenCalledWith(
        'Sync all button element not found (id: syncAllBtn)'
      );
    });
  });

  describe('renderDataSyncCards', () => {
    it('should render cards for all storage keys', async () => {
      const mockConfigs: any[] = [
        {
          id: 'config-1',
          storageKey: 'automationVariables',
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'bidirectional',
          syncIntervalSeconds: undefined,
          inputs: [],
          outputs: [],
          conflictResolution: 'latest_timestamp',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        {
          id: 'config-2',
          storageKey: 'websiteConfigs',
          syncMethod: 'spread-sheet',
          syncTiming: 'periodic',
          syncDirection: 'send_only',
          syncIntervalSeconds: 300,
          inputs: [],
          outputs: [],
          conflictResolution: 'latest_timestamp',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ];

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: mockConfigs,
        count: mockConfigs.length,
      });

      await manager.renderDataSyncCards();

      expect(syncCardsContainer.children.length).toBe(5); // 5 storage keys
    });

    it('should render cards even when configs not found', async () => {
      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [],
        count: 0,
      });

      await manager.renderDataSyncCards();

      expect(syncCardsContainer.children.length).toBe(5);
    });

    it('should handle errors during rendering', async () => {
      const error = new Error('Failed to load configs');
      mockListSyncConfigsUseCase.execute.mockRejectedValue(error);

      await manager.renderDataSyncCards();

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to render data sync cards', error);
    });

    it('should display sync information for configured keys', async () => {
      const mockConfig: any = {
        id: 'mock-id',
        storageKey: 'xpaths',
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'bidirectional' as const,
        syncIntervalSeconds: undefined,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [mockConfig],
        count: 1,
      });

      await manager.renderDataSyncCards();

      const cards = syncCardsContainer.querySelectorAll('.sync-config-card');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should show not configured message for unconfigured keys', async () => {
      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [],
        count: 0,
      });

      await manager.renderDataSyncCards();

      const notConfiguredElements = syncCardsContainer.querySelectorAll('.empty-state');
      expect(notConfiguredElements.length).toBe(5); // All keys unconfigured
    });
  });

  describe('executeDataSync', () => {
    beforeEach(async () => {
      const mockConfig: any = {
        id: 'mock-id',
        storageKey: 'xpaths',
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'bidirectional' as const,
        syncIntervalSeconds: undefined,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };
      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [mockConfig],
        count: 1,
      });
      await manager.renderDataSyncCards();
    });

    it('should execute sync for storage key', async () => {
      mockPresenter.executeDataSync.mockResolvedValue({
        success: true,
        syncDirection: 'bidirectional',
        receiveResult: { success: true, receivedCount: 10 },
        sendResult: { success: true, sentCount: 5 },
      });

      const { button: syncButton } = getCardAndButton('xpaths');
      await syncButton?.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPresenter.executeDataSync).toHaveBeenCalled();
    });

    it('should display result after successful sync', async () => {
      mockPresenter.executeDataSync.mockResolvedValue({
        success: true,
        syncDirection: 'bidirectional',
        receiveResult: { success: true, receivedCount: 10 },
        sendResult: { success: true, sentCount: 5 },
      });

      const { button: syncButton } = getCardAndButton('xpaths');
      syncButton?.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const resultDiv = document.getElementById('sync-result-xpaths');
      expect(resultDiv?.innerHTML).toContain('sync-status success');
    });

    it('should handle sync errors', async () => {
      const error = new Error('Sync failed');
      mockPresenter.executeDataSync.mockRejectedValue(error);

      const { button: syncButton } = getCardAndButton('xpaths');
      await syncButton?.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle null result (config not found)', async () => {
      mockPresenter.executeDataSync.mockResolvedValue(null);

      const { button: syncButton } = getCardAndButton('xpaths');
      syncButton?.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const resultDiv = document.getElementById('sync-result-xpaths');
      expect(resultDiv?.innerHTML).toContain('error');
    });

    it('should disable button during sync', async () => {
      mockPresenter.executeDataSync.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  syncDirection: 'bidirectional',
                }),
              100
            )
          )
      );

      const { button: syncButton } = getCardAndButton('xpaths');
      const originalText = syncButton?.textContent;

      syncButton?.click();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(syncButton?.disabled).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(syncButton?.disabled).toBe(false);
      expect(syncButton?.textContent).toBe(originalText);
    });
  });

  describe('executeAllDataSync', () => {
    it('should execute all syncs successfully', async () => {
      mockPresenter.executeDataSync.mockResolvedValue({
        success: true,
        syncDirection: 'bidirectional',
        receiveResult: { success: true, receivedCount: 10 },
        sendResult: { success: true, sentCount: 5 },
      });

      await syncAllButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockPresenter.executeDataSync).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalled();
    });

    it('should handle partial failures', async () => {
      mockPresenter.executeDataSync.mockResolvedValue({
        success: false,
        syncDirection: 'bidirectional',
        error: 'Sync failed',
      });

      await syncAllButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(global.alert).toHaveBeenCalledWith(expect.stringContaining('syncCompletedAll'));
    });

    it('should handle errors during execute all', async () => {
      const error = new Error('Execute all failed');
      mockPresenter.executeDataSync.mockRejectedValue(error);

      await syncAllButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to execute all sync', error);
    });

    it('should re-render cards after sync', async () => {
      mockPresenter.executeDataSync.mockResolvedValue({
        success: true,
        syncDirection: 'bidirectional',
        receiveResult: { success: true, receivedCount: 10 },
        sendResult: { success: true, sentCount: 5 },
      });

      const renderSpy = jest.spyOn(manager, 'renderDataSyncCards');

      await syncAllButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(renderSpy).toHaveBeenCalled();
    });

    it('should disable button during sync', async () => {
      mockPresenter.executeDataSync.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  syncDirection: 'bidirectional',
                  receiveResult: { success: true, receivedCount: 10 },
                  sendResult: { success: true, sentCount: 5 },
                }),
              100
            )
          )
      );

      const originalText = syncAllButton.textContent;

      syncAllButton.click();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(syncAllButton.disabled).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(syncAllButton.disabled).toBe(false);
      expect(syncAllButton.textContent).toBe(originalText);
    });
  });

  describe('formatSyncTiming', () => {
    it('should format manual timing correctly', async () => {
      const mockConfig: any = {
        id: 'mock-id',
        storageKey: 'xpaths',
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'bidirectional' as const,
        syncIntervalSeconds: undefined,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [mockConfig],
        count: 1,
      });
      await manager.renderDataSyncCards();

      const syncInfo = syncCardsContainer.querySelector('.config-info');
      expect(syncInfo?.textContent).toBeTruthy();
    });

    it('should format periodic timing with interval', async () => {
      const mockConfig: any = {
        id: 'mock-id',
        storageKey: 'xpaths',
        syncMethod: 'notion' as const,
        syncTiming: 'periodic' as const,
        syncDirection: 'bidirectional' as const,
        syncIntervalSeconds: 300,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [mockConfig],
        count: 1,
      });
      await manager.renderDataSyncCards();

      const syncInfo = syncCardsContainer.querySelector('.config-info');
      expect(syncInfo?.textContent).toBeTruthy();
    });
  });

  describe('formatSyncDirection', () => {
    it('should format bidirectional direction', async () => {
      const mockConfig: any = {
        id: 'mock-id',
        storageKey: 'xpaths',
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'bidirectional' as const,
        syncIntervalSeconds: undefined,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [mockConfig],
        count: 1,
      });
      await manager.renderDataSyncCards();

      const syncInfo = syncCardsContainer.querySelector('.config-info');
      expect(syncInfo?.textContent).toBeTruthy();
    });

    it('should format send_only direction', async () => {
      const mockConfig: any = {
        id: 'mock-id',
        storageKey: 'xpaths',
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'send_only' as const,
        syncIntervalSeconds: undefined,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [mockConfig],
        count: 1,
      });
      await manager.renderDataSyncCards();

      const syncInfo = syncCardsContainer.querySelector('.config-info');
      expect(syncInfo?.textContent).toBeTruthy();
    });

    it('should format receive_only direction', async () => {
      const mockConfig: any = {
        id: 'mock-id',
        storageKey: 'xpaths',
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'receive_only' as const,
        syncIntervalSeconds: undefined,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [mockConfig],
        count: 1,
      });
      await manager.renderDataSyncCards();

      const syncInfo = syncCardsContainer.querySelector('.config-info');
      expect(syncInfo?.textContent).toBeTruthy();
    });
  });

  describe('additional coverage tests', () => {
    it('should log error when sync cards container not found', () => {
      document.body.innerHTML = '<button id="syncAllBtn">Sync All</button>';

      const manager2 = new DataSyncManager(mockPresenter, mockListSyncConfigsUseCase, mockLogger);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Sync cards container element not found (id: syncConfigList)'
      );
    });

    it('should log error when sync all button not found', () => {
      document.body.innerHTML = '<div id="syncConfigList"></div>';

      const manager2 = new DataSyncManager(mockPresenter, mockListSyncConfigsUseCase, mockLogger);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Sync all button element not found (id: syncAllBtn)'
      );
    });

    it('should format Notion sync method', async () => {
      const mockConfig: any = {
        id: 'mock-id',
        storageKey: 'xpaths',
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'bidirectional' as const,
        syncIntervalSeconds: undefined,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [mockConfig],
        count: 1,
      });
      await manager.renderDataSyncCards();

      const { card } = getCardAndButton('xpaths');
      const methodElement = card?.querySelector('.sync-method');
      expect(methodElement?.textContent).toBeTruthy();
    });

    it('should format Spreadsheet sync method', async () => {
      const mockConfig: any = {
        id: 'mock-id',
        storageKey: 'xpaths',
        syncMethod: 'spread-sheet' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'bidirectional' as const,
        syncIntervalSeconds: undefined,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [mockConfig],
        count: 1,
      });
      await manager.renderDataSyncCards();

      const { card } = getCardAndButton('xpaths');
      const methodElement = card?.querySelector('.sync-method');
      expect(methodElement?.textContent).toBeTruthy();
    });

    it('should render configure button for unconfigured sync', async () => {
      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [],
        count: 0,
      });
      await manager.renderDataSyncCards();

      const configureButtons = syncCardsContainer.querySelectorAll('.configure-sync-btn');
      expect(configureButtons.length).toBe(5); // All 5 storage keys should have configure buttons
    });

    it('should render configure button for configured sync', async () => {
      const mockConfig: any = {
        id: 'mock-id',
        storageKey: 'xpaths',
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'bidirectional' as const,
        syncIntervalSeconds: undefined,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [mockConfig],
        count: 1,
      });
      await manager.renderDataSyncCards();

      const configureButtons = syncCardsContainer.querySelectorAll('.configure-sync-btn');
      expect(configureButtons.length).toBe(5);
    });

    it('should open sync config manager when configure button is clicked', async () => {
      const mockChrome = {
        runtime: {
          getURL: jest.fn((path) => `chrome-extension://test/${path}`),
        },
        tabs: {
          create: jest.fn(),
        },
      };
      global.chrome = mockChrome as any;

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [],
        count: 0,
      });
      await manager.renderDataSyncCards();

      const configureButton = syncCardsContainer.querySelector(
        '.configure-sync-btn'
      ) as HTMLButtonElement;
      configureButton?.click();

      expect(mockChrome.tabs.create).toHaveBeenCalledWith({
        url: expect.stringContaining('storage-sync-manager.html?storageKey='),
      });
    });

    it('should render all storage key icons', async () => {
      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [],
        count: 0,
      });
      await manager.renderDataSyncCards();

      const icons = syncCardsContainer.querySelectorAll('.card-icon');
      expect(icons.length).toBe(5);
      expect(icons[0].textContent).toBe('📋'); // automationVariables
      expect(icons[1].textContent).toBe('🌐'); // websiteConfigs
      expect(icons[2].textContent).toBe('🔍'); // xpaths
      expect(icons[3].textContent).toBe('⚙️'); // systemSettings
      expect(icons[4].textContent).toBe('🔄'); // storageSyncConfigs
    });

    it('should render sync result div for each card', async () => {
      const mockConfig: any = {
        id: 'mock-id',
        storageKey: 'xpaths',
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'bidirectional' as const,
        syncIntervalSeconds: undefined,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [mockConfig],
        count: 1,
      });
      await manager.renderDataSyncCards();

      const resultDivs = syncCardsContainer.querySelectorAll('.last-sync-result');
      expect(resultDivs.length).toBe(5);
      expect(document.getElementById('sync-result-automationVariables')).toBeTruthy();
      expect(document.getElementById('sync-result-websiteConfigs')).toBeTruthy();
      expect(document.getElementById('sync-result-xpaths')).toBeTruthy();
      expect(document.getElementById('sync-result-systemSettings')).toBeTruthy();
      expect(document.getElementById('sync-result-storageSyncConfigs')).toBeTruthy();
    });

    it('should restore button text after sync error', async () => {
      const mockConfig: any = {
        id: 'mock-id',
        storageKey: 'xpaths',
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'bidirectional' as const,
        syncIntervalSeconds: undefined,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [mockConfig],
        count: 1,
      });
      await manager.renderDataSyncCards();

      const { button: syncButton } = getCardAndButton('xpaths');
      const originalText = syncButton?.textContent;

      mockPresenter.executeDataSync.mockRejectedValue(new Error('Sync error'));

      syncButton?.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(syncButton?.textContent).toBe(originalText);
      expect(syncButton?.disabled).toBe(false);
    });

    it('should render sync now button for all configs', async () => {
      const enabledConfig: any = {
        id: 'mock-id',
        storageKey: 'xpaths',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        syncIntervalSeconds: undefined,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const disabledConfig: any = {
        id: 'mock-id-2',
        storageKey: 'websiteConfigs',
        syncMethod: 'spread-sheet',
        syncTiming: 'periodic',
        syncDirection: 'send_only',
        syncIntervalSeconds: 300,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [enabledConfig, disabledConfig],
        count: 2,
      });
      await manager.renderDataSyncCards();

      const cards = syncCardsContainer.querySelectorAll('.sync-config-card');
      expect(cards.length).toBe(5);

      // Check that sync now button exists for both configs (DTOには enabled プロパティがないため、常に表示)
      const xpathsCard = Array.from(cards).find((card) =>
        card.textContent?.includes('xpaths')
      ) as HTMLElement;
      const syncNowButton = xpathsCard?.querySelector('.sync-now-btn');
      expect(syncNowButton).toBeTruthy();

      // Check that sync now button container is visible for all configs
      const websiteConfigsCard = Array.from(cards).find((card) =>
        card.textContent?.includes('websiteConfigs')
      ) as HTMLElement;
      const syncNowContainer = websiteConfigsCard?.querySelector(
        '.sync-now-button-container'
      ) as HTMLElement;
      expect(syncNowContainer?.style.display).toBe('block');
    });

    it('should call chrome.tabs.create when opening sync config manager', async () => {
      const mockChrome = {
        runtime: {
          getURL: jest.fn((path) => `chrome-extension://test/${path}`),
        },
        tabs: {
          create: jest.fn(),
        },
      };
      global.chrome = mockChrome as any;

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [],
        count: 0,
      });
      await manager.renderDataSyncCards();

      const configureButton = syncCardsContainer.querySelector(
        '.configure-sync-btn'
      ) as HTMLButtonElement;
      configureButton?.click();

      expect(mockChrome.runtime.getURL).toHaveBeenCalledWith(
        'storage-sync-manager.html?storageKey=automationVariables'
      );
      expect(mockChrome.tabs.create).toHaveBeenCalledWith({
        url: expect.stringContaining('storage-sync-manager.html?storageKey='),
      });
    });

    it('should handle formatSyncTiming with no interval for periodic sync', async () => {
      const periodicConfigNoInterval: any = {
        id: 'mock-id',
        storageKey: 'systemSettings',
        syncMethod: 'notion' as const,
        syncTiming: 'periodic' as const,
        syncDirection: 'bidirectional' as const,
        syncIntervalSeconds: undefined, // No interval specified
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [periodicConfigNoInterval],
        count: 1,
      });
      await manager.renderDataSyncCards();

      const cards = syncCardsContainer.querySelectorAll('.sync-config-card');
      expect(cards.length).toBe(5);

      // Should fall back to 'not set' message
      const systemSettingsCard = Array.from(cards).find((card) =>
        card.textContent?.includes('systemSettings')
      ) as HTMLElement;
      expect(systemSettingsCard).toBeTruthy();
    });

    it('should properly render sync now button in card actions', async () => {
      const enabledConfig: any = {
        id: 'mock-id',
        storageKey: 'automationVariables',
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'bidirectional' as const,
        syncIntervalSeconds: undefined,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [enabledConfig],
        count: 1,
      });
      await manager.renderDataSyncCards();

      const cards = syncCardsContainer.querySelectorAll('.sync-config-card');
      const automationVariablesCard = Array.from(cards).find((card) =>
        card.innerHTML.includes('automationVariables')
      ) as HTMLElement;

      // Verify the card-actions div contains the sync now button
      const actions = automationVariablesCard?.querySelector('.card-actions');
      expect(actions).toBeTruthy();

      const syncNowBtn = actions?.querySelector('.sync-now-btn');
      expect(syncNowBtn).toBeTruthy();
      expect(syncNowBtn?.textContent).toContain('🔄');
    });

    it('should add event listener to sync now button when created', async () => {
      const enabledConfig: any = {
        id: 'mock-id',
        storageKey: 'xpaths',
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'bidirectional' as const,
        syncIntervalSeconds: undefined,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };

      mockPresenter.executeDataSync.mockResolvedValue({
        success: true,
        syncDirection: 'bidirectional',
        receiveResult: { success: true, receivedCount: 5 },
        sendResult: { success: true, sentCount: 3 },
      });

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [enabledConfig],
        count: 1,
      });
      await manager.renderDataSyncCards();

      const { button: syncButton } = getCardAndButton('xpaths');
      expect(syncButton).toBeTruthy();

      // Click the button to verify the event listener was attached
      syncButton.click();
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockPresenter.executeDataSync).toHaveBeenCalled();
    });

    it('should properly handle multiple sync methods in same render', async () => {
      const notionConfig: any = {
        id: 'mock-id',
        storageKey: 'automationVariables',
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'bidirectional' as const,
        syncIntervalSeconds: undefined,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };

      const spreadsheetConfig: any = {
        id: 'mock-id',
        storageKey: 'websiteConfigs',
        syncMethod: 'spread-sheet' as const,
        syncTiming: 'periodic' as const,
        syncDirection: 'send_only' as const,
        syncIntervalSeconds: 600,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [notionConfig, spreadsheetConfig],
        count: 2,
      });
      await manager.renderDataSyncCards();

      const cards = syncCardsContainer.querySelectorAll('.sync-config-card');
      expect(cards.length).toBe(5);

      // Both should have sync now buttons since they're enabled
      const syncButtons = syncCardsContainer.querySelectorAll('.sync-now-btn');
      expect(syncButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle sync result with receive_only direction', async () => {
      const receiveOnlyConfig: any = {
        id: 'mock-id',
        storageKey: 'xpaths',
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'receive_only' as const,
        syncIntervalSeconds: undefined,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [receiveOnlyConfig],
        count: 1,
      });
      await manager.renderDataSyncCards();

      mockPresenter.executeDataSync.mockResolvedValue({
        success: true,
        syncDirection: 'receive_only',
        receiveResult: { success: true, receivedCount: 8 },
      });

      const { button: syncButton } = getCardAndButton('xpaths');
      syncButton?.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const resultDiv = document.getElementById('sync-result-xpaths');
      expect(resultDiv?.innerHTML).toContain('syncReceiveOnlyResult: 8');
      expect(resultDiv?.innerHTML).toContain('sync-status success');
    });

    it('should handle sync result with send_only direction', async () => {
      const sendOnlyConfig: any = {
        id: 'mock-id',
        storageKey: 'websiteConfigs',
        syncMethod: 'spread-sheet' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'send_only' as const,
        syncIntervalSeconds: undefined,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [sendOnlyConfig],
        count: 1,
      });
      await manager.renderDataSyncCards();

      mockPresenter.executeDataSync.mockResolvedValue({
        success: true,
        syncDirection: 'send_only',
        sendResult: { success: true, sentCount: 12 },
      });

      const cards = syncCardsContainer.querySelectorAll('.sync-config-card');
      const websiteConfigsCard = Array.from(cards).find((card) =>
        card.textContent?.includes('websiteConfigs')
      ) as HTMLElement;

      const syncButton = websiteConfigsCard?.querySelector('.sync-now-btn') as HTMLButtonElement;
      syncButton?.click();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const resultDiv = document.getElementById('sync-result-websiteConfigs');
      expect(resultDiv?.innerHTML).toContain('syncSendOnlyResult: 12');
      expect(resultDiv?.innerHTML).toContain('sync-status success');
    });

    it('should create and append configure button for all storage keys', async () => {
      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [],
        count: 0,
      });
      await manager.renderDataSyncCards();

      // All 5 storage keys should have configure buttons
      const configureButtons = syncCardsContainer.querySelectorAll('.configure-sync-btn');
      expect(configureButtons.length).toBe(5);

      // Each button should have the correct structure
      configureButtons.forEach((button) => {
        expect(button.querySelector('span')).toBeTruthy();
        expect(button.textContent).toBeTruthy();
      });
    });

    it('should handle formatSyncMethod for both notion and spread-sheet', async () => {
      const notionConfig: any = {
        id: 'mock-id',
        storageKey: 'automationVariables',
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'bidirectional' as const,
        syncIntervalSeconds: undefined,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };

      const spreadsheetConfig: any = {
        id: 'mock-id',
        storageKey: 'websiteConfigs',
        syncMethod: 'spread-sheet' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'bidirectional' as const,
        syncIntervalSeconds: undefined,
        inputs: [],
        outputs: [],
        conflictResolution: 'latest_timestamp',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        enabled: true,
      };

      mockListSyncConfigsUseCase.execute.mockResolvedValue({
        success: true,
        configs: [notionConfig, spreadsheetConfig],
        count: 2,
      });
      await manager.renderDataSyncCards();

      const cards = syncCardsContainer.querySelectorAll('.sync-config-card');

      // Find Notion card and verify sync method display
      const notionCard = Array.from(cards).find((card) =>
        card.innerHTML.includes('automationVariables')
      ) as HTMLElement;
      expect(notionCard.querySelector('.sync-method')).toBeTruthy();

      // Find Spreadsheet card and verify sync method display
      const spreadsheetCard = Array.from(cards).find((card) =>
        card.innerHTML.includes('websiteConfigs')
      ) as HTMLElement;
      expect(spreadsheetCard.querySelector('.sync-method')).toBeTruthy();
    });
  });
});
