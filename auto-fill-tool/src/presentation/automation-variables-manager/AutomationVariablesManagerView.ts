/**
 * Presentation Layer: AutomationVariablesManagerView
 * Implements AutomationVariablesManagerView interface
 * Handles DOM manipulation for AutomationVariables Manager UI
 */

import {
  AutomationVariablesManagerView,
  AutomationVariablesViewModel,
} from './AutomationVariablesManagerPresenter';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';
import { TabRecording } from '@domain/entities/TabRecording';
import { TemplateLoader } from '@presentation/common/TemplateLoader';
import { DataBinder } from '@presentation/common/DataBinder';

export class AutomationVariablesManagerViewImpl implements AutomationVariablesManagerView {
  constructor(private container: HTMLElement) {}

  /**
   * Show automation variables list
   */
  // eslint-disable-next-line max-lines-per-function -- Template-based rendering requires sequential DOM operations (load template, bind data, handle conditionals, append) for each variable item. Breaking into smaller methods would scatter the rendering logic and make it harder to maintain the template binding flow.
  showVariables(variables: AutomationVariablesViewModel[]): void {
    if (variables.length === 0) {
      this.showEmpty();
      return;
    }

    // Clear container
    this.container.innerHTML = '';

    // Load template and create elements for each variable
    // eslint-disable-next-line max-lines-per-function, complexity -- Each variable requires template loading, data preparation, binding, conditional rendering, and class manipulation. The complexity arises from handling multiple conditional states (hasLatestResult, hasResultDetail) and ensuring proper data binding for all fields. Splitting would break the cohesive rendering flow.
    variables.forEach((v) => {
      const template = TemplateLoader.load('automation-variables-item-template');
      if (!template) {
        throw new Error('automation-variables-item-template not found');
      }

      const element = template.cloneNode(true) as HTMLElement;

      // Prepare data for binding
      const hasLatestResult = !!v.latestResult;
      const hasResultDetail = !!(
        v.latestResult?.errorMessage && v.latestResult.errorMessage.trim()
      );

      const statusClass = `status-${v.status || 'once'}`;
      const statusLabel = this.getStatusLabel(v.status);

      let resultStatusClass = '';
      let resultStatusLabel = '';
      if (v.latestResult) {
        resultStatusClass =
          v.latestResult.status === 'success' ? 'result-status-success' : 'result-status-failure';
        resultStatusLabel =
          v.latestResult.status === 'success'
            ? I18nAdapter.getMessage('executionStatusSuccess')
            : I18nAdapter.getMessage('executionStatusFailure');
      }

      const data = {
        websiteName: v.websiteName || v.websiteId,
        id: v.id,
        statusClass: statusClass,
        statusLabel: statusLabel,
        updatedAtLabel: I18nAdapter.getMessage('updatedAt') + ':',
        updatedAt: this.formatDate(v.updatedAt),
        variablesLabel: I18nAdapter.getMessage('variables') + ':',
        variablesFormatted: { html: this.formatVariables(v.variables) },
        latestExecutionLabel: I18nAdapter.getMessage('latestExecution') + ':',
        resultStatusClass: resultStatusClass,
        resultStatusLabel: resultStatusLabel,
        resultDetail: v.latestResult?.errorMessage || '',
        resultStartFrom: v.latestResult ? this.formatDate(v.latestResult.startedAt) : '',
      };

      DataBinder.bind(element, data);

      // Bind attributes (data-id for buttons and container)
      const dataAttributes = { id: v.id };
      DataBinder.bindAttributes(element, dataAttributes);

      // Manually add status class to status span (data-bind-attr replaces class, so we add it separately)
      const statusSpan = element.querySelector('[data-bind="statusLabel"]') as HTMLElement;
      if (statusSpan) {
        statusSpan.classList.add(statusClass);
      }

      // Manually add result status class if present
      if (resultStatusClass) {
        const resultSpan = element.querySelector('[data-bind="resultStatusLabel"]') as HTMLElement;
        if (resultSpan) {
          resultSpan.classList.add(resultStatusClass);
        }
      }

      // Handle conditional rendering (data-bind-if)
      const latestResultDiv = element.querySelector(
        '[data-bind-if="hasLatestResult"]'
      ) as HTMLElement;
      if (latestResultDiv) {
        latestResultDiv.style.display = hasLatestResult ? '' : 'none';
      }

      // Handle nested conditional (resultDetail)
      if (hasLatestResult) {
        const resultDetailSpan = element.querySelector(
          '[data-bind-if="hasResultDetail"]'
        ) as HTMLElement;
        if (resultDetailSpan) {
          resultDetailSpan.style.display = hasResultDetail ? '' : 'none';
        }
      }

      this.container.appendChild(element);
    });

    // Apply i18n to newly created elements
    I18nAdapter.applyToDOM(this.container);
  }

  /**
   * Show error notification
   */
  showError(message: string): void {
    this.showNotification(message, 'error');
  }

  /**
   * Show success notification
   */
  showSuccess(message: string): void {
    this.showNotification(message, 'success');
  }

  /**
   * Show loading state
   */
  showLoading(): void {
    const template = TemplateLoader.load('automation-variables-loading-state-template');
    if (!template) {
      throw new Error('automation-variables-loading-state-template not found');
    }

    const element = template.cloneNode(true) as HTMLElement;
    const data = {
      loadingText: I18nAdapter.getMessage('loading'),
    };

    DataBinder.bind(element, data);
    this.container.innerHTML = '';
    this.container.appendChild(element);

    // Apply i18n
    I18nAdapter.applyToDOM(this.container);
  }

  /**
   * Hide loading state (handled by showVariables or showEmpty)
   */
  hideLoading(): void {
    // No-op: loading state is replaced by showVariables or showEmpty
  }

  /**
   * Show empty state
   */
  showEmpty(): void {
    const template = TemplateLoader.load('automation-variables-empty-state-template');
    if (!template) {
      throw new Error('automation-variables-empty-state-template not found');
    }

    const element = template.cloneNode(true) as HTMLElement;
    const data = {
      emptyText: I18nAdapter.getMessage('noAutomationVariables'),
    };

    DataBinder.bind(element, data);
    this.container.innerHTML = '';
    this.container.appendChild(element);

    // Apply i18n
    I18nAdapter.applyToDOM(this.container);
  }

  // Private helper methods

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

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private getStatusLabel(status?: string): string {
    switch (status) {
      case 'enabled':
        return I18nAdapter.getMessage('statusEnabled');
      case 'disabled':
        return I18nAdapter.getMessage('statusDisabled');
      case 'once':
        return I18nAdapter.getMessage('statusOnce');
      default:
        return I18nAdapter.getMessage('statusOnce');
    }
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }

  private formatVariables(variables: Record<string, string>): string {
    const entries = Object.entries(variables);
    if (entries.length === 0) {
      return I18nAdapter.getMessage('noVariables');
    }

    return entries
      .map(([key, value]) => `{{${this.escapeHtml(key)}}}=${this.escapeHtml(value)}`)
      .join(', ');
  }

  /**
   * Show recording preview modal
   */
  showRecordingPreview(recordingData: Blob): void {
    const template = TemplateLoader.load('automation-variables-recording-modal-template');
    if (!template) {
      throw new Error('automation-variables-recording-modal-template not found');
    }

    const modal = document.createElement('div');
    modal.className = 'recording-modal';

    const element = template.cloneNode(true) as HTMLElement;

    const data = {
      headerText: I18nAdapter.getMessage('recordingPreview'),
      mimeType: 'video/webm', // recordingData.type
      videoNotSupported: I18nAdapter.getMessage('videoNotSupported'),
      durationLabel: I18nAdapter.getMessage('recordingDuration') + ':',
      duration: '0', // recordingData duration
      secondsUnit: I18nAdapter.getMessage('seconds'),
      fileSizeLabel: I18nAdapter.getMessage('fileSize') + ':',
      fileSize: (recordingData.size / (1024 * 1024)).toFixed(2),
      bitrateLabel: I18nAdapter.getMessage('bitrate') + ':',
      bitrate: '2.5', // Default bitrate
    };

    DataBinder.bind(element, data);

    // Bind mimeType attribute to source element
    const sourceAttributes = { mimeType: recordingData.type };
    DataBinder.bindAttributes(element, sourceAttributes);

    modal.appendChild(element);
    document.body.appendChild(modal);

    // Set recording data to video tag
    const videoElement = modal.querySelector('#recordingVideo') as HTMLVideoElement;
    if (recordingData) {
      const url = URL.createObjectURL(recordingData);
      videoElement.src = url;

      // Release Blob URL when modal is closed
      const closeBtn = modal.querySelector('.close-recording-modal') as HTMLButtonElement;
      closeBtn.addEventListener('click', () => {
        URL.revokeObjectURL(url);
        modal.remove();
      });

      // Close modal on background click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          URL.revokeObjectURL(url);
          modal.remove();
        }
      });
    }

    // Apply i18n to newly created modal
    I18nAdapter.applyToDOM(modal);
  }

  /**
   * Show no recording message
   */
  showNoRecordingMessage(): void {
    this.showError(I18nAdapter.getMessage('noRecordingFound'));
  }
}
