/**
 * Presentation Layer: Storage Sync Manager
 * Entry point for Storage Sync Configuration management UI
 * Refactored with Phase 6-7 pattern: Coordinator + Controller
 */

/* eslint-disable max-lines -- This file contains StorageSyncManagerController (701 lines) which handles comprehensive form operations for sync configuration management including: (1) 25 DOM element references for form fields, modals, and action buttons, (2) dynamic input/output field management with add/remove functionality, (3) create/edit modal operations with validation, (4) CRUD operations (save, delete, export, import) for sync configs, (5) sync execution via background script messaging, (6) tab management for config/history views, (7) history cleanup functionality. The Controller is intentionally kept cohesive following Phase 6-7 pattern (similar to automation-variables-manager with 328-line Controller and xpath-manager patterns) rather than being split into multiple files which would fragment the tightly-coupled form operation logic. The file also includes 4 helper functions (initializeRepositories, initializeAdapters, initializeUseCases: 150 lines) and main initialization function (initializeStorageSyncManager: 96 lines) for dependency injection, totaling 984 lines. Breaking this down would reduce clarity and violate the Phase 6-7 architectural pattern where large Controllers are acceptable for complex form operations. */

import { SystemSettingsViewModel } from '@presentation/types/SystemSettingsViewModel';
import { CreateSyncConfigUseCase } from '@application/usecases/sync/CreateSyncConfigUseCase';
import { UpdateSyncConfigUseCase } from '@application/usecases/sync/UpdateSyncConfigUseCase';
import { DeleteSyncConfigUseCase } from '@application/usecases/sync/DeleteSyncConfigUseCase';
import { ListSyncConfigsUseCase } from '@application/usecases/sync/ListSyncConfigsUseCase';
import { ImportCSVUseCase } from '@application/usecases/sync/ImportCSVUseCase';
import { ExportCSVUseCase } from '@application/usecases/sync/ExportCSVUseCase';
import { ValidateSyncConfigUseCase } from '@application/usecases/sync/ValidateSyncConfigUseCase';
import { TestConnectionUseCase } from '@application/usecases/sync/TestConnectionUseCase';
import { GetSyncHistoriesUseCase } from '@application/usecases/sync/GetSyncHistoriesUseCase';
import { CleanupSyncHistoriesUseCase } from '@application/usecases/sync/CleanupSyncHistoriesUseCase';
import { ExportXPathsUseCase } from '@application/usecases/xpaths/ExportXPathsUseCase';
import { ExportWebsitesUseCase } from '@application/usecases/websites/ExportWebsitesUseCase';
import { ExportAutomationVariablesUseCase } from '@application/usecases/automation-variables/ExportAutomationVariablesUseCase';
import { ExportSystemSettingsUseCase } from '@application/usecases/system-settings/ExportSystemSettingsUseCase';
import { ExportStorageSyncConfigsUseCase } from '@application/usecases/storage/ExportStorageSyncConfigsUseCase';
import { ChromeStorageStorageSyncConfigRepository } from '@/infrastructure/repositories/ChromeStorageStorageSyncConfigRepository';
import { ChromeStorageSyncHistoryRepository } from '@/infrastructure/repositories/ChromeStorageSyncHistoryRepository';
import { PapaParseAdapter } from '@/infrastructure/adapters/PapaParseAdapter';
import { JsonPathDataMapper } from '@/infrastructure/mappers/JsonPathDataMapper';
import { XPathCollectionMapper } from '@infrastructure/mappers/XPathCollectionMapper';
import { WebsiteCollectionMapper } from '@infrastructure/mappers/WebsiteCollectionMapper';
import { AutomationVariablesMapper } from '@infrastructure/mappers/AutomationVariablesMapper';
import { StorageSyncConfigMapper } from '@infrastructure/mappers/StorageSyncConfigMapper';
import { RepositoryFactory } from '@infrastructure/factories/RepositoryFactory';
import { StorageSyncManagerPresenter } from './StorageSyncManagerPresenter';
import { StorageSyncManagerViewImpl } from './StorageSyncManagerView';
import { StorageSyncManagerCoordinator } from './StorageSyncManagerCoordinator';
import { StorageSyncConfig, StorageSyncConfigData } from '@domain/entities/StorageSyncConfig';
import { RetryPolicy } from '@domain/entities/RetryPolicy';
import { BackgroundLogger } from '@/infrastructure/loggers/BackgroundLogger';
import { Logger, LogLevel } from '@domain/types/logger.types';
import { formatDateForFilename } from '@utils/dateFormatter';
import browser from 'webextension-polyfill';
import { I18nAdapter } from '@infrastructure/adapters/I18nAdapter';
import type { SyncInputField, SyncOutputField } from '../types/storage-sync-manager.types';

/**
 * Initialize repositories
 */
function initializeRepositories(logger: Logger) {
  const factory = new RepositoryFactory({ mode: 'chrome' });
  return {
    syncConfigRepository: new ChromeStorageStorageSyncConfigRepository(
      logger.createChild('SyncConfigRepository')
    ),
    syncHistoryRepository: new ChromeStorageSyncHistoryRepository(
      logger.createChild('SyncHistoryRepository')
    ),
    xpathRepository: factory.createXPathRepository(),
    websiteRepository: factory.createWebsiteRepository(),
    automationVariablesRepository: factory.createAutomationVariablesRepository(),
    systemSettingsRepository: factory.createSystemSettingsRepository(),
    storageSyncConfigRepository: factory.createStorageSyncConfigRepository(),
  };
}

/**
 * Initialize adapters and mappers
 */
function initializeAdapters(logger: Logger) {
  return {
    csvConverter: new PapaParseAdapter(logger.createChild('CSVConverter')),
    dataMapper: new JsonPathDataMapper(logger.createChild('DataMapper')),
    xpathMapper: new XPathCollectionMapper(),
    websiteMapper: new WebsiteCollectionMapper(logger.createChild('WebsiteMapper')),
    automationVariablesMapper: new AutomationVariablesMapper(
      logger.createChild('AutomationVariablesMapper')
    ),
    storageSyncConfigMapper: new StorageSyncConfigMapper(),
  };
}

/**
 * Initialize use cases
 */
// eslint-disable-next-line max-lines-per-function -- DI function initializes 15 use cases (10 sync-related use cases for CRUD, import, export, validate, test, history operations + 5 export use cases for UnifiedNavigationBar: xpaths, websites, automation variables, system settings, storage sync configs). Breaking this down would fragment the use case initialization graph without improving clarity. The function is purely declarative DI with no complex logic.
function initializeUseCases(
  repositories: ReturnType<typeof initializeRepositories>,
  adapters: ReturnType<typeof initializeAdapters>,
  factory: RepositoryFactory,
  logger: Logger
) {
  const {
    syncConfigRepository,
    syncHistoryRepository,
    xpathRepository,
    websiteRepository,
    automationVariablesRepository,
    storageSyncConfigRepository,
  } = repositories;
  const {
    csvConverter,
    dataMapper,
    xpathMapper,
    websiteMapper,
    automationVariablesMapper,
    storageSyncConfigMapper: _storageSyncConfigMapper,
  } = adapters;

  return {
    // Sync configuration use cases
    createSyncConfig: new CreateSyncConfigUseCase(
      syncConfigRepository,
      logger.createChild('CreateSyncConfigUseCase'),
      factory.getIdGenerator()
    ),
    updateSyncConfig: new UpdateSyncConfigUseCase(
      syncConfigRepository,
      logger.createChild('UpdateSyncConfigUseCase')
    ),
    deleteSyncConfig: new DeleteSyncConfigUseCase(
      syncConfigRepository,
      logger.createChild('DeleteSyncConfigUseCase')
    ),
    listSyncConfigs: new ListSyncConfigsUseCase(
      syncConfigRepository,
      logger.createChild('ListSyncConfigsUseCase')
    ),
    importCSV: new ImportCSVUseCase(csvConverter, logger.createChild('ImportCSVUseCase')),
    exportCSV: new ExportCSVUseCase(csvConverter, logger.createChild('ExportCSVUseCase')),
    validateSyncConfig: new ValidateSyncConfigUseCase(
      dataMapper,
      logger.createChild('ValidateSyncConfigUseCase')
    ),
    // TestConnectionUseCase is not used in browser context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TestConnectionUseCase not available in browser context, presenter handles null case
    testConnection: null as any as TestConnectionUseCase,
    getSyncHistories: new GetSyncHistoriesUseCase(
      syncHistoryRepository,
      logger.createChild('GetSyncHistoriesUseCase')
    ),
    cleanupSyncHistories: new CleanupSyncHistoriesUseCase(
      syncHistoryRepository,
      logger.createChild('CleanupSyncHistoriesUseCase')
    ),

    // Export use cases for UnifiedNavigationBar
    exportXPathsUseCase: new ExportXPathsUseCase(xpathRepository, xpathMapper),
    exportWebsitesUseCase: new ExportWebsitesUseCase(websiteRepository, websiteMapper),
    exportAutomationVariablesUseCase: new ExportAutomationVariablesUseCase(
      automationVariablesRepository,
      automationVariablesMapper
    ),
    exportSystemSettingsUseCase: new ExportSystemSettingsUseCase(
      repositories.systemSettingsRepository
    ),
    exportStorageSyncConfigsUseCase: new ExportStorageSyncConfigsUseCase(
      storageSyncConfigRepository,
      logger.createChild('ExportStorageSyncConfigs')
    ),
  };
}

/**
 * Initialize and run Storage Sync Manager
 */
// eslint-disable-next-line max-lines-per-function -- DI function initializes repositories (7 repos), adapters (6), use cases (15), view, presenter, coordinator, and controller. Breaking this down would fragment the dependency graph without improving clarity. The function is purely declarative DI with no complex logic.
async function initializeStorageSyncManager(): Promise<void> {
  // Apply localization
  I18nAdapter.applyToDOM();

  // Initialize logger
  const logger = new BackgroundLogger('StorageSyncManager', LogLevel.INFO);

  // Initialize factory and dependencies
  const factory = new RepositoryFactory({ mode: 'chrome' });
  const repositories = initializeRepositories(logger);
  const adapters = initializeAdapters(logger);
  const useCases = initializeUseCases(repositories, adapters, factory, logger);

  // Load log level and settings from storage
  try {
    const settingsResult = await repositories.systemSettingsRepository.load();
    if (settingsResult.isFailure) {
      throw new Error(`Failed to load system settings: ${settingsResult.error?.message}`);
    }
    const settingsEntity = settingsResult.value!;
    const logLevel = settingsEntity.getLogLevel();
    logger.setLevel(logLevel);
    logger.debug('Storage Sync Manager log level set from settings', { logLevel });

    // Convert to ViewModel
    const settings: SystemSettingsViewModel = {
      retryWaitSecondsMin: settingsEntity.getRetryWaitSecondsMin(),
      retryWaitSecondsMax: settingsEntity.getRetryWaitSecondsMax(),
      retryCount: settingsEntity.getRetryCount(),
      recordingEnabled: settingsEntity.getEnableTabRecording(),
      recordingBitrate: settingsEntity.getRecordingBitrate(),
      recordingRetentionDays: settingsEntity.getRecordingRetentionDays(),
      enabledLogSources: settingsEntity.getEnabledLogSources(),
      securityEventsOnly: settingsEntity.getSecurityEventsOnly(),
      maxStoredLogs: settingsEntity.getMaxStoredLogs(),
      logRetentionDays: settingsEntity.getLogRetentionDays(),
      retryWaitRangeText: `${settingsEntity.getRetryWaitSecondsMin()}-${settingsEntity.getRetryWaitSecondsMax()}秒`,
      retryCountText: `${settingsEntity.getRetryCount()}回`,
      recordingStatusText: settingsEntity.getEnableTabRecording() ? '有効' : '無効',
      logSettingsText: '標準',
      canSave: true,
      canReset: true,
      canExport: true,
      canImport: true,
    };

    // Initialize View and Presenter
    const configList = document.getElementById('configList') as HTMLDivElement;
    if (!configList) {
      throw new Error('Required element #configList not found');
    }
    const view = new StorageSyncManagerViewImpl(configList);
    const presenter = new StorageSyncManagerPresenter(
      view,
      useCases.createSyncConfig,
      useCases.updateSyncConfig,
      useCases.deleteSyncConfig,
      useCases.listSyncConfigs,
      useCases.importCSV,
      useCases.exportCSV,
      useCases.validateSyncConfig,
      useCases.testConnection,
      useCases.getSyncHistories,
      useCases.cleanupSyncHistories,
      logger.createChild('Presenter')
    );

    // Initialize Controller (handles DOM events and form operations)
    const controller = new StorageSyncManagerController(
      presenter,
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
    const coordinator = new StorageSyncManagerCoordinator({
      presenter: {
        importData: async (csvText: string, _format: string) => {
          await presenter.importConfigsFromCSV(csvText, 'default', true);
        },
      },
      logger,
      settings,
      exportXPathsUseCase: useCases.exportXPathsUseCase,
      exportWebsitesUseCase: useCases.exportWebsitesUseCase,
      exportAutomationVariablesUseCase: useCases.exportAutomationVariablesUseCase,
      exportSystemSettingsUseCase: useCases.exportSystemSettingsUseCase,
      exportStorageSyncConfigsUseCase: useCases.exportStorageSyncConfigsUseCase,
      tabs: {
        historyTabBtn: document.getElementById('historyTabBtn') as HTMLButtonElement | null,
        configTabBtn: document.getElementById('configTabBtn') as HTMLButtonElement | null,
        onHistoryTabClick: async () => controller.showHistoryTab(),
        onConfigTabClick: async () => controller.showConfigTab(),
      },
      downloadFile,
      onImportComplete: async () => {
        await controller.loadConfigs();
      },
    });

    // Initialize coordinator (handles UnifiedNavigationBar, gradient background, tabs)
    const unifiedNavBar = document.getElementById('unifiedNavBar') as HTMLDivElement;
    await coordinator.initialize(unifiedNavBar);

    // Initialize controller (handles DOM events and config list)
    await controller.initialize();

    logger.info('Storage Sync Manager initialized');
  } catch (error) {
    logger.error('Failed to initialize Storage Sync Manager', error);
  }
}

/**
 * Storage Sync Manager Controller
 * Handles DOM events and configuration CRUD operations
 */
class StorageSyncManagerController {
  private presenter: StorageSyncManagerPresenter;
  private useCases: ReturnType<typeof initializeUseCases>;
  private factory: RepositoryFactory;
  private logger: Logger;
  private editingId: string | null = null;

  // DOM elements
  private configList: HTMLDivElement;
  private createBtn: HTMLButtonElement;
  private exportBtn: HTMLButtonElement;
  private importBtn: HTMLButtonElement;
  private fileInput: HTMLInputElement;
  private backBtn: HTMLButtonElement;
  private editModal: HTMLDivElement;
  private editForm: HTMLFormElement;
  private editId: HTMLInputElement;
  private editStorageKey: HTMLInputElement;
  private editEnabled: HTMLSelectElement;
  private editSyncMethod: HTMLSelectElement;
  private editSyncTiming: HTMLSelectElement;
  private editSyncIntervalSeconds: HTMLInputElement;
  private editSyncDirection: HTMLSelectElement;
  private inputsList: HTMLDivElement;
  private outputsList: HTMLDivElement;
  private addInputBtn: HTMLButtonElement;
  private addOutputBtn: HTMLButtonElement;
  private editConflictResolution: HTMLSelectElement;
  private editEncoding: HTMLSelectElement;
  private editDelimiter: HTMLSelectElement;
  private editHasHeader: HTMLSelectElement;
  private cancelBtn: HTMLButtonElement;
  private modalTitle: HTMLDivElement;
  private intervalGroup: HTMLDivElement;
  private csvConfigSection: HTMLDivElement;

  // eslint-disable-next-line max-lines-per-function -- Constructor initializes Controller dependencies: assigns 3 constructor parameters, obtains 25 DOM element references (configList, createBtn, exportBtn, importBtn, fileInput, backBtn, editModal, editForm, editId, editStorageKey, editEnabled, editSyncMethod, editSyncTiming, editSyncIntervalSeconds, editSyncDirection, inputsList, outputsList, addInputBtn, addOutputBtn, editConflictResolution, editEncoding, editDelimiter, editHasHeader, cancelBtn, modalTitle, intervalGroup, csvConfigSection). Splitting this would fragment the initialization sequence and obscure the dependency relationships.
  constructor(
    presenter: StorageSyncManagerPresenter,
    useCases: ReturnType<typeof initializeUseCases>,
    factory: RepositoryFactory,
    logger: Logger
  ) {
    this.presenter = presenter;
    this.useCases = useCases;
    this.factory = factory;
    this.logger = logger;

    // Initialize DOM elements
    this.configList = document.getElementById('configList') as HTMLDivElement;
    this.createBtn = document.getElementById('createBtn') as HTMLButtonElement;
    this.exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
    this.importBtn = document.getElementById('importBtn') as HTMLButtonElement;
    this.fileInput = document.getElementById('fileInput') as HTMLInputElement;
    this.backBtn = document.getElementById('backBtn') as HTMLButtonElement;
    this.editModal = document.getElementById('editModal') as HTMLDivElement;
    this.editForm = document.getElementById('editForm') as HTMLFormElement;
    this.editId = document.getElementById('editId') as HTMLInputElement;
    this.editStorageKey = document.getElementById('editStorageKey') as HTMLInputElement;
    this.editEnabled = document.getElementById('editEnabled') as HTMLSelectElement;
    this.editSyncMethod = document.getElementById('editSyncMethod') as HTMLSelectElement;
    this.editSyncTiming = document.getElementById('editSyncTiming') as HTMLSelectElement;
    this.editSyncIntervalSeconds = document.getElementById(
      'editSyncIntervalSeconds'
    ) as HTMLInputElement;
    this.editSyncDirection = document.getElementById('editSyncDirection') as HTMLSelectElement;
    this.inputsList = document.getElementById('inputsList') as HTMLDivElement;
    this.outputsList = document.getElementById('outputsList') as HTMLDivElement;
    this.addInputBtn = document.getElementById('addInputBtn') as HTMLButtonElement;
    this.addOutputBtn = document.getElementById('addOutputBtn') as HTMLButtonElement;
    this.editConflictResolution = document.getElementById(
      'editConflictResolution'
    ) as HTMLSelectElement;
    this.editEncoding = document.getElementById('editEncoding') as HTMLSelectElement;
    this.editDelimiter = document.getElementById('editDelimiter') as HTMLSelectElement;
    this.editHasHeader = document.getElementById('editHasHeader') as HTMLSelectElement;
    this.cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement;
    this.modalTitle = document.getElementById('modalTitle') as HTMLDivElement;
    this.intervalGroup = document.getElementById('intervalGroup') as HTMLDivElement;
    this.csvConfigSection = document.getElementById('csvConfigSection') as HTMLDivElement;

    // Attach event listeners
    this.attachEventListeners();
  }

  /**
   * Initialize the controller
   */
  public async initialize(): Promise<void> {
    await this.loadConfigs();
    this.logger.info('Storage Sync Manager Controller initialized');
  }

  /**
   * Load sync configurations
   */
  public async loadConfigs(): Promise<void> {
    await this.presenter.loadConfigs();
    this.attachActionListeners();
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    this.createBtn.addEventListener('click', () => this.openCreateModal());
    this.exportBtn.addEventListener('click', () => this.handleExport());
    this.importBtn.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleImport(e));
    this.backBtn.addEventListener('click', () => window.close());
    this.editForm.addEventListener('submit', (e) => this.handleSave(e));
    this.cancelBtn.addEventListener('click', () => this.closeModal());

    // Conditional field visibility
    this.editSyncTiming.addEventListener('change', () => this.updateIntervalVisibility());
    this.editSyncMethod.addEventListener('change', () => this.updateMethodSectionVisibility());

    // Inputs/Outputs field management
    this.addInputBtn.addEventListener('click', () => this.addInputField());
    this.addOutputBtn.addEventListener('click', () => this.addOutputField());
  }

  /**
   * Attach action listeners to dynamically created buttons
   */
  private attachActionListeners(): void {
    const testButtons = this.configList.querySelectorAll('[data-action="test"]');
    const syncButtons = this.configList.querySelectorAll('[data-action="sync"]');
    const editButtons = this.configList.querySelectorAll('[data-action="edit"]');
    const deleteButtons = this.configList.querySelectorAll('[data-action="delete"]');

    testButtons.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = (btn as HTMLElement).dataset.id;
        if (id) await this.handleTestConnection(id);
      });
    });

    syncButtons.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = (btn as HTMLElement).dataset.id;
        if (id) await this.handleSync(id);
      });
    });

    editButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset.id;
        if (id) this.openEditModal(id);
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
   * Update interval field visibility based on sync timing
   */
  private updateIntervalVisibility(): void {
    const isPeriodic = this.editSyncTiming.value === 'periodic';
    this.intervalGroup.style.display = isPeriodic ? 'block' : 'none';
    if (isPeriodic) {
      this.editSyncIntervalSeconds.setAttribute('required', '');
    } else {
      this.editSyncIntervalSeconds.removeAttribute('required');
    }
  }

  /**
   * Update method section visibility based on sync method
   */
  private updateMethodSectionVisibility(): void {
    // Both notion and spread-sheet use the same inputs/outputs structure,
    // so no conditional section visibility needed anymore
    // Keep this method for future extensibility
  }

  /**
   * Render input fields dynamically
   */
  private renderInputFields(inputs: SyncInputField[]): void {
    this.inputsList.innerHTML = '';
    inputs.forEach((input, index) => {
      this.inputsList.appendChild(this.createInputFieldRow(input, index));
    });
  }

  /**
   * Render output fields dynamically
   */
  private renderOutputFields(outputs: SyncOutputField[]): void {
    this.outputsList.innerHTML = '';
    outputs.forEach((output, index) => {
      this.outputsList.appendChild(this.createOutputFieldRow(output, index));
    });
  }

  /**
   * Create input field row
   */
  private createInputFieldRow(input: SyncInputField, index: number): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'input-output-row';
    row.style.cssText = 'display: flex; gap: 10px; margin-bottom: 8px; align-items: center;';

    row.innerHTML = `
      <input type="text" class="input-key" placeholder="${I18nAdapter.getMessage('placeholderKey')}" value="${input.key || ''}" style="flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
      <input type="text" class="input-value" placeholder="${I18nAdapter.getMessage('placeholderValue')}" value="${input.value || ''}" style="flex: 2; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
      <button type="button" class="btn-remove" data-index="${index}" style="padding: 6px 12px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">✖</button>
    `;

    const removeBtn = row.querySelector('.btn-remove') as HTMLButtonElement;
    removeBtn.addEventListener('click', () => this.removeInputField(index));

    return row;
  }

  /**
   * Create output field row
   */
  private createOutputFieldRow(output: SyncOutputField, index: number): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'input-output-row';
    row.style.cssText = 'display: flex; gap: 10px; margin-bottom: 8px; align-items: center;';

    row.innerHTML = `
      <input type="text" class="output-key" placeholder="${I18nAdapter.getMessage('placeholderOutputKey')}" value="${output.key || ''}" style="flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
      <input type="text" class="output-default-value" placeholder="${I18nAdapter.getMessage('placeholderDefaultValue')}" value="${output.defaultValue || ''}" style="flex: 2; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
      <button type="button" class="btn-remove" data-index="${index}" style="padding: 6px 12px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer;">✖</button>
    `;

    const removeBtn = row.querySelector('.btn-remove') as HTMLButtonElement;
    removeBtn.addEventListener('click', () => this.removeOutputField(index));

    return row;
  }

  /**
   * Add new input field
   */
  private addInputField(): void {
    const currentInputs = this.collectInputsFromForm();
    currentInputs.push({ key: '', value: '' });
    this.renderInputFields(currentInputs);
  }

  /**
   * Add new output field
   */
  private addOutputField(): void {
    const currentOutputs = this.collectOutputsFromForm();
    currentOutputs.push({ key: '', defaultValue: '' });
    this.renderOutputFields(currentOutputs);
  }

  /**
   * Remove input field by index
   */
  private removeInputField(index: number): void {
    const currentInputs = this.collectInputsFromForm();
    currentInputs.splice(index, 1);
    this.renderInputFields(currentInputs);
  }

  /**
   * Remove output field by index
   */
  private removeOutputField(index: number): void {
    const currentOutputs = this.collectOutputsFromForm();
    currentOutputs.splice(index, 1);
    this.renderOutputFields(currentOutputs);
  }

  /**
   * Collect inputs from form fields
   */
  private collectInputsFromForm(): SyncInputField[] {
    const inputs: SyncInputField[] = [];
    const rows = this.inputsList.querySelectorAll('.input-output-row');
    rows.forEach((row) => {
      const keyInput = row.querySelector('.input-key') as HTMLInputElement;
      const valueInput = row.querySelector('.input-value') as HTMLInputElement;
      if (keyInput && valueInput) {
        inputs.push({
          key: keyInput.value.trim(),
          value: valueInput.value.trim(),
        });
      }
    });
    return inputs;
  }

  /**
   * Collect outputs from form fields
   */
  private collectOutputsFromForm(): SyncOutputField[] {
    const outputs: SyncOutputField[] = [];
    const rows = this.outputsList.querySelectorAll('.input-output-row');
    rows.forEach((row) => {
      const keyInput = row.querySelector('.output-key') as HTMLInputElement;
      const defaultValueInput = row.querySelector('.output-default-value') as HTMLInputElement;
      if (keyInput && defaultValueInput) {
        outputs.push({
          key: keyInput.value.trim(),
          defaultValue: defaultValueInput.value.trim(),
        });
      }
    });
    return outputs;
  }

  /**
   * Open create modal
   */
  private openCreateModal(): void {
    this.editingId = null;
    this.editForm.reset();
    this.editId.value = '';
    this.modalTitle.textContent = I18nAdapter.getMessage('createSyncConfigTitle');
    this.updateIntervalVisibility();
    this.updateMethodSectionVisibility();
    // Initialize empty inputs/outputs
    this.renderInputFields([]);
    this.renderOutputFields([]);
    this.editModal.classList.add('show');
  }

  /**
   * Open edit modal
   */
  private async openEditModal(id: string): Promise<void> {
    try {
      const config = await this.presenter.getConfigById(id);
      if (!config) {
        this.logger.error('Config not found', { id });
        return;
      }

      this.editingId = id;
      this.populateForm(config);
      this.modalTitle.textContent = I18nAdapter.getMessage('editSyncConfigTitle');
      this.updateIntervalVisibility();
      this.updateMethodSectionVisibility();
      this.editModal.classList.add('show');
    } catch (error) {
      this.logger.error('Failed to open edit modal', error);
    }
  }

  /**
   * Populate form with config data
   */
  private populateForm(config: StorageSyncConfigData): void {
    this.editId.value = config.id;
    this.editStorageKey.value = config.storageKey;
    this.editEnabled.value = config.enabled ? 'true' : 'false';
    this.editSyncMethod.value = config.syncMethod;
    this.editSyncTiming.value = config.syncTiming;
    this.editSyncDirection.value = config.syncDirection;

    if (config.syncIntervalSeconds) {
      this.editSyncIntervalSeconds.value = config.syncIntervalSeconds.toString();
    }

    // Inputs/Outputs (new structure)
    this.renderInputFields((config.inputs || []) as SyncInputField[]);
    this.renderOutputFields((config.outputs || []) as SyncOutputField[]);

    // Conflict resolution
    if (config.conflictResolution) {
      this.editConflictResolution.value = config.conflictResolution;
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
   * Get form data
   */
  private getFormData(): Partial<StorageSyncConfigData> {
    const data: Partial<StorageSyncConfigData> = {
      storageKey: this.editStorageKey.value.trim(),
      enabled: this.editEnabled.value === 'true',
      syncMethod: this.editSyncMethod.value as 'notion' | 'spread-sheet',
      syncTiming: this.editSyncTiming.value as 'manual' | 'periodic',
      syncDirection: this.editSyncDirection.value as 'bidirectional' | 'receive_only' | 'send_only',
      conflictResolution: this.editConflictResolution.value as
        | 'latest_timestamp'
        | 'local_priority'
        | 'remote_priority'
        | 'user_confirm',
    };

    if (this.editSyncTiming.value === 'periodic') {
      data.syncIntervalSeconds = parseInt(this.editSyncIntervalSeconds.value, 10);
    }

    // Collect inputs/outputs from dynamic form fields
    const inputs = this.collectInputsFromForm();
    const outputs = this.collectOutputsFromForm();

    // Filter out empty inputs/outputs
    data.inputs = inputs.filter((input) => input.key.trim() !== '');
    data.outputs = outputs.filter((output) => output.key.trim() !== '');

    return data;
  }

  /**
   * Handle save
   */
  private async handleSave(event: Event): Promise<void> {
    event.preventDefault();

    this.logger.info('handleSave called');

    try {
      const formData = this.getFormData();
      this.logger.info('Form data extracted', formData);

      if (!formData.storageKey) {
        this.showError(I18nAdapter.getMessage('storageKeyRequired'));
        return;
      }

      if (this.editingId) {
        // Update existing
        this.logger.info('Updating config', { id: this.editingId });
        await this.presenter.updateConfig(this.editingId, formData);
      } else {
        // Create new
        this.logger.info('Creating new config');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- formData validated above, type mismatch between Partial<StorageSyncConfigData> and create params
        const config = StorageSyncConfig.create(formData as any, this.factory.getIdGenerator());
        await this.presenter.createConfig(config);
      }

      this.closeModal();
      await this.loadConfigs();
      this.showSuccess(I18nAdapter.getMessage('configSaved'));
    } catch (error) {
      this.logger.error('Failed to save config', error);
      this.showError(I18nAdapter.getMessage('configSaveFailed', (error as Error).message));
    }
  }

  /**
   * Handle test connection
   */
  private async handleTestConnection(id: string): Promise<void> {
    try {
      const config = await this.presenter.getConfigById(id);
      if (!config) {
        this.showError(I18nAdapter.getMessage('configNotFound'));
        return;
      }

      const syncConfig = StorageSyncConfig.create(
        {
          ...config,
          retryPolicy: config.retryPolicy
            ? RetryPolicy.fromData(config.retryPolicy)
            : RetryPolicy.default(),
        },
        this.factory.getIdGenerator()
      );
      await this.presenter.testConnection(syncConfig);
    } catch (error) {
      this.logger.error('Failed to test connection', error);
    }
  }

  /**
   * Handle sync execution
   */
  // eslint-disable-next-line complexity -- Sends sync request to background and formats result messages based on sync direction (bidirectional/receive_only/send_only). The conditional message building is necessary for user feedback.
  private async handleSync(id: string): Promise<void> {
    try {
      this.logger.info('Executing manual sync', { configId: id });

      // Send sync request to background worker
      const response = (await browser.runtime.sendMessage({
        action: 'executeManualSync',
        configId: id,
      })) as {
        success: boolean;
        syncDirection?: 'bidirectional' | 'receive_only' | 'send_only';
        receiveResult?: { success: boolean; receivedCount?: number; error?: string };
        sendResult?: { success: boolean; sentCount?: number; error?: string };
        error?: string;
      };

      if (response.success) {
        const { syncDirection, receiveResult, sendResult } = response;

        let message = I18nAdapter.getMessage('syncCompleted');
        if (syncDirection === 'bidirectional') {
          message += `\n${I18nAdapter.getMessage('syncBidirectionalResult', [
            String(receiveResult?.receivedCount || 0),
            String(sendResult?.sentCount || 0),
          ])}`;
        } else if (syncDirection === 'receive_only') {
          message += `\n${I18nAdapter.getMessage('syncReceiveOnlyResult', String(receiveResult?.receivedCount || 0))}`;
        } else if (syncDirection === 'send_only') {
          message += `\n${I18nAdapter.getMessage('syncSendOnlyResult', String(sendResult?.sentCount || 0))}`;
        }

        this.showSuccess(message);
        this.logger.info('Manual sync completed successfully', {
          configId: id,
          syncDirection,
        });
      } else {
        this.showError(
          I18nAdapter.getMessage(
            'syncFailed',
            response.error || I18nAdapter.getMessage('error_generic')
          )
        );
        this.logger.error('Manual sync failed', {
          configId: id,
          error: response.error,
        });
      }
    } catch (error) {
      this.logger.error('Failed to execute sync', error);
      this.showError(I18nAdapter.getMessage('syncExecutionFailed'));
    }
  }

  /**
   * Handle delete
   */
  private async handleDelete(id: string): Promise<void> {
    if (!confirm(I18nAdapter.getMessage('confirmDeleteSyncConfig'))) {
      return;
    }

    try {
      await this.presenter.deleteConfig(id);
      await this.loadConfigs();
    } catch (error) {
      this.logger.error('Failed to delete config', error);
    }
  }

  /**
   * Handle export
   */
  private async handleExport(): Promise<void> {
    try {
      const storageKey = prompt(I18nAdapter.getMessage('exportPromptStorageKey'));
      if (!storageKey) return;

      const csv = await this.presenter.exportConfigsToCSV(storageKey);

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `sync-config-${storageKey}_${formatDateForFilename()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      this.logger.error('Failed to export configs', error);
    }
  }

  /**
   * Handle import
   */
  private async handleImport(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    try {
      const text = await file.text();
      const storageKey = prompt(I18nAdapter.getMessage('importPromptStorageKey'));
      if (!storageKey) return;

      const mergeWithExisting = confirm(I18nAdapter.getMessage('importMergeConfirm'));

      await this.presenter.importConfigsFromCSV(text, storageKey, mergeWithExisting);
      await this.loadConfigs();
    } catch (error) {
      this.logger.error('Failed to import configs', error);
    } finally {
      input.value = '';
    }
  }

  /**
   * Show error notification
   */
  private showError(message: string): void {
    this.presenter.getView().showError(message);
  }

  /**
   * Show success notification
   */
  private showSuccess(message: string): void {
    this.presenter.getView().showSuccess(message);
  }

  /**
   * Show history tab
   */
  public async showHistoryTab(): Promise<void> {
    try {
      this.logger.info('Switching to history tab');

      // Load and show histories
      await this.presenter.loadHistories();
      this.attachHistoryActionListeners();
    } catch (error) {
      this.logger.error('Failed to show history tab', error);
      this.showError(I18nAdapter.getMessage('historyLoadFailed'));
    }
  }

  /**
   * Show config tab
   */
  public async showConfigTab(): Promise<void> {
    try {
      this.logger.info('Switching to config tab');

      // Load and show configs
      await this.loadConfigs();
    } catch (error) {
      this.logger.error('Failed to show config tab', error);
      this.showError(I18nAdapter.getMessage('configurationsLoadFailed'));
    }
  }

  /**
   * Attach action listeners to dynamically created history buttons
   */
  private attachHistoryActionListeners(): void {
    const viewDetailButtons = this.configList.querySelectorAll('[data-action="view-detail"]');
    const cleanupButtons = this.configList.querySelectorAll('[data-action="cleanup"]');

    viewDetailButtons.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = (btn as HTMLElement).dataset.id;
        if (id) await this.handleHistoryDetailView(id);
      });
    });

    cleanupButtons.forEach((btn) => {
      btn.addEventListener('click', async () => {
        await this.handleHistoryCleanup();
      });
    });
  }

  /**
   * Handle history detail view
   */
  private async handleHistoryDetailView(historyId: string): Promise<void> {
    try {
      this.logger.info('Viewing history detail', { historyId });
      await this.presenter.showHistoryDetail(historyId);
    } catch (error) {
      this.logger.error('Failed to view history detail', error);
      this.showError(I18nAdapter.getMessage('historyDetailLoadFailed'));
    }
  }

  /**
   * Handle history cleanup
   */
  private async handleHistoryCleanup(): Promise<void> {
    try {
      const daysStr = prompt(
        I18nAdapter.getMessage('cleanupHistoriesPrompt'),
        I18nAdapter.getMessage('cleanupHistoriesDefaultDays')
      );
      if (!daysStr) return;

      const days = parseInt(daysStr, 10);
      if (isNaN(days) || days < 1) {
        this.showError(I18nAdapter.getMessage('cleanupHistoriesInvalidDays'));
        return;
      }

      if (!confirm(I18nAdapter.getMessage('cleanupHistoriesConfirm', days.toString()))) {
        return;
      }

      this.logger.info('Cleaning up old histories', { olderThanDays: days });
      await this.presenter.cleanupHistories(days);

      // Reload histories after cleanup
      await this.showHistoryTab();
    } catch (error) {
      this.logger.error('Failed to cleanup histories', error);
      this.showError(I18nAdapter.getMessage('cleanupHistoriesFailed'));
    }
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeStorageSyncManager().catch(console.error);
  });
} else {
  initializeStorageSyncManager().catch(console.error);
}
