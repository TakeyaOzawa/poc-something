/**
 * Presentation Layer: XPath Manager View
 * Handles DOM manipulation and rendering
 */

import { XPathOutputDto } from '@application/dtos/XPathOutputDto';
import { XPathViewModel } from '../types/XPathViewModel';
import { XPathManagerView } from './XPathManagerPresenter';
import { LoggerFactory } from '@/infrastructure/loggers/LoggerFactory';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';
import { ProgressIndicator, ProgressOptions } from '@presentation/common/ProgressIndicator';
import { renderXPathCard } from './components/molecules/XPathCard';
import { TemplateLoader } from '@presentation/common/TemplateLoader';

export class XPathManagerViewImpl implements XPathManagerView {
  private xpathListElement: HTMLElement;
  private loadingIndicator?: HTMLElement;
  private progressIndicator: ProgressIndicator | null = null;
  private logger = LoggerFactory.createLogger('XPathManagerView');

  constructor(xpathListElement: HTMLElement) {
    this.xpathListElement = xpathListElement;
  }

  showXPaths(xpaths: XPathViewModel[]): void {
    this.xpathListElement.innerHTML = xpaths
      .map((xpath) =>
        renderXPathCard({
          xpath: {
            ...xpath,
            pathAbsolute: xpath.absoluteXPath || '',
            pathShort: xpath.shortXPath || '',
            pathSmart: xpath.smartXPath || '',
          } as unknown as XPathOutputDto,
        })
      )
      .join('');
  }

  showError(message: string): void {
    this.showNotification(message, 'error');
  }

  showSuccess(message: string): void {
    this.showNotification(message, 'success');
  }

  showLoading(): void {
    if (!this.loadingIndicator) {
      this.loadingIndicator = document.createElement('div');
      this.loadingIndicator.className = 'loading-indicator';
      this.loadingIndicator.textContent = I18nAdapter.getMessage('loading');
      this.loadingIndicator.style.cssText = 'text-align: center; padding: 20px; opacity: 0.7;';
    }
    this.xpathListElement.innerHTML = '';
    this.xpathListElement.appendChild(this.loadingIndicator);
  }

  hideLoading(): void {
    if (this.loadingIndicator && this.xpathListElement.contains(this.loadingIndicator)) {
      this.xpathListElement.removeChild(this.loadingIndicator);
    }
  }

  showEmpty(): void {
    const fragment = TemplateLoader.load('xpath-empty-state-template');
    const emptyState = fragment.querySelector('.empty-state') as HTMLDivElement;

    // Use textContent for automatic XSS protection
    emptyState.textContent = I18nAdapter.getMessage('noXPathsSaved');

    this.xpathListElement.innerHTML = '';
    this.xpathListElement.appendChild(emptyState);
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  /**
   * Show progress indicator
   */
  showProgress(status: string, cancellable = false): void {
    // Clean up existing progress indicator
    if (this.progressIndicator) {
      this.progressIndicator.hide();
      this.progressIndicator = null;
    }

    const options: ProgressOptions = {
      cancellable,
      container: document.body,
    };

    this.progressIndicator = new ProgressIndicator(options);
    this.progressIndicator.setIndeterminate(status);
    this.progressIndicator.show();
  }

  /**
   * Update progress indicator
   */
  updateProgress(percent: number, status?: string): void {
    if (this.progressIndicator) {
      this.progressIndicator.clearIndeterminate();
      this.progressIndicator.updateProgress(percent, status);
    }
  }

  /**
   * Hide progress indicator
   */
  hideProgress(): void {
    if (this.progressIndicator) {
      this.progressIndicator.hide();
      this.progressIndicator = null;
    }
  }
}
