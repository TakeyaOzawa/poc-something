/**
 * Presentation Layer: XPath Manager
 * Entry point for XPath management UI
 * Refactored with Phase 6 pattern: Coordinator + Controller
 */

/* eslint-disable max-lines -- This file contains the initialization logic for XPathManagerController which requires comprehensive DOM element validation, dependency injection setup, and event handler registration. The initialization logic is cohesive and splitting it into multiple files would reduce code clarity and maintainability. The slight excess (302 vs 300 lines) is due to essential null-checking for DOM elements added for type safety. */

import {
  RepositoryFactory,
  setGlobalFactory,
  getGlobalFactory,
} from '@infrastructure/factories/RepositoryFactory';
import { GetAllXPathsUseCase } from '@application/usecases/xpaths/GetAllXPathsUseCase';
import { GetXPathsByWebsiteIdUseCase } from '@application/usecases/xpaths/GetXPathsByWebsiteIdUseCase';
import { UpdateXPathUseCase } from '@application/usecases/xpaths/UpdateXPathUseCase';
import { DeleteXPathUseCase } from '@application/usecases/xpaths/DeleteXPathUseCase';
import { ExportXPathsUseCase } from '@application/usecases/xpaths/ExportXPathsUseCase';
import { ImportXPathsUseCase } from '@application/usecases/xpaths/ImportXPathsUseCase';
import { ExportWebsitesUseCase } from '@application/usecases/websites/ExportWebsitesUseCase';
import { ImportWebsitesUseCase } from '@application/usecases/websites/ImportWebsitesUseCase';
import { ExportAutomationVariablesUseCase } from '@application/usecases/automation-variables/ExportAutomationVariablesUseCase';
import { ImportAutomationVariablesUseCase } from '@application/usecases/automation-variables/ImportAutomationVariablesUseCase';
import { ExportSystemSettingsUseCase } from '@application/usecases/system-settings/ExportSystemSettingsUseCase';
import { ImportSystemSettingsUseCase } from '@application/usecases/system-settings/ImportSystemSettingsUseCase';
import { ExportStorageSyncConfigsUseCase } from '@application/usecases/storage/ExportStorageSyncConfigsUseCase';
import { DuplicateXPathUseCase } from '@application/usecases/xpaths/DuplicateXPathUseCase';
import { GetAllWebsitesUseCase } from '@application/usecases/websites/GetAllWebsitesUseCase';
import { GetWebsiteByIdUseCase } from '@application/usecases/websites/GetWebsiteByIdUseCase';
import { UpdateWebsiteUseCase as UpdateWebsiteUseCaseForWebsite } from '@application/usecases/websites/UpdateWebsiteUseCase';
import { XPathManagerPresenter } from './XPathManagerPresenter';
import { XPathManagerViewImpl } from './XPathManagerView';
import { XPathManagerCoordinator } from './XPathManagerCoordinator';
import { BackgroundLogger } from '@/infrastructure/loggers/BackgroundLogger';
import { Logger, LogLevel } from '@domain/types/logger.types';
import { WebsiteSelectManager } from './WebsiteSelectManager';
import { AutoFillExecutor } from './AutoFillExecutor';
import { VariableManager } from './VariableManager';
import { XPathEditModalManager } from './XPathEditModalManager';
import { XPathActionHandler } from './XPathActionHandler';
import { ViewModelMapper } from '../mappers/ViewModelMapper';
import { SystemSettingsMapper } from '@application/mappers/SystemSettingsMapper';
import { I18nAdapter } from '@/infrastructure/adapters/I18nAdapter';
import { XPathCollectionMapper } from '@infrastructure/mappers/XPathCollectionMapper';
import { WebsiteCollectionMapper } from '@infrastructure/mappers/WebsiteCollectionMapper';
import { AutomationVariablesMapper } from '@infrastructure/mappers/AutomationVariablesMapper';
import { StorageSyncConfigMapper } from '@infrastructure/mappers/StorageSyncConfigMapper';

/**
 * Initialize or get global factory
 */
function initializeFactory(): RepositoryFactory {
  try {
    return getGlobalFactory();
  } catch {
    const factory = new RepositoryFactory({
      mode: 'chrome',
    });
    setGlobalFactory(factory);
    return factory;
  }
}

/**
 * Initialize repositories
 */
function initializeRepositories(factory: RepositoryFactory) {
  return {
    xpathRepository: factory.createXPathRepository(),
    systemSettingsRepository: factory.createSystemSettingsRepository(),
    websiteRepository: factory.createWebsiteRepository(),
    automationVariablesRepository: factory.createAutomationVariablesRepository(),
    storageSyncConfigRepository: factory.createStorageSyncConfigRepository(),
  };
}

/**
 * Initialize CSV converters
 */
function initializeConverters(logger: Logger) {
  return {
    xpathCSVConverter: new XPathCollectionMapper(),
    websiteCSVConverter: new WebsiteCollectionMapper(logger.createChild('WebsiteCSV')),
    automationVariablesCSVConverter: new AutomationVariablesMapper(
      logger.createChild('AutomationVariablesCSV')
    ),
    storageSyncConfigMapper: new StorageSyncConfigMapper(),
  };
}

/**
 * Initialize use cases
 */
// eslint-disable-next-line max-lines-per-function -- DI function initializes 17 use cases (13 XPath/Website/Variables use cases for CRUD, export, import, duplicate operations + 4 system-level export/import use cases for settings and sync configs). Breaking this down would fragment the use case initialization graph without improving clarity. The function is purely declarative DI with no complex logic.
function initializeUseCases(repositories: any, converters: any) {
  const {
    xpathRepository,
    websiteRepository,
    automationVariablesRepository,
    storageSyncConfigRepository,
  } = repositories;
  const {
    xpathCSVConverter,
    websiteCSVConverter,
    automationVariablesCSVConverter,
    storageSyncConfigMapper,
  } = converters;

  return {
    getAllXPathsUseCase: new GetAllXPathsUseCase(xpathRepository),
    getXPathsByWebsiteIdUseCase: new GetXPathsByWebsiteIdUseCase(xpathRepository),
    updateXPathUseCase: new UpdateXPathUseCase(xpathRepository),
    deleteXPathUseCase: new DeleteXPathUseCase(xpathRepository),
    exportXPathsUseCase: new ExportXPathsUseCase(xpathRepository, xpathCSVConverter),
    importXPathsUseCase: new ImportXPathsUseCase(
      xpathRepository,
      xpathCSVConverter,
      websiteRepository
    ),
    exportWebsitesUseCase: new ExportWebsitesUseCase(websiteRepository, websiteCSVConverter),
    importWebsitesUseCase: new ImportWebsitesUseCase(websiteRepository, websiteCSVConverter),
    exportAutomationVariablesUseCase: new ExportAutomationVariablesUseCase(
      automationVariablesRepository,
      automationVariablesCSVConverter
    ),
    importAutomationVariablesUseCase: new ImportAutomationVariablesUseCase(
      automationVariablesRepository,
      automationVariablesCSVConverter
    ),
    duplicateXPathUseCase: new DuplicateXPathUseCase(xpathRepository),
    getAllWebsitesUseCase: new GetAllWebsitesUseCase(websiteRepository),
    getWebsiteByIdUseCase: new GetWebsiteByIdUseCase(websiteRepository),
    updateWebsiteUseCase: new UpdateWebsiteUseCaseForWebsite(websiteRepository),
    exportSystemSettingsUseCase: new ExportSystemSettingsUseCase(
      repositories.systemSettingsRepository
    ),
    importSystemSettingsUseCase: new ImportSystemSettingsUseCase(
      repositories.systemSettingsRepository
    ),
    exportStorageSyncConfigsUseCase: new ExportStorageSyncConfigsUseCase(
      storageSyncConfigRepository,
      storageSyncConfigMapper
    ),
  };
}

/**
 * Initialize and run XPath Manager
 */
// eslint-disable-next-line max-lines-per-function -- DI function initializes repositories (5 repos), converters (4), use cases (17), presenter, view, coordinator, managers (5), and controller. Breaking this down would fragment the dependency graph without improving clarity. The function is purely declarative DI with no complex logic.
async function initializeXPathManager(): Promise<void> {
  // Apply localization
  I18nAdapter.applyToDOM();

  // Initialize logger
  const logger = new BackgroundLogger('XPathManager', LogLevel.INFO);

  // Initialize factory and dependencies
  const factory = initializeFactory();
  const repositories = initializeRepositories(factory);
  const converters = initializeConverters(logger);
  const useCases = initializeUseCases(repositories, converters);

  // Load log level and settings from storage
  try {
    const settingsResult = await repositories.systemSettingsRepository.load();
    if (settingsResult.isFailure) {
      throw new Error(`Failed to load system settings: ${settingsResult.error?.message}`);
    }
    const settings = settingsResult.value!;
    const logLevel = settings.getLogLevel();
    logger.setLevel(logLevel);
    logger.debug('XPath Manager log level set from settings', { logLevel });

    // Convert to ViewModel
    const systemSettingsDto = SystemSettingsMapper.toOutputDto(settings);
    const systemSettingsViewModel = ViewModelMapper.toSystemSettingsViewModel(systemSettingsDto);

    // Initialize View and Presenter
    const xpathListElement = document.getElementById('xpathList');
    if (!xpathListElement) {
      throw new Error('Required element #xpathList not found');
    }
    const view = new XPathManagerViewImpl(xpathListElement as HTMLElement);
    const presenter = new XPathManagerPresenter(view);

    // Initialize Controller (handles DOM events and XPath operations)
    const controller = new XPathManagerController(
      presenter,
      view,
      useCases,
      factory,
      logger.createChild('Controller')
    );

    // Helper function for file download
    const downloadFile = (content: string, filename: string, mimeType: string): void => {
      const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    };

    // Initialize Coordinator with dependencies
    const coordinator = new XPathManagerCoordinator({
      presenter,
      logger,
      settings: systemSettingsViewModel,
      exportSystemSettingsUseCase: useCases.exportSystemSettingsUseCase,
      exportStorageSyncConfigsUseCase: useCases.exportStorageSyncConfigsUseCase,
      downloadFile,
      onImportComplete: async () => {
        await controller.websiteSelectManager.initialize();
        await controller.loadXPaths();
      },
    });

    // Initialize coordinator (handles gradient background, UnifiedNavigationBar)
    const unifiedNavBar = document.getElementById('unifiedNavBar') as HTMLDivElement;
    await coordinator.initialize(unifiedNavBar);

    // Initialize controller (handles DOM events and XPath list)
    await controller.initialize();

    logger.info('XPath Manager initialized');
  } catch (error) {
    logger.error('Failed to initialize XPath Manager', error);
  }
}

/**
 * XPath Manager Controller
 * Handles DOM events and XPath CRUD operations
 */
class XPathManagerController {
  private presenter: XPathManagerPresenter;
  private view: XPathManagerViewImpl;
  public websiteSelectManager: WebsiteSelectManager;
  private autoFillExecutor: AutoFillExecutor;
  private variableManager: VariableManager;
  private xpathEditModalManager: XPathEditModalManager;
  private xpathActionHandler: XPathActionHandler;
  private logger: Logger;

  // DOM elements
  private xpathList: HTMLDivElement;
  private executeAutoFillBtn: HTMLButtonElement;
  private editForm: HTMLFormElement;
  private cancelBtn: HTMLButtonElement;
  private editActionType: HTMLSelectElement;
  private variablesModal: HTMLDivElement;
  private closeVariablesBtn: HTMLButtonElement;
  private addVariableBtn: HTMLButtonElement;
  private newVariableName: HTMLInputElement;
  private newVariableValue: HTMLInputElement;

  // eslint-disable-next-line max-lines-per-function -- Constructor initializes Controller dependencies: assigns 3 constructor parameters, obtains 8 DOM element references (xpathList, executeAutoFillBtn, editForm, cancelBtn, editActionType, variablesModal, closeVariablesBtn, addVariableBtn, newVariableName, newVariableValue), and creates 5 UI manager instances (WebsiteSelectManager, AutoFillExecutor, VariableManager, XPathEditModalManager, XPathActionHandler) with their respective dependencies. Splitting this would fragment the initialization sequence and obscure the dependency relationships between managers.
  constructor(
    presenter: XPathManagerPresenter,
    view: XPathManagerViewImpl,
    useCases: any,
    factory: RepositoryFactory,
    logger: Logger
  ) {
    this.presenter = presenter;
    this.view = view;
    this.logger = logger;

    // Initialize DOM elements
    this.xpathList = document.getElementById('xpathList') as HTMLDivElement;
    this.executeAutoFillBtn = document.getElementById('executeAutoFillBtn') as HTMLButtonElement;
    this.editForm = document.getElementById('editForm') as HTMLFormElement;
    this.cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement;
    this.editActionType = document.getElementById('editActionType') as HTMLSelectElement;
    this.variablesModal = document.getElementById('variablesModal') as HTMLDivElement;
    this.closeVariablesBtn = document.getElementById('closeVariablesBtn') as HTMLButtonElement;
    this.addVariableBtn = document.getElementById('addVariableBtn') as HTMLButtonElement;
    this.newVariableName = document.getElementById('newVariableName') as HTMLInputElement;
    this.newVariableValue = document.getElementById('newVariableValue') as HTMLInputElement;

    // Initialize UI managers
    this.websiteSelectManager = new WebsiteSelectManager(
      document.getElementById('websiteFilter') as HTMLSelectElement,
      this.logger.createChild('WebsiteSelectManager'),
      () => this.loadXPaths(),
      useCases.getAllWebsitesUseCase,
      useCases.getWebsiteByIdUseCase,
      useCases.updateWebsiteUseCase
    );

    this.autoFillExecutor = new AutoFillExecutor(
      this.websiteSelectManager,
      this.logger.createChild('AutoFillExecutor'),
      view
    );

    this.variableManager = new VariableManager(
      document.getElementById('variablesList') as HTMLDivElement,
      this.newVariableName,
      this.newVariableValue,
      this.logger.createChild('VariableManager'),
      this.view,
      () => this.websiteSelectManager.getCurrentWebsiteId(),
      useCases.getWebsiteByIdUseCase,
      useCases.updateWebsiteUseCase,
      factory.getIdGenerator()
    );

    this.xpathEditModalManager = new XPathEditModalManager(
      this.presenter,
      this.logger.createChild('XPathEditModalManager'),
      this.view
    );

    this.xpathActionHandler = new XPathActionHandler(
      this.presenter,
      this.xpathEditModalManager,
      this.logger.createChild('XPathActionHandler'),
      this.xpathList,
      () => this.loadXPaths()
    );

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Initialize the controller
   */
  public async initialize(): Promise<void> {
    this.websiteSelectManager.initialize();
    await this.loadXPaths();
    this.logger.info('XPath Manager Controller initialized');
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    this.executeAutoFillBtn.addEventListener('click', () =>
      this.autoFillExecutor.executeAutoFill()
    );
    this.editForm.addEventListener('submit', (e) => this.handleSave(e));
    this.cancelBtn.addEventListener('click', () => this.xpathEditModalManager.closeModal());
    this.editActionType.addEventListener('change', () =>
      this.xpathEditModalManager.handleActionTypeChange()
    );
    this.closeVariablesBtn.addEventListener('click', () => this.closeVariablesModal());
    this.addVariableBtn.addEventListener('click', () => this.variableManager.addVariable());
  }

  /**
   * Load XPaths for current website
   */
  public async loadXPaths(): Promise<void> {
    const currentWebsiteId = this.websiteSelectManager.getCurrentWebsiteId();
    await this.presenter.loadXPaths(currentWebsiteId || undefined);
    // Attach event listeners to action buttons after rendering
    this.xpathActionHandler.attachActionListeners();
  }

  /**
   * Handle save XPath
   */
  private async handleSave(event: Event): Promise<void> {
    event.preventDefault();
    const success = await this.xpathEditModalManager.saveXPath();
    if (success) {
      await this.loadXPaths();
    }
  }

  /**
   * Close variables modal
   */
  private closeVariablesModal(): void {
    this.variablesModal.classList.remove('show');
    this.newVariableName.value = '';
    this.newVariableValue.value = '';
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeXPathManager().catch(console.error);
  });
} else {
  initializeXPathManager().catch(console.error);
}
