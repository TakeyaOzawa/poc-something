import { MessageDispatcher } from '../MessageDispatcher';
import { MessageTypes } from '@domain/types/messaging';
import browser from 'webextension-polyfill';

// Mock webextension-polyfill
jest.mock('webextension-polyfill', () => ({
  runtime: {
    sendMessage: jest.fn(),
  },
  tabs: {
    sendMessage: jest.fn(),
  },
}));

describe('MessageDispatcher', () => {
  let dispatcher: MessageDispatcher;

  beforeEach(() => {
    dispatcher = new MessageDispatcher();
    jest.clearAllMocks();
  });

  describe('sendToBackground', () => {
    it('should send message to background script', async () => {
      const mockResponse = { success: true, data: { processedSteps: 5 } };
      (browser.runtime.sendMessage as jest.Mock).mockResolvedValue(mockResponse);

      const message = {
        action: MessageTypes.EXECUTE_AUTO_FILL,
        tabId: 123,
        websiteId: 'website-1',
        websiteVariables: { key: 'value' },
      };

      const response = await dispatcher.sendToBackground(message);

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith(message);
      expect(response).toEqual(mockResponse);
    });
  });

  describe('sendToTab', () => {
    it('should send message to specific tab', async () => {
      const mockResponse = {
        success: true,
        xpaths: { smart: 'test', mixed: 'test', absolute: 'test' },
      };
      (browser.tabs.sendMessage as jest.Mock).mockResolvedValue(mockResponse);

      const message = {
        action: MessageTypes.GET_XPATH,
      };

      const response = await dispatcher.sendToTab(123, message);

      expect(browser.tabs.sendMessage).toHaveBeenCalledWith(123, message);
      expect(response).toEqual(mockResponse);
    });
  });

  describe('executeAutoFill', () => {
    it('should send executeAutoFill message', async () => {
      const mockResponse = { success: true, data: { processedSteps: 3 } };
      (browser.runtime.sendMessage as jest.Mock).mockResolvedValue(mockResponse);

      const response = await dispatcher.executeAutoFill({
        tabId: 456,
        websiteId: 'website-2',
        websiteVariables: { foo: 'bar' },
      });

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: MessageTypes.EXECUTE_AUTO_FILL,
        tabId: 456,
        websiteId: 'website-2',
        websiteVariables: { foo: 'bar' },
      });
      expect(response).toEqual(mockResponse);
    });

    it('should send executeAutoFill message with null tabId', async () => {
      const mockResponse = { success: true, data: { processedSteps: 2 } };
      (browser.runtime.sendMessage as jest.Mock).mockResolvedValue(mockResponse);

      const response = await dispatcher.executeAutoFill({
        tabId: null,
        websiteId: 'website-3',
        websiteVariables: {},
      });

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: MessageTypes.EXECUTE_AUTO_FILL,
        tabId: null,
        websiteId: 'website-3',
        websiteVariables: {},
      });
      expect(response).toEqual(mockResponse);
    });
  });

  describe('getXPath', () => {
    it('should send getXPath message to tab', async () => {
      const mockResponse = {
        success: true,
        xpaths: {
          smart: '//div[@id="test"]',
          mixed: '//*[@id="test"]',
          absolute: '/html/body/div[1]',
        },
        elementInfo: {
          tagName: 'DIV',
          text: 'test',
        },
      };
      (browser.tabs.sendMessage as jest.Mock).mockResolvedValue(mockResponse);

      const response = await dispatcher.getXPath(789);

      expect(browser.tabs.sendMessage).toHaveBeenCalledWith(789, {
        action: MessageTypes.GET_XPATH,
      });
      expect(response).toEqual(mockResponse);
    });
  });

  describe('showXPathDialog', () => {
    it('should send showXPathDialog message to tab', async () => {
      const mockResponse = { success: true };
      (browser.tabs.sendMessage as jest.Mock).mockResolvedValue(mockResponse);

      const xpathInfo = {
        smart: '//div[@id="test"]',
        short: '//*[@id="test"]',
        absolute: '/html/body/div[1]',
        elementInfo: {
          tagName: 'DIV',
          text: 'test',
        },
      };

      const response = await dispatcher.showXPathDialog(123, xpathInfo);

      expect(browser.tabs.sendMessage).toHaveBeenCalledWith(123, {
        action: MessageTypes.SHOW_XPATH_DIALOG,
        xpathInfo,
      });
      expect(response).toEqual(mockResponse);
    });
  });

  describe('executeWebsiteFromPopup', () => {
    it('should send executeWebsiteFromPopup message to background', async () => {
      const mockResponse = {
        success: true,
        data: { processedSteps: 5 },
      };
      (browser.runtime.sendMessage as jest.Mock).mockResolvedValue(mockResponse);

      const response = await dispatcher.executeWebsiteFromPopup('website-123');

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        action: MessageTypes.EXECUTE_WEBSITE_FROM_POPUP,
        websiteId: 'website-123',
      });
      expect(response).toEqual(mockResponse);
    });

    it('should handle error response', async () => {
      const mockResponse = {
        success: false,
        data: { error: 'Website not found' },
      };
      (browser.runtime.sendMessage as jest.Mock).mockResolvedValue(mockResponse);

      const response = await dispatcher.executeWebsiteFromPopup('invalid-id');

      expect(response).toEqual(mockResponse);
    });
  });
});
