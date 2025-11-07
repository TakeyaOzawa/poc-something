/**
 * Presentation Layer: Website List Controller
 * Handles website list operations and CRUD actions
 *
 * @coverage 0% - DOM-heavy UI component requiring E2E testing
 */

import { LoggerFactory, Logger } from '@/infrastructure/loggers/LoggerFactory';
import { ModalManager } from './ModalManager';
import { WebsiteActionHandler } from './WebsiteActionHandler';
import { GetAllWebsitesUseCase } from '@usecases/websites/GetAllWebsitesUseCase';
import { DeleteWebsiteUseCase } from '@usecases/websites/DeleteWebsiteUseCase';
import { GetAllAutomationVariablesUseCase } from '@usecases/automation-variables/GetAllAutomationVariablesUseCase';
import { GetAutomationVariablesByWebsiteIdUseCase } from '@usecases/automation-variables/GetAutomationVariablesByWebsiteIdUseCase';
import { SaveWebsiteWithAutomationVariablesUseCase } from '@usecases/websites/SaveWebsiteWithAutomationVariablesUseCase';
import { WebsiteOutputDto } from '@application/dtos/WebsiteOutputDto';
import { AutomationVariablesOutputDto } from '@application/dtos/AutomationVariablesOutputDto';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';

export class WebsiteListPresenter {
  private currentWebsites: WebsiteOutputDto[] = [];
  public editingId: string | null = null; // Public for ModalManager callback access

  // eslint-disable-next-line max-params -- Controller constructor with 8 dependencies (ModalManager, WebsiteActionHandler, 5 UseCases, Logger) required by Clean Architecture separation. Splitting would break dependency injection pattern.
  constructor(
    private modalManager: ModalManager,
    private actionHandler: WebsiteActionHandler,
    private getAllWebsitesUseCase: GetAllWebsitesUseCase,
    private getAllAutomationVariablesUseCase: GetAllAutomationVariablesUseCase,
    private getAutomationVariablesByWebsiteIdUseCase: GetAutomationVariablesByWebsiteIdUseCase,
    private saveWebsiteWithAutomationVariablesUseCase: SaveWebsiteWithAutomationVariablesUseCase,
    private deleteWebsiteUseCase: DeleteWebsiteUseCase,
    private logger: Logger
  ) {}

  /**
   * Get modal manager instance (for external access to addVariableField)
   */
  getModalManager(): ModalManager {
    return this.modalManager;
  }

  /**
   * Load and render website list
   */
  async loadAndRender(): Promise<void> {
    const result = await this.getAllWebsitesUseCase.execute();
    this.currentWebsites = result.websites ?? [];
    await this.renderWebsites();
  }

  /**
   * Render websites with automation variables
   * Alpine.js handles the actual DOM rendering via reactive templates
   */
  private async renderWebsites(): Promise<void> {
    // Load automation variables for all websites via UseCase
    const { automationVariables: allAutomationVariables } =
      await this.getAllAutomationVariablesUseCase.execute();

    // Group by websiteId and keep only the latest one for each websiteId
    const automationVariablesMap = new Map<string, AutomationVariablesOutputDto>();
    allAutomationVariables.forEach((av) => {
      const websiteId = av.websiteId;
      const existing = automationVariablesMap.get(websiteId);

      if (!existing || new Date(av.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
        automationVariablesMap.set(websiteId, av);
      }
    });

    // Update Alpine.js data - Alpine.js handles DOM rendering automatically
    this.updateAlpineData(automationVariablesMap);
  }

  /**
   * Update Alpine.js reactive data
   */
  private updateAlpineData(
    automationVariablesMap: Map<string, AutomationVariablesOutputDto>
  ): void {
    try {
      // Get Alpine.js $data from the body element
      const bodyElement = document.querySelector('body') as any;
      if (bodyElement && bodyElement._x_dataStack && bodyElement._x_dataStack.length > 0) {
        const alpineData = bodyElement._x_dataStack[0];
        if (alpineData && typeof alpineData.setWebsites === 'function') {
          alpineData.setWebsites(this.currentWebsites, automationVariablesMap);
          this.logger.debug('Updated Alpine.js data', {
            websiteCount: this.currentWebsites.length,
          });
        }
      }
    } catch (error) {
      this.logger.warn('Failed to update Alpine.js data', { error });
    }
  }

  /**
   * Set Alpine.js modal state
   */
  private setAlpineModalState(show: boolean): void {
    try {
      const bodyElement = document.querySelector('body') as any;
      if (bodyElement && bodyElement._x_dataStack && bodyElement._x_dataStack.length > 0) {
        const alpineData = bodyElement._x_dataStack[0];
        if (alpineData) {
          alpineData.showModal = show;
          this.logger.debug('Updated Alpine.js modal state', { show });
        }
      }
    } catch (error) {
      this.logger.warn('Failed to update Alpine.js modal state', { error });
    }
  }

  /**
   * Handle website action (public method for Alpine.js integration)
   */
  async handleWebsiteAction(action: string, id: string): Promise<void> {
    if (!id) {
      this.logger.warn('No ID provided for website action');
      return;
    }

    this.logger.info('Handling website action', { action, id });

    switch (action) {
      case 'execute':
        await this.executeWebsite(id);
        break;
      case 'edit':
        await this.openEditModal(id);
        break;
      case 'delete':
        await this.deleteWebsite(id);
        break;
      default:
        this.logger.warn('Unknown action', { action });
    }
  }

  /**
   * Attach event listeners to website action buttons
   */
  attachWebsiteListeners(): void {
    const buttons = this.getWebsiteListElement().querySelectorAll('[data-action]');
    this.logger.info('Attaching website listeners', { buttonCount: buttons.length });

    buttons.forEach((button) => {
      const action = (button as HTMLElement).dataset.action;
      const id = (button as HTMLElement).dataset.id;
      this.logger.debug('Found button', { action, id });

      button.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const target = e.currentTarget as HTMLElement;
        const clickedAction = target.dataset.action;
        const clickedId = target.dataset.id;

        this.logger.info('Button clicked', { action: clickedAction, id: clickedId });

        if (!clickedId) {
          this.logger.warn('No ID found on clicked button');
          return;
        }

        switch (clickedAction) {
          case 'execute':
            this.logger.info('Executing website', { id: clickedId });
            await this.executeWebsite(clickedId);
            break;
          case 'edit':
            this.logger.info('Opening edit modal', { id: clickedId });
            await this.openEditModal(clickedId);
            break;
          case 'delete':
            this.logger.info('Deleting website', { id: clickedId });
            await this.deleteWebsite(clickedId);
            break;
          default:
            this.logger.warn('Unknown action', { action: clickedAction });
        }
      });
    });
  }

  /**
   * Execute website auto-fill
   */
  private async executeWebsite(id: string): Promise<void> {
    const website = this.currentWebsites.find((w) => w.id === id);
    if (!website) {
      alert(I18nAdapter.getMessage('websiteNotFound'));
      return;
    }

    const success = await this.actionHandler.executeWebsite(website);
    if (success) {
      // Reload websites to reflect status change
      await this.loadAndRender();
      this.attachWebsiteListeners();
    }
  }

  /**
   * Open edit modal for a website
   */
  private async openEditModal(id: string): Promise<void> {
    const website = this.currentWebsites.find((w) => w.id === id);
    if (!website) {
      alert(I18nAdapter.getMessage('websiteNotFound'));
      return;
    }

    const { automationVariables } = await this.getAutomationVariablesByWebsiteIdUseCase.execute({
      websiteId: id,
    });
    // AutomationVariablesOutputDtoからAutomationVariablesエンティティを作成
    const { AutomationVariables } = await import('@domain/entities/AutomationVariables');
    const automationVariablesEntity = automationVariables
      ? new AutomationVariables({
          id: automationVariables.id,
          websiteId: automationVariables.websiteId,
          variables: automationVariables.variables,
          status: automationVariables.status as any,
          updatedAt: automationVariables.updatedAt,
        })
      : null;

    // WebsiteOutputDtoをWebsiteDataに変換
    const websiteData = {
      id: website.id,
      name: website.name,
      startUrl: website.startUrl || '',
      editable: website.editable,
      updatedAt: website.updatedAt,
    };

    this.editingId = id;
    this.modalManager.openEditModal(websiteData, automationVariablesEntity);
    this.setAlpineModalState(true);
  }

  /**
   * Open add modal for new website
   */
  openAddModal(): void {
    this.editingId = null;
    this.modalManager.openAddModal();
    this.setAlpineModalState(true);
  }

  /**
   * Save website (create or update)
   */
  async saveWebsite(event: Event): Promise<void> {
    event.preventDefault();

    const formData = this.modalManager.getFormData();

    if (!formData.name) {
      alert(I18nAdapter.getMessage('websiteNameRequired'));
      return;
    }

    try {
      // Use unified UseCase to handle both website and automation variables
      await this.saveWebsiteWithAutomationVariablesUseCase.execute({
        websiteId: this.editingId || '',
        name: formData.name,
        startUrl: formData.startUrl,
        status: formData.status,
        variables: formData.variables,
      });

      // Reload websites
      await this.loadAndRender();
      this.attachWebsiteListeners();
      this.closeModal();
    } catch (error) {
      this.logger.error('Failed to save website', { error });
      alert(I18nAdapter.getMessage('saveFailed'));
    }
  }

  /**
   * Delete website
   */
  private async deleteWebsite(id: string): Promise<void> {
    if (!confirm(I18nAdapter.getMessage('confirmDeleteWebsite'))) {
      return;
    }

    try {
      await this.deleteWebsiteUseCase.execute({ websiteId: id });
      await this.loadAndRender();
      this.attachWebsiteListeners();
    } catch (error) {
      this.logger.error('Failed to delete website', error);
      alert(I18nAdapter.getMessage('deleteFailed'));
    }
  }

  /**
   * Close modal
   */
  closeModal(): void {
    this.modalManager.closeModal();
    this.editingId = null;
    this.setAlpineModalState(false);
  }

  /**
   * Get website list DOM element
   */
  private getWebsiteListElement(): HTMLDivElement {
    return document.getElementById('websiteList') as HTMLDivElement;
  }
}
