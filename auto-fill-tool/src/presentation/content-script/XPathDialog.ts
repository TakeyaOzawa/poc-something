/* eslint-disable max-lines */
/**
 * XPathDialog Component
 *
 * A Shadow DOM based dialog component that displays XPath information
 * for a selected element at the click position.
 *
 * Features:
 * - Isolated styles using Shadow DOM
 * - Click position based positioning
 * - Three XPath variants (Smart, Short, Absolute)
 * - Copy to clipboard functionality
 * - Keyboard accessible (ESC to close)
 */

import { LoggerFactory } from '@/infrastructure/loggers/LoggerFactory';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';

export interface XPathInfo {
  smart: string;
  short: string;
  absolute: string;
  elementInfo: {
    tagName: string;
    text: string;
  };
}

export class XPathDialog {
  private container: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private logger = LoggerFactory.createLogger('XPathDialog');

  // CSS cache to avoid repeated fetch operations
  private static cssCache: string | null = null;

  /**
   * Show the dialog at the specified position
   * @param xpathInfo - XPath information to display
   * @param x - X coordinate for dialog position
   * @param y - Y coordinate for dialog position
   */
  public async show(xpathInfo: XPathInfo, x: number, y: number): Promise<void> {
    // Remove any existing dialog
    this.destroy();

    // Create container element
    this.container = document.createElement('div');
    this.container.id = 'xpath-dialog-container';

    // Attach Shadow DOM for style isolation
    this.shadowRoot = this.container.attachShadow({ mode: 'open' });

    // Add styles
    this.shadowRoot.appendChild(await this.createStyles());

    // Add dialog content
    this.shadowRoot.appendChild(this.createDialogContent(xpathInfo));

    // Append to body
    document.body.appendChild(this.container);

    // Position the dialog near the click position
    this.positionDialog(x, y);

    // Add event listeners
    this.attachEventListeners();
  }

  /**
   * Destroy the dialog and clean up
   */
  public destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.shadowRoot = null;
  }

  /**
   * Create styles for the dialog by loading external CSS file
   * CSS is now separated in public/styles/xpath-dialog-shadow.css
   * CSS is cached after first load to improve performance
   */
  private async createStyles(): Promise<HTMLStyleElement> {
    const style = document.createElement('style');

    // Use cached CSS if available
    if (XPathDialog.cssCache !== null) {
      style.textContent = XPathDialog.cssCache;
      return style;
    }

    try {
      // Load CSS file from extension resources (first time only)
      const cssUrl = chrome.runtime.getURL('styles/xpath-dialog-shadow.css');
      const response = await fetch(cssUrl);
      const cssText = await response.text();

      // Cache the CSS for future use
      XPathDialog.cssCache = cssText;
      style.textContent = cssText;
      this.logger.debug('Shadow DOM CSS loaded and cached successfully');
    } catch (error) {
      this.logger.error('Failed to load Shadow DOM CSS', error);
      // Fallback to minimal styles with proper centering if CSS loading fails
      const fallbackCss = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dialog {
          background: white;
          padding: 20px;
          border-radius: 8px;
          max-width: 500px;
          max-height: 80vh;
          overflow: auto;
        }
      `;
      XPathDialog.cssCache = fallbackCss;
      style.textContent = fallbackCss;
    }

    return style;
  }

  /**
   * Create the dialog content
   */
  private createDialogContent(xpathInfo: XPathInfo): HTMLElement {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    overlay.dataset.role = 'overlay';

    const dialog = document.createElement('div');
    dialog.className = 'dialog';

    // Header
    const header = document.createElement('div');
    header.className = 'dialog-header';
    header.innerHTML = `
      <h2 class="dialog-title">🔍 ${I18nAdapter.getMessage('xpathInfo')}</h2>
      <button class="close-button" data-action="close" aria-label="${I18nAdapter.getMessage('close')}">×</button>
    `;

    // Body
    const body = document.createElement('div');
    body.className = 'dialog-body';

    // Element info
    const elementInfo = document.createElement('div');
    elementInfo.className = 'element-info';
    elementInfo.innerHTML = `
      <strong>${I18nAdapter.getMessage('element')}:</strong> ${this.escapeHtml(xpathInfo.elementInfo.tagName)}
      ${xpathInfo.elementInfo.text ? `<br><strong>${I18nAdapter.getMessage('value')}:</strong> ${this.escapeHtml(xpathInfo.elementInfo.text)}` : ''}
    `;

    // XPath groups
    const smartGroup = this.createXPathGroup('Smart XPath', xpathInfo.smart, 'smart', true);
    const shortGroup = this.createXPathGroup('Short XPath', xpathInfo.short, 'short', false);
    const absoluteGroup = this.createXPathGroup(
      'Absolute XPath',
      xpathInfo.absolute,
      'absolute',
      false
    );

    body.appendChild(elementInfo);
    body.appendChild(smartGroup);
    body.appendChild(shortGroup);
    body.appendChild(absoluteGroup);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'dialog-footer';
    footer.innerHTML = `
      <button class="close-footer-button" data-action="close">${I18nAdapter.getMessage('close')}</button>
    `;

    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);

    return overlay;
  }

  /**
   * Create an XPath group element
   */
  private createXPathGroup(
    label: string,
    xpath: string,
    type: string,
    isRecommended: boolean
  ): HTMLElement {
    const group = document.createElement('div');
    group.className = 'xpath-group';

    const labelDiv = document.createElement('div');
    labelDiv.className = 'xpath-label';
    labelDiv.innerHTML = `
      ${label}
      ${isRecommended ? `<span class="badge">${I18nAdapter.getMessage('recommended')}</span>` : ''}
    `;

    const container = document.createElement('div');
    container.className = 'xpath-container';

    const valueDiv = document.createElement('div');
    valueDiv.className = 'xpath-value';
    valueDiv.textContent = xpath;

    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.textContent = `📋 ${I18nAdapter.getMessage('copy')}`;
    copyButton.dataset.action = 'copy';
    copyButton.dataset.xpath = xpath;
    copyButton.dataset.type = type;

    container.appendChild(valueDiv);
    container.appendChild(copyButton);

    group.appendChild(labelDiv);
    group.appendChild(container);

    return group;
  }

  /**
   * Position the dialog near the click position
   */
  private positionDialog(_x: number, _y: number): void {
    if (!this.container) return;

    // Position is handled by the overlay with flexbox centering
    // We keep _x, _y for future use if needed
    this.container.style.position = 'fixed';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.zIndex = '2147483647';
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    if (!this.shadowRoot) return;

    // Close button clicks
    const closeButtons = this.shadowRoot.querySelectorAll('[data-action="close"]');
    closeButtons.forEach((button) => {
      button.addEventListener('click', () => this.destroy());
    });

    // Overlay click to close
    const overlay = this.shadowRoot.querySelector('[data-role="overlay"]');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.destroy();
        }
      });
    }

    // Copy button clicks
    const copyButtons = this.shadowRoot.querySelectorAll('[data-action="copy"]');
    copyButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const xpath = target.dataset.xpath;
        const type = target.dataset.type;
        if (xpath) {
          this.copyToClipboard(xpath, target, type || '');
        }
      });
    });

    // ESC key to close
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.destroy();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  /**
   * Copy text to clipboard
   */
  private async copyToClipboard(
    text: string,
    button: HTMLButtonElement,
    type: string
  ): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);

      // Visual feedback
      const originalText = button.textContent;
      button.textContent = `✓ ${I18nAdapter.getMessage('copied')}`;
      button.classList.add('copied');

      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove('copied');
      }, 2000);

      this.logger.info(`Copied ${type} XPath to clipboard`, { text });
    } catch (error) {
      this.logger.error('Failed to copy to clipboard', error);
      alert(I18nAdapter.getMessage('clipboardCopyFailed'));
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
