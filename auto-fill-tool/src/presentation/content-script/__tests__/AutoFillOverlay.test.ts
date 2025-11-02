/**
 * Test for AutoFillOverlay
 */

import { AutoFillOverlay } from '../AutoFillOverlay';
import browser from 'webextension-polyfill';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock browser
jest.mock('webextension-polyfill', () => ({
  runtime: {
    sendMessage: jest.fn(),
  },
}));

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => {
      const messages: Record<string, string> = {
        autoFillInProgress: 'Auto-fill in progress...',
        preparing: 'Preparing...',
        cancel: 'Cancel',
        escKeyHint: 'Press ESC to cancel',
      };
      return messages[key] || key;
    }),
    format: jest.fn((key: string, ...args: string[]) => {
      const messages: Record<string, string> = {
        stepProgress: `Step ${args[0]} of ${args[1]}`,
      };
      return messages[key] || key;
    }),
  },
}));

// Mock CSS content for Shadow DOM
const mockCSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  .overlay-backdrop { position: fixed; background: rgba(0,0,0,0.5); }
  .loading-container { background: white; border-radius: 12px; }
`;

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('AutoFillOverlay', () => {
  let overlay: AutoFillOverlay;
  let mockSendMessage: jest.Mock;

  beforeEach(async () => {
    overlay = new AutoFillOverlay();
    mockSendMessage = browser.runtime.sendMessage as jest.Mock;
    mockSendMessage.mockResolvedValue(undefined);

    // Clear document body
    document.body.innerHTML = '';

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

  afterEach((done) => {
    // Ensure overlay is hidden and cleaned up before next test
    if (overlay) {
      overlay.hide();
    }
    // Wait for cleanup to complete (300ms fade out + buffer)
    setTimeout(() => {
      jest.clearAllMocks();
      document.body.innerHTML = '';
      done();
    }, 350);
  });

  describe('show', () => {
    it('should create and display overlay with default message', async () => {
      await overlay.show();

      const container = document.getElementById('auto-fill-overlay-container');
      expect(container).toBeTruthy();
      expect(container?.shadowRoot).toBeTruthy();
    });

    it('should display custom message', async () => {
      await overlay.show('Custom loading message');

      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const messageElement = shadowRoot?.querySelector('.message');

      expect(messageElement?.textContent).toContain('Custom loading message');
    });

    it('should not create duplicate overlays', async () => {
      await overlay.show();
      await overlay.show();

      const containers = document.querySelectorAll('#auto-fill-overlay-container');
      expect(containers.length).toBe(1);
    });

    it('should create spinner element', async () => {
      await overlay.show();

      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const spinner = shadowRoot?.querySelector('.spinner');

      expect(spinner).toBeTruthy();
    });

    it('should create cancel button', async () => {
      await overlay.show();

      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const cancelButton = shadowRoot?.getElementById('cancel-button');

      expect(cancelButton).toBeTruthy();
      expect(cancelButton?.textContent).toContain('Cancel');
    });

    it('should create progress bar', async () => {
      await overlay.show();

      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const progressBar = shadowRoot?.getElementById('progress-bar');

      expect(progressBar).toBeTruthy();
    });

    it('should display step info', async () => {
      await overlay.show();

      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const stepInfo = shadowRoot?.getElementById('step-info');

      expect(stepInfo).toBeTruthy();
      expect(stepInfo?.textContent).toContain('Preparing...');
    });

    it('should escape HTML in message', async () => {
      await overlay.show('<script>alert("xss")</script>');

      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const messageElement = shadowRoot?.querySelector('.message');

      expect(messageElement?.textContent).not.toContain('<script>');
    });
  });

  describe('updateProgress', () => {
    beforeEach(async () => {
      await overlay.show();
    });

    it('should update progress bar width', async () => {
      overlay.updateProgress(5, 10);

      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const progressBar = shadowRoot?.getElementById('progress-bar') as HTMLElement;

      expect(progressBar.style.width).toBe('50%');
    });

    it('should update step info text', async () => {
      overlay.updateProgress(3, 7);

      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const stepInfo = shadowRoot?.getElementById('step-info');

      expect(stepInfo?.textContent).toContain('Step 3 of 7');
    });

    it('should handle zero total', async () => {
      overlay.updateProgress(0, 0);

      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const progressBar = shadowRoot?.getElementById('progress-bar') as HTMLElement;

      expect(progressBar.style.width).toBe('0%');
    });

    it('should handle 100% progress', async () => {
      overlay.updateProgress(10, 10);

      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const progressBar = shadowRoot?.getElementById('progress-bar') as HTMLElement;

      expect(progressBar.style.width).toBe('100%');
    });

    it('should do nothing if overlay is not shown', async () => {
      overlay.hide();

      expect(() => {
        overlay.updateProgress(5, 10);
      }).not.toThrow();
    });
  });

  describe('updateMessage', () => {
    beforeEach(async () => {
      await overlay.show();
    });

    it('should update message text', async () => {
      overlay.updateMessage('New message');

      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const messageElement = shadowRoot?.querySelector('.message');

      expect(messageElement?.textContent).toBe('New message');
    });

    it('should escape HTML in message', async () => {
      overlay.updateMessage('<img src=x onerror=alert(1)>');

      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const messageElement = shadowRoot?.querySelector('.message');

      expect(messageElement?.textContent).not.toContain('<img');
    });

    it('should do nothing if overlay is not shown', async () => {
      overlay.hide();

      expect(() => {
        overlay.updateMessage('Test');
      }).not.toThrow();
    });
  });

  describe('updateStepDescription', () => {
    beforeEach(async () => {
      await overlay.show();
    });

    it('should update step description text', async () => {
      overlay.updateStepDescription('Filling form field');

      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const stepDesc = shadowRoot?.getElementById('step-description');

      expect(stepDesc?.textContent).toBe('Filling form field');
    });

    it('should escape HTML in description', async () => {
      overlay.updateStepDescription('<script>alert("xss")</script>');

      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const stepDesc = shadowRoot?.getElementById('step-description');

      expect(stepDesc?.textContent).not.toContain('<script>');
    });

    it('should do nothing if overlay is not shown', async () => {
      overlay.hide();

      expect(() => {
        overlay.updateStepDescription('Test');
      }).not.toThrow();
    });
  });

  describe('hide', () => {
    it('should remove overlay from DOM', async () => {
      await overlay.show();

      const container = document.getElementById('auto-fill-overlay-container');
      expect(container).toBeTruthy();

      overlay.hide();

      await new Promise((resolve) => setTimeout(resolve, 350));

      const containerAfter = document.getElementById('auto-fill-overlay-container');
      expect(containerAfter).toBeNull();
    });

    it('should do nothing if overlay is not shown', async () => {
      expect(() => {
        overlay.hide();
      }).not.toThrow();
    });

    it('should clean up event listeners', async () => {
      await overlay.show();

      // Verify overlay is shown and handler is working
      expect(document.getElementById('auto-fill-overlay-container')).toBeTruthy();

      // Hide the overlay to trigger cleanup
      overlay.hide();

      // Wait for cleanup to complete (300ms fade out + buffer)
      await new Promise((resolve) => setTimeout(resolve, 350));

      // Clear any previous calls to mockSendMessage
      mockSendMessage.mockClear();

      // Try to trigger the cancel action via ESC key
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      // Wait a bit to ensure any async operations complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // The overlay's handler should not be called anymore after cleanup
      expect(mockSendMessage).not.toHaveBeenCalled();

      // Verify the overlay container is removed
      expect(document.getElementById('auto-fill-overlay-container')).toBeNull();
    });
  });

  describe('cancel functionality', () => {
    beforeEach(async () => {
      await overlay.show();
    });

    it('should send cancel message when cancel button is clicked', async () => {
      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const cancelButton = shadowRoot?.getElementById('cancel-button') as HTMLButtonElement;

      cancelButton.click();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockSendMessage).toHaveBeenCalledWith({
        action: 'cancelAutoFill',
        tabId: null,
      });
    });

    it('should hide overlay when cancel button is clicked', async () => {
      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const cancelButton = shadowRoot?.getElementById('cancel-button') as HTMLButtonElement;

      cancelButton.click();

      await new Promise((resolve) => setTimeout(resolve, 350));

      const containerAfter = document.getElementById('auto-fill-overlay-container');
      expect(containerAfter).toBeNull();
    });

    it('should send cancel message when ESC key is pressed', async () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockSendMessage).toHaveBeenCalledWith({
        action: 'cancelAutoFill',
        tabId: null,
      });
    });

    it('should hide overlay when ESC key is pressed', async () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 350));

      const containerAfter = document.getElementById('auto-fill-overlay-container');
      expect(containerAfter).toBeNull();
    });

    it('should not trigger cancel on other keys', async () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('should handle cancel message error gracefully', async () => {
      mockSendMessage.mockRejectedValue(new Error('Network error'));

      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const cancelButton = shadowRoot?.getElementById('cancel-button') as HTMLButtonElement;

      await expect(async () => {
        cancelButton.click();
        await new Promise((resolve) => setTimeout(resolve, 0));
      }).not.toThrow();
    });
  });

  describe('progress update event', () => {
    beforeEach(async () => {
      await overlay.show();
    });

    it('should handle progress update custom event', async () => {
      const event = new CustomEvent('auto-fill-progress-update', {
        detail: {
          current: 5,
          total: 10,
          description: 'Filling username',
        },
      });

      document.dispatchEvent(event);

      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const progressBar = shadowRoot?.getElementById('progress-bar') as HTMLElement;
      const stepInfo = shadowRoot?.getElementById('step-info');
      const stepDesc = shadowRoot?.getElementById('step-description');

      expect(progressBar.style.width).toBe('50%');
      expect(stepInfo?.textContent).toContain('Step 5 of 10');
      expect(stepDesc?.textContent).toBe('Filling username');
    });

    it('should handle progress update without description', async () => {
      const event = new CustomEvent('auto-fill-progress-update', {
        detail: {
          current: 3,
          total: 7,
        },
      });

      document.dispatchEvent(event);

      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const progressBar = shadowRoot?.getElementById('progress-bar') as HTMLElement;

      expect(progressBar.style.width).toContain('42.857');
    });
  });

  describe('shadow DOM isolation', () => {
    it('should use shadow DOM for style isolation', async () => {
      await overlay.show();

      const container = document.getElementById('auto-fill-overlay-container');
      expect(container?.shadowRoot).toBeTruthy();
      expect(container?.shadowRoot?.mode).toBe('open');
    });

    it('should contain styles within shadow DOM', async () => {
      await overlay.show();

      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const styleElement = shadowRoot?.querySelector('style');

      expect(styleElement).toBeTruthy();
      expect(styleElement?.textContent).toContain('.overlay-backdrop');
    });
  });

  describe('overlay backdrop click', () => {
    it('should not close when clicking on dialog content', async () => {
      await overlay.show();

      const container = document.getElementById('auto-fill-overlay-container');
      const shadowRoot = container?.shadowRoot;
      const loadingContainer = shadowRoot?.querySelector('.loading-container') as HTMLElement;

      loadingContainer.click();

      const containerAfter = document.getElementById('auto-fill-overlay-container');
      expect(containerAfter).toBeTruthy();
    });
  });
});
