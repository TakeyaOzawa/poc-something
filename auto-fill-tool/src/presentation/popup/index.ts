/**
 * Presentation Layer: Popup UI
 * Entry point for the Auto Fill Tool popup
 * Refactored with Phase 6 pattern: Coordinator + Controller
 */

import browser from 'webextension-polyfill';
import { BackgroundLogger } from '@/infrastructure/loggers/BackgroundLogger';
import { LogLevel, Logger } from '@domain/types/logger.types';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';
import { MessageTypes } from '@domain/types/messaging';
import {
  RepositoryFactory,
  setGlobalFactory,
  getGlobalFactory,
} from '@infrastructure/factories/RepositoryFactory';
import { ModalManager } from './ModalManager';
import { WebsiteActionHandler } from './WebsiteActionHandler';
import { WebsiteListPresenter } from './WebsiteListPresenter';
import { PopupCoordinator } from './PopupCoordinator';
import { GetAllWebsitesUseCase } from '@usecases/websites/GetAllWebsitesUseCase';
import { DeleteWebsiteUseCase } from '@usecases/websites/DeleteWebsiteUseCase';
import { GetAllAutomationVariablesUseCase } from '@usecases/automation-variables/GetAllAutomationVariablesUseCase';
import { GetAutomationVariablesByWebsiteIdUseCase } from '@usecases/automation-variables/GetAutomationVariablesByWebsiteIdUseCase';
import { SaveWebsiteWithAutomationVariablesUseCase } from '@usecases/websites/SaveWebsiteWithAutomationVariablesUseCase';
import { GetWebsiteByIdUseCase } from '@usecases/websites/GetWebsiteByIdUseCase';
import { SaveWebsiteUseCase } from '@usecases/websites/SaveWebsiteUseCase';
import { UpdateWebsiteUseCase } from '@usecases/websites/UpdateWebsiteUseCase';
import type {
  PopupRepositories,
  PopupUseCases,
  ExecuteAllSyncsResponse,
} from '../types/popup.types';

/**
 * Initialize or get global factory
 */
function initializeFactory(): RepositoryFactory {
  try {
    return getGlobalFactory();
  } catch {
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
function initializeRepositories(factory: RepositoryFactory): PopupRepositories {
  return {
    websiteRepository: factory.createWebsiteRepository(),
    xpathRepository: factory.createXPathRepository(),
    automationVariablesRepository: factory.createAutomationVariablesRepository(),
    systemSettingsRepository: factory.createSystemSettingsRepository(),
  };
}

/**
 * Initialize use cases
 */
function initializeUseCases(repositories: PopupRepositories): PopupUseCases {
  const { websiteRepository, xpathRepository, automationVariablesRepository } = repositories;

  const getAllWebsitesUseCase = new GetAllWebsitesUseCase(websiteRepository);
  const deleteWebsiteUseCase = new DeleteWebsiteUseCase(
    websiteRepository,
    xpathRepository,
    automationVariablesRepository
  );
  const getAllAutomationVariablesUseCase = new GetAllAutomationVariablesUseCase(
    automationVariablesRepository
  );
  const getAutomationVariablesByWebsiteIdUseCase = new GetAutomationVariablesByWebsiteIdUseCase(
    automationVariablesRepository
  );
  const getWebsiteByIdUseCase = new GetWebsiteByIdUseCase(websiteRepository);
  const saveWebsiteUseCase = new SaveWebsiteUseCase(websiteRepository);
  const updateWebsiteUseCase = new UpdateWebsiteUseCase(websiteRepository);
  const saveWebsiteWithAutomationVariablesUseCase = new SaveWebsiteWithAutomationVariablesUseCase(
    websiteRepository,
    automationVariablesRepository,
    saveWebsiteUseCase,
    updateWebsiteUseCase,
    getWebsiteByIdUseCase
  );

  return {
    getAllWebsitesUseCase,
    deleteWebsiteUseCase,
    getAllAutomationVariablesUseCase,
    getAutomationVariablesByWebsiteIdUseCase,
    saveWebsiteWithAutomationVariablesUseCase,
  };
}

/**
 * Initialize managers
 */
function initializeManagers(
  logger: Logger,
  websiteListPresenter: WebsiteListPresenter
): { actionHandler: WebsiteActionHandler; modalManager: ModalManager } {
  const actionHandler = new WebsiteActionHandler(logger.createChild('ActionHandler'));
  const modalManager = new ModalManager(
    () => websiteListPresenter?.editingId || null,
    (id) => {
      if (websiteListPresenter) {
        websiteListPresenter.editingId = id;
      }
    }
  );

  return { actionHandler, modalManager };
}

/**
 * Initialize and run popup
 */
// eslint-disable-next-line max-lines-per-function -- DI function initializes repositories (4 repos), use cases (8), managers (2), view, presenter, coordinator, and controller. Breaking this down would fragment the dependency graph without improving clarity. The function is purely declarative DI with no complex logic.
async function initializePopup(): Promise<void> {
  // Apply localization
  I18nAdapter.applyToDOM();

  // Initialize logger
  const logger = new BackgroundLogger('Popup', LogLevel.INFO);

  // Initialize factory and dependencies
  const factory = initializeFactory();
  const repositories = initializeRepositories(factory);
  const useCases = initializeUseCases(repositories);

  // Load log level and settings from storage
  try {
    const settingsResult = await repositories.systemSettingsRepository.load();
    if (settingsResult.isFailure) {
      throw new Error(`Failed to load system settings: ${settingsResult.error?.message}`);
    }
    const settings = settingsResult.value!;
    const logLevel = settings.getLogLevel();
    logger.setLevel(logLevel);
    logger.debug('Popup log level set from settings', { logLevel });

    // Initialize WebsiteListPresenter (needed by managers)
    // Temporarily create a placeholder to satisfy initializeManagers
    const placeholder = {} as WebsiteListPresenter;
    const managers = initializeManagers(logger, placeholder);

    // Now create the real WebsiteListPresenter with managers
    const websiteListPresenter = new WebsiteListPresenter(
      managers.modalManager,
      managers.actionHandler,
      useCases.getAllWebsitesUseCase,
      useCases.getAllAutomationVariablesUseCase,
      useCases.getAutomationVariablesByWebsiteIdUseCase,
      useCases.saveWebsiteWithAutomationVariablesUseCase,
      useCases.deleteWebsiteUseCase,
      logger.createChild('WebsiteListPresenter')
    );

    // Update the placeholder reference in managers
    // @ts-expect-error - Dynamic property assignment to work around circular dependency between ModalManager and WebsiteListPresenter
    managers.modalManager['getEditingId'] = () => websiteListPresenter?.editingId || null;
    // @ts-expect-error - Dynamic property assignment to work around circular dependency between ModalManager and WebsiteListPresenter
    managers.modalManager['setEditingId'] = (id: string | null) => {
      if (websiteListPresenter) {
        websiteListPresenter.editingId = id;
      }
    };

    // Initialize Controller (handles navigation and data sync)
    const controller = new PopupController(websiteListPresenter, logger);

    // Initialize Coordinator with dependencies
    const coordinator = new PopupCoordinator({
      websiteListPresenter,
      logger,
      settings,
      onDataSyncRequest: () => controller.openDataSyncSettings(),
    });

    // Initialize coordinator (handles Alpine.js, gradient background)
    await coordinator.initialize();

    // Initialize controller (handles DOM events and navigation)
    await controller.initialize();
  } catch (error) {
    logger.error('Failed to initialize Popup', error);
  }
}

/**
 * Popup Controller
 * Handles navigation and data sync operations
 */
class PopupController {
  private logger: Logger;
  private websiteListPresenter: WebsiteListPresenter;

  constructor(websiteListPresenter: WebsiteListPresenter, logger: Logger) {
    this.websiteListPresenter = websiteListPresenter;
    this.logger = logger;
  }

  /**
   * Initialize the controller (attach event listeners, load data)
   */
  public async initialize(): Promise<void> {
    try {
      // Attach event listeners for navigation
      this.attachEventListeners();

      // Load and render websites
      await this.init();

      this.logger.info('Popup Controller initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Controller', error);
    }
  }

  /**
   * Attach event listeners for top-level UI actions
   */
  private attachEventListeners(): void {
    const xpathManagerBtn = document.getElementById('xpathManagerBtn') as HTMLButtonElement;
    const automationVariablesManagerBtn = document.getElementById(
      'automationVariablesManagerBtn'
    ) as HTMLButtonElement;
    const addWebsiteBtn = document.getElementById('addWebsiteBtn') as HTMLButtonElement;
    const securityLogViewerBtn = document.getElementById(
      'securityLogViewerBtn'
    ) as HTMLButtonElement;
    const dataSyncBtn = document.getElementById('dataSyncBtn') as HTMLButtonElement;
    const settingsBtn = document.getElementById('settingsBtn') as HTMLButtonElement;
    const editForm = document.getElementById('editForm') as HTMLFormElement;
    const cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement;
    const addVariableBtn = document.getElementById('addVariableBtn') as HTMLButtonElement;

    xpathManagerBtn.addEventListener('click', () => this.openXPathManager());
    automationVariablesManagerBtn.addEventListener('click', () =>
      this.openAutomationVariablesManager()
    );
    addWebsiteBtn.addEventListener('click', () => this.websiteListPresenter.openAddModal());
    securityLogViewerBtn.addEventListener('click', () => this.openSecurityLogViewer());
    dataSyncBtn.addEventListener('click', () => this.openDataSyncSettings());
    settingsBtn.addEventListener('click', () => this.openSettings());
    editForm.addEventListener('submit', (e) => this.websiteListPresenter.saveWebsite(e));
    cancelBtn.addEventListener('click', () => this.websiteListPresenter.closeModal());
    addVariableBtn.addEventListener('click', () =>
      this.websiteListPresenter.getModalManager().addVariableField()
    );
  }

  /**
   * Open XPath Manager in new tab
   */
  private openXPathManager(): void {
    browser.tabs.create({ url: browser.runtime.getURL('xpath-manager.html') });
  }

  /**
   * Open AutomationVariables Manager in new tab
   */
  private openAutomationVariablesManager(): void {
    browser.tabs.create({ url: browser.runtime.getURL('automation-variables-manager.html') });
  }

  /**
   * Open Security Log Viewer in new tab
   */
  private openSecurityLogViewer(): void {
    browser.tabs.create({ url: browser.runtime.getURL('security-log-viewer.html') });
  }

  /**
   * Execute data sync in background
   */
  public async openDataSyncSettings(): Promise<void> {
    try {
      this.logger.info('Starting data sync from popup');

      // Send message to background to execute all configured syncs
      const response = (await browser.runtime.sendMessage({
        action: MessageTypes.EXECUTE_ALL_SYNCS,
      })) as ExecuteAllSyncsResponse;

      if (response.success) {
        const successCount = response.results.filter((r) => r.success).length;
        const totalCount = response.results.length;

        alert(`データ同期を開始しました\n成功: ${successCount}/${totalCount}`);
        this.logger.info('Data sync completed', { successCount, totalCount });
      } else {
        alert(`データ同期に失敗しました: ${response.error || '不明なエラー'}`);
        this.logger.error('Data sync failed', response.error);
      }
    } catch (error) {
      this.logger.error('Failed to execute data sync', error);
      alert('データ同期の実行中にエラーが発生しました');
    }
  }

  /**
   * Open Settings in new tab
   */
  private openSettings(): void {
    browser.tabs.create({ url: browser.runtime.getURL('system-settings.html') });
  }

  /**
   * Initialize popup by loading and rendering websites
   */
  private async init(): Promise<void> {
    this.logger.info('Initializing popup');
    await this.websiteListPresenter.loadAndRender();
    this.websiteListPresenter.attachWebsiteListeners();
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializePopup().catch(console.error);
  });
} else {
  initializePopup().catch(console.error);
}
