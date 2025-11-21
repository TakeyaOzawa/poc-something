/**
 * Type definitions for System Settings script dependencies and use cases
 */

import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { SyncHistoryRepository } from '@domain/repositories/SyncHistoryRepository';
import { GetSystemSettingsUseCase } from '@application/usecases/system-settings/GetSystemSettingsUseCase';
import { UpdateSystemSettingsUseCase } from '@application/usecases/system-settings/UpdateSystemSettingsUseCase';
import { ResetSystemSettingsUseCase } from '@application/usecases/system-settings/ResetSystemSettingsUseCase';
import { ExportSystemSettingsUseCase } from '@application/usecases/system-settings/ExportSystemSettingsUseCase';
import { ImportSystemSettingsUseCase } from '@application/usecases/system-settings/ImportSystemSettingsUseCase';
import { ExecuteStorageSyncUseCase } from '@application/usecases/storage/ExecuteStorageSyncUseCase';
import { GetAllStorageSyncConfigsUseCase } from '@application/usecases/storage/GetAllStorageSyncConfigsUseCase';
import { ExecuteReceiveDataUseCase } from '@application/usecases/sync/ExecuteReceiveDataUseCase';
import { ExecuteSendDataUseCase } from '@application/usecases/sync/ExecuteSendDataUseCase';
import { ExportXPathsUseCase } from '@application/usecases/xpaths/ExportXPathsUseCase';
import { ExportWebsitesUseCase } from '@application/usecases/websites/ExportWebsitesUseCase';
import { ExportAutomationVariablesUseCase } from '@application/usecases/automation-variables/ExportAutomationVariablesUseCase';
import { ExportStorageSyncConfigsUseCase } from '@application/usecases/storage/ExportStorageSyncConfigsUseCase';
import { XPathCollectionMapper } from '@infrastructure/mappers/XPathCollectionMapper';
import { WebsiteCollectionMapper } from '@infrastructure/mappers/WebsiteCollectionMapper';
import { AutomationVariablesMapper } from '@infrastructure/mappers/AutomationVariablesMapper';
import { StorageSyncConfigMapper } from '@infrastructure/mappers/StorageSyncConfigMapper';

/**
 * Repositories created by initializeRepositories function
 */
export interface SystemSettingsRepositories {
  systemSettingsRepository: SystemSettingsRepository;
  storageSyncConfigRepository: StorageSyncConfigRepository;
  xpathRepository: XPathRepository;
  websiteRepository: WebsiteRepository;
  automationVariablesRepository: AutomationVariablesRepository;
  syncHistoryRepository: SyncHistoryRepository;
}

/**
 * Sync step use cases for data synchronization
 */
export interface SyncStepUseCases {
  executeReceiveDataUseCase: ExecuteReceiveDataUseCase;
  executeSendDataUseCase: ExecuteSendDataUseCase;
}

/**
 * Mappers for export functionality
 */
export interface ExportMappers {
  xpathMapper: XPathCollectionMapper;
  websiteMapper: WebsiteCollectionMapper;
  automationVariablesMapper: AutomationVariablesMapper;
  storageSyncConfigMapper: StorageSyncConfigMapper;
}

/**
 * System settings specific use cases
 */
export interface SystemSettingsSpecificUseCases {
  getSystemSettingsUseCase: GetSystemSettingsUseCase;
  updateSystemSettingsUseCase: UpdateSystemSettingsUseCase;
  resetSystemSettingsUseCase: ResetSystemSettingsUseCase;
  exportSystemSettingsUseCase: ExportSystemSettingsUseCase;
  importSystemSettingsUseCase: ImportSystemSettingsUseCase;
}

/**
 * Storage sync use cases
 */
export interface StorageSyncUseCases {
  executeStorageSyncUseCase: ExecuteStorageSyncUseCase;
  getAllStorageSyncConfigsUseCase: GetAllStorageSyncConfigsUseCase;
}

/**
 * Export use cases
 */
export interface ExportUseCases {
  exportXPathsUseCase: ExportXPathsUseCase;
  exportWebsitesUseCase: ExportWebsitesUseCase;
  exportAutomationVariablesUseCase: ExportAutomationVariablesUseCase;
  exportStorageSyncConfigsUseCase: ExportStorageSyncConfigsUseCase;
}

/**
 * Combined use cases for system settings
 */
export type SystemSettingsUseCases = SystemSettingsSpecificUseCases &
  StorageSyncUseCases &
  ExportUseCases;

/**
 * Dependencies for SystemSettingsCoordinator
 * Contains all required components for system settings orchestration
 */
export interface SystemSettingsCoordinatorDependencies {
  // Core components
  presenter: {
    loadAllSettings: () => Promise<void>;
    getSettings: () => unknown; // SystemSettings entity
    exportSettings: () => Promise<string>;
  };
  view: unknown; // SystemSettingsViewImpl
  logger: {
    createChild: (name: string) => unknown;
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string | Error, context?: unknown) => void;
    error: (message: string, error?: unknown) => void;
    debug: (message: string, data?: unknown) => void;
    setLevel: (level: unknown) => void;
  };

  // UI Managers
  generalSettingsManager: {
    loadSettings: (settings: unknown) => void;
  };
  recordingSettingsManager: {
    loadSettings: (settings: unknown) => void;
  };
  appearanceSettingsManager: {
    loadSettings: (settings: unknown) => void;
  };
  permissionsSettingsManager: {
    initialize: () => Promise<void>;
    renderPermissionCards: () => Promise<void>;
  };
  dataSyncManager: {
    renderDataSyncCards: () => Promise<void>;
  };

  // Export use cases
  exportXPathsUseCase: ExportXPathsUseCase;
  exportWebsitesUseCase: ExportWebsitesUseCase;
  exportAutomationVariablesUseCase: ExportAutomationVariablesUseCase;
  exportStorageSyncConfigsUseCase: ExportStorageSyncConfigsUseCase;
}
