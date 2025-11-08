/**
 * Type definitions for XPath Manager
 */

import { SystemSettingsViewModel } from './SystemSettingsViewModel';
import { ExportSystemSettingsUseCase } from '@application/usecases/system-settings/ExportSystemSettingsUseCase';
import { ExportStorageSyncConfigsUseCase } from '@application/usecases/storage/ExportStorageSyncConfigsUseCase';
import { CSVFormat } from '@domain/services/CSVFormatDetectorService';

/**
 * Dependencies for XPathManagerCoordinator
 * Phase 6 pattern: Coordinator orchestrates initialization and UI setup
 */
export interface XPathManagerCoordinatorDependencies {
  // Core components
  presenter: {
    exportXPaths: () => Promise<string>;
    exportWebsites: () => Promise<string>;
    exportAutomationVariables: () => Promise<string>;
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
  settings: SystemSettingsViewModel;

  // Use cases for UnifiedNavigationBar
  exportSystemSettingsUseCase: ExportSystemSettingsUseCase;
  exportStorageSyncConfigsUseCase: ExportStorageSyncConfigsUseCase;

  // Callbacks for file operations
  downloadFile: (content: string, filename: string, mimeType: string) => void;
  onImportComplete: () => Promise<void>;
}
