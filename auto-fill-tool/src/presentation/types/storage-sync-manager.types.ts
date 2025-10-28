/**
 * Type definitions for Storage Sync Manager
 */

import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { ExportXPathsUseCase } from '@usecases/xpaths/ExportXPathsUseCase';
import { ExportWebsitesUseCase } from '@usecases/websites/ExportWebsitesUseCase';
import { ExportAutomationVariablesUseCase } from '@usecases/automation-variables/ExportAutomationVariablesUseCase';
import { ExportSystemSettingsUseCase } from '@usecases/system-settings/ExportSystemSettingsUseCase';
import { ExportStorageSyncConfigsUseCase } from '@usecases/storage/ExportStorageSyncConfigsUseCase';
import { CSVFormat } from '@domain/services/CSVFormatDetectorService';

/**
 * Input field structure for sync configuration
 */
export interface SyncInputField {
  key: string;
  value: string;
}

/**
 * Output field structure for sync configuration
 */
export interface SyncOutputField {
  key: string;
  defaultValue: string;
}

/**
 * Dependencies for StorageSyncManagerCoordinator
 * Phase 6-7 pattern: Coordinator orchestrates initialization and UI setup
 */
export interface StorageSyncManagerCoordinatorDependencies {
  // Core components
  presenter: {
    importData: (csvText: string, format: CSVFormat) => Promise<void>;
  };
  logger: {
    info: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    debug: (message: string, ...args: any[]) => void;
    createChild: (name: string) => any;
  };

  // Settings for gradient background
  settings: SystemSettingsCollection;

  // Use cases for UnifiedNavigationBar (5 export use cases)
  exportXPathsUseCase: ExportXPathsUseCase;
  exportWebsitesUseCase: ExportWebsitesUseCase;
  exportAutomationVariablesUseCase: ExportAutomationVariablesUseCase;
  exportSystemSettingsUseCase: ExportSystemSettingsUseCase;
  exportStorageSyncConfigsUseCase: ExportStorageSyncConfigsUseCase;

  // Tab management
  tabs: {
    historyTabBtn: HTMLButtonElement | null;
    configTabBtn: HTMLButtonElement | null;
    onHistoryTabClick: () => Promise<void>;
    onConfigTabClick: () => Promise<void>;
  };

  // Callbacks for file operations
  downloadFile: (content: string, filename: string, mimeType: string) => void;
  onImportComplete: () => Promise<void>;
}
