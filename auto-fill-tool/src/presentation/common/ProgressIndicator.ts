/**
 * Presentation Layer: Progress Indicator Component
 * Provides visual feedback for long-running operations
 *
 * This component displays:
 * - Progress percentage
 * - Detailed status message
 * - Animated progress bar
 * - Optional cancel button
 *
 * HTML/CSS are separated:
 * - Template: public/components/progress-indicator.html
 * - Styles: public/styles/progress-indicator.css
 *
 * @coverage 0% - DOM-heavy UI component requiring E2E testing
 */

import { TemplateLoader } from './TemplateLoader';

export interface ProgressOptions {
  /**
   * Show cancel button
   * @default false
   */
  cancellable?: boolean;

  /**
   * Callback when cancel button is clicked
   */
  onCancel?: () => void;

  /**
   * Container element to append progress indicator
   * @default document.body
   */
  container?: HTMLElement;

  /**
   * CSS class name for custom styling
   */
  className?: string;
}

export class ProgressIndicator {
  private element: HTMLDivElement;
  private progressBar: HTMLDivElement;
  private progressText: HTMLSpanElement;
  private statusText: HTMLDivElement;
  private cancelButton?: HTMLButtonElement;
  private options: ProgressOptions;

  constructor(options: ProgressOptions = {}) {
    this.options = options;
    this.element = this.createProgressElement();
    this.progressBar = this.element.querySelector('.progress-bar') as HTMLDivElement;
    this.progressText = this.element.querySelector('.progress-text') as HTMLSpanElement;
    this.statusText = this.element.querySelector('.progress-status') as HTMLDivElement;

    if (options.cancellable) {
      this.cancelButton = this.element.querySelector('.progress-cancel') as HTMLButtonElement;
      this.cancelButton.addEventListener('click', () => {
        if (this.options.onCancel) {
          this.options.onCancel();
        }
      });
    }
  }

  /**
   * Create progress indicator DOM element using template
   */
  private createProgressElement(): HTMLDivElement {
    // Load template from public/components/progress-indicator.html
    const fragment = TemplateLoader.load('progress-indicator-template');

    // Create wrapper element
    const wrapper = document.createElement('div');
    wrapper.className = `progress-indicator ${this.options.className || ''}`;
    wrapper.appendChild(fragment);

    // Add cancel button if needed
    if (this.options.cancellable) {
      const progressHeader = wrapper.querySelector('.progress-header');
      if (progressHeader) {
        const cancelButton = document.createElement('button');
        cancelButton.className = 'progress-cancel';
        cancelButton.title = 'Cancel';
        cancelButton.textContent = '✖';
        progressHeader.appendChild(cancelButton);
      }
    }

    return wrapper;
  }

  /**
   * Show progress indicator
   */
  show(): void {
    const targetContainer = this.options.container || document.body;
    targetContainer.appendChild(this.element);
    // Force reflow for animation
    void this.element.offsetWidth;
    this.element.classList.add('show');
  }

  /**
   * Hide and remove progress indicator
   */
  hide(): void {
    this.element.classList.remove('show');
    setTimeout(() => {
      this.element.remove();
    }, 300); // Match CSS transition duration
  }

  /**
   * Update progress (0-100)
   */
  updateProgress(percent: number, status?: string): void {
    const clampedPercent = Math.max(0, Math.min(100, percent));
    this.progressBar.style.width = `${clampedPercent}%`;
    this.progressText.textContent = `${Math.round(clampedPercent)}%`;

    if (status) {
      this.updateStatus(status);
    }
  }

  /**
   * Update status message
   */
  updateStatus(message: string): void {
    this.statusText.textContent = message;
  }

  /**
   * Set indeterminate state (for unknown duration operations)
   */
  setIndeterminate(status: string): void {
    this.progressBar.classList.add('indeterminate');
    this.progressText.textContent = '';
    this.updateStatus(status);
  }

  /**
   * Clear indeterminate state
   */
  clearIndeterminate(): void {
    this.progressBar.classList.remove('indeterminate');
  }

  /**
   * Disable cancel button
   */
  disableCancel(): void {
    if (this.cancelButton) {
      this.cancelButton.disabled = true;
      this.cancelButton.style.opacity = '0.5';
      this.cancelButton.style.cursor = 'not-allowed';
    }
  }

  /**
   * Enable cancel button
   */
  enableCancel(): void {
    if (this.cancelButton) {
      this.cancelButton.disabled = false;
      this.cancelButton.style.opacity = '1';
      this.cancelButton.style.cursor = 'pointer';
    }
  }

  /**
   * Show error state
   */
  showError(message: string): void {
    this.element.classList.add('error');
    this.progressBar.style.backgroundColor = '#e74c3c';
    this.updateStatus(`❌ ${message}`);
  }

  /**
   * Show success state
   */
  showSuccess(message: string): void {
    this.element.classList.add('success');
    this.progressBar.style.backgroundColor = '#2ecc71';
    this.updateProgress(100, `✅ ${message}`);
    setTimeout(() => this.hide(), 2000);
  }

  /**
   * Check if progress indicator is visible
   */
  isVisible(): boolean {
    return this.element.classList.contains('show') && document.body.contains(this.element);
  }
}
