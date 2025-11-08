/* eslint-disable max-lines */
/**
 * Presentation Layer: Background Service Worker
 * Entry point for the Chrome extension background script
 */

import browser from 'webextension-polyfill';
import { ChromeNotificationAdapter } from '@infrastructure/adapters/ChromeNotificationAdapter';
import { ChromeAutoFillAdapter } from '@infrastructure/adapters/ChromeAutoFillAdapter';
import { ContentScriptTabCaptureAdapter } from '@infrastructure/adapters/ContentScriptTabCaptureAdapter';
import { SecureStorageAdapter } from '@infrastructure/adapters/SecureStorageAdapter';
import { PasswordValidatorAdapter } from '@infrastructure/adapters/PasswordValidatorAdapter';
import { WebCryptoAdapter } from '@infrastructure/adapters/CryptoAdapter';
import { LockoutManager } from '@domain/services/LockoutManager';
import { ChromeStorageLockoutStorage } from '@infrastructure/adapters/ChromeStorageLockoutStorage';
import { MasterPasswordPolicy } from '@domain/entities/MasterPasswordPolicy';
import { IndexedDBRecordingRepository } from '@infrastructure/repositories/IndexedDBRecordingRepository';
import { LoggerFactory } from '@/infrastructure/loggers/LoggerFactory';
import { LogLevel } from '@domain/types/logger.types';
import { LogEntryProps } from '@domain/entities/LogEntry';
import { RepositoryFactory, setGlobalFactory } from '@infrastructure/factories/RepositoryFactory';
import { ChromeStorageBatchLoader } from '@infrastructure/loaders/ChromeStorageBatchLoader';
import { StorageSyncConfigMapper } from '@application/mappers/StorageSyncConfigMapper';

import { SaveXPathUseCase } from '@application/usecases/xpaths/SaveXPathUseCase';
import { ExecuteAutoFillUseCase } from '@application/usecases/auto-fill/ExecuteAutoFillUseCase';
import { SaveWebsiteUseCase } from '@application/usecases/websites/SaveWebsiteUseCase';
import { GetWebsiteByIdUseCase } from '@application/usecases/websites/GetWebsiteByIdUseCase';
import { UpdateWebsiteUseCase } from '@application/usecases/websites/UpdateWebsiteUseCase';
import { InitializeMasterPasswordUseCase } from '@application/usecases/storage/InitializeMasterPasswordUseCase';
import { UnlockStorageUseCase } from '@application/usecases/storage/UnlockStorageUseCase';
import { LockStorageUseCase } from '@application/usecases/storage/LockStorageUseCase';
import { CheckUnlockStatusUseCase } from '@application/usecases/storage/CheckUnlockStatusUseCase';
import { StartTabRecordingUseCase } from '@application/usecases/recording/StartTabRecordingUseCase';
import { StopTabRecordingUseCase } from '@application/usecases/recording/StopTabRecordingUseCase';
import { DeleteOldRecordingsUseCase } from '@application/usecases/recording/DeleteOldRecordingsUseCase';
import type {
  BackgroundDependencies,
  BackgroundUseCases,
  BackgroundMessageRouter,
  BackgroundLogger,
} from '../types/background.types';
import { ExecuteReceiveDataUseCase } from '@application/usecases/sync/ExecuteReceiveDataUseCase';
import { ExecuteSendDataUseCase } from '@application/usecases/sync/ExecuteSendDataUseCase';
import { ExecuteManualSyncUseCase } from '@application/usecases/sync/ExecuteManualSyncUseCase';
import { ListSyncConfigsUseCase } from '@application/usecases/sync/ListSyncConfigsUseCase';
import { ChromeStorageStorageSyncConfigRepository } from '@/infrastructure/repositories/ChromeStorageStorageSyncConfigRepository';
import { ChromeStorageSyncHistoryRepository } from '@/infrastructure/repositories/ChromeStorageSyncHistoryRepository';
import { NotionSyncAdapter } from '@/infrastructure/adapters/NotionSyncAdapter';
import { SpreadsheetSyncAdapter } from '@/infrastructure/adapters/SpreadsheetSyncAdapter';
import { BrowserSyncStateNotifier } from '@/infrastructure/adapters/BrowserSyncStateNotifier';
import { MessageRouter } from '@infrastructure/messaging/MessageRouter';
import { MessageTypes } from '@domain/types/messaging';
import { ExecuteAutoFillHandler } from './handlers/ExecuteAutoFillHandler';
import { CancelAutoFillHandler } from './handlers/CancelAutoFillHandler';
import { ExecuteWebsiteFromPopupHandler } from './handlers/ExecuteWebsiteFromPopupHandler';
import { ChromeContextMenuAdapter } from '@/infrastructure/adapters/ChromeContextMenuAdapter';
import { XPathContextMenuHandler } from './XPathContextMenuHandler';
import { ForwardLogMessage } from '@domain/types/messaging';
import { ChromeStorageLogAggregatorPort } from '@/infrastructure/adapters/ChromeStorageLogAggregatorAdapter';
import { LogEntry } from '@domain/entities/LogEntry';

// Log immediately to confirm background script is loading
console.log('[Background] Background script starting to initialize...');

// Global instances for secure storage and lockout management
let secureStorage: SecureStorageAdapter;
let lockoutManager: LockoutManager;
let masterPasswordPolicy: MasterPasswordPolicy;

// Initialize asynchronously to load settings
async function initialize() {
  // Initialize Repository Factory with chrome mode (default)
  // TODO: Switch to secure mode when master password UI is implemented
  const factory = new RepositoryFactory({
    mode: 'chrome',
  });
  setGlobalFactory(factory);

  const logLevel = await loadLogLevel(factory);
  const logger = LoggerFactory.createConsoleLogger('Background', logLevel);

  // Initialize secure storage and lockout manager
  const cryptoAdapter = new WebCryptoAdapter();
  const passwordValidator = new PasswordValidatorAdapter();
  secureStorage = new SecureStorageAdapter(cryptoAdapter, passwordValidator);

  // Create log aggregator early for lockout manager
  const logAggregatorService = new ChromeStorageLogAggregatorPort();

  const lockoutStorage = new ChromeStorageLockoutStorage();
  lockoutManager = new LockoutManager(lockoutStorage, logAggregatorService, 5, 5 * 60 * 1000); // 5 attempts, 5 minute lockout
  await lockoutManager.initialize();

  masterPasswordPolicy = MasterPasswordPolicy.default();

  const dependencies = createDependencies(factory, logger, logAggregatorService);
  const useCases = createUseCases(dependencies, logger);

  // Set global references for message handlers
  globalUseCases = useCases;
  globalLogger = logger;
  globalDependencies = dependencies;

  const messageRouter = new MessageRouter(logger.createChild('MessageRouter'));
  registerMessageHandlers(messageRouter, useCases, logger);
  messageRouter.startListening();

  initializeContextMenu(dependencies, useCases, logger);

  // Set up session management and idle detection
  setupSessionManagement(logger);

  // Set up periodic sync scheduler
  setupPeriodicSync(useCases, logger);

  // Set up log cleanup scheduler
  setupLogCleanup(dependencies, logger);

  logger.info('Auto Fill Tool background service initialized', {
    repositoryMode: factory.getMode(),
  });
}

async function loadLogLevel(factory: RepositoryFactory): Promise<LogLevel> {
  const tempSystemSettingsRepository = factory.createSystemSettingsRepository();

  const systemSettingsResult = await tempSystemSettingsRepository.load();
  if (systemSettingsResult.isFailure) {
    throw new Error(`Failed to load system settings: ${systemSettingsResult.error?.message}`);
  }
  const systemSettings = systemSettingsResult.value!;
  const logLevel = systemSettings.getLogLevel();
  console.log('[Background] Loaded log level from settings:', LogLevel[logLevel]);

  return logLevel;
}

function createDependencies(
  factory: RepositoryFactory,
  logger: BackgroundLogger,
  logAggregatorService: ChromeStorageLogAggregatorPort
): BackgroundDependencies {
  const automationResultRepository = factory.createAutomationResultRepository();

  return {
    notificationService: new ChromeNotificationAdapter(),
    xpathRepository: factory.createXPathRepository(),
    websiteRepository: factory.createWebsiteRepository(),
    automationVariablesRepository: factory.createAutomationVariablesRepository(),
    automationResultRepository,
    systemSettingsRepository: factory.createSystemSettingsRepository(),
    tabCaptureAdapter: new ContentScriptTabCaptureAdapter(logger.createChild('TabCaptureAdapter')),
    recordingRepository: new IndexedDBRecordingRepository(
      logger.createChild('RecordingRepository'),
      automationResultRepository
    ),
    // Sync dependencies
    storageSyncConfigRepository: new ChromeStorageStorageSyncConfigRepository(
      logger.createChild('StorageSyncConfigRepository')
    ),
    syncHistoryRepository: new ChromeStorageSyncHistoryRepository(
      logger.createChild('SyncHistoryRepository')
    ),
    // Centralized logging (created earlier for LockoutManager, reuse the same instance)
    logAggregatorService,
    idGenerator: factory.getIdGenerator(),
  };
}

function createRecordingUseCases(dependencies: BackgroundDependencies, logger: BackgroundLogger) {
  return {
    startRecordingUseCase: new StartTabRecordingUseCase(
      dependencies.tabCaptureAdapter,
      dependencies.recordingRepository,
      dependencies.systemSettingsRepository,
      logger.createChild('StartTabRecording')
    ),
    stopRecordingUseCase: new StopTabRecordingUseCase(
      dependencies.tabCaptureAdapter,
      dependencies.recordingRepository,
      logger.createChild('StopTabRecording')
    ),
    deleteOldRecordingsUseCase: new DeleteOldRecordingsUseCase(
      dependencies.recordingRepository,
      dependencies.systemSettingsRepository,
      logger.createChild('DeleteOldRecordings')
    ),
  };
}

function createSyncUseCases(dependencies: BackgroundDependencies, logger: BackgroundLogger) {
  // Create specialized adapters for new architecture
  const notionAdapter = new NotionSyncAdapter(logger.createChild('NotionSyncPort'));
  const spreadsheetAdapter = new SpreadsheetSyncAdapter(logger.createChild('SpreadsheetSyncPort'));

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

  const executeManualSyncUseCase = new ExecuteManualSyncUseCase(
    executeReceiveDataUseCase,
    executeSendDataUseCase,
    dependencies.syncHistoryRepository,
    syncStateNotifier,
    dependencies.idGenerator,
    logger.createChild('ExecuteManualSync')
  );

  const listSyncConfigsUseCase = new ListSyncConfigsUseCase(
    dependencies.storageSyncConfigRepository,
    logger.createChild('ListSyncConfigs')
  );

  return {
    executeManualSyncUseCase,
    listSyncConfigsUseCase,
  };
}

function createUseCases(
  dependencies: BackgroundDependencies,
  logger: BackgroundLogger
): BackgroundUseCases {
  const autoFillService = new ChromeAutoFillAdapter(
    dependencies.systemSettingsRepository,
    dependencies.automationResultRepository,
    logger.createChild('AutoFillAdapter')
  );

  const recordingUseCases = createRecordingUseCases(dependencies, logger);
  const syncUseCases = createSyncUseCases(dependencies, logger);

  return {
    saveXPathUseCase: new SaveXPathUseCase(dependencies.xpathRepository),
    saveWebsiteUseCase: new SaveWebsiteUseCase(dependencies.websiteRepository),
    getWebsiteByIdUseCase: new GetWebsiteByIdUseCase(dependencies.websiteRepository),
    updateWebsiteUseCase: new UpdateWebsiteUseCase(dependencies.websiteRepository),
    executeAutoFillUseCase: new ExecuteAutoFillUseCase(
      dependencies.xpathRepository,
      autoFillService,
      dependencies.automationVariablesRepository,
      dependencies.automationResultRepository,
      recordingUseCases.startRecordingUseCase,
      recordingUseCases.stopRecordingUseCase,
      recordingUseCases.deleteOldRecordingsUseCase,
      dependencies.idGenerator,
      new ChromeStorageBatchLoader(),
      logger.createChild('ExecuteAutoFill')
    ),
    ...syncUseCases,
  };
}

function registerMessageHandlers(
  messageRouter: BackgroundMessageRouter,
  useCases: BackgroundUseCases,
  logger: BackgroundLogger
): void {
  messageRouter.registerHandler(
    MessageTypes.EXECUTE_AUTO_FILL,
    new ExecuteAutoFillHandler(
      useCases.executeAutoFillUseCase,
      logger.createChild('ExecuteAutoFillHandler')
    )
  );

  messageRouter.registerHandler(
    MessageTypes.CANCEL_AUTO_FILL,
    new CancelAutoFillHandler(logger.createChild('CancelAutoFillHandler'))
  );

  messageRouter.registerHandler(
    MessageTypes.EXECUTE_WEBSITE_FROM_POPUP,
    new ExecuteWebsiteFromPopupHandler(
      useCases.getWebsiteByIdUseCase,
      useCases.executeAutoFillUseCase,
      logger.createChild('ExecuteWebsiteFromPopupHandler')
    )
  );
}

function initializeContextMenu(
  dependencies: BackgroundDependencies,
  useCases: BackgroundUseCases,
  logger: BackgroundLogger
): void {
  const contextMenuManager = new ChromeContextMenuAdapter(logger.createChild('ContextMenuManager'));
  contextMenuManager.initialize();

  const xpathContextMenuHandler = new XPathContextMenuHandler(
    useCases.saveXPathUseCase,
    dependencies.xpathRepository,
    dependencies.notificationService,
    logger.createChild('XPathContextMenuHandler'),
    useCases.saveWebsiteUseCase,
    useCases.getWebsiteByIdUseCase,
    useCases.updateWebsiteUseCase
  );

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    await xpathContextMenuHandler.handleContextMenuClick(info, tab);
  });
}

// Global references for use cases (needed for message handlers)
let globalUseCases: BackgroundUseCases | null = null;
let globalLogger: BackgroundLogger | null = null;
let globalDependencies: BackgroundDependencies | null = null;

// Add listener for master password operations (async)
// @ts-expect-error - Function intentionally returns true | undefined based on message type to prevent channel closed errors
// eslint-disable-next-line complexity, max-lines-per-function -- Routes multiple message types (master password ops, manual sync, forwarded logs, resumeAutoFill, getCurrentTabId) with appropriate async handling. The branching logic is necessary and clear.
browser.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  // Type guard for messages
  if (message && typeof message === 'object' && 'action' in message) {
    const action = (message as any).action;

    // Handle master password operations (async)
    if (
      action === MessageTypes.INITIALIZE_MASTER_PASSWORD ||
      action === MessageTypes.UNLOCK_STORAGE ||
      action === MessageTypes.LOCK_STORAGE ||
      action === MessageTypes.CHECK_UNLOCK_STATUS ||
      action === MessageTypes.CHECK_STORAGE_STATUS
    ) {
      handleMasterPasswordMessage(message as any)
        .then(sendResponse)
        .catch((error) => {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      return true; // Async response
    }

    // Handle manual sync operation (async)
    if (action === MessageTypes.EXECUTE_MANUAL_SYNC) {
      handleManualSyncMessage(message as any)
        .then(sendResponse)
        .catch((error) => {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      return true; // Async response
    }

    // Handle execute all syncs operation (async)
    if (action === MessageTypes.EXECUTE_ALL_SYNCS) {
      handleExecuteAllSyncsMessage()
        .then(sendResponse)
        .catch((error) => {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      return true; // Async response
    }

    // Handle resumeAutoFill operation (async)
    if (action === MessageTypes.RESUME_AUTO_FILL) {
      handleResumeAutoFill(message as any)
        .then(sendResponse)
        .catch((error) => {
          sendResponse({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      return true; // Async response
    }

    // Handle getCurrentTabId operation (sync)
    if (action === MessageTypes.GET_CURRENT_TAB_ID) {
      sendResponse(handleGetCurrentTabId(sender));
      return false; // Sync response
    }

    // Handle forwarded logs (sync - no response needed)
    if (action === MessageTypes.FORWARD_LOG) {
      handleForwardedLog(message as ForwardLogMessage);
      // Don't return true - we don't need async response for logs
      // This prevents "message channel closed" errors when popup/content script closes
      return;
    }
  }
  // For unhandled messages, return true to allow other listeners
  return true;
});

function handleForwardedLog(message: ForwardLogMessage) {
  const { level, context, message: logMessage, logContext, error, timestamp } = message;
  const prefix = formatLogPrefix(timestamp, context, level);
  const args = formatLogArgs(logContext, error);

  // Output to console (existing behavior)
  logToConsole(level, prefix, logMessage, args);

  // Store log in centralized storage (new behavior)
  // Use fire-and-forget pattern to avoid blocking
  storeLogInBackground(message).catch((err) => {
    console.error('[Background] Failed to store log:', err);
  });
}

/**
 * Store log entry in centralized storage
 * @private
 */
async function storeLogInBackground(message: ForwardLogMessage): Promise<void> {
  if (!globalDependencies?.logAggregatorService) {
    return; // Not yet initialized
  }

  const { level, context, message: logMessage, logContext, error, timestamp } = message;

  // Map string level to LogLevel enum
  const logLevel = mapStringToLogLevel(level);

  // Create LogEntry
  const logEntryData: Omit<LogEntryProps, 'id'> = {
    timestamp,
    level: logLevel,
    source: context,
    message: logMessage,
    isSecurityEvent: false, // Will be set true by SecurityEventLogger
  };

  if (logContext) {
    logEntryData.context = logContext;
  }

  if (error) {
    const errorObj: { message: string; stack?: string } = {
      message:
        typeof error === 'string'
          ? error
          : (error as { message?: string }).message || 'Unknown error',
    };

    const stack = (error as { stack?: string }).stack;
    if (stack !== undefined) {
      errorObj.stack = stack;
    }

    logEntryData.error = errorObj;
  }

  const logEntry = LogEntry.create(logEntryData);

  // Add log to storage
  await globalDependencies.logAggregatorService.addLog(logEntry);

  // Apply log rotation based on SystemSettings
  const systemSettingsResult = await globalDependencies.systemSettingsRepository.load();
  if (systemSettingsResult.isFailure) {
    console.error('Failed to load system settings for log rotation:', systemSettingsResult.error);
    return;
  }
  const systemSettings = systemSettingsResult.value!;
  const maxLogs = systemSettings.getMaxStoredLogs();
  await globalDependencies.logAggregatorService.applyRotation(maxLogs);
}

/**
 * Map string log level to LogLevel enum
 * @private
 */
function mapStringToLogLevel(level: string): LogLevel {
  switch (level.toUpperCase()) {
    case 'DEBUG':
      return LogLevel.DEBUG;
    case 'INFO':
      return LogLevel.INFO;
    case 'WARN':
      return LogLevel.WARN;
    case 'ERROR':
      return LogLevel.ERROR;
    default:
      return LogLevel.INFO;
  }
}

function formatLogPrefix(timestamp: number, context: string, level: string): string {
  const now = new Date(timestamp);
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  const timeStr = `${hours}:${minutes}:${seconds}.${milliseconds}`;

  return `[${timeStr}] [${context}] [${level}]`;
}

function formatLogArgs(
  logContext: Record<string, unknown> | null | undefined,
  error: unknown
): unknown[] {
  const args: unknown[] = [];

  if (logContext && Object.keys(logContext).length > 0) {
    try {
      args.push(JSON.stringify(logContext, null, 2));
    } catch {
      args.push(logContext);
    }
  }

  if (error) {
    // Format error object for readable console output
    if (error instanceof Error) {
      const errorText = [`Error: ${error.message || 'Unknown error'}`];
      if (error.stack) {
        errorText.push(`Stack trace:\n${error.stack}`);
      }
      args.push(errorText.join('\n'));
    } else {
      // Fallback for other error formats
      try {
        args.push(JSON.stringify(error, null, 2));
      } catch {
        args.push(String(error));
      }
    }
  }

  return args;
}

function logToConsole(level: string, prefix: string, logMessage: string, args: unknown[]): void {
  switch (level) {
    case 'DEBUG':
    case 'INFO':
      console.log(prefix, logMessage, ...args);
      break;
    case 'WARN':
      console.warn(prefix, logMessage, ...args);
      break;
    case 'ERROR':
      console.error(prefix, logMessage, ...args);
      break;
    default:
      console.log(prefix, logMessage, ...args);
  }
}

/**
 * Handle master password-related messages
 */
async function handleMasterPasswordMessage(message: {
  type: string;
  action?: string;
  password?: string;
}): Promise<{ success: boolean; error?: string; status?: unknown }> {
  const { action } = message;

  try {
    switch (action) {
      case MessageTypes.INITIALIZE_MASTER_PASSWORD:
        return await handleInitializeMasterPassword(message);

      case MessageTypes.UNLOCK_STORAGE:
        return await handleUnlockStorage(message);

      case MessageTypes.LOCK_STORAGE:
        return await handleLockStorage();

      case MessageTypes.CHECK_UNLOCK_STATUS:
        return await handleCheckUnlockStatus();

      case MessageTypes.CHECK_STORAGE_STATUS:
        return await handleCheckStorageStatus();

      default:
        return { success: false, error: 'Unknown action' };
    }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Handle initializeMasterPassword action
 */
async function handleInitializeMasterPassword(message: any): Promise<any> {
  const { password, confirmation } = message;

  try {
    // Create use case
    const useCase = new InitializeMasterPasswordUseCase(secureStorage, masterPasswordPolicy);

    // Execute use case
    const result = await useCase.execute({ password, confirmation });

    if (result.isSuccess) {
      return { success: true, message: 'Master password initialized successfully' };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Handle unlockStorage action
 */
async function handleUnlockStorage(message: any): Promise<any> {
  const { password } = message;

  try {
    // Create use case
    const useCase = new UnlockStorageUseCase(
      secureStorage,
      lockoutManager,
      globalDependencies!.logAggregatorService
    );

    // Execute use case
    const result = await useCase.execute({ password });

    if (result.isSuccess) {
      const status = result.value!;
      return {
        success: true,
        message: 'Storage unlocked successfully',
        status: status.toObject(),
      };
    } else {
      // Get remaining attempts for error message
      const remainingAttempts = await lockoutManager.getRemainingAttempts();
      return {
        success: false,
        error: result.error,
        remainingAttempts,
      };
    }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Handle lockStorage action
 */
async function handleLockStorage(): Promise<any> {
  try {
    // Create use case
    const useCase = new LockStorageUseCase(secureStorage, globalDependencies!.logAggregatorService);

    // Execute use case
    const result = await useCase.execute();

    if (result.isSuccess) {
      // Broadcast lock event to all tabs
      browser.runtime.sendMessage({ action: 'storageLocked' }).catch(() => {});

      return { success: true, message: 'Storage locked successfully' };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Handle checkUnlockStatus action
 */
async function handleCheckUnlockStatus(): Promise<any> {
  try {
    // Create use case
    const useCase = new CheckUnlockStatusUseCase(secureStorage, lockoutManager);

    // Execute use case
    const result = await useCase.execute();

    if (result.isSuccess) {
      const status = result.value!;
      return {
        success: true,
        status: status.toObject(),
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Handle checkStorageStatus action
 * Checks if master password has been initialized
 */
async function handleCheckStorageStatus(): Promise<any> {
  try {
    const isInitialized = await secureStorage.isInitialized();
    return {
      success: true,
      isInitialized,
    };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Handle manual sync message
 */
async function handleManualSyncMessage(message: any): Promise<any> {
  const { configId } = message;

  if (!globalUseCases || !globalLogger) {
    return { success: false, error: 'Background service not initialized' };
  }

  try {
    const logger = globalLogger.createChild('ManualSyncHandler');
    logger.info('Manual sync requested', { configId });

    // Load sync configuration
    const listResult = await globalUseCases.listSyncConfigsUseCase.execute({});
    if (!listResult.success) {
      return { success: false, error: 'Failed to load sync configurations' };
    }

    const config = listResult.configs?.find((c: any) => c.id === configId);
    if (!config) {
      return { success: false, error: `Sync configuration not found: ${configId}` };
    }

    // DTOをエンティティに変換
    const configEntity = StorageSyncConfigMapper.toEntity(config);
    const syncResult = await globalUseCases.executeManualSyncUseCase.execute({
      config: configEntity,
    });

    logger.info('Manual sync completed', {
      configId,
      success: syncResult.success,
    });

    return syncResult;
  } catch (error: unknown) {
    globalLogger?.error('Manual sync failed', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Handle execute all syncs message
 * Executes all enabled sync configurations
 */
// eslint-disable-next-line max-lines-per-function, complexity -- Loads all sync configurations, filters enabled ones, executes sync for each, collects results, and logs progress. The sequential logic is clear and necessary for coordinating multiple async sync operations with error handling. Complexity of 12 is unavoidable due to multiple early returns for error handling, config filtering logic, and per-config sync execution with try-catch.
async function handleExecuteAllSyncsMessage(): Promise<any> {
  if (!globalUseCases || !globalLogger) {
    return { success: false, error: 'Background service not initialized' };
  }

  try {
    const logger = globalLogger.createChild('ExecuteAllSyncsHandler');
    logger.info('Execute all syncs requested');

    // Load all sync configurations
    const listResult = await globalUseCases.listSyncConfigsUseCase.execute({});
    if (!listResult.success || !listResult.configs) {
      return { success: false, error: 'Failed to load sync configurations' };
    }

    // Filter enabled configurations
    const enabledConfigs = listResult.configs.filter((c: any) => c.getEnabled());

    if (enabledConfigs.length === 0) {
      logger.info('No enabled sync configurations found');
      return { success: true, results: [], message: 'No enabled sync configurations found' };
    }

    logger.info('Found enabled sync configurations', { count: enabledConfigs.length });

    // Execute each sync
    const results = [];
    for (const configDto of enabledConfigs) {
      try {
        logger.info('Executing sync', {
          configId: configDto.id,
          storageKey: configDto.storageKey,
        });

        const configEntity = StorageSyncConfigMapper.toEntity(configDto);
        const syncResult = await globalUseCases.executeManualSyncUseCase.execute({
          config: configEntity,
        });
        results.push({
          configId: configDto.id,
          storageKey: configDto.storageKey,
          ...syncResult,
        });

        logger.info('Sync completed', {
          configId: configDto.id,
          success: syncResult.success,
        });
      } catch (error: unknown) {
        logger.error('Sync failed', {
          configId: configDto.id,
          error: error instanceof Error ? error.message : String(error),
        });

        results.push({
          configId: configDto.id,
          storageKey: configDto.storageKey,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    logger.info('All syncs completed', {
      total: results.length,
      successful: successCount,
      failed: results.length - successCount,
    });

    return { success: true, results };
  } catch (error: unknown) {
    globalLogger?.error('Execute all syncs failed', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Handle resumeAutoFill message
 * Resumes auto-fill execution from in-progress state
 */
// eslint-disable-next-line max-lines-per-function, complexity -- Loads AutomationResult and AutomationVariables, verifies DOING status, gets tab URL, and executes auto-fill with comprehensive error handling and logging. The sequential steps are necessary for safe resume operation. Complexity of 11 is due to multiple error handling branches (initialization check, AutomationResult loading, status verification, AutomationVariables loading, tab URL retrieval) which cannot be reduced without losing error specificity.
async function handleResumeAutoFill(message: any): Promise<any> {
  const { executionId, tabId } = message;

  if (!globalUseCases || !globalLogger) {
    return { success: false, error: 'Background service not initialized' };
  }

  try {
    const logger = globalLogger.createChild('ResumeAutoFillHandler');
    logger.info('Resume auto-fill requested', { executionId, tabId });

    // Get AutomationResult
    const automationResultResult =
      await globalDependencies?.automationResultRepository.load(executionId);
    if (automationResultResult?.isFailure) {
      logger.error('Failed to load AutomationResult', {
        executionId,
        error: automationResultResult.error,
      });
      return { success: false, error: 'Failed to load execution' };
    }
    const automationResult = automationResultResult?.value;
    if (!automationResult) {
      logger.error('AutomationResult not found', { executionId });
      return { success: false, error: 'Execution not found' };
    }

    // Verify status is DOING
    if (!automationResult.isInProgress()) {
      logger.warn('AutomationResult is not in progress', {
        executionId,
        status: automationResult.getExecutionStatus(),
      });
      return { success: false, error: 'Execution is not in progress' };
    }

    // Get AutomationVariables
    const automationVariablesResult = await globalDependencies?.automationVariablesRepository.load(
      automationResult.getAutomationVariablesId()
    );
    if (automationVariablesResult?.isFailure) {
      logger.error('Failed to load AutomationVariables', {
        automationVariablesId: automationResult.getAutomationVariablesId(),
        error: automationVariablesResult.error,
      });
      return { success: false, error: 'Failed to load automation variables' };
    }
    const automationVariables = automationVariablesResult?.value;
    if (!automationVariables) {
      logger.error('AutomationVariables not found', {
        automationVariablesId: automationResult.getAutomationVariablesId(),
      });
      return { success: false, error: 'Automation variables not found' };
    }

    // Get current URL from tab
    const tab = await browser.tabs.get(tabId);
    if (!tab.url) {
      logger.error('Tab URL not found', { tabId });
      return { success: false, error: 'Tab URL not found' };
    }

    // Execute auto-fill (will resume from current step)
    const result = await globalUseCases.executeAutoFillUseCase.execute({
      tabId,
      url: tab.url,
      websiteId: automationVariables.getWebsiteId(),
    });

    logger.info('Resume auto-fill completed', {
      executionId,
      success: result.success,
      processedSteps: result.processedSteps,
    });

    return { success: result.success, processedSteps: result.processedSteps, error: result.error };
  } catch (error: unknown) {
    globalLogger?.error('Resume auto-fill failed', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Handle getCurrentTabId message
 * Returns the current tab ID from sender
 */
function handleGetCurrentTabId(sender: any): any {
  if (!sender.tab || typeof sender.tab.id !== 'number') {
    return { error: 'Tab ID not available' };
  }

  return { tabId: sender.tab.id };
}

/**
 * Set up session management and idle detection
 */
function setupSessionManagement(logger: any): void {
  // Listen for session expiration alarms and sync alarms
  if (typeof browser.alarms !== 'undefined') {
    browser.alarms.onAlarm.addListener(async (alarm) => {
      // Session expiration
      if (alarm.name === 'secure-storage-session') {
        logger.warn('Session expired, locking storage');
        secureStorage.lock();

        // Broadcast session expired event to all tabs
        browser.runtime.sendMessage({ action: 'sessionExpired' }).catch(() => {});
      }

      // Periodic sync alarms
      if (alarm.name.startsWith('sync-')) {
        const configId = alarm.name.replace('sync-', '');
        logger.info('Periodic sync alarm triggered', { configId });

        try {
          await handleManualSyncMessage({ configId });
        } catch (error) {
          logger.error('Periodic sync failed', error);
        }
      }

      // Log cleanup alarm
      if (alarm.name === 'log-cleanup') {
        logger.info('Log cleanup alarm triggered');

        try {
          if (globalDependencies) {
            const settingsResult = await globalDependencies.systemSettingsRepository.load();
            if (settingsResult.isFailure) {
              logger.error('Failed to load system settings for log cleanup', settingsResult.error);
              return;
            }
            const settings = settingsResult.value!;
            const retentionDays = settings.getLogRetentionDays();
            const deletedCount =
              await globalDependencies.logAggregatorService.deleteOldLogs(retentionDays);
            logger.info('Old logs deleted', { deletedCount, retentionDays });
          }
        } catch (error) {
          logger.error('Log cleanup failed', error);
        }
      }
    });
  }

  // Listen for idle state changes
  if (typeof browser.idle !== 'undefined') {
    browser.idle.setDetectionInterval(60); // 60 seconds

    browser.idle.onStateChanged.addListener((state) => {
      if (state === 'locked' || state === 'idle') {
        logger.info('System idle or locked, locking storage');
        secureStorage.lock();

        // Broadcast lock event to all tabs
        browser.runtime.sendMessage({ action: 'storageLocked' }).catch(() => {});
      }
    });
  }
}

/**
 * Set up periodic sync scheduler
 * Loads sync configurations and creates Chrome alarms for periodic syncs
 */
// eslint-disable-next-line complexity -- Loads sync configs, clears old alarms, creates new alarms for enabled periodic syncs. The conditional logic is straightforward and necessary for the feature.
async function setupPeriodicSync(useCases: any, logger: any): Promise<void> {
  try {
    logger.info('Setting up periodic sync scheduler');

    // Load all sync configurations
    const result = await useCases.listSyncConfigsUseCase.execute({});
    if (!result.success || !result.configs) {
      logger.warn('No sync configurations found or failed to load');
      return;
    }

    // Clear existing sync alarms
    if (typeof browser.alarms !== 'undefined') {
      const alarms = await browser.alarms.getAll();
      for (const alarm of alarms) {
        if (alarm.name.startsWith('sync-')) {
          await browser.alarms.clear(alarm.name);
        }
      }
    }

    // Create alarms for enabled periodic sync configs
    for (const configDto of result.configs) {
      if (
        configDto.enabled &&
        configDto.syncTiming === 'periodic' &&
        configDto.syncIntervalSeconds
      ) {
        const alarmName = `sync-${configDto.id}`;
        const intervalInMinutes = (configDto.syncIntervalSeconds ?? 0) / 60;

        if (typeof browser.alarms !== 'undefined') {
          await browser.alarms.create(alarmName, {
            delayInMinutes: intervalInMinutes,
            periodInMinutes: intervalInMinutes,
          });

          logger.info('Created periodic sync alarm', {
            configId: configDto.id,
            storageKey: configDto.storageKey,
            intervalInMinutes,
          });
        }
      }
    }

    logger.info('Periodic sync scheduler setup complete');
  } catch (error) {
    logger.error('Failed to set up periodic sync scheduler', error);
  }
}

/**
 * Set up periodic log cleanup scheduler
 * Creates Chrome alarm for daily log cleanup based on retention policy
 */
async function setupLogCleanup(dependencies: any, logger: any): Promise<void> {
  try {
    logger.info('Setting up periodic log cleanup scheduler');

    if (typeof browser.alarms !== 'undefined') {
      // Clear existing log-cleanup alarm
      await browser.alarms.clear('log-cleanup');

      // Create daily alarm for log cleanup (24 hours = 1440 minutes)
      await browser.alarms.create('log-cleanup', {
        delayInMinutes: 1440, // Run first cleanup after 24 hours
        periodInMinutes: 1440, // Repeat every 24 hours
      });

      logger.info('Created periodic log cleanup alarm', {
        intervalHours: 24,
      });
    }

    logger.info('Periodic log cleanup scheduler setup complete');
  } catch (error) {
    logger.error('Failed to set up periodic log cleanup scheduler', error);
  }
}

// Start initialization
initialize().catch((error) => {
  console.error('[Background] Failed to initialize:', error);
});
