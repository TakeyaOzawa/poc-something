/**
 * Type definitions for Background script dependencies and use cases
 */

import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { SyncHistoryRepository } from '@domain/repositories/SyncHistoryRepository';
import { RecordingStorageRepository } from '@domain/repositories/RecordingStorageRepository';
import { NotificationPort } from '@domain/types/notification-port.types';
import { TabCaptureAdapter } from '@domain/types/tab-capture-port.types';
import { LogAggregatorPort } from '@domain/types/log-aggregator-port.types';
import { SaveXPathUseCase } from '@usecases/xpaths/SaveXPathUseCase';
import { SaveWebsiteUseCase } from '@usecases/websites/SaveWebsiteUseCase';
import { GetWebsiteByIdUseCase } from '@usecases/websites/GetWebsiteByIdUseCase';
import { UpdateWebsiteUseCase } from '@usecases/websites/UpdateWebsiteUseCase';
import { ExecuteAutoFillUseCase } from '@usecases/auto-fill/ExecuteAutoFillUseCase';
import { ExecuteManualSyncUseCase } from '@usecases/sync/ExecuteManualSyncUseCase';
import { ListSyncConfigsUseCase } from '@usecases/sync/ListSyncConfigsUseCase';
import { MessageRouter } from '@infrastructure/messaging/MessageRouter';
import { Logger } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

/**
 * Dependencies created by createDependencies function
 */
export interface BackgroundDependencies {
  notificationService: NotificationPort;
  xpathRepository: XPathRepository;
  websiteRepository: WebsiteRepository;
  automationVariablesRepository: AutomationVariablesRepository;
  automationResultRepository: AutomationResultRepository;
  systemSettingsRepository: SystemSettingsRepository;
  tabCaptureAdapter: TabCaptureAdapter;
  recordingRepository: RecordingStorageRepository;
  storageSyncConfigRepository: StorageSyncConfigRepository;
  syncHistoryRepository: SyncHistoryRepository;
  logAggregatorService: LogAggregatorPort;
  idGenerator: IdGenerator;
}

/**
 * Use cases created by createUseCases function
 */
export interface BackgroundUseCases {
  saveXPathUseCase: SaveXPathUseCase;
  saveWebsiteUseCase: SaveWebsiteUseCase;
  getWebsiteByIdUseCase: GetWebsiteByIdUseCase;
  updateWebsiteUseCase: UpdateWebsiteUseCase;
  executeAutoFillUseCase: ExecuteAutoFillUseCase;
  executeManualSyncUseCase: ExecuteManualSyncUseCase;
  listSyncConfigsUseCase: ListSyncConfigsUseCase;
}

/**
 * Type for message router
 */
export type BackgroundMessageRouter = MessageRouter;

/**
 * Type for logger
 */
export type BackgroundLogger = Logger;
