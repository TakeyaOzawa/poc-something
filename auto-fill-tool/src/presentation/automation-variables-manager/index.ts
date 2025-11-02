/* eslint-disable max-lines */
/**
 * Presentation Layer: AutomationVariables Manager
 * Entry point for AutomationVariables management UI
 */

import {
  RepositoryFactory,
  setGlobalFactory,
  getGlobalFactory,
} from '@infrastructure/factories/RepositoryFactory';
import { GetAllAutomationVariablesUseCase } from '@usecases/automation-variables/GetAllAutomationVariablesUseCase';
import { GetAutomationVariablesByIdUseCase } from '@usecases/automation-variables/GetAutomationVariablesByIdUseCase';
import { GetAutomationVariablesByWebsiteIdUseCase } from '@usecases/automation-variables/GetAutomationVariablesByWebsiteIdUseCase';
import { SaveAutomationVariablesUseCase } from '@usecases/automation-variables/SaveAutomationVariablesUseCase';
import { DeleteAutomationVariablesUseCase } from '@usecases/automation-variables/DeleteAutomationVariablesUseCase';
import { DuplicateAutomationVariablesUseCase } from '@usecases/automation-variables/DuplicateAutomationVariablesUseCase';
import { ExportAutomationVariablesUseCase } from '@usecases/automation-variables/ExportAutomationVariablesUseCase';
import { ImportAutomationVariablesUseCase } from '@usecases/automation-variables/ImportAutomationVariablesUseCase';
import { ExportXPathsUseCase } from '@usecases/xpaths/ExportXPathsUseCase';
import { ExportWebsitesUseCase } from '@usecases/websites/ExportWebsitesUseCase';
import { ExportSystemSettingsUseCase } from '@usecases/system-settings/ExportSystemSettingsUseCase';
import { ExportStorageSyncConfigsUseCase } from '@usecases/storage/ExportStorageSyncConfigsUseCase';
import { XPathCollectionMapper } from '@infrastructure/mappers/XPathCollectionMapper';
import { WebsiteCollectionMapper } from '@infrastructure/mappers/WebsiteCollectionMapper';
import { StorageSyncConfigMapper } from '@infrastructure/mappers/StorageSyncConfigMapper';
import { GetLatestAutomationResultUseCase } from '@usecases/automation-variables/GetLatestAutomationResultUseCase';
import { GetAutomationResultHistoryUseCase } from '@usecases/automation-variables/GetAutomationResultHistoryUseCase';
import { GetAllWebsitesUseCase } from '@usecases/websites/GetAllWebsitesUseCase';
import { GetLatestRecordingByVariablesIdUseCase } from '@usecases/recording/GetLatestRecordingByVariablesIdUseCase';
import { IndexedDBRecordingRepository } from '@infrastructure/repositories/IndexedDBRecordingRepository';
import { AutomationVariablesManagerPresenter } from './AutomationVariablesManagerPresenter';
import { AutomationVariablesManagerViewImpl } from './AutomationVariablesManagerView';
import { AutomationVariablesManagerCoordinator } from './AutomationVariablesManagerCoordinator';
import { BackgroundLogger } from '@/infrastructure/loggers/BackgroundLogger';
import { Logger, LogLevel } from '@domain/types/logger.types';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';
import { AutomationVariablesMapper } from '@infrastructure/mappers/AutomationVariablesMapper';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { WebsiteData } from '@domain/entities/Website';
import type {
  AutomationVariablesManagerRepositories,
  AutomationVariablesManagerMappers,
  AutomationVariablesManagerUseCases,
} from '../types/automation-variables-manager.types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import browser from 'webextension-polyfill';

/**
 * Initialize or get global factory
 */
function initializeFactory(): RepositoryFactory {
  try {
    // Try to use global factory if already initialized
    return getGlobalFactory();
  } catch {
    // If not initialized, create and set global factory
    const factory = new RepositoryFactory({
      mode: 'chrome', // TODO: Switch to secure mode when master password UI is implemented
    });
    setGlobalFactory(factory);
    return factory;
  }
}

/**
 * Initialize repositories
 */
function initializeRepositories(
  factory: RepositoryFactory,
  logger: Logger
): AutomationVariablesManagerRepositories {
  const automationResult = factory.createAutomationResultRepository();
  return {
    automationVariables: factory.createAutomationVariablesRepository(),
    automationResult,
    website: factory.createWebsiteRepository(),
    xpath: factory.createXPathRepository(),
    systemSettings: factory.createSystemSettingsRepository(),
    storageSyncConfig: factory.createStorageSyncConfigRepository(),
    recording: new IndexedDBRecordingRepository(
      logger.createChild('IndexedDBRecordingRepository'),
      automationResult
    ),
  };
}

/**
 * Initialize mappers
 */
function initializeMappers(logger: Logger): AutomationVariablesManagerMappers {
  return {
    automationVariablesMapper: new AutomationVariablesMapper(
      logger.createChild('AutomationVariablesMapper')
    ),
    xpathMapper: new XPathCollectionMapper(),
    websiteMapper: new WebsiteCollectionMapper(logger.createChild('WebsiteMapper')),
    storageSyncConfigMapper: new StorageSyncConfigMapper(),
  };
}

/**
 * Initialize use cases
 */
// eslint-disable-next-line max-lines-per-function -- Factory method that creates and configures 14 use case instances with their dependencies. Each use case requires specific repository and mapper wiring. Splitting would fragment the cohesive initialization logic.
function initializeUseCases(
  repositories: AutomationVariablesManagerRepositories,
  mappers: AutomationVariablesManagerMappers,
  logger: Logger
): AutomationVariablesManagerUseCases {
  return {
    getAllAutomationVariables: new GetAllAutomationVariablesUseCase(
      repositories.automationVariables
    ),
    getAutomationVariablesById: new GetAutomationVariablesByIdUseCase(
      repositories.automationVariables
    ),
    getAutomationVariablesByWebsiteId: new GetAutomationVariablesByWebsiteIdUseCase(
      repositories.automationVariables
    ),
    saveAutomationVariables: new SaveAutomationVariablesUseCase(repositories.automationVariables),
    deleteAutomationVariables: new DeleteAutomationVariablesUseCase(
      repositories.automationVariables,
      repositories.automationResult
    ),
    duplicateAutomationVariables: new DuplicateAutomationVariablesUseCase(
      repositories.automationVariables,
      factory.getIdGenerator()
    ),
    exportAutomationVariables: new ExportAutomationVariablesUseCase(
      repositories.automationVariables,
      mappers.automationVariablesMapper
    ),
    importAutomationVariables: new ImportAutomationVariablesUseCase(
      repositories.automationVariables,
      mappers.automationVariablesMapper,
      repositories.website
    ),
    getLatestAutomationResult: new GetLatestAutomationResultUseCase(repositories.automationResult),
    getAutomationResultHistory: new GetAutomationResultHistoryUseCase(
      repositories.automationResult
    ),
    getAllWebsites: new GetAllWebsitesUseCase(repositories.website),
    getLatestRecordingByVariablesId: new GetLatestRecordingByVariablesIdUseCase(
      repositories.recording,
      logger.createChild('GetLatestRecordingByVariablesIdUseCase')
    ),
    exportXPaths: new ExportXPathsUseCase(repositories.xpath, mappers.xpathMapper),
    exportWebsites: new ExportWebsitesUseCase(repositories.website, mappers.websiteMapper),
    exportSystemSettings: new ExportSystemSettingsUseCase(repositories.systemSettings),
    exportStorageSyncConfigs: new ExportStorageSyncConfigsUseCase(
      repositories.storageSyncConfig,
      mappers.storageSyncConfigMapper,
      logger.createChild('ExportStorageSyncConfigs')
    ),
  };
}

/**
 * Initialize and run automation variables manager
 */
// eslint-disable-next-line max-lines-per-function -- DI function initializes repositories (7 repos), mappers (4), use cases (15), view, presenter, coordinator, and controller. Breaking this down would fragment the dependency graph without improving clarity. The function is purely declarative DI with no complex logic.
async function initializeAutomationVariablesManager(): Promise<void> {
  // Apply localization
  I18nAdapter.applyToDOM();

  // Initialize logger
  const logger = new BackgroundLogger('AutomationVariablesManager', LogLevel.INFO);

  // Initialize factory and dependencies
  const factory = initializeFactory();
  const repositories = initializeRepositories(factory, logger);
  const mappers = initializeMappers(logger);
  const useCases = initializeUseCases(repositories, mappers, logger);

  // Load log level from settings
  try {
    const settingsResult = await repositories.systemSettings.load();
    if (settingsResult.isFailure) {
      throw new Error(`Failed to load system settings: ${settingsResult.error?.message}`);
    }

    const settings = settingsResult.value!;
    const logLevel = settings.getLogLevel();
    logger.setLevel(logLevel);
    logger.debug('AutomationVariables Manager log level set from settings', { logLevel });

    // Initialize View and Presenter
    const variablesList = document.getElementById('variablesList') as HTMLDivElement;
    const view = new AutomationVariablesManagerViewImpl(variablesList);
    const presenter = new AutomationVariablesManagerPresenter(
      view,
      useCases.getAllAutomationVariables,
      useCases.getAutomationVariablesById,
      useCases.getAutomationVariablesByWebsiteId,
      useCases.saveAutomationVariables,
      useCases.deleteAutomationVariables,
      useCases.duplicateAutomationVariables,
      useCases.exportAutomationVariables,
      useCases.importAutomationVariables,
      useCases.getLatestAutomationResult,
      useCases.getAutomationResultHistory,
      useCases.getAllWebsites,
      useCases.getLatestRecordingByVariablesId,
      logger.createChild('Presenter')
    );

    // Initialize Coordinator with dependencies
    const coordinator = new AutomationVariablesManagerCoordinator({
      presenter,
      logger,
      getAllWebsitesUseCase: useCases.getAllWebsites,
      exportXPathsUseCase: useCases.exportXPaths,
      exportWebsitesUseCase: useCases.exportWebsites,
      exportSystemSettingsUseCase: useCases.exportSystemSettings,
      exportStorageSyncConfigsUseCase: useCases.exportStorageSyncConfigs,
      settings,
    });

    // Initialize coordinator (handles UnifiedNavigationBar, gradient background)
    await coordinator.initialize();

    // Initialize Controller (handles DOM events and form operations)
    new AutomationVariablesManagerController(
      presenter,
      useCases.getAllWebsites,
      logger.createChild('Controller')
    );
  } catch (error) {
    logger.error('Failed to initialize AutomationVariables Manager', error);
  }
}

/**
 * AutomationVariables Manager Controller
 * Handles DOM operations, modal management, and user interactions
 */
class AutomationVariablesManagerController {
  private logger: Logger;
  private presenter: AutomationVariablesManagerPresenter;
  private getAllWebsitesUseCase: GetAllWebsitesUseCase;
  private websites: WebsiteData[] = [];
  private editingId: string | null = null;

  // DOM elements
  private variablesList!: HTMLDivElement;
  private createBtn!: HTMLButtonElement;
  private editModal!: HTMLDivElement;
  private editForm!: HTMLFormElement;
  private editId!: HTMLInputElement;
  private editWebsiteId!: HTMLSelectElement;
  private editStatus!: HTMLSelectElement;
  private variableFieldsContainer!: HTMLDivElement;
  private addVariableFieldBtn!: HTMLButtonElement;
  private cancelBtn!: HTMLButtonElement;
  private modalTitle!: HTMLDivElement;

  constructor(
    presenter: AutomationVariablesManagerPresenter,
    getAllWebsitesUseCase: GetAllWebsitesUseCase,
    logger: Logger
  ) {
    this.presenter = presenter;
    this.getAllWebsitesUseCase = getAllWebsitesUseCase;
    this.logger = logger;

    // Initialize DOM elements
    this.initializeDOMElements();

    // Attach event listeners
    this.attachEventListeners();

    // Load initial data
    this.initialize();
  }

  /**
   * Initialize all DOM element references
   */
  private initializeDOMElements(): void {
    this.variablesList = document.getElementById('variablesList') as HTMLDivElement;
    this.createBtn = document.getElementById('createBtn') as HTMLButtonElement;
    this.editModal = document.getElementById('editModal') as HTMLDivElement;
    this.editForm = document.getElementById('editForm') as HTMLFormElement;
    this.editId = document.getElementById('editId') as HTMLInputElement;
    this.editWebsiteId = document.getElementById('editWebsiteId') as HTMLSelectElement;
    this.editStatus = document.getElementById('editStatus') as HTMLSelectElement;
    this.variableFieldsContainer = document.getElementById(
      'variableFieldsContainer'
    ) as HTMLDivElement;
    this.addVariableFieldBtn = document.getElementById('addVariableFieldBtn') as HTMLButtonElement;
    this.cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement;
    this.modalTitle = document.getElementById('modalTitle') as HTMLDivElement;
  }

  /**
   * Initialize the controller (load data)
   */
  private async initialize(): Promise<void> {
    try {
      // Load websites for dropdown
      await this.loadWebsites();

      // Load automation variables
      await this.loadVariables();

      this.logger.info('AutomationVariables Manager Controller initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Controller', error);
    }
  }

  /**
   * Load websites for dropdown
   */
  private async loadWebsites(): Promise<void> {
    try {
      const { websites } = await this.getAllWebsitesUseCase.execute();
      this.websites = websites || [];

      // Populate website dropdown
      this.editWebsiteId.innerHTML = `
        <option value="">${I18nAdapter.getMessage('selectWebsitePlaceholder')}</option>
        ${this.websites.map((w) => `<option value="${this.escapeHtml(w.id)}">${this.escapeHtml(w.name)}</option>`).join('')}
      `;

      I18nAdapter.applyToDOM(this.editWebsiteId);
    } catch (error) {
      this.logger.error('Failed to load websites', error);
    }
  }

  /**
   * Load automation variables
   */
  private async loadVariables(): Promise<void> {
    await this.presenter.loadVariables();
    this.attachActionListeners();
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    this.createBtn.addEventListener('click', () => this.openCreateModal());
    this.editForm.addEventListener('submit', (e) => this.handleSave(e));
    this.cancelBtn.addEventListener('click', () => this.closeModal());
    this.addVariableFieldBtn.addEventListener('click', () => this.addVariableField());
  }

  /**
   * Attach action listeners to dynamically created buttons
   */
  private attachActionListeners(): void {
    const previewRecordingButtons = this.variablesList.querySelectorAll(
      '[data-action="preview-recording"]'
    );
    const editButtons = this.variablesList.querySelectorAll('[data-action="edit"]');
    const duplicateButtons = this.variablesList.querySelectorAll('[data-action="duplicate"]');
    const deleteButtons = this.variablesList.querySelectorAll('[data-action="delete"]');

    previewRecordingButtons.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = (btn as HTMLElement).dataset.id;
        if (id) await this.openRecordingPreview(id);
      });
    });

    editButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.id;
        if (id) this.openEditModal(id);
      });
    });

    duplicateButtons.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = (btn as HTMLElement).dataset.id;
        if (id) await this.handleDuplicate(id);
      });
    });

    deleteButtons.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = (btn as HTMLElement).dataset.id;
        if (id) await this.handleDelete(id);
      });
    });
  }

  /**
   * Open create modal
   */
  private openCreateModal(): void {
    this.editingId = null;
    this.editId.value = '';
    this.editWebsiteId.value = '';
    this.editStatus.value = 'once';
    this.variableFieldsContainer.innerHTML = '';
    this.modalTitle.textContent = I18nAdapter.getMessage('createNew');
    this.editModal.classList.add('show');
  }

  /**
   * Open edit modal
   */
  private async openEditModal(id: string): Promise<void> {
    try {
      const data = await this.presenter.getVariablesById(id);
      if (!data) {
        this.logger.error('Variables not found', { id });
        return;
      }

      this.editingId = id;
      this.editId.value = data.id;
      this.editWebsiteId.value = data.websiteId;
      this.editStatus.value = data.status || 'once';

      // Populate variables
      this.variableFieldsContainer.innerHTML = '';
      Object.entries(data.variables || {}).forEach(([key, value]) => {
        this.addVariableField(key, value);
      });

      this.modalTitle.textContent = I18nAdapter.getMessage('editAutomationVariables');
      this.editModal.classList.add('show');
    } catch (error) {
      this.logger.error('Failed to open edit modal', error);
    }
  }

  /**
   * Close modal
   */
  private closeModal(): void {
    this.editModal.classList.remove('show');
    this.editingId = null;
  }

  /**
   * Add variable field
   */
  private addVariableField(name: string = '', value: string = ''): void {
    const div = document.createElement('div');
    div.className = 'variable-item';
    div.innerHTML = `
      <input type="text" class="variable-name" placeholder="${I18nAdapter.getMessage('variableNamePlaceholder')}" value="${this.escapeHtml(name)}">
      <input type="text" class="variable-value" placeholder="${I18nAdapter.getMessage('valuePlaceholder')}" value="${this.escapeHtml(value)}">
      <button type="button" class="btn-remove-variable">✖</button>
    `;

    const removeBtn = div.querySelector('.btn-remove-variable') as HTMLButtonElement;
    removeBtn.addEventListener('click', () => div.remove());

    this.variableFieldsContainer.appendChild(div);
  }

  /**
   * Get form data
   */
  private getFormData(): {
    websiteId: string;
    status: string;
    variables: Record<string, string>;
  } {
    const websiteId = this.editWebsiteId.value.trim();
    const status = this.editStatus.value;
    const variables: Record<string, string> = {};

    // Collect variables
    const variableItems = this.variableFieldsContainer.querySelectorAll('.variable-item');
    variableItems.forEach((item) => {
      const nameInput = item.querySelector('.variable-name') as HTMLInputElement;
      const valueInput = item.querySelector('.variable-value') as HTMLInputElement;
      const name = nameInput.value.trim();
      const value = valueInput.value.trim();

      if (name) {
        variables[name] = value;
      }
    });

    return { websiteId, status, variables };
  }

  /**
   * Handle save
   */
  private async handleSave(event: Event): Promise<void> {
    event.preventDefault();

    try {
      const formData = this.getFormData();

      if (!formData.websiteId) {
        this.showError(I18nAdapter.getMessage('selectWebsitePlaceholder'));
        return;
      }

      let automationVariables: AutomationVariables;

      if (this.editingId) {
        // Update existing
        const existing = await this.presenter.getVariablesById(this.editingId);
        if (!existing) {
          this.showError(I18nAdapter.getMessage('automationVariablesNotFound'));
          return;
        }

        automationVariables = AutomationVariables.fromExisting({
          ...existing,
          websiteId: formData.websiteId,
          status: formData.status as any,
          variables: formData.variables,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Create new
        automationVariables = AutomationVariables.create(
          {
            websiteId: formData.websiteId,
            status: formData.status as any,
            variables: formData.variables,
          },
          factory.getIdGenerator()
        );
      }

      await this.presenter.saveVariables(automationVariables);
      this.closeModal();
      await this.loadVariables();
    } catch (error) {
      this.logger.error('Failed to save variables', error);
      // Error already shown by Presenter
    }
  }

  /**
   * Handle duplicate
   */
  private async handleDuplicate(id: string): Promise<void> {
    try {
      await this.presenter.duplicateVariables(id);
      await this.loadVariables();
    } catch (error) {
      this.logger.error('Failed to duplicate variables', error);
    }
  }

  /**
   * Handle delete
   */
  private async handleDelete(id: string): Promise<void> {
    if (!confirm(I18nAdapter.getMessage('confirmDelete'))) {
      return;
    }

    try {
      await this.presenter.deleteVariables(id);
      await this.loadVariables();
    } catch (error) {
      this.logger.error('Failed to delete variables', error);
    }
  }

  /**
   * Open recording preview
   */
  private async openRecordingPreview(variablesId: string): Promise<void> {
    try {
      const recording = await this.presenter.getLatestRecording(variablesId);

      if (recording && recording.getBlobData()) {
        this.presenter.getView().showRecordingPreview(recording);
      } else {
        this.presenter.getView().showNoRecordingMessage();
      }
    } catch (error) {
      this.logger.error('Failed to open recording preview', error);
      this.showError(I18nAdapter.getMessage('recordingLoadFailed'));
    }
  }

  /**
   * Escape HTML
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show error notification
   */
  private showError(message: string): void {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeAutomationVariablesManager().catch(console.error);
  });
} else {
  initializeAutomationVariablesManager().catch(console.error);
}
