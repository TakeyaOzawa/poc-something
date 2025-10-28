/**
 * @jest-environment jsdom
 */

import { ShowXPathDialogHandler } from '../ShowXPathDialogHandler';
import { MessageTypes } from '@domain/types/messaging';
import { ShowXPathDialogRequest } from '@domain/types/messaging';
import { MessageContext } from '@domain/types/messaging';

// Mock XPathDialog
jest.mock('../../XPathDialog', () => {
  return {
    XPathDialog: jest.fn().mockImplementation(() => {
      return {
        show: jest.fn(),
      };
    }),
  };
});

describe('ShowXPathDialogHandler', () => {
  let handler: ShowXPathDialogHandler;
  let lastRightClickPosition = { x: 100, y: 200 };

  beforeEach(() => {
    handler = new ShowXPathDialogHandler(() => lastRightClickPosition);
  });

  it('should show XPath dialog with provided info', () => {
    const message: ShowXPathDialogRequest = {
      action: MessageTypes.SHOW_XPATH_DIALOG,
      xpathInfo: {
        smart: '//div[@id="test"]',
        short: '//*[@id="test"]',
        absolute: '/html/body/div[1]',
        elementInfo: {
          tagName: 'DIV',
          text: 'test content',
        },
      },
    };

    const context: MessageContext = {
      sender: { tab: { id: 123 } } as any,
    };

    const response = handler.handle(message, context);

    expect(response.success).toBe(true);
  });

  it('should return error when xpathInfo is missing', () => {
    const message = {
      action: MessageTypes.SHOW_XPATH_DIALOG,
    } as ShowXPathDialogRequest;

    const context: MessageContext = {
      sender: { tab: { id: 123 } } as any,
    };

    const response = handler.handle(message, context);

    expect(response.success).toBe(false);
    expect(response.error).toBe('Missing xpathInfo');
  });

  it('should handle null XPath values', () => {
    const message: ShowXPathDialogRequest = {
      action: MessageTypes.SHOW_XPATH_DIALOG,
      xpathInfo: {
        smart: null,
        short: null,
        absolute: null,
        elementInfo: {
          tagName: 'DIV',
          text: 'test',
        },
      },
    };

    const context: MessageContext = {
      sender: { tab: { id: 123 } } as any,
    };

    const response = handler.handle(message, context);

    expect(response.success).toBe(true);
  });

  it('should use current click position', () => {
    lastRightClickPosition = { x: 300, y: 400 };
    handler = new ShowXPathDialogHandler(() => lastRightClickPosition);

    const message: ShowXPathDialogRequest = {
      action: MessageTypes.SHOW_XPATH_DIALOG,
      xpathInfo: {
        smart: '//span',
        short: '//span',
        absolute: '//span',
        elementInfo: {
          tagName: 'SPAN',
          text: 'click here',
        },
      },
    };

    const context: MessageContext = {
      sender: { tab: { id: 456 } } as any,
    };

    const response = handler.handle(message, context);

    expect(response.success).toBe(true);
  });
});
