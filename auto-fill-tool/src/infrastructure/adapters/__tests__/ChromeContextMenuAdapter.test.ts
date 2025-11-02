/**
 * Tests for ChromeContextMenuAdapter
 */

import browser from 'webextension-polyfill';
import { ChromeContextMenuAdapter } from '../ChromeContextMenuAdapter';
import { WebsiteData } from '@domain/entities/Website';
import { Logger } from '@domain/types/logger.types';
import { CONTEXT_MENU_IDS, getWebsiteContextMenuId } from '@domain/constants/ContextMenuIds';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock webextension-polyfill
jest.mock('webextension-polyfill', () => ({
  runtime: {
    onInstalled: {
      addListener: jest.fn(),
    },
  },
  storage: {
    local: {
      get: jest.fn(),
    },
    onChanged: {
      addListener: jest.fn(),
    },
  },
  contextMenus: {
    create: jest.fn(),
    removeAll: jest.fn(),
  },
  i18n: {
    getMessage: jest.fn((key: string) => {
      // Return the key as default, or specific mock values if needed
      return key;
    }),
  },
}));

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ChromeContextMenuAdapter', () => {
  let service: ChromeContextMenuAdapter;
  let mockLogger: jest.Mocked<Logger>;
  let onInstalledListener: (() => Promise<void>) | null = null;
  let onChangedListener: ((changes: any, areaName: string) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    // Capture listeners
    (browser.runtime.onInstalled.addListener as jest.Mock).mockImplementation((listener) => {
      onInstalledListener = listener;
    });

    (browser.storage.onChanged.addListener as jest.Mock).mockImplementation((listener) => {
      onChangedListener = listener;
    });

    (browser.contextMenus.removeAll as jest.Mock).mockResolvedValue(undefined);
    (browser.contextMenus.create as jest.Mock).mockReturnValue(undefined);
    (browser.storage.local.get as jest.Mock).mockResolvedValue({});

    service = new ChromeContextMenuAdapter(mockLogger);
  });

  describe('initialize', () => {
    it('should set up onInstalled listener', async () => {
      await service.initialize();

      expect(browser.runtime.onInstalled.addListener).toHaveBeenCalledTimes(1);
      expect(onInstalledListener).toBeDefined();
    });

    it('should set up storage.onChanged listener', async () => {
      await service.initialize();

      expect(browser.storage.onChanged.addListener).toHaveBeenCalledTimes(1);
      expect(onChangedListener).toBeDefined();
    });

    it('should create context menus on initialization', async () => {
      await service.initialize();

      expect(browser.contextMenus.removeAll).toHaveBeenCalled();
      expect(browser.contextMenus.create).toHaveBeenCalled();
    });

    it('should trigger createContextMenus when onInstalled fires', async () => {
      await service.initialize();

      // Clear previous calls
      jest.clearAllMocks();
      (browser.contextMenus.removeAll as jest.Mock).mockResolvedValue(undefined);
      (browser.contextMenus.create as jest.Mock).mockReturnValue(undefined);
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      // Trigger the listener
      if (onInstalledListener) {
        await onInstalledListener();
      }

      expect(browser.contextMenus.removeAll).toHaveBeenCalled();
      expect(browser.contextMenus.create).toHaveBeenCalled();
    });

    it('should trigger createContextMenus when websiteConfigs change', async () => {
      await service.initialize();

      // Clear previous calls
      jest.clearAllMocks();
      (browser.contextMenus.removeAll as jest.Mock).mockResolvedValue(undefined);
      (browser.contextMenus.create as jest.Mock).mockReturnValue(undefined);
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      // Trigger the storage change listener
      if (onChangedListener) {
        onChangedListener({ websiteConfigs: { newValue: '[]' } }, 'local');
      }

      // Wait for async operations
      await Promise.resolve();

      expect(browser.contextMenus.removeAll).toHaveBeenCalled();
    });

    it('should not trigger createContextMenus when other storage changes', async () => {
      await service.initialize();

      // Clear previous calls
      jest.clearAllMocks();

      // Trigger with different key
      if (onChangedListener) {
        onChangedListener({ otherKey: { newValue: 'value' } }, 'local');
      }

      expect(browser.contextMenus.removeAll).not.toHaveBeenCalled();
    });

    it('should not trigger createContextMenus when change is in different area', async () => {
      await service.initialize();

      // Clear previous calls
      jest.clearAllMocks();

      // Trigger with sync area instead of local
      if (onChangedListener) {
        onChangedListener({ websiteConfigs: { newValue: '[]' } }, 'sync');
      }

      expect(browser.contextMenus.removeAll).not.toHaveBeenCalled();
    });
  });

  describe('createContextMenus', () => {
    it('should remove all existing menus', async () => {
      await service.createContextMenus();

      expect(browser.contextMenus.removeAll).toHaveBeenCalled();
    });

    it('should create parent menu "XPathを取得する"', async () => {
      await service.createContextMenus();

      expect(browser.contextMenus.create).toHaveBeenCalledWith({
        id: CONTEXT_MENU_IDS.GET_XPATH,
        title: 'getXPath',
        contexts: ['all'],
      });
    });

    it('should create "XPathを表示する" menu', async () => {
      await service.createContextMenus();

      expect(browser.contextMenus.create).toHaveBeenCalledWith({
        id: CONTEXT_MENU_IDS.SHOW_XPATH,
        title: 'showXPath',
        contexts: ['all'],
      });
    });

    it('should create submenu for each editable website', async () => {
      const websites: WebsiteData[] = [
        {
          id: 'website1',
          name: 'Website 1',
          updatedAt: '2024-01-01T00:00:00.000Z',
          editable: true,
        },
        {
          id: 'website2',
          name: 'Website 2',
          updatedAt: '2024-01-02T00:00:00.000Z',
          editable: true,
        },
      ];

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        websiteConfigs: JSON.stringify(websites),
      });

      await service.createContextMenus();

      expect(browser.contextMenus.create).toHaveBeenCalledWith({
        id: getWebsiteContextMenuId('website1'),
        parentId: CONTEXT_MENU_IDS.GET_XPATH,
        title: 'Website 1',
        contexts: ['all'],
      });

      expect(browser.contextMenus.create).toHaveBeenCalledWith({
        id: getWebsiteContextMenuId('website2'),
        parentId: CONTEXT_MENU_IDS.GET_XPATH,
        title: 'Website 2',
        contexts: ['all'],
      });
    });

    it('should filter out non-editable websites', async () => {
      const websites: WebsiteData[] = [
        {
          id: 'website1',
          name: 'Editable Website',
          updatedAt: '2024-01-01T00:00:00.000Z',
          editable: true,
        },
        {
          id: 'website2',
          name: 'Non-Editable Website',
          updatedAt: '2024-01-02T00:00:00.000Z',
          editable: false,
        },
      ];

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        websiteConfigs: JSON.stringify(websites),
      });

      await service.createContextMenus();

      // Should create menu for editable website
      expect(browser.contextMenus.create).toHaveBeenCalledWith({
        id: getWebsiteContextMenuId('website1'),
        parentId: CONTEXT_MENU_IDS.GET_XPATH,
        title: 'Editable Website',
        contexts: ['all'],
      });

      // Should NOT create menu for non-editable website
      expect(browser.contextMenus.create).not.toHaveBeenCalledWith({
        id: getWebsiteContextMenuId('website2'),
        parentId: CONTEXT_MENU_IDS.GET_XPATH,
        title: 'Non-Editable Website',
        contexts: ['all'],
      });
    });

    it('should sort websites by updatedAt (newest first)', async () => {
      const websites: WebsiteData[] = [
        {
          id: 'website1',
          name: 'Oldest Website',
          updatedAt: '2024-01-01T00:00:00.000Z',
          editable: true,
        },
        {
          id: 'website2',
          name: 'Newest Website',
          updatedAt: '2024-01-03T00:00:00.000Z',
          editable: true,
        },
        {
          id: 'website3',
          name: 'Middle Website',
          updatedAt: '2024-01-02T00:00:00.000Z',
          editable: true,
        },
      ];

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        websiteConfigs: JSON.stringify(websites),
      });

      const createCalls: any[] = [];
      (browser.contextMenus.create as jest.Mock).mockImplementation((options) => {
        createCalls.push(options);
      });

      await service.createContextMenus();

      // Find website submenu calls (those with parentId: 'get-xpath' and not 'new')
      const websiteMenus = createCalls.filter(
        (call) =>
          call.parentId === CONTEXT_MENU_IDS.GET_XPATH && call.id !== CONTEXT_MENU_IDS.GET_XPATH_NEW
      );

      // Should be in order: newest, middle, oldest
      expect(websiteMenus[0].title).toBe('Newest Website');
      expect(websiteMenus[1].title).toBe('Middle Website');
      expect(websiteMenus[2].title).toBe('Oldest Website');
    });

    it('should create "新規作成" submenu at the end', async () => {
      const websites: WebsiteData[] = [
        {
          id: 'website1',
          name: 'Website 1',
          updatedAt: '2024-01-01T00:00:00.000Z',
          editable: true,
        },
      ];

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        websiteConfigs: JSON.stringify(websites),
      });

      await service.createContextMenus();

      expect(browser.contextMenus.create).toHaveBeenCalledWith({
        id: CONTEXT_MENU_IDS.GET_XPATH_NEW,
        parentId: CONTEXT_MENU_IDS.GET_XPATH,
        title: 'createNew',
        contexts: ['all'],
      });
    });

    it('should handle empty websites array', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        websiteConfigs: JSON.stringify([]),
      });

      await service.createContextMenus();

      // Should still create parent menus and "新規作成"
      expect(browser.contextMenus.create).toHaveBeenCalledWith({
        id: CONTEXT_MENU_IDS.GET_XPATH,
        title: 'getXPath',
        contexts: ['all'],
      });

      expect(browser.contextMenus.create).toHaveBeenCalledWith({
        id: CONTEXT_MENU_IDS.GET_XPATH_NEW,
        parentId: CONTEXT_MENU_IDS.GET_XPATH,
        title: 'createNew',
        contexts: ['all'],
      });
    });

    it('should handle no websiteConfigs in storage', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      await service.createContextMenus();

      // Should still create parent menus
      expect(browser.contextMenus.create).toHaveBeenCalledWith({
        id: CONTEXT_MENU_IDS.GET_XPATH,
        title: 'getXPath',
        contexts: ['all'],
      });

      expect(browser.contextMenus.create).toHaveBeenCalledWith({
        id: CONTEXT_MENU_IDS.SHOW_XPATH,
        title: 'showXPath',
        contexts: ['all'],
      });
    });

    it('should log error but not throw when loading websites fails', async () => {
      const error = new Error('Storage error');
      (browser.storage.local.get as jest.Mock).mockRejectedValue(error);

      await service.createContextMenus();

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to create context menus', error);

      // Should still create parent menus
      expect(browser.contextMenus.create).toHaveBeenCalledWith({
        id: CONTEXT_MENU_IDS.GET_XPATH,
        title: 'getXPath',
        contexts: ['all'],
      });
    });

    it('should log error but not throw when JSON.parse fails', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        websiteConfigs: 'invalid json',
      });

      await service.createContextMenus();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create context menus',
        expect.any(Error)
      );
    });
  });
});
