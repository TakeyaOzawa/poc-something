/**
 * Type definitions for AutomationVariables Manager script dependencies and use cases
 */

import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { RecordingStorageRepository } from '@domain/repositories/RecordingStorageRepository';
import { GetAllAutomationVariablesUseCase } from '@usecases/automation-variables/GetAllAutomationVariablesUseCase';
import { GetAutomationVariablesByIdUseCase } from '@usecases/automation-variables/GetAutomationVariablesByIdUseCase';
import { GetAutomationVariablesByWebsiteIdUseCase } from '@usecases/automation-variables/GetAutomationVariablesByWebsiteIdUseCase';
import { SaveAutomationVariablesUseCase } from '@usecases/automation-variables/SaveAutomationVariablesUseCase';
import { DeleteAutomationVariablesUseCase } from '@usecases/automation-variables/DeleteAutomationVariablesUseCase';
import { DuplicateAutomationVariablesUseCase } from '@usecases/automation-variables/DuplicateAutomationVariablesUseCase';
import { ExportAutomationVariablesUseCase } from '@usecases/automation-variables/ExportAutomationVariablesUseCase';
import { ImportAutomationVariablesUseCase } from '@usecases/automation-variables/ImportAutomationVariablesUseCase';
import { GetLatestAutomationResultUseCase } from '@usecases/automation-variables/GetLatestAutomationResultUseCase';
import { GetAutomationResultHistoryUseCase } from '@usecases/automation-variables/GetAutomationResultHistoryUseCase';
import { GetAllWebsitesUseCase } from '@usecases/websites/GetAllWebsitesUseCase';
import { GetLatestRecordingByVariablesIdUseCase } from '@usecases/recording/GetLatestRecordingByVariablesIdUseCase';
import { ExportXPathsUseCase } from '@usecases/xpaths/ExportXPathsUseCase';
import { ExportWebsitesUseCase } from '@usecases/websites/ExportWebsitesUseCase';
import { ExportSystemSettingsUseCase } from '@usecases/system-settings/ExportSystemSettingsUseCase';
import { ExportStorageSyncConfigsUseCase } from '@usecases/storage/ExportStorageSyncConfigsUseCase';
import { AutomationVariablesMapper } from '@infrastructure/mappers/AutomationVariablesMapper';
import { XPathCollectionMapper } from '@infrastructure/mappers/XPathCollectionMapper';
import { WebsiteCollectionMapper } from '@infrastructure/mappers/WebsiteCollectionMapper';
import { StorageSyncConfigMapper } from '@infrastructure/mappers/StorageSyncConfigMapper';
import { SystemSettingsViewModel } from './SystemSettingsViewModel';
import { RepositoryFactory } from '@infrastructure/factories/RepositoryFactory';

/**
 * Repositories created by initializeRepositories function
 */
export interface AutomationVariablesManagerRepositories {
  automationVariables: AutomationVariablesRepository;
  automationResult: AutomationResultRepository;
  website: WebsiteRepository;
  xpath: XPathRepository;
  systemSettings: SystemSettingsRepository;
  storageSyncConfig: StorageSyncConfigRepository;
  recording: RecordingStorageRepository;
}

/**
 * Mappers created by initializeMappers function
 */
export interface AutomationVariablesManagerMappers {
  automationVariablesMapper: AutomationVariablesMapper;
  xpathMapper: XPathCollectionMapper;
  websiteMapper: WebsiteCollectionMapper;
  storageSyncConfigMapper: StorageSyncConfigMapper;
}

/**
 * Use cases created by initializeUseCases function
 */
export interface AutomationVariablesManagerUseCases {
  getAllAutomationVariables: GetAllAutomationVariablesUseCase;
  getAutomationVariablesById: GetAutomationVariablesByIdUseCase;
  getAutomationVariablesByWebsiteId: GetAutomationVariablesByWebsiteIdUseCase;
  saveAutomationVariables: SaveAutomationVariablesUseCase;
  deleteAutomationVariables: DeleteAutomationVariablesUseCase;
  duplicateAutomationVariables: DuplicateAutomationVariablesUseCase;
  exportAutomationVariables: ExportAutomationVariablesUseCase;
  importAutomationVariables: ImportAutomationVariablesUseCase;
  getLatestAutomationResult: GetLatestAutomationResultUseCase;
  getAutomationResultHistory: GetAutomationResultHistoryUseCase;
  getAllWebsites: GetAllWebsitesUseCase;
  getLatestRecordingByVariablesId: GetLatestRecordingByVariablesIdUseCase;
  exportXPaths: ExportXPathsUseCase;
  exportWebsites: ExportWebsitesUseCase;
  exportSystemSettings: ExportSystemSettingsUseCase;
  exportStorageSyncConfigs: ExportStorageSyncConfigsUseCase;
}

/**
 * Type for SystemSettings (used in gradient background functions)
 */
export type AutomationVariablesManagerSettings = SystemSettingsViewModel;

/**
 * Dependencies for AutomationVariablesManagerCoordinator
 * Phase 5 pattern: Coordinator orchestrates initialization and UI setup
 */
export interface AutomationVariablesManagerCoordinatorDependencies {
  // Core components
  presenter: {
    loadVariables: (websiteId?: string) => Promise<void>;
    exportVariables: () => Promise<string>;
    importVariables: (csvText: string) => Promise<void>;
  };
  logger: {
    info: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    debug: (message: string, ...args: any[]) => void;
    createChild: (name: string) => any;
  };

  // Factory and use cases
  factory?: RepositoryFactory;
  useCases?: AutomationVariablesManagerUseCases;

  // Use cases for navigation bar
  getAllWebsitesUseCase: GetAllWebsitesUseCase;
  exportXPathsUseCase: ExportXPathsUseCase;
  exportWebsitesUseCase: ExportWebsitesUseCase;
  exportSystemSettingsUseCase: ExportSystemSettingsUseCase;
  exportStorageSyncConfigsUseCase: ExportStorageSyncConfigsUseCase;

  // Settings for gradient background
  settings: AutomationVariablesManagerSettings;
}
