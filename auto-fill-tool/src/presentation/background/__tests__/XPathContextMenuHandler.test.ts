/**
 * Test: XPath Context Menu Handler
 */

import browser from 'webextension-polyfill';
import { XPathContextMenuHandler } from '../XPathContextMenuHandler';
import { SaveXPathUseCase } from '@application/usecases/xpaths/SaveXPathUseCase';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { NotificationPort } from '@domain/ports/NotificationPort';
import { Logger } from '@domain/types/logger.types';
import { MessageDispatcher } from '@infrastructure/messaging/MessageDispatcher';
import { ACTION_TYPE } from '@domain/constants/ActionType';
import { CONTEXT_MENU_IDS, getWebsiteContextMenuId } from '@domain/constants/ContextMenuIds';
import { XPathCollection } from '@domain/entities/XPathCollection';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock browser API
jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
  },
  contextMenus: {
    create: jest.fn(),
    update: jest.fn(),
    removeAll: jest.fn(),
  },
  i18n: {
    getMessage: jest.fn((key: string) => {
      const messages: { [key: string]: string } = {
        error: 'Error',
        xpathGetFailed: 'Failed to get XPath',
        newSite: 'New Site',
      };
      return messages[key] || key;
    }),
  },
}));

// Mock MessageDispatcher
jest.mock('@infrastructure/messaging/MessageDispatcher');

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('XPathContextMenuHandler', () => {
  let handler: XPathContextMenuHandler;
  let mockSaveXPathUseCase: jest.Mocked<SaveXPathUseCase>;
  let mockXPathRepository: jest.Mocked<XPathRepository>;
  let mockNotificationPort: jest.Mocked<NotificationPort>;
  let mockLogger: jest.Mocked<Logger>;
  let mockMessageDispatcher: jest.Mocked<MessageDispatcher>;
  let mockSaveWebsiteUseCase: any;
  let mockGetWebsiteByIdUseCase: any;
  let mockUpdateWebsiteUseCase: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock implementations
    mockSaveXPathUseCase = {
      execute: jest.fn(),
    } as any;

    mockXPathRepository = {
      load: jest.fn(),
      save: jest.fn(),
    } as any;

    mockNotificationPort = {
      notify: jest.fn(),
      clearAll: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    mockSaveWebsiteUseCase = {
      execute: jest.fn(),
    };

    mockGetWebsiteByIdUseCase = {
      execute: jest.fn(),
    };

    mockUpdateWebsiteUseCase = {
      execute: jest.fn(),
    };

    // Mock MessageDispatcher instance
    mockMessageDispatcher = {
      getXPath: jest.fn(),
      showXPathDialog: jest.fn(),
      executeAutoFill: jest.fn(),
    } as any;

    (MessageDispatcher as jest.MockedClass<typeof MessageDispatcher>).mockImplementation(() => {
      return mockMessageDispatcher;
    });

    handler = new XPathContextMenuHandler(
      mockSaveXPathUseCase,
      mockXPathRepository,
      mockNotificationPort,
      mockLogger,
      mockSaveWebsiteUseCase,
      mockGetWebsiteByIdUseCase,
      mockUpdateWebsiteUseCase
    );
  });

  describe('handleGetXPath', () => {
    it('should save XPath when websiteId is provided', async () => {
      const mockTab: browser.Tabs.Tab = {
        id: 1,
        url: 'https://example.com/test',
        active: true,
        highlighted: false,
        pinned: false,
        incognito: false,
        index: 0,
        windowId: 1,
      };

      const mockResponse = {
        success: true,
        xpaths: {
          absolute: '/html/body/div[1]/input',
          mixed: '//*[@id="username"]',
          smart: '//input[@id="username"]',
        },
        elementInfo: {
          tagName: 'INPUT',
          type: 'text',
          text: 'Username',
        },
      };

      mockMessageDispatcher.getXPath.mockResolvedValue(mockResponse);
      mockSaveXPathUseCase.execute.mockResolvedValue({
        xpath: {
          id: 'xpath_123',
          websiteId: 'website_456',
          value: 'Username',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com/test',
          pathShort: '//*[@id="username"]',
          pathAbsolute: '/html/body/div[1]/input',
          pathSmart: '//input[@id="username"]',
          selectedPathPattern: 'smart',
          afterWaitSeconds: 1,
          actionPattern: 0,
          retryType: 0,
          executionOrder: 1,
          executionTimeoutSeconds: 30,
        },
      });

      // Mock repository to return empty collection (no need to set start_url)
      mockXPathRepository.load.mockResolvedValue(
        Result.success(
          new XPathCollection([
            {
              id: 'xpath_existing',
              websiteId: 'website_456',
              value: 'test',
              actionType: ACTION_TYPE.CLICK,
              url: 'https://example.com',
              pathShort: '',
              pathAbsolute: '',
              pathSmart: '',
              selectedPathPattern: 'smart',
              afterWaitSeconds: 0,
              actionPattern: 0,
              retryType: 0,
              executionOrder: 1,
              executionTimeoutSeconds: 30,
            },
          ])
        )
      );

      await handler.handleGetXPath(mockTab, 'website_456');

      expect(mockMessageDispatcher.getXPath).toHaveBeenCalledWith(1);
      expect(mockSaveXPathUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          websiteId: 'website_456',
          value: 'Username',
          actionType: ACTION_TYPE.TYPE,
          url: 'https://example.com/test',
          pathShort: '//*[@id="username"]',
          pathAbsolute: '/html/body/div[1]/input',
          pathSmart: '//input[@id="username"]',
        })
      );
      expect(mockNotificationPort.notify).toHaveBeenCalled();
    });

    it('should create new website when websiteId is not provided', async () => {
      const mockTab: browser.Tabs.Tab = {
        id: 1,
        url: 'https://newsite.com/page',
        active: true,
        highlighted: false,
        pinned: false,
        incognito: false,
        index: 0,
        windowId: 1,
      };

      const mockResponse = {
        success: true,
        xpaths: {
          absolute: '/html/body/button',
          mixed: '//*[@id="submit"]',
          smart: '//button[@id="submit"]',
        },
        elementInfo: {
          tagName: 'BUTTON',
          text: 'Submit',
        },
      };

      // Mock SaveWebsiteUseCase to return new website
      mockSaveWebsiteUseCase.execute.mockResolvedValue({
        website: {
          id: 'website_new',
          name: 'newsite.com',
          updatedAt: '2025-01-01T00:00:00Z',
          editable: true,
        },
      });

      mockMessageDispatcher.getXPath.mockResolvedValue(mockResponse);
      mockSaveXPathUseCase.execute.mockResolvedValue({
        xpath: {
          id: 'xpath_789',
          websiteId: 'website_new',
          value: 'Submit',
          actionType: ACTION_TYPE.CLICK,
          url: 'https://newsite.com/page',
          pathShort: '//*[@id="submit"]',
          pathAbsolute: '/html/body/button',
          pathSmart: '//button[@id="submit"]',
          selectedPathPattern: 'smart',
          afterWaitSeconds: 1,
          actionPattern: 0,
          retryType: 0,
          executionOrder: 1,
          executionTimeoutSeconds: 30,
        },
      });

      // Mock repository to return empty collection (first XPath)
      mockXPathRepository.load.mockResolvedValue(Result.success(new XPathCollection([])));

      // Mock GetWebsiteByIdUseCase to return the newly created website
      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({
        website: {
          id: 'website_new',
          name: 'newsite.com',
          startUrl: '',
          editable: true,
          updatedAt: '2025-01-01T00:00:00Z',
        },
      });

      await handler.handleGetXPath(mockTab, '');

      expect(mockSaveWebsiteUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'newsite.com',
          editable: true,
        })
      );
      expect(mockSaveXPathUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 'Submit',
          actionType: ACTION_TYPE.CLICK,
          url: 'https://newsite.com/page',
        })
      );
    });

    it('should determine actionType as CHECK for checkbox input', async () => {
      const mockTab: browser.Tabs.Tab = {
        id: 1,
        url: 'https://example.com',
        active: true,
        highlighted: false,
        pinned: false,
        incognito: false,
        index: 0,
        windowId: 1,
      };

      const mockResponse = {
        success: true,
        xpaths: {
          absolute: '/html/body/input',
          mixed: '//*[@id="agree"]',
          smart: '//input[@id="agree"]',
        },
        elementInfo: {
          tagName: 'INPUT',
          type: 'checkbox',
          text: 'Agree',
        },
      };

      mockMessageDispatcher.getXPath.mockResolvedValue(mockResponse);
      mockSaveXPathUseCase.execute.mockResolvedValue({} as any);
      mockXPathRepository.load.mockResolvedValue(Result.success(new XPathCollection([])));
      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({
        website: {
          id: 'website_123',
          name: 'Test Website',
          startUrl: 'https://example.com',
          editable: true,
          updatedAt: '2025-01-01T00:00:00Z',
        },
      });

      await handler.handleGetXPath(mockTab, 'website_123');

      expect(mockSaveXPathUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: ACTION_TYPE.CHECK,
        })
      );
    });

    it('should determine actionType as SELECT_VALUE for select element', async () => {
      const mockTab: browser.Tabs.Tab = {
        id: 1,
        url: 'https://example.com',
        active: true,
        highlighted: false,
        pinned: false,
        incognito: false,
        index: 0,
        windowId: 1,
      };

      const mockResponse = {
        success: true,
        xpaths: {
          absolute: '/html/body/select',
          mixed: '//*[@id="country"]',
          smart: '//select[@id="country"]',
        },
        elementInfo: {
          tagName: 'SELECT',
          text: 'Country',
        },
      };

      mockMessageDispatcher.getXPath.mockResolvedValue(mockResponse);
      mockSaveXPathUseCase.execute.mockResolvedValue({} as any);
      mockXPathRepository.load.mockResolvedValue(Result.success(new XPathCollection([])));
      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({
        website: {
          id: 'website_123',
          name: 'Test Website',
          startUrl: 'https://example.com',
          editable: true,
          updatedAt: '2025-01-01T00:00:00Z',
        },
      });

      await handler.handleGetXPath(mockTab, 'website_123');

      expect(mockSaveXPathUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: ACTION_TYPE.SELECT_VALUE,
        })
      );
    });

    it('should handle error when getXPath fails', async () => {
      const mockTab: browser.Tabs.Tab = {
        id: 1,
        url: 'https://example.com',
        active: true,
        highlighted: false,
        pinned: false,
        incognito: false,
        index: 0,
        windowId: 1,
      };

      mockMessageDispatcher.getXPath.mockResolvedValue({
        success: false,
        error: 'Failed to get XPath',
      });

      await handler.handleGetXPath(mockTab, 'website_123');

      expect(mockSaveXPathUseCase.execute).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle error when tab.id is undefined', async () => {
      const mockTab: browser.Tabs.Tab = {
        url: 'https://example.com',
        active: true,
        highlighted: false,
        pinned: false,
        incognito: false,
        index: 0,
        windowId: 1,
      };

      await handler.handleGetXPath(mockTab, 'website_123');

      expect(mockMessageDispatcher.getXPath).not.toHaveBeenCalled();
      expect(mockSaveXPathUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('handleShowXPath', () => {
    it('should show XPath without saving', async () => {
      const mockTab: browser.Tabs.Tab = {
        id: 1,
        url: 'https://example.com',
        active: true,
        highlighted: false,
        pinned: false,
        incognito: false,
        index: 0,
        windowId: 1,
      };

      const mockResponse = {
        success: true,
        xpaths: {
          absolute: '/html/body/div',
          mixed: '//*[@id="content"]',
          smart: '//div[@id="content"]',
        },
      };

      mockMessageDispatcher.getXPath.mockResolvedValue(mockResponse);
      mockMessageDispatcher.showXPathDialog.mockResolvedValue({} as any);

      await handler.handleShowXPath(mockTab);

      expect(mockMessageDispatcher.getXPath).toHaveBeenCalledWith(1);
      expect(mockMessageDispatcher.showXPathDialog).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          smart: '//div[@id="content"]',
          short: '//*[@id="content"]',
          absolute: '/html/body/div',
        })
      );
      expect(mockSaveXPathUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle error when showXPath fails', async () => {
      const mockTab: browser.Tabs.Tab = {
        id: 1,
        url: 'https://example.com',
        active: true,
        highlighted: false,
        pinned: false,
        incognito: false,
        index: 0,
        windowId: 1,
      };

      mockMessageDispatcher.getXPath.mockResolvedValue({
        success: false,
        error: 'Failed to get XPath',
      });

      await handler.handleShowXPath(mockTab);

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('handleContextMenuClick', () => {
    it('should call handleGetXPath for "get-xpath-*" menu items', async () => {
      const mockInfo: browser.Menus.OnClickData = {
        menuItemId: getWebsiteContextMenuId('website_123'),
        editable: false,
        modifiers: [],
      };

      const mockTab: browser.Tabs.Tab = {
        id: 1,
        url: 'https://example.com',
        active: true,
        highlighted: false,
        pinned: false,
        incognito: false,
        index: 0,
        windowId: 1,
      };

      mockMessageDispatcher.getXPath.mockResolvedValue({
        success: true,
        xpaths: { absolute: '', mixed: '', smart: '' },
      });
      mockSaveXPathUseCase.execute.mockResolvedValue({} as any);
      mockXPathRepository.load.mockResolvedValue(Result.success(new XPathCollection([])));

      await handler.handleContextMenuClick(mockInfo, mockTab);

      expect(mockMessageDispatcher.getXPath).toHaveBeenCalled();
    });

    it('should call handleShowXPath for "show-xpath" menu item', async () => {
      const mockInfo: browser.Menus.OnClickData = {
        menuItemId: CONTEXT_MENU_IDS.SHOW_XPATH,
        editable: false,
        modifiers: [],
      };

      const mockTab: browser.Tabs.Tab = {
        id: 1,
        url: 'https://example.com',
        active: true,
        highlighted: false,
        pinned: false,
        incognito: false,
        index: 0,
        windowId: 1,
      };

      mockMessageDispatcher.getXPath.mockResolvedValue({
        success: true,
        xpaths: { absolute: '', mixed: '', smart: '' },
      });
      mockMessageDispatcher.showXPathDialog.mockResolvedValue({} as any);

      await handler.handleContextMenuClick(mockInfo, mockTab);

      expect(mockMessageDispatcher.getXPath).toHaveBeenCalled();
      expect(mockMessageDispatcher.showXPathDialog).toHaveBeenCalled();
    });
  });
});
