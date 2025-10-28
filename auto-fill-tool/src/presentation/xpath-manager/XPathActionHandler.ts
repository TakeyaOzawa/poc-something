/**
 * Presentation Layer: XPath Action Handler
 * Handles XPath action button events (duplicate, edit, delete)
 */

import { Logger } from '@domain/types/logger.types';
import { XPathManagerPresenter } from './XPathManagerPresenter';
import { XPathEditModalManager } from './XPathEditModalManager';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';

export class XPathActionHandler {
  // eslint-disable-next-line max-params
  constructor(
    private presenter: XPathManagerPresenter,
    private xpathEditModalManager: XPathEditModalManager,
    private logger: Logger,
    private xpathList: HTMLDivElement,
    private onXPathsChanged: () => Promise<void>
  ) {}

  /**
   * Attach event listeners to XPath action buttons
   */
  attachActionListeners(): void {
    const buttons = this.xpathList.querySelectorAll('[data-action]');
    this.logger.debug('Total buttons found:', { buttonsLength: buttons.length });

    buttons.forEach((button) => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const target = e.currentTarget as HTMLElement;
        const action = target.dataset.action;
        const id = target.dataset.id;

        this.logger.debug('Button clicked', { action, id });

        if (!id) {
          this.logger.error('No ID found');
          return;
        }

        switch (action) {
          case 'duplicate':
            this.logger.debug('Calling handleDuplicateXPath');
            await this.handleDuplicateXPath(id);
            break;
          case 'edit':
            this.logger.debug('Calling handleEditXPath');
            await this.xpathEditModalManager.openEditModal(id);
            break;
          case 'delete':
            this.logger.debug('Calling handleDeleteXPath');
            await this.handleDeleteXPath(id);
            break;
          default:
            this.logger.error('Unknown action', { action });
        }
      });
    });
  }

  /**
   * Handle delete XPath
   */
  private async handleDeleteXPath(id: string): Promise<void> {
    if (!confirm(I18nAdapter.getMessage('confirmDeleteXPath'))) return;

    try {
      await this.presenter.deleteXPath(id);
      await this.onXPathsChanged();
    } catch (error) {
      // Error already handled by presenter
    }
  }

  /**
   * Handle duplicate XPath
   */
  private async handleDuplicateXPath(id: string): Promise<void> {
    try {
      await this.presenter.duplicateXPath(id);
      await this.onXPathsChanged();
    } catch (error) {
      // Error already handled by presenter
    }
  }
}
