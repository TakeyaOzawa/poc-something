/**
 * Test for XPathDialog
 */

import { XPathDialog, XPathInfo } from '../XPathDialog';

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => {
      const messages: Record<string, string> = {
        xpathInfo: 'XPath Information',
        close: 'Close',
        element: 'Element',
        value: 'Value',
        copy: 'Copy',
        copied: 'Copied',
        recommended: 'Recommended',
        clipboardCopyFailed: 'Failed to copy to clipboard',
      };
      return messages[key] || key;
    }),
  },
}));

// Mock CSS content for Shadow DOM
const mockCSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  .dialog-overlay { position: fixed; background: rgba(0,0,0,0.3); }
  .dialog { background: white; border-radius: 8px; }
`;

describe('XPathDialog', () => {
  let dialog: XPathDialog;
  let mockXPathInfo: XPathInfo;

  beforeEach(() => {
    dialog = new XPathDialog();
    mockXPathInfo = {
      smart: '//input[@id="username"]',
      short: '//input[@id="username"]',
      absolute: '/html/body/form/div/input[1]',
      elementInfo: {
        tagName: 'INPUT',
        text: 'Username',
      },
    };

    // Clear document body
    document.body.innerHTML = '';

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });

    // Mock chrome.runtime.getURL
    global.chrome = {
      runtime: {
        getURL: jest.fn((path: string) => `chrome-extension://mock-id/${path}`),
      },
    } as any;

    // Mock fetch for CSS loading
    global.fetch = jest.fn().mockResolvedValue({
      text: jest.fn().mockResolvedValue(mockCSS),
      ok: true,
    } as any);
  });

  afterEach(() => {
    dialog.destroy();
    jest.clearAllMocks();
  });

  describe('show', () => {
    it('should create and display dialog', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      expect(container).toBeTruthy();
      expect(container?.shadowRoot).toBeTruthy();
    });

    it('should display element information', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      const shadowRoot = container?.shadowRoot;
      const elementInfo = shadowRoot?.querySelector('.element-info');

      expect(elementInfo?.innerHTML).toContain('INPUT');
      expect(elementInfo?.innerHTML).toContain('Username');
    });

    it('should display all three XPath variants', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      const shadowRoot = container?.shadowRoot;

      expect(shadowRoot?.textContent).toContain('Smart XPath');
      expect(shadowRoot?.textContent).toContain('Short XPath');
      expect(shadowRoot?.textContent).toContain('Absolute XPath');
      expect(shadowRoot?.textContent).toContain('//input[@id="username"]');
      expect(shadowRoot?.textContent).toContain('/html/body/form/div/input[1]');
    });

    it('should display recommended badge for smart XPath', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      const shadowRoot = container?.shadowRoot;

      expect(shadowRoot?.innerHTML).toContain('Recommended');
    });

    it('should create copy buttons for each XPath', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      const shadowRoot = container?.shadowRoot;
      const copyButtons = shadowRoot?.querySelectorAll('[data-action="copy"]');

      expect(copyButtons?.length).toBe(3);
    });

    it('should create close buttons', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      const shadowRoot = container?.shadowRoot;
      const closeButtons = shadowRoot?.querySelectorAll('[data-action="close"]');

      expect(closeButtons?.length).toBeGreaterThan(0);
    });

    it('should remove existing dialog before showing new one', async () => {
      await dialog.show(mockXPathInfo, 100, 100);
      const firstContainer = document.getElementById('xpath-dialog-container');
      expect(firstContainer).toBeTruthy();

      await dialog.show(mockXPathInfo, 200, 200);
      const secondContainer = document.getElementById('xpath-dialog-container');
      expect(secondContainer).toBeTruthy();

      // Should only have one dialog container at a time
      const containers = document.querySelectorAll('#xpath-dialog-container');
      expect(containers.length).toBe(1);
    });

    it('should escape HTML in element info', async () => {
      const xssXPathInfo: XPathInfo = {
        smart: '//input',
        short: '//input',
        absolute: '/html/body/input[1]',
        elementInfo: {
          tagName: '<script>alert("xss")</script>',
          text: '<img src=x onerror=alert(1)>',
        },
      };

      await dialog.show(xssXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      const shadowRoot = container?.shadowRoot;
      const elementInfo = shadowRoot?.querySelector('.element-info');

      expect(elementInfo?.innerHTML).not.toContain('<script>');
      expect(elementInfo?.innerHTML).not.toContain('<img');
      expect(elementInfo?.innerHTML).toContain('&lt;script&gt;');
    });

    it('should display element without text', async () => {
      const xpathInfoNoText: XPathInfo = {
        smart: '//button',
        short: '//button',
        absolute: '/html/body/button[1]',
        elementInfo: {
          tagName: 'BUTTON',
          text: '',
        },
      };

      await dialog.show(xpathInfoNoText, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      const shadowRoot = container?.shadowRoot;
      const elementInfo = shadowRoot?.querySelector('.element-info');

      expect(elementInfo?.innerHTML).toContain('BUTTON');
      expect(elementInfo?.innerHTML).not.toContain('Value:');
    });
  });

  describe('destroy', () => {
    it('should remove dialog from DOM', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      expect(container).toBeTruthy();

      dialog.destroy();

      const containerAfter = document.getElementById('xpath-dialog-container');
      expect(containerAfter).toBeNull();
    });

    it('should do nothing if dialog is not shown', async () => {
      expect(() => {
        dialog.destroy();
      }).not.toThrow();
    });
  });

  describe('close buttons', () => {
    it('should close dialog when header close button is clicked', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      const shadowRoot = container?.shadowRoot;
      const closeButton = shadowRoot?.querySelector(
        '.dialog-header [data-action="close"]'
      ) as HTMLButtonElement;

      closeButton.click();

      const containerAfter = document.getElementById('xpath-dialog-container');
      expect(containerAfter).toBeNull();
    });

    it('should close dialog when footer close button is clicked', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      const shadowRoot = container?.shadowRoot;
      const closeButton = shadowRoot?.querySelector(
        '.dialog-footer [data-action="close"]'
      ) as HTMLButtonElement;

      closeButton.click();

      const containerAfter = document.getElementById('xpath-dialog-container');
      expect(containerAfter).toBeNull();
    });
  });

  describe('overlay backdrop click', () => {
    it('should close dialog when clicking on backdrop', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      const shadowRoot = container?.shadowRoot;
      const overlay = shadowRoot?.querySelector('[data-role="overlay"]') as HTMLElement;

      overlay.click();

      const containerAfter = document.getElementById('xpath-dialog-container');
      expect(containerAfter).toBeNull();
    });

    it('should not close when clicking on dialog content', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      const shadowRoot = container?.shadowRoot;
      const dialogContent = shadowRoot?.querySelector('.dialog') as HTMLElement;

      dialogContent.click();

      const containerAfter = document.getElementById('xpath-dialog-container');
      expect(containerAfter).toBeTruthy();
    });
  });

  describe('ESC key', () => {
    it('should close dialog when ESC key is pressed', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      const container = document.getElementById('xpath-dialog-container');
      expect(container).toBeNull();
    });

    it('should not close on other keys', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);

      const container = document.getElementById('xpath-dialog-container');
      expect(container).toBeTruthy();
    });
  });

  describe('copy to clipboard', () => {
    it('should copy XPath to clipboard when copy button is clicked', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      const shadowRoot = container?.shadowRoot;
      const copyButtons = shadowRoot?.querySelectorAll('[data-action="copy"]');
      const smartCopyButton = copyButtons?.[0] as HTMLButtonElement;

      smartCopyButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('//input[@id="username"]');
    });

    it('should show visual feedback after copying', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      const shadowRoot = container?.shadowRoot;
      const copyButtons = shadowRoot?.querySelectorAll('[data-action="copy"]');
      const smartCopyButton = copyButtons?.[0] as HTMLButtonElement;

      const originalText = smartCopyButton.textContent;
      smartCopyButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(smartCopyButton.textContent).toContain('Copied');
      expect(smartCopyButton.classList.contains('copied')).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 2100));

      expect(smartCopyButton.textContent).toBe(originalText);
      expect(smartCopyButton.classList.contains('copied')).toBe(false);
    });

    it('should copy short XPath correctly', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      const shadowRoot = container?.shadowRoot;
      const copyButtons = shadowRoot?.querySelectorAll('[data-action="copy"]');
      const shortCopyButton = copyButtons?.[1] as HTMLButtonElement;

      shortCopyButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('//input[@id="username"]');
    });

    it('should copy absolute XPath correctly', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      const shadowRoot = container?.shadowRoot;
      const copyButtons = shadowRoot?.querySelectorAll('[data-action="copy"]');
      const absoluteCopyButton = copyButtons?.[2] as HTMLButtonElement;

      absoluteCopyButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('/html/body/form/div/input[1]');
    });

    it('should show alert if clipboard copy fails', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValue(new Error('Clipboard error'));

      await dialog.show(mockXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      const shadowRoot = container?.shadowRoot;
      const copyButtons = shadowRoot?.querySelectorAll('[data-action="copy"]');
      const smartCopyButton = copyButtons?.[0] as HTMLButtonElement;

      smartCopyButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(alertSpy).toHaveBeenCalledWith('Failed to copy to clipboard');

      alertSpy.mockRestore();
    });
  });

  describe('shadow DOM isolation', () => {
    it('should use shadow DOM for style isolation', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      expect(container?.shadowRoot).toBeTruthy();
      expect(container?.shadowRoot?.mode).toBe('open');
    });

    it('should contain styles within shadow DOM', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      const shadowRoot = container?.shadowRoot;
      const styleElement = shadowRoot?.querySelector('style');

      expect(styleElement).toBeTruthy();
      expect(styleElement?.textContent).toContain('.dialog-overlay');
      expect(styleElement?.textContent).toContain('.dialog');
    });
  });

  describe('positioning', () => {
    it('should position dialog in viewport', async () => {
      await dialog.show(mockXPathInfo, 500, 300);

      const container = document.getElementById('xpath-dialog-container');
      expect(container?.style.position).toBe('fixed');
      expect(container?.style.top).toBe('0px');
      expect(container?.style.left).toBe('0px');
      expect(container?.style.width).toBe('100%');
      expect(container?.style.height).toBe('100%');
    });
  });

  describe('XPath data attributes', () => {
    it('should set correct data attributes on copy buttons', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      const shadowRoot = container?.shadowRoot;
      const copyButtons = shadowRoot?.querySelectorAll('[data-action="copy"]');

      const smartButton = copyButtons?.[0] as HTMLButtonElement;
      const shortButton = copyButtons?.[1] as HTMLButtonElement;
      const absoluteButton = copyButtons?.[2] as HTMLButtonElement;

      expect(smartButton.dataset.xpath).toBe('//input[@id="username"]');
      expect(smartButton.dataset.type).toBe('smart');

      expect(shortButton.dataset.xpath).toBe('//input[@id="username"]');
      expect(shortButton.dataset.type).toBe('short');

      expect(absoluteButton.dataset.xpath).toBe('/html/body/form/div/input[1]');
      expect(absoluteButton.dataset.type).toBe('absolute');
    });
  });

  describe('dialog title', () => {
    it('should display dialog title with XPath info', async () => {
      await dialog.show(mockXPathInfo, 100, 100);

      const container = document.getElementById('xpath-dialog-container');
      const shadowRoot = container?.shadowRoot;
      const title = shadowRoot?.querySelector('.dialog-title');

      expect(title?.textContent).toContain('XPath Information');
    });
  });
});
