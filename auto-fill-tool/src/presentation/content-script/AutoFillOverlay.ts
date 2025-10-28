/* eslint-disable max-lines */
/**
 * Auto-Fill Overlay Component
 *
 * Displays a full-screen overlay during auto-fill execution to:
 * - Block user interaction with the page
 * - Show progress information
 * - Provide cancel functionality
 *
 * Features:
 * - Shadow DOM for style isolation
 * - Progress bar and step counter
 * - ESC key and button for cancellation
 * - Smooth animations
 */

import browser from 'webextension-polyfill';
import { LoggerFactory } from '@/infrastructure/loggers/LoggerFactory';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';

export class AutoFillOverlay {
  private container: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private logger = LoggerFactory.createLogger('AutoFillOverlay');
  private handleEscapeKey: ((e: KeyboardEvent) => void) | null = null;
  private handleProgressUpdate: ((e: Event) => void) | null = null;
  private showCancelButton = true;

  /**
   * Show the overlay
   * @param message - Optional custom message to display
   * @param showCancelButton - Whether to show the cancel button (default: true)
   */
  public async show(message?: string, showCancelButton = true): Promise<void> {
    const defaultMessage = message || I18nAdapter.getMessage('autoFillInProgress');
    this.showCancelButton = showCancelButton;
    if (this.container) {
      this.logger.warn('Overlay is already visible');
      return;
    }

    this.logger.info('Showing auto-fill overlay');

    // Create container element
    this.container = document.createElement('div');
    this.container.id = 'auto-fill-overlay-container';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 2147483647;
      pointer-events: none;
    `;

    // Attach Shadow DOM for style isolation
    this.shadowRoot = this.container.attachShadow({ mode: 'open' });

    // Add styles
    this.shadowRoot.appendChild(await this.createStyles());

    // Add content
    this.shadowRoot.appendChild(this.createContent(defaultMessage));

    // Append to body
    document.body.appendChild(this.container);

    // Setup event listeners
    this.setupEventListeners();

    this.logger.info('Auto-fill overlay shown');
  }

  /**
   * Update progress bar
   */
  public updateProgress(current: number, total: number): void {
    if (!this.shadowRoot) return;

    const progressBar = this.shadowRoot.getElementById('progress-bar');
    const stepInfo = this.shadowRoot.getElementById('step-info');

    if (progressBar) {
      const percentage = total > 0 ? (current / total) * 100 : 0;
      progressBar.style.width = `${percentage}%`;
    }

    if (stepInfo) {
      stepInfo.textContent = I18nAdapter.format(
        'stepProgress',
        current.toString(),
        total.toString()
      );
    }

    this.logger.debug(`Progress updated: ${current}/${total}`);
  }

  /**
   * Update message
   */
  public updateMessage(message: string): void {
    if (!this.shadowRoot) return;

    const messageEl = this.shadowRoot.querySelector('.message');
    if (messageEl) {
      messageEl.textContent = this.escapeHtml(message);
    }

    this.logger.debug('Message updated', { message });
  }

  /**
   * Update step description
   */
  public updateStepDescription(description: string): void {
    if (!this.shadowRoot) return;

    const stepDesc = this.shadowRoot.getElementById('step-description');
    if (stepDesc) {
      stepDesc.textContent = this.escapeHtml(description);
    }
  }

  /**
   * Hide the overlay
   */
  public hide(): void {
    if (!this.container) return;

    this.logger.info('Hiding auto-fill overlay');

    // Fade out animation
    if (this.container.parentNode) {
      this.container.style.opacity = '0';
      this.container.style.transition = 'opacity 0.3s ease-out';

      setTimeout(() => {
        if (this.container && this.container.parentNode) {
          this.container.parentNode.removeChild(this.container);
        }
        this.cleanup();
      }, 300);
    } else {
      this.cleanup();
    }
  }

  /**
   * Create styles for the overlay by loading external CSS file
   * CSS is now separated in public/styles/auto-fill-overlay-shadow.css
   */
  private async createStyles(): Promise<HTMLStyleElement> {
    const style = document.createElement('style');

    try {
      // Load CSS file from extension resources
      const cssUrl = chrome.runtime.getURL('styles/auto-fill-overlay-shadow.css');
      const response = await fetch(cssUrl);
      const cssText = await response.text();

      style.textContent = cssText;
      this.logger.debug('Shadow DOM CSS loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load Shadow DOM CSS', error);
      // Fallback to minimal styles if CSS loading fails
      style.textContent = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .overlay-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; }
        .loading-container { background: white; padding: 32px; border-radius: 12px; }
        .spinner { width: 60px; height: 60px; border: 4px solid #e0e0e0; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `;
    }

    return style;
  }

  /**
   * Create content
   */
  private createContent(message: string): HTMLElement {
    const backdrop = document.createElement('div');
    backdrop.className = 'overlay-backdrop';
    backdrop.dataset.role = 'overlay';

    const container = document.createElement('div');
    container.className = 'loading-container';

    // Spinner
    const spinner = document.createElement('div');
    spinner.className = 'spinner';

    // Message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.textContent = this.escapeHtml(message);

    // Progress bar container
    const progressBarContainer = document.createElement('div');
    progressBarContainer.className = 'progress-bar-container';

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.id = 'progress-bar';

    progressBarContainer.appendChild(progressBar);

    // Step info
    const stepInfo = document.createElement('div');
    stepInfo.className = 'step-info';
    stepInfo.id = 'step-info';
    stepInfo.textContent = I18nAdapter.getMessage('preparing');

    // Step description
    const stepDescription = document.createElement('div');
    stepDescription.className = 'step-description';
    stepDescription.id = 'step-description';
    stepDescription.textContent = '';

    // Assemble
    container.appendChild(spinner);
    container.appendChild(messageDiv);
    container.appendChild(progressBarContainer);
    container.appendChild(stepInfo);
    container.appendChild(stepDescription);

    // Conditionally add cancel button and hint text
    if (this.showCancelButton) {
      // Cancel button
      const cancelButton = document.createElement('button');
      cancelButton.className = 'cancel-button';
      cancelButton.id = 'cancel-button';
      cancelButton.textContent = I18nAdapter.getMessage('cancel');
      container.appendChild(cancelButton);

      // Hint text
      const hintText = document.createElement('div');
      hintText.className = 'hint-text';
      hintText.textContent = I18nAdapter.getMessage('escKeyHint');
      container.appendChild(hintText);
    }

    backdrop.appendChild(container);

    return backdrop;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.shadowRoot) return;

    // Only setup cancel-related event listeners if cancel button is shown
    if (this.showCancelButton) {
      // Cancel button click
      const cancelButton = this.shadowRoot.getElementById('cancel-button');
      if (cancelButton) {
        cancelButton.addEventListener('click', () => {
          this.logger.info('Cancel button clicked');
          this.triggerCancel();
        });
      }

      // ESC key to cancel
      this.handleEscapeKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          this.logger.info('ESC key pressed');
          this.triggerCancel();
        }
      };
      document.addEventListener('keydown', this.handleEscapeKey);
    }

    // Listen for progress updates
    this.handleProgressUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { current, total, description } = customEvent.detail;
      this.updateProgress(current, total);
      if (description) {
        this.updateStepDescription(description);
      }
    };
    document.addEventListener('auto-fill-progress-update', this.handleProgressUpdate);

    // Prevent clicks on overlay from propagating
    const overlay = this.shadowRoot.querySelector('[data-role="overlay"]');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        // Only close if clicked on backdrop, not on the dialog itself
        if (e.target === overlay) {
          this.logger.info('Overlay backdrop clicked');
          // Could optionally close here, but we'll keep it to button/ESC only
        }
      });
    }
  }

  /**
   * Trigger cancel event
   */
  private async triggerCancel(): Promise<void> {
    this.logger.info('Triggering auto-fill cancel event');

    try {
      // Send cancel message to background script
      await browser.runtime.sendMessage({
        action: 'cancelAutoFill',
        tabId: null, // Will be determined by background script from sender
      });

      this.logger.info('Cancel message sent to background script');
    } catch (error) {
      this.logger.error('Failed to send cancel message', error);
    }

    this.hide();
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.handleEscapeKey) {
      document.removeEventListener('keydown', this.handleEscapeKey);
      this.handleEscapeKey = null;
    }

    if (this.handleProgressUpdate) {
      document.removeEventListener('auto-fill-progress-update', this.handleProgressUpdate);
      this.handleProgressUpdate = null;
    }

    this.container = null;
    this.shadowRoot = null;

    this.logger.info('Auto-fill overlay cleanup completed');
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
