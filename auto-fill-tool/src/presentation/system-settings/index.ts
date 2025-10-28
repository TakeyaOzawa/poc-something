/**
 * Presentation Layer: System Settings
 * Entry point for system settings UI with Dependency Injection
 */

import {
  RepositoryFactory,
  setGlobalFactory,
  getGlobalFactory,
} from '@infrastructure/factories/RepositoryFactory';
import { GetSystemSettingsUseCase } from '@usecases/system-settings/GetSystemSettingsUseCase';
import { UpdateSystemSettingsUseCase } from '@usecases/system-settings/UpdateSystemSettingsUseCase';
import { ResetSystemSettingsUseCase } from '@usecases/system-settings/ResetSystemSettingsUseCase';
import { ExportSystemSettingsUseCase } from '@usecases/system-settings/ExportSystemSettingsUseCase';
import { ImportSystemSettingsUseCase } from '@usecases/system-settings/ImportSystemSettingsUseCase';
import { ExecuteStorageSyncUseCase } from '@usecases/storage/ExecuteStorageSyncUseCase';
import { GetAllStorageSyncConfigsUseCase } from '@usecases/storage/GetAllStorageSyncConfigsUseCase';
import { ExecuteReceiveDataUseCase } from '@usecases/sync/ExecuteReceiveDataUseCase';
import { ExecuteSendDataUseCase } from '@usecases/sync/ExecuteSendDataUseCase';
import { ChromeStorageSyncHistoryRepository } from '@infrastructure/repositories/ChromeStorageSyncHistoryRepository';
import { NotionSyncAdapter } from '@infrastructure/adapters/NotionSyncAdapter';
import { SpreadsheetSyncAdapter } from '@infrastructure/adapters/SpreadsheetSyncAdapter';
import { BrowserSyncStateNotifier } from '@infrastructure/adapters/BrowserSyncStateNotifier';
import { BackgroundLogger } from '@infrastructure/loggers/BackgroundLogger';
import { LogLevel } from '@domain/types/logger.types';
import { I18nAdapter } from '@infrastructure/adapters/I18nAdapter';
import { SystemSettingsPresenter } from './SystemSettingsPresenter';
import { SystemSettingsViewImpl } from './SystemSettingsView';
import { GeneralSettingsManager } from './GeneralSettingsManager';
import { RecordingSettingsManager } from './RecordingSettingsManager';
import { AppearanceSettingsManager } from './AppearanceSettingsManager';
import { PermissionsSettingsManager } from './PermissionsSettingsManager';
import { DataSyncManager } from './DataSyncManager';
import { SystemSettingsCoordinator } from './SystemSettingsCoordinator';
import { ExportXPathsUseCase } from '@usecases/xpaths/ExportXPathsUseCase';
import { ExportWebsitesUseCase } from '@usecases/websites/ExportWebsitesUseCase';
import { ExportAutomationVariablesUseCase } from '@usecases/automation-variables/ExportAutomationVariablesUseCase';
import { ExportStorageSyncConfigsUseCase } from '@usecases/storage/ExportStorageSyncConfigsUseCase';
import { XPathCollectionMapper } from '@infrastructure/mappers/XPathCollectionMapper';
import { WebsiteCollectionMapper } from '@infrastructure/mappers/WebsiteCollectionMapper';
import { AutomationVariablesMapper } from '@infrastructure/mappers/AutomationVariablesMapper';
import { StorageSyncConfigMapper } from '@infrastructure/mappers/StorageSyncConfigMapper';

/**
 * Initialize and run system settings
 */
// eslint-disable-next-line max-lines-per-function -- DI function initializes repositories (6 repos), adapters (2), use cases (11), mappers (4), export use cases (4), view, presenter, and managers (4). Breaking this down would fragment the dependency graph without improving clarity. The function is purely declarative DI with no complex logic.
async function initializeSystemSettings(): Promise<void> {
  // Apply localization
  I18nAdapter.applyToDOM();

  // Initialize logger
  const logger = new BackgroundLogger('SystemSettings', LogLevel.INFO);

  // Initialize factory
  const factory = initializeFactory();

  // Initialize repositories
  const systemSettingsRepository = factory.createSystemSettingsRepository();
  const storageSyncConfigRepository = factory.createStorageSyncConfigRepository();
  const xpathRepository = factory.createXPathRepository();
  const websiteRepository = factory.createWebsiteRepository();
  const automationVariablesRepository = factory.createAutomationVariablesRepository();
  const syncHistoryRepository = new ChromeStorageSyncHistoryRepository(
    logger.createChild('SyncHistoryRepository')
  );

  // Initialize sync adapters
  const notionAdapter = new NotionSyncAdapter(logger.createChild('NotionSyncPort'));
  const spreadsheetAdapter = new SpreadsheetSyncAdapter(logger.createChild('SpreadsheetSyncPort'));

  // Initialize use cases
  const getSystemSettingsUseCase = new GetSystemSettingsUseCase(systemSettingsRepository);
  const updateSystemSettingsUseCase = new UpdateSystemSettingsUseCase(systemSettingsRepository);
  const resetSystemSettingsUseCase = new ResetSystemSettingsUseCase(systemSettingsRepository);
  const exportSystemSettingsUseCase = new ExportSystemSettingsUseCase(systemSettingsRepository);
  const importSystemSettingsUseCase = new ImportSystemSettingsUseCase(systemSettingsRepository);

  const executeReceiveDataUseCase = new ExecuteReceiveDataUseCase(
    notionAdapter,
    spreadsheetAdapter,
    logger.createChild('ExecuteReceiveData')
  );
  const executeSendDataUseCase = new ExecuteSendDataUseCase(
    notionAdapter,
    spreadsheetAdapter,
    logger.createChild('ExecuteSendData')
  );

  const syncStateNotifier = new BrowserSyncStateNotifier(logger.createChild('SyncStateNotifier'));

  const executeStorageSyncUseCase = new ExecuteStorageSyncUseCase(
    storageSyncConfigRepository,
    executeReceiveDataUseCase,
    executeSendDataUseCase,
    syncHistoryRepository,
    syncStateNotifier,
    logger.createChild('ExecuteStorageSync')
  );
  const getAllStorageSyncConfigsUseCase = new GetAllStorageSyncConfigsUseCase(
    storageSyncConfigRepository,
    logger.createChild('GetAllStorageSyncConfigs')
  );

  // Initialize export mappers
  const xpathMapper = new XPathCollectionMapper();
  const websiteMapper = new WebsiteCollectionMapper(logger.createChild('WebsiteMapper'));
  const automationVariablesMapper = new AutomationVariablesMapper(
    logger.createChild('AutomationVariablesMapper')
  );
  const storageSyncConfigMapper = new StorageSyncConfigMapper();

  // Initialize export use cases
  const exportXPathsUseCase = new ExportXPathsUseCase(xpathRepository, xpathMapper);
  const exportWebsitesUseCase = new ExportWebsitesUseCase(websiteRepository, websiteMapper);
  const exportAutomationVariablesUseCase = new ExportAutomationVariablesUseCase(
    automationVariablesRepository,
    automationVariablesMapper
  );
  const exportStorageSyncConfigsUseCase = new ExportStorageSyncConfigsUseCase(
    storageSyncConfigRepository,
    storageSyncConfigMapper,
    logger.createChild('ExportStorageSyncConfigs')
  );

  // Initialize View and Presenter
  const view = new SystemSettingsViewImpl();
  const presenter = new SystemSettingsPresenter(
    view,
    getSystemSettingsUseCase,
    updateSystemSettingsUseCase,
    resetSystemSettingsUseCase,
    exportSystemSettingsUseCase,
    importSystemSettingsUseCase,
    executeStorageSyncUseCase,
    getAllStorageSyncConfigsUseCase,
    logger.createChild('Presenter')
  );

  // Initialize UI Managers
  const generalSettingsManager = new GeneralSettingsManager(
    presenter,
    logger.createChild('GeneralSettings')
  );
  const recordingSettingsManager = new RecordingSettingsManager(
    presenter,
    logger.createChild('RecordingSettings')
  );
  const appearanceSettingsManager = new AppearanceSettingsManager(
    presenter,
    logger.createChild('AppearanceSettings')
  );
  const permissionsSettingsManager = new PermissionsSettingsManager(
    logger.createChild('PermissionsSettings')
  );
  const dataSyncManager = new DataSyncManager(
    presenter,
    getAllStorageSyncConfigsUseCase,
    logger.createChild('DataSync')
  );

  // Load log level from settings
  try {
    const settingsResult = await systemSettingsRepository.load();
    if (settingsResult.isFailure) {
      throw new Error(`Failed to load system settings: ${settingsResult.error?.message}`);
    }
    const settings = settingsResult.value!;
    const logLevel = settings.getLogLevel();
    logger.setLevel(logLevel);
    logger.debug('System Settings log level set from settings', { logLevel });
  } catch (error) {
    console.error('[SystemSettings] Failed to load log level from settings:', error);
  }

  // Initialize Coordinator with all dependencies
  const coordinator = new SystemSettingsCoordinator({
    presenter,
    view,
    logger,
    generalSettingsManager,
    recordingSettingsManager,
    appearanceSettingsManager,
    permissionsSettingsManager,
    dataSyncManager,
    exportXPathsUseCase,
    exportWebsitesUseCase,
    exportAutomationVariablesUseCase,
    exportStorageSyncConfigsUseCase,
  });

  // Initialize system settings
  await coordinator.initialize();
}

/**
 * Initialize repository factory
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

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeSystemSettings().catch((error) => {
      console.error('[SystemSettings] Initialization failed:', error);
    });
  });
} else {
  initializeSystemSettings().catch((error) => {
    console.error('[SystemSettings] Initialization failed:', error);
  });
}
