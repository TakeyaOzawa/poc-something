/**
 * @jest-environment jsdom
 */

import { GetXPathHandler } from '../GetXPathHandler';
import { MessageTypes } from '@domain/types/messaging';
import { GetXPathRequest } from '@domain/types/messaging';
import { MessageContext } from '@domain/types/messaging';
import { BrowserXPathGenerationAdapter } from '@infrastructure/adapters/BrowserXPathGenerationAdapter';

describe('GetXPathHandler', () => {
  let handler: GetXPathHandler;
  let mockElement: HTMLElement;
  let lastRightClickedElement: Element | null = null;
  let xpathService: BrowserXPathGenerationAdapter;

  beforeEach(() => {
    document.body.innerHTML = '<div id="test-element">Test Content</div>';
    mockElement = document.getElementById('test-element') as HTMLElement;
    lastRightClickedElement = mockElement;
    xpathService = new BrowserXPathGenerationAdapter();

    handler = new GetXPathHandler(() => lastRightClickedElement, xpathService);
  });

  it('should return XPaths when element is available', () => {
    const message: GetXPathRequest = {
      action: MessageTypes.GET_XPATH,
    };

    const context: MessageContext = {
      sender: { tab: { id: 123 } } as any,
    };

    const response = handler.handle(message, context);

    expect(response.success).toBe(true);
    expect(response.xpaths).toBeDefined();
    expect(response.xpaths?.smart).toBeTruthy();
    expect(response.xpaths?.absolute).toBeTruthy();
    expect(response.xpaths?.mixed).toBeTruthy();
    expect(response.elementInfo).toBeDefined();
    expect(response.elementInfo?.tagName).toBe('DIV');
  });

  it('should return error when no element is clicked', () => {
    lastRightClickedElement = null;
    handler = new GetXPathHandler(() => lastRightClickedElement, xpathService);

    const message: GetXPathRequest = {
      action: MessageTypes.GET_XPATH,
    };

    const context: MessageContext = {
      sender: { tab: { id: 123 } } as any,
    };

    const response = handler.handle(message, context);

    expect(response.success).toBe(false);
    expect(response.error).toBe('No element was right-clicked');
  });

  it('should extract value from input element', () => {
    document.body.innerHTML = '<input id="test-input" type="text" value="test-value">';
    const inputElement = document.getElementById('test-input') as HTMLInputElement;
    lastRightClickedElement = inputElement;
    handler = new GetXPathHandler(() => lastRightClickedElement, xpathService);

    const message: GetXPathRequest = {
      action: MessageTypes.GET_XPATH,
    };

    const context: MessageContext = {
      sender: { tab: { id: 123 } } as any,
    };

    const response = handler.handle(message, context);

    expect(response.success).toBe(true);
    expect(response.elementInfo?.text).toBe('test-value');
  });

  it('should extract checked state from checkbox', () => {
    document.body.innerHTML = '<input id="test-checkbox" type="checkbox" checked>';
    const checkboxElement = document.getElementById('test-checkbox') as HTMLInputElement;
    lastRightClickedElement = checkboxElement;
    handler = new GetXPathHandler(() => lastRightClickedElement, xpathService);

    const message: GetXPathRequest = {
      action: MessageTypes.GET_XPATH,
    };

    const context: MessageContext = {
      sender: { tab: { id: 123 } } as any,
    };

    const response = handler.handle(message, context);

    expect(response.success).toBe(true);
    expect(response.elementInfo?.text).toBe('1');
  });
});
